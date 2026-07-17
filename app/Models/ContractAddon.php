<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractAddon extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id',
        'name',
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
     * Mirrors BoqItem:
     * - saving:  amount is always (re)computed from quantity × rate.
     * - saved/deleted: the parent contract's addons_amount is rolled up, which in
     *            turn re-derives its contract_amount.
     */
    protected static function booted(): void
    {
        static::saving(function (ContractAddon $addon) {
            $addon->amount = (float) $addon->quantity * (float) $addon->rate;
        });

        static::saved(function (ContractAddon $addon) {
            $addon->contract?->recalculateAddons();
        });

        static::deleted(function (ContractAddon $addon) {
            $addon->contract?->recalculateAddons();
        });
    }

    /**
     * Get the contract that owns the add-on.
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }
}
