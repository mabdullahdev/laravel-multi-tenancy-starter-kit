<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventAccessFromTenantDomains
{
    /**
     * Handle an incoming request.
     *
     * Prevents central routes from being accessed on tenant domains.
     * This ensures tenant domains only use tenant-specific routes.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $currentDomain = $request->getHost();
        $centralDomains = config('tenancy.central_domains', []);
        
        // If the current domain is NOT in the central domains list, it's a tenant domain
        if (!in_array($currentDomain, $centralDomains)) {
            // We're on a tenant domain trying to access a central route - abort!
            abort(404);
        }

        return $next($request);
    }
}

