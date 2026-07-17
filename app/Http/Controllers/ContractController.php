<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContractRequest;
use App\Http\Requests\UpdateContractRequest;
use App\Models\Contract;
use App\Models\ContractAddon;
use App\Models\ContractDocument;
use App\Models\ContractMilestone;
use App\Models\Payment;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ContractController extends Controller
{
    /**
     * Show the form for creating a new contract against a project.
     */
    public function create(Project $project)
    {
        return inertia('contracts/create', [
            'project' => $this->projectSummary($project),
            'contract' => [
                'title' => '',
                'type' => 'theka_per_sqft',
                // Most contracts price the whole house, so default the billable area
                // to the project's covered area. It stays editable for the cases
                // where a deal only covers part of the building.
                'billable_area_sqft' => $project->covered_area_sqft ? (string) $project->covered_area_sqft : '',
                'rate_per_sqft' => '',
                'quality_tier' => 'standard',
                'currency' => 'PKR',
                'signed_on' => '',
                'status' => 'draft',
                'notes' => '',
                'payment_terms' => '',
                'exclusions' => '',
                'addons' => [],
                'milestones' => [],
            ],
        ]);
    }

    /**
     * Store a newly created contract.
     */
    public function store(StoreContractRequest $request, Project $project): RedirectResponse
    {
        $validated = $request->validated();

        $contract = DB::transaction(function () use ($validated, $project) {
            $contract = $project->contracts()->create(Arr::except($validated, ['addons', 'milestones']));

            // Add-ons first: they move contract_amount, which the percentage
            // milestones are then derived from.
            $this->syncAddons($contract, $validated['addons']);
            $this->syncMilestones($contract->refresh(), $validated['milestones']);

            return $contract;
        });

        return redirect()
            ->route('projects.show', $contract->project_id)
            ->with('success', 'Contract created successfully!');
    }

    /**
     * Display a contract with its schedule and payment history.
     */
    public function show(Contract $contract)
    {
        $contract->load(['project.client', 'addons', 'milestones.payments', 'payments.milestone', 'documents']);

        // Hand each document the contract instance we already have. isStale() reads
        // contract->documentFingerprint(), which would otherwise lazy-load the
        // contract and its addons/milestones once per document.
        $contract->documents->each(fn (ContractDocument $document) => $document->setRelation('contract', $contract));

        $fingerprint = $contract->documentFingerprint();
        $issued = $contract->issuedContract();

        return inertia('contracts/show', [
            'contract' => [
                'id' => $contract->id,
                'project_id' => $contract->project_id,
                'project_name' => $contract->project->name,
                'client_name' => $contract->project->client?->name,
                'title' => $contract->title,
                'type' => $contract->type,
                'billable_area_sqft' => $contract->billable_area_sqft,
                'rate_per_sqft' => $contract->rate_per_sqft,
                'quality_tier' => $contract->quality_tier,
                'base_amount' => $contract->base_amount,
                'addons_amount' => $contract->addons_amount,
                'contract_amount' => $contract->contract_amount,
                'currency' => $contract->currency,
                'signed_on' => $contract->signed_on?->format('Y-m-d'),
                'status' => $contract->status,
                'notes' => $contract->notes,
                'payment_terms' => $contract->payment_terms,
                'exclusions' => $contract->exclusions,
                'addons' => $contract->addons->map(fn (ContractAddon $addon) => [
                    'id' => $addon->id,
                    'name' => $addon->name,
                    'unit' => $addon->unit,
                    'quantity' => $addon->quantity,
                    'rate' => $addon->rate,
                    'amount' => $addon->amount,
                ])->values()->all(),
                'milestones' => $contract->milestones->map(fn (ContractMilestone $milestone) => [
                    'id' => $milestone->id,
                    'name' => $milestone->name,
                    'percentage' => $milestone->percentage,
                    'amount' => $milestone->amount,
                    'due_on' => $milestone->due_on?->format('Y-m-d'),
                    'status' => $milestone->status,
                    'invoice_no' => $milestone->invoice_no,
                    'paid_amount' => (string) $milestone->payments->sum('amount'),
                ])->values()->all(),
            ],
            'payments' => $contract->payments->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'amount' => $payment->amount,
                'paid_on' => $payment->paid_on->format('Y-m-d'),
                'method' => $payment->method,
                'reference' => $payment->reference,
                'note' => $payment->note,
                'milestone_name' => $payment->milestone?->name,
            ])->values()->all(),
            'documents' => $contract->documents->map(fn (ContractDocument $document) => [
                'id' => $document->id,
                'type' => $document->type,
                'name' => $document->name,
                'mime' => $document->mime,
                'size' => $document->size,
                'amount_at_issue' => $document->amount_at_issue,
                'issued_at' => $document->issued_at?->format('Y-m-d H:i'),
                'created_at' => $document->created_at->format('Y-m-d'),
                // An issued copy is frozen; flag when the contract has moved since.
                'is_stale' => $document->isStale(),
            ])->values()->all(),
            // Why the Issue button is or isn't available, so the page can say so
            // rather than just presenting a dead control.
            'issue' => [
                'can_issue' => $contract->status !== 'draft' && (! $issued || $issued->content_hash !== $fingerprint),
                'reason' => match (true) {
                    $contract->status === 'draft' => 'Activate the contract before issuing it — a draft is not agreed yet.',
                    $issued && $issued->content_hash === $fingerprint => 'Nothing has changed since you last issued this contract.',
                    default => null,
                },
            ],
            'paymentSummary' => [
                'total' => $contract->contract_amount,
                'paid' => $contract->total_paid,
                'due' => $contract->balance_due,
                'status' => $contract->payment_status,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified contract.
     */
    public function edit(Contract $contract)
    {
        $contract->load(['project', 'addons', 'milestones']);

        return inertia('contracts/edit', [
            'project' => $this->projectSummary($contract->project),
            'contract' => [
                'id' => $contract->id,
                'title' => $contract->title,
                'type' => $contract->type,
                'billable_area_sqft' => $contract->billable_area_sqft !== null ? (string) $contract->billable_area_sqft : '',
                'rate_per_sqft' => $contract->rate_per_sqft !== null ? (string) $contract->rate_per_sqft : '',
                'quality_tier' => $contract->quality_tier ?? '',
                'currency' => $contract->currency,
                'signed_on' => $contract->signed_on?->format('Y-m-d') ?? '',
                'status' => $contract->status,
                'notes' => $contract->notes ?? '',
                'payment_terms' => $contract->payment_terms ?? '',
                'exclusions' => $contract->exclusions ?? '',
                'addons' => $contract->addons->map(fn (ContractAddon $addon) => [
                    'name' => $addon->name,
                    'unit' => $addon->unit,
                    'quantity' => (string) $addon->quantity,
                    'rate' => (string) $addon->rate,
                ])->values()->all(),
                'milestones' => $contract->milestones->map(fn (ContractMilestone $milestone) => [
                    'name' => $milestone->name,
                    'percentage' => $milestone->percentage !== null ? (string) $milestone->percentage : '',
                    'amount' => (string) $milestone->amount,
                    'due_on' => $milestone->due_on?->format('Y-m-d') ?? '',
                ])->values()->all(),
            ],
        ]);
    }

    /**
     * Update the specified contract.
     */
    public function update(UpdateContractRequest $request, Contract $contract): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $contract) {
            $contract->update(Arr::except($validated, ['addons', 'milestones']));

            // Add-ons first: they move contract_amount, which the percentage
            // milestones are then derived from.
            $this->syncAddons($contract, $validated['addons']);
            $this->syncMilestones($contract->refresh(), $validated['milestones']);
        });

        return redirect()
            ->route('projects.show', $contract->project_id)
            ->with('success', 'Contract updated successfully!');
    }

    /**
     * Remove the specified contract.
     */
    public function destroy(Contract $contract): RedirectResponse
    {
        $projectId = $contract->project_id;
        $contract->delete();

        return redirect()
            ->route('projects.show', $projectId)
            ->with('success', 'Contract deleted successfully!');
    }

    /**
     * Replace the contract's payment schedule with the submitted list.
     *
     * A milestone priced as a percentage derives its amount from the contract
     * total; one given a flat figure keeps it as entered.
     *
     * @param  array<int, array{name: string, percentage: ?string, amount: ?string, due_on: ?string}>  $milestones
     */
    private function syncMilestones(Contract $contract, array $milestones): void
    {
        $contract->milestones()->delete();

        $now = now();
        $total = (float) $contract->contract_amount;

        $rows = [];
        foreach ($milestones as $index => $milestone) {
            $percentage = ($milestone['percentage'] ?? '') === '' ? null : (float) $milestone['percentage'];

            $rows[] = [
                'contract_id' => $contract->id,
                'name' => $milestone['name'],
                'percentage' => $percentage,
                'amount' => $percentage !== null
                    ? $total * $percentage / 100
                    : (float) ($milestone['amount'] ?? 0),
                'due_on' => ($milestone['due_on'] ?? '') === '' ? null : $milestone['due_on'],
                'status' => 'pending',
                'display_order' => $index,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (! empty($rows)) {
            ContractMilestone::insert($rows);
        }
    }

    /**
     * Replace the contract's add-on lines with the submitted list.
     *
     * insert() bypasses model events, so amount is computed here and the parent's
     * addons_amount is rolled up once at the end rather than per row.
     *
     * @param  array<int, array{name: string, unit: string, quantity: string, rate: string}>  $addons
     */
    private function syncAddons(Contract $contract, array $addons): void
    {
        $contract->addons()->delete();

        $now = now();

        $rows = [];
        foreach ($addons as $index => $addon) {
            $quantity = (float) $addon['quantity'];
            $rate = (float) $addon['rate'];

            $rows[] = [
                'contract_id' => $contract->id,
                'name' => $addon['name'],
                'unit' => $addon['unit'],
                'quantity' => $quantity,
                'rate' => $rate,
                'amount' => $quantity * $rate,
                'display_order' => $index,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if (! empty($rows)) {
            ContractAddon::insert($rows);
        }

        $contract->recalculateAddons();
    }

    /**
     * The slice of the project a contract form needs for context.
     *
     * @return array{id: int, name: string, covered_area_sqft: string|null}
     */
    private function projectSummary(Project $project): array
    {
        return [
            'id' => $project->id,
            'name' => $project->name,
            'covered_area_sqft' => $project->covered_area_sqft,
        ];
    }
}
