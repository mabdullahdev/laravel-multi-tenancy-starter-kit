<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Customize auth redirect based on tenancy context (for protected routes)
        \Illuminate\Auth\Middleware\Authenticate::redirectUsing(function ($request) {
            return tenancy()->initialized 
                ? route('tenant.login') 
                : route('login');
        });

        // Customize guest redirect based on tenancy context (for login/register pages)
        \Illuminate\Auth\Middleware\RedirectIfAuthenticated::redirectUsing(function ($request) {
            return tenancy()->initialized 
                ? route('tenant.dashboard') 
                : route('dashboard');
        });
    }
}
