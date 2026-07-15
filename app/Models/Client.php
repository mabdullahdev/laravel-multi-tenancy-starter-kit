<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'company_name',
        'email',
        'phone',
        'phone_secondary',
        'whatsapp',
        'cnic',
        'address',
        'city',
        'province',
        'postal_code',
        'notes',
    ];

    /**
     * Get the projects for the client.
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }
}
