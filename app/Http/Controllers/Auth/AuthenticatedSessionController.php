<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Traits\HasTenantAware;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    use HasTenantAware;
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render($this->determineLoginPage(), [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->hasSession() ? $request->session()->get('status') : null,
        ]);
    }



    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Redirect to appropriate dashboard based on tenancy context
        return redirect()->intended(route(tenancy()->initialized ? 'tenant.dashboard' : 'dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Redirect to appropriate login page based on tenancy context
        return redirect()->route(tenancy()->initialized ? 'tenant.login' : 'login');
    }
}
