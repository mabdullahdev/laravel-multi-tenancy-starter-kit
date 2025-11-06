<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    use HasFactory;

    protected $fillable = [
        'address',
        'city',
        'province',
        'postal_code',
        'price',
        'security_deposit',
        'maintenance_charges',
        'price_unit',
        'type',
        'status',
        'category',
        'sub_category',
        'bedrooms',
        'bathrooms',
        'square_feet',
        'description',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'security_deposit' => 'decimal:2',
        'maintenance_charges' => 'decimal:2',
        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
        'square_feet' => 'integer',
    ];

    /**
     * Get the images for the property.
     */
    public function images(): HasMany
    {
        return $this->hasMany(PropertyImage::class)->orderBy('display_order');
    }

    /**
     * Get the primary/featured image for the property.
     */
    public function primaryImage()
    {
        return $this->hasOne(PropertyImage::class)->where('is_primary', true);
    }

    /**
     * Get the contacts for the property.
     */
    public function contacts(): HasMany
    {
        return $this->hasMany(PropertyContact::class);
    }

    /**
     * Get the primary contact for the property.
     */
    public function primaryContact()
    {
        return $this->hasOne(PropertyContact::class)->where('is_primary', true);
    }

    /**
     * Scope a query to only include properties of a given type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to only include properties of a given status.
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include available properties.
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    /**
     * Get the formatted price based on property type.
     * 
     * For rental properties: "Rs. 50,000/mo"
     * For sale properties: "Rs. 5.0M" (in millions)
     * 
     * @return string|null
     */
    public function getFormattedPriceAttribute(): ?string
    {
        if ($this->price === null) {
            return null;
        }

        if ($this->type === 'rental') {
            $formatted = number_format((float) $this->price, 0, '.', ',');
            $unit = $this->price_unit === 'per_sqft' ? '/sqft' : '/mo';
            return "Rs. {$formatted}{$unit}";
        }

        // For sale properties, format in millions
        $priceInMillions = (float) $this->price / 1000000;
        $formatted = rtrim(rtrim(number_format($priceInMillions, 1, '.', ''), '0'), '.');
        return "Rs. {$formatted} Million";
    }

    /**
     * Get the display price (formatted or "Price on Request").
     * 
     * @return string
     */
    public function getDisplayPriceAttribute(): string
    {
        return $this->formatted_price ?? 'Price on Request';
    }
}

