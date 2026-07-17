<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id',
        'contract_milestone_id',
        'amount',
        'paid_on',
        'method',
        'reference',
        'note',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_on' => 'date',
    ];

    /**
     * Get the contract this payment is against.
     */
    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    /**
     * Get the milestone this payment settles, if it was against one.
     */
    public function milestone(): BelongsTo
    {
        return $this->belongsTo(ContractMilestone::class, 'contract_milestone_id');
    }
}
