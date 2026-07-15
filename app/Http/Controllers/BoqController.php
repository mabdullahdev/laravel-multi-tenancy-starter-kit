<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBoqRequest;
use App\Http\Requests\UpdateBoqRequest;
use App\Models\Boq;
use App\Models\BoqItem;
use App\Models\BoqSection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BoqController extends Controller
{
    /**
     * Store a newly created BOQ (revision 1) under a project, then send the
     * user straight to the builder to fill in sections and items.
     */
    public function store(StoreBoqRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $boq = Boq::create([
            'project_id' => $validated['project_id'],
            'title' => $validated['title'],
            'revision' => 1,
            'currency' => $validated['currency'] ?? 'PKR',
            'status' => 'draft',
            'total_amount' => 0,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()
            ->route('boqs.edit', $boq)
            ->with('success', 'BOQ created. Add sections and line items below.');
    }

    /**
     * Display a read-only view of the BOQ with its sections and items.
     */
    public function show(Boq $boq)
    {
        $boq->load(['project.client', 'sections.items', 'payments']);

        return inertia('boqs/show', [
            'boq' => $this->transformBoq($boq),
            'payments' => $boq->payments->map(fn (\App\Models\Payment $p) => [
                'id' => $p->id,
                'amount' => $p->amount,
                'paid_on' => $p->paid_on->format('Y-m-d'),
                'method' => $p->method,
                'reference' => $p->reference,
                'note' => $p->note,
            ])->values()->all(),
            'paymentSummary' => $this->paymentSummary($boq),
        ]);
    }

    /**
     * Total / paid / due / status figures for a BOQ.
     *
     * @return array<string, mixed>
     */
    private function paymentSummary(Boq $boq): array
    {
        return [
            'total' => $boq->total_amount,
            'paid' => $boq->total_paid,
            'due' => $boq->balance_due,
            'status' => $boq->payment_status,
        ];
    }

    /**
     * Show the builder for the BOQ.
     */
    public function edit(Boq $boq)
    {
        $boq->load(['project.client', 'sections.items']);

        return inertia('boqs/edit', [
            'boq' => $this->transformBoq($boq),
        ]);
    }

    /**
     * Sync the whole BOQ tree from the builder in a single transaction.
     *
     * The submitted sections/items are the source of truth: existing sections
     * are replaced wholesale (cascade deletes their items) and rebuilt, then
     * the denormalized total is recomputed once at the end.
     */
    public function update(UpdateBoqRequest $request, Boq $boq): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $boq) {
            $boq->update([
                'title' => $validated['title'],
                'currency' => $validated['currency'] ?? $boq->currency,
                'status' => $validated['status'],
                'payment_terms' => $validated['payment_terms'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Replace the section/item tree wholesale.
            $boq->sections()->delete();

            $now = now();

            foreach ($validated['sections'] as $sectionIndex => $sectionData) {
                $section = BoqSection::create([
                    'boq_id' => $boq->id,
                    'name' => $sectionData['name'],
                    'display_order' => $sectionIndex,
                ]);

                $rows = [];
                foreach ($sectionData['items'] ?? [] as $itemIndex => $itemData) {
                    $quantity = (float) $itemData['quantity'];
                    $rate = (float) $itemData['rate'];

                    $rows[] = [
                        'boq_section_id' => $section->id,
                        'item_code' => $itemData['item_code'] ?? null,
                        'description' => $itemData['description'],
                        'unit' => $itemData['unit'],
                        'quantity' => $quantity,
                        'rate' => $rate,
                        'amount' => $quantity * $rate,
                        'display_order' => $itemIndex,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if (! empty($rows)) {
                    BoqItem::insert($rows);
                }
            }

            $boq->recalculateTotal();
        });

        return redirect()
            ->route('boqs.show', $boq)
            ->with('success', 'BOQ saved successfully!');
    }

    /**
     * Remove the specified BOQ.
     */
    public function destroy(Boq $boq): RedirectResponse
    {
        $projectId = $boq->project_id;

        $boq->delete();

        return redirect()
            ->route('projects.show', $projectId)
            ->with('success', 'BOQ deleted successfully!');
    }

    /**
     * Generate a high-quality PDF of the BOQ and stream it as a download.
     */
    public function pdf(Boq $boq): Response
    {
        $boq->load(['project.client', 'sections.items', 'payments']);

        $logo = public_path('logo.svg');

        $validityDays = 30;

        $html = view('pdf.boq', [
            'boq' => $this->transformBoq($boq),
            'companyName' => config('app.name'),
            'logoPath' => is_file($logo) ? $logo : null,
            'generatedAt' => now()->format('d M Y'),
            'validUntil' => now()->addDays($validityDays)->format('d M Y'),
            'validityDays' => $validityDays,
            'payment' => $this->paymentSummary($boq),
        ])->render();

        $mpdf = new \Mpdf\Mpdf([
            'tempDir' => storage_path('app/mpdf-temp'),
            'format' => 'A4',
            'margin_top' => 14,
            'margin_bottom' => 16,
            'margin_left' => 12,
            'margin_right' => 12,
        ]);
        $mpdf->WriteHTML($html);

        $filename = 'boq-' . Str::slug($boq->title) . '-v' . $boq->revision . '.pdf';

        return response(
            $mpdf->Output($filename, \Mpdf\Output\Destination::STRING_RETURN),
            200,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ],
        );
    }

    /**
     * Branch the next revision of this BOQ and open it for editing.
     */
    public function revise(Boq $boq): RedirectResponse
    {
        $revision = $boq->replicateWithRevision();

        return redirect()
            ->route('boqs.edit', $revision)
            ->with('success', "Created revision {$revision->revision}. Make your changes below.");
    }

    /**
     * Shape a BOQ (with its tree) for the frontend.
     *
     * @return array<string, mixed>
     */
    private function transformBoq(Boq $boq): array
    {
        return [
            'id' => $boq->id,
            'project_id' => $boq->project_id,
            'title' => $boq->title,
            'revision' => $boq->revision,
            'currency' => $boq->currency,
            'status' => $boq->status,
            'total_amount' => $boq->total_amount,
            'payment_terms' => $boq->payment_terms ?? '',
            'notes' => $boq->notes ?? '',
            'project' => [
                'id' => $boq->project->id,
                'name' => $boq->project->name,
                'client_name' => $boq->project->client?->name,
            ],
            'sections' => $boq->sections->map(fn (BoqSection $section) => [
                'id' => $section->id,
                'name' => $section->name,
                'items' => $section->items->map(fn (BoqItem $item) => [
                    'id' => $item->id,
                    'item_code' => $item->item_code ?? '',
                    'description' => $item->description,
                    'unit' => $item->unit,
                    'quantity' => (string) $item->quantity,
                    'rate' => (string) $item->rate,
                    'amount' => $item->amount,
                ])->values()->all(),
            ])->values()->all(),
        ];
    }
}
