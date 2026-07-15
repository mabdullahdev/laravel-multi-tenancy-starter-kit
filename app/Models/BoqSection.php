<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BoqSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'boq_id',
        'name',
        'display_order',
    ];

    protected $casts = [
        'display_order' => 'integer',
    ];

    /**
     * Get the BOQ that owns the section.
     */
    public function boq(): BelongsTo
    {
        return $this->belongsTo(Boq::class);
    }

    /**
     * Get the line items for the section.
     */
    public function items(): HasMany
    {
        return $this->hasMany(BoqItem::class)->orderBy('display_order');
    }
}
