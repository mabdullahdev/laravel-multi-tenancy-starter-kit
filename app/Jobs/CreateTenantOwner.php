<?php

namespace App\Jobs;

use App\Models\User;
use App\Helpers\TenantOwnerLogger;
use App\Events\TenantOwnerProvisioned;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Hash;
use Stancl\Tenancy\Contracts\Tenant;

class CreateTenantOwner implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Tenant $tenant;

    public function __construct(Tenant $tenant)
    {
        $this->tenant = $tenant;
    }

    public function handle()
    {
        // Owner fields are VirtualColumn attributes: on save they're packed into the
        // `data` column, but after retrieval they're decoded back onto the model and
        // `data` is reset to null. So read them directly, not via `->data`.
        $ownerName = $this->tenant->owner_name;
        $ownerEmail = $this->tenant->owner_email;

        TenantOwnerLogger::info(
            ['tenant_id' => $this->tenant->id, 'owner_name' => $ownerName, 'owner_email' => $ownerEmail],
            "Creating tenant owner in tenant context and here is data"
        );

        if (!$ownerEmail) {
            TenantOwnerLogger::warning($this->tenant->id, "No owner data found");
            return;
        }

        try {
            // Create the owner user in the TENANT database context
            $owner = $this->tenant->run(function () use ($ownerName, $ownerEmail) {
                return User::firstOrCreate(
                    [ 'email' => $ownerEmail ],
                    [
                        'name' => $ownerName,
                        'email_verified_at' => now(),
                    ]
                );
            });

            event(new TenantOwnerProvisioned(
                tenantId: (string) $this->tenant->id,
                userId: (int) $owner->id,
                email: (string) $owner->email,
                wasRecentlyCreated: (bool) $owner->wasRecentlyCreated,
            ));

            // Log successful owner creation
            TenantOwnerLogger::success($this->tenant->id, $owner->id, $owner->email);

        } catch (\Exception $e) {
            TenantOwnerLogger::failure($this->tenant->id, $e->getMessage(), [
                'owner_email' => $ownerEmail ?? 'unknown'
            ]);
            
            // Re-throw the exception so the job fails
            throw $e;
        }
    }
}
