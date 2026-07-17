<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContractMilestone extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id',
        'name',
        'percentage',
        'amount',
        'due_on',
        'status',
        'invoice_no',
        'invoiced_on',
        'display_order',
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'amount' => 'decimal:2',
        'due_on' => 'date',
        'invoiced_on' => 'date',
        'display_order' => 'integer',
    ];

    /**
     * True once the milestone has been billed to the client.
     */
    public function isBilled(): bool
    {
        return $this->invoiced_on !== null;
    }

    /**
     * Recompute amount from the parent contract's total.
     *
     * Only applies to percentage-based milestones that have not been billed yet.
     * A flat milestone was entered as a figure, and a billed one is a number the
     * client has already been given — re-deriving either would move it under them.
     */
    public function recalculateAmount(): void
    {
        if ($this->percentage === null || $this->isBilled()) {
            return;
        }

        $this->update([
            'amount' => (float) $this->contract->contract_amount * (float) $this->percentage / 100,
        ]);
    }

    /**
     * Get the contract this milestone belongs to.
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    /**
     * Get the payments recorded against this milestone.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
