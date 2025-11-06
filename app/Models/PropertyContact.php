<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyContact extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'contact_name',
        'contact_phone',
        'contact_phone_secondary',
        'contact_email',
        'contact_whatsapp',
        'contact_type',
        'is_primary',
        'notes',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    /**
     * Get the property that owns the contact.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}

