<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'name',
        'location',
        'covered_area_sqft',
        'status',
    ];

    protected $casts = [
        'covered_area_sqft' => 'decimal:2',
    ];

    /**
     * Get the client that owns the project.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the contracts signed for the project.
     *
     * Usually one ("Turnkey"), but a client can contract the grey structure and
     * the finishing separately, at rates agreed months apart.
     */
    public function contracts(): HasMany
    {
        return $this->hasMany(Contract::class);
    }

    /**
     * Get the BOQs for the project.
     */
    public function boqs(): HasMany
    {
        return $this->hasMany(Boq::class);
    }
}
