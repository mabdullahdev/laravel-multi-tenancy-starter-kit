<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'type',
        'billable_area_sqft',
        'rate_per_sqft',
        'quality_tier',
        'base_amount',
        'addons_amount',
        'contract_amount',
        'currency',
        'signed_on',
        'status',
        'notes',
        'payment_terms',
        'exclusions',
    ];

    protected $casts = [
        'billable_area_sqft' => 'decimal:2',
        'rate_per_sqft' => 'decimal:2',
        'base_amount' => 'decimal:2',
        'addons_amount' => 'decimal:2',
        'contract_amount' => 'decimal:2',
        'signed_on' => 'date',
    ];

    /**
     * Hook model events to keep derived values in sync.
     *
     * saving: base_amount and contract_amount are always (re)computed from their
     *         inputs, so the stored totals can never drift from the terms.
     */
    protected static function booted(): void
    {
        static::saving(function (Contract $contract) {
            // Only a per-sqft theka derives its base from area × rate. A dihari
            // contract is billed some other way, so its base is left as entered.
            if ($contract->type === 'theka_per_sqft') {
                $contract->base_amount = (float) $contract->billable_area_sqft * (float) $contract->rate_per_sqft;
            }

            $contract->contract_amount = (float) $contract->base_amount + (float) $contract->addons_amount;
        });

        static::deleting(function (Contract $contract) {
            // The documents rows cascade at the database level, which never fires
            // ContractDocument::deleted — so remove their files here instead.
            Storage::disk('local')->deleteDirectory(ContractDocument::directoryFor($contract));
        });

        // A percentage milestone ("20% on lenter") tracks the contract amount, so
        // re-derive the schedule whenever the total moves. recalculateAmount()
        // skips flat and already-invoiced milestones — those are figures the client
        // was given, and must not shift under an edit.
        static::saved(function (Contract $contract) {
            $contract->milestones()
                ->whereNotNull('percentage')
                ->whereNull('invoiced_on')
                ->get()
                ->each(function (ContractMilestone $milestone) use ($contract) {
                    $milestone->setRelation('contract', $contract);
                    $milestone->recalculateAmount();
                });
        });
    }

    /**
     * Get the project this contract is against.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the add-ons priced on top of this contract's base.
     */
    public function addons(): HasMany
    {
        return $this->hasMany(ContractAddon::class)->orderBy('display_order');
    }

    /**
     * Get the documents attached to this contract (newest first).
     */
    public function documents(): HasMany
    {
        return $this->hasMany(ContractDocument::class)->latest('id');
    }

    /**
     * The most recently issued copy of this contract, if one exists.
     */
    public function issuedContract(): ?ContractDocument
    {
        return $this->documents()->where('type', 'issued_contract')->first();
    }

    /**
     * Get the stage-wise payment schedule for this contract.
     */
    public function milestones(): HasMany
    {
        return $this->hasMany(ContractMilestone::class)->orderBy('display_order');
    }

    /**
     * Get the payments received against this contract (newest first).
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderByDesc('paid_on');
    }

    /**
     * Total amount received against this contract.
     */
    public function getTotalPaidAttribute(): string
    {
        // Use the loaded relation if present to avoid an extra query, else sum in DB.
        $paid = $this->relationLoaded('payments')
            ? $this->payments->sum('amount')
            : $this->payments()->sum('amount');

        return number_format((float) $paid, 2, '.', '');
    }

    /**
     * Outstanding balance: what was agreed minus what has been paid.
     */
    public function getBalanceDueAttribute(): string
    {
        $due = (float) $this->contract_amount - (float) $this->total_paid;

        return number_format($due, 2, '.', '');
    }

    /**
     * Payment status derived from paid vs contract amount.
     */
    public function getPaymentStatusAttribute(): string
    {
        $paid = (float) $this->total_paid;
        $total = (float) $this->contract_amount;

        if ($paid <= 0) {
            return 'unpaid';
        }

        // Treat within one paisa of the total as fully paid.
        return $paid + 0.01 >= $total ? 'paid' : 'partial';
    }

    /**
     * Fingerprint of everything this contract puts on its PDF.
     *
     * Comparing this against a document's stored content_hash is how an issued
     * copy is known to be out of date. It deliberately covers more than the
     * total: changing the exclusions or a milestone rewrites the paper without
     * moving the price, and the client's copy is wrong either way.
     *
     * Scope is what the *contract* owns. The PDF also prints the client's name
     * and phone and the project's site, but those belong to other records, and
     * correcting a phone number is not an amendment to a deal — folding them in
     * would flag every contract a client has whenever their details are edited,
     * and a warning that cries wolf is one that stops being read.
     *
     * status is out for the same reason: marking a contract completed does not
     * change what was agreed.
     */
    public function documentFingerprint(): string
    {
        $this->loadMissing(['addons', 'milestones']);

        // Cast decimals to string so 700 and 700.00 fingerprint identically.
        $payload = [
            'title' => $this->title,
            'type' => $this->type,
            'billable_area_sqft' => (string) $this->billable_area_sqft,
            'rate_per_sqft' => (string) $this->rate_per_sqft,
            'quality_tier' => $this->quality_tier,
            'base_amount' => (string) $this->base_amount,
            'addons_amount' => (string) $this->addons_amount,
            'contract_amount' => (string) $this->contract_amount,
            'currency' => $this->currency,
            'signed_on' => $this->signed_on?->format('Y-m-d'),
            'payment_terms' => $this->payment_terms,
            'exclusions' => $this->exclusions,
            'notes' => $this->notes,
            // Both relations are ordered by display_order, so the sequence here is
            // stable — an unordered list would make the hash flap between saves.
            'addons' => $this->addons->map(fn (ContractAddon $addon) => [
                $addon->name,
                $addon->unit,
                (string) $addon->quantity,
                (string) $addon->rate,
                (string) $addon->amount,
            ])->all(),
            'milestones' => $this->milestones->map(fn (ContractMilestone $milestone) => [
                $milestone->name,
                (string) $milestone->percentage,
                (string) $milestone->amount,
                $milestone->due_on?->format('Y-m-d'),
            ])->all(),
        ];

        return hash('sha256', json_encode($payload));
    }

    /**
     * Roll the add-on lines up into addons_amount.
     *
     * The update() re-fires saving(), which re-derives contract_amount, so the
     * header total always matches the sum of its add-ons.
     */
    public function recalculateAddons(): void
    {
        $this->update([
            'addons_amount' => $this->addons()->sum('amount'),
        ]);
    }
}
