<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantOwner extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'cellphone',
    ];

    /**
     * Get the tenant that owns the owner.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Boot the model and add model events.
     */
    protected static function boot()
    {
        parent::boot();
        
        // Clean up owner when tenant is deleted (no-op placeholder)
        static::deleted(function ($tenantOwner) {
            // Intentionally left blank
        });
    }
}
