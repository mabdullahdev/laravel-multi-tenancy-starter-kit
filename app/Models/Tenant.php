<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'id',
        'data',
        // Virtual columns (packed into `data` by VirtualColumn) — must be
        // fillable or mass assignment silently drops them.
        'owner_name',
        'owner_email',
        'owner_cellphone',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'data' => 'array',
    ];

    /**
     * Get the owner for this tenant.
     */
    public function owner(): HasOne
    {
        return $this->hasOne(TenantOwner::class);
    }

    /**
     * Boot the model and add model events.
     */
    protected static function boot()
    {
        parent::boot();
        
        // Clean up owner when tenant is deleted
        static::deleting(function ($tenant) {
            $tenant->owner()->delete();
        });
    }
}
