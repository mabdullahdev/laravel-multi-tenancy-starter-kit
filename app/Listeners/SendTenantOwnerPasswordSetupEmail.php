<?php

namespace App\Listeners;

use App\Events\TenantOwnerProvisioned;
use App\Helpers\TenantOwnerLogger;
use App\Models\Tenant;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Password;

class SendTenantOwnerPasswordSetupEmail implements ShouldQueue
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(TenantOwnerProvisioned $event): void
    {
        if (!$event->wasRecentlyCreated) {
            return;
        }

        $tenant = Tenant::findOrFail($event->tenantId);

        $tenant->run(function () use ($event) {
            Password::sendResetLink([
                'email' => $event->email,
            ]);
        });
    }
}
