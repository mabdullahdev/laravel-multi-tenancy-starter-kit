<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Facades\DB;

class Boq extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'revision',
        'currency',
        'status',
        'total_amount',
        'payment_terms',
        'notes',
    ];

    protected $casts = [
        'revision' => 'integer',
        'total_amount' => 'decimal:2',
    ];

    /**
     * Get the project that owns the BOQ.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the sections for the BOQ.
     */
    public function sections(): HasMany
    {
        return $this->hasMany(BoqSection::class)->orderBy('display_order');
    }

    /**
     * Get all line items across every section of the BOQ.
     */
    public function items(): HasManyThrough
    {
        return $this->hasManyThrough(BoqItem::class, BoqSection::class);
    }

    /**
     * Get the payments received against this BOQ (newest first).
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderByDesc('paid_on');
    }

    /**
     * Total amount received against this BOQ.
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
     * Outstanding balance: total minus what has been paid.
     */
    public function getBalanceDueAttribute(): string
    {
        $due = (float) $this->total_amount - (float) $this->total_paid;

        return number_format($due, 2, '.', '');
    }

    /**
     * Payment status derived from paid vs total.
     */
    public function getPaymentStatusAttribute(): string
    {
        $paid = (float) $this->total_paid;
        $total = (float) $this->total_amount;

        if ($paid <= 0) {
            return 'unpaid';
        }

        // Treat within one paisa of the total as fully paid.
        return $paid + 0.01 >= $total ? 'paid' : 'partial';
    }

    /**
     * Recompute and persist the denormalized total from the line items.
     *
     * This is the single source of truth for keeping total_amount in sync;
     * it is triggered automatically whenever a BoqItem is saved or deleted.
     */
    public function recalculateTotal(): void
    {
        $this->update([
            'total_amount' => $this->items()->sum('amount'),
        ]);
    }

    /**
     * Create the next revision of this BOQ as a fresh, editable copy.
     *
     * Duplicates the BOQ header along with every section and line item into a
     * new draft. The original is left untouched as a permanent snapshot of what
     * was previously quoted.
     *
     * The copy is done inside a transaction (all-or-nothing) and uses a single
     * bulk insert per section for the items, so even large BOQs replicate in a
     * handful of queries rather than one query per row.
     */
    public function replicateWithRevision(): self
    {
        // Load the full tree once to avoid N+1 queries while copying.
        $this->loadMissing('sections.items');

        return DB::transaction(function () {
            // Next revision is based on the highest existing revision for the
            // project, so branching from an older revision still lands on top.
            $nextRevision = static::where('project_id', $this->project_id)->max('revision') + 1;

            $newBoq = $this->replicate(['total_amount']);
            $newBoq->revision = $nextRevision;
            $newBoq->status = 'draft';
            $newBoq->total_amount = $this->total_amount; // items are identical, so the total carries over
            $newBoq->save();

            $now = now();

            foreach ($this->sections as $section) {
                $newSection = $section->replicate();
                $newSection->boq_id = $newBoq->id;
                $newSection->save();

                // One bulk insert for all items in this section. insert() bypasses
                // model events on purpose: amounts are already computed and the new
                // total is copied above, so there is nothing to recalculate.
                $rows = $section->items->map(fn (BoqItem $item) => [
                    'boq_section_id' => $newSection->id,
                    'item_code' => $item->item_code,
                    'description' => $item->description,
                    'unit' => $item->unit,
                    'quantity' => $item->quantity,
                    'rate' => $item->rate,
                    'amount' => $item->amount,
                    'display_order' => $item->display_order,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])->all();

                if (! empty($rows)) {
                    BoqItem::insert($rows);
                }
            }

            return $newBoq;
        });
    }
}
