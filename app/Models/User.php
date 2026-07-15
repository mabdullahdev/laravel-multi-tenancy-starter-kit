<?php

namespace App\Models;

use App\Notifications\TenantResetPassword;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Auth\Notifications\ResetPassword as DefaultResetPassword;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Boot method to handle automatic role assignment
     */
    protected static function boot()
    {
        parent::boot();

        static::created(function ($user) {
            // Only assign roles if tenancy is initialized (we're in a tenant context)
            if (tenancy()->initialized) {
                // Check if this is the first user in the tenant (owner)
                if (static::count() === 1) {
                    // This is the first user, assign Owner role
                    $ownerRole = \Spatie\Permission\Models\Role::where('name', 'Owner')->first();
                    if ($ownerRole) {
                        $user->assignRole($ownerRole);
                    }
                }
            }
        });
    }
    
    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        if (tenancy()->initialized) {
            $this->notify(new TenantResetPassword($token));

            return;
        }

        $this->notify(new DefaultResetPassword($token));
    }   
}
