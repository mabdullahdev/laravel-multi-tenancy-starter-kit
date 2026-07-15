<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'boq_id',
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
     * Get the BOQ this payment is against.
     */
    public function boq(): BelongsTo
    {
        return $this->belongsTo(Boq::class);
    }
}
