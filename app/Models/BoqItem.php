<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BoqItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'boq_section_id',
        'item_code',
        'description',
        'unit',
        'quantity',
        'rate',
        'amount',
        'display_order',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'rate' => 'decimal:2',
        'amount' => 'decimal:2',
        'display_order' => 'integer',
    ];

    /**
     * Hook model events to keep derived values in sync.
     *
     * - saving:  amount is always (re)computed from quantity × rate, so the
     *            stored line total can never drift from its inputs.
     * - saved/deleted: the parent BOQ's total_amount is rolled up so the
     *            header total always matches the sum of its items.
     */
    protected static function booted(): void
    {
        static::saving(function (BoqItem $item) {
            $item->amount = (float) $item->quantity * (float) $item->rate;
        });

        static::saved(function (BoqItem $item) {
            $item->section?->boq?->recalculateTotal();
        });

        static::deleted(function (BoqItem $item) {
            $item->section?->boq?->recalculateTotal();
        });
    }

    /**
     * Get the section that owns the item.
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(BoqSection::class, 'boq_section_id');
    }
}
