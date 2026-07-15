<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;

class TenantOwnerLogger
{
    /**
     * Log tenant owner creation info
     */
    public static function info(array $data, string $message): void
    {
        Log::channel('tenant_owner')->info($message, $data);
    }

    /**
     * Log tenant owner creation success
     */
    public static function success(string $tenantId, int $ownerId, string $ownerEmail): void
    {
        Log::channel('tenant_owner')->info('Tenant owner created successfully', [
            'tenant_id' => $tenantId,
            'owner_id' => $ownerId,
            'owner_email' => $ownerEmail,
            'created_at' => now()->toISOString(),
            'status' => 'success'
        ]);
    }

    /**
     * Log tenant owner creation failure
     */
    public static function failure(string $tenantId, string $error, array $context = []): void
    {
        Log::channel('tenant_owner')->error('Tenant owner creation failed', [
            'tenant_id' => $tenantId,
            'error' => $error,
            'context' => $context,
            'created_at' => now()->toISOString(),
            'status' => 'failed'
        ]);
    }

    /**
     * Log tenant owner creation warning
     */
    public static function warning(string $tenantId, string $message, array $context = []): void
    {
        Log::channel('tenant_owner')->warning('Tenant owner creation warning', [
            'tenant_id' => $tenantId,
            'message' => $message,
            'context' => $context,
            'created_at' => now()->toISOString(),
            'status' => 'warning'
        ]);
    }

    /**
     * Log tenant owner creation start
     */
    public static function start(string $tenantId, string $ownerEmail): void
    {
        Log::channel('tenant_owner')->info('Tenant owner creation started', [
            'tenant_id' => $tenantId,
            'owner_email' => $ownerEmail,
            'created_at' => now()->toISOString(),
            'status' => 'started'
        ]);
    }
}
