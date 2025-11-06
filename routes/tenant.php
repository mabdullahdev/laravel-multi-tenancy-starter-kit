<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;
use Inertia\Inertia;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Tenant\PropertyController;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Here you can register the tenant routes for your application.
| These routes are loaded by the TenantRouteServiceProvider.
|
| Feel free to customize them however you want. Good luck!
|
*/

// Tenant-specific routes that require tenancy middleware
Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {
    // Tenant home/welcome page
    Route::get('/', function () {
        return Inertia::render('welcome');
    })->name('home');
    
    Route::middleware(['auth'])->name('tenant.')->group(function () {
        Route::get('tenant/dashboard', function () {
            return Inertia::render('dashboard');
        })->name('dashboard');
        
        // Properties routes
        Route::get('properties', [PropertyController::class, 'index'])->name('properties.index');
        
        Route::get('properties/create', [PropertyController::class, 'create'])->name('properties.create');
        
        Route::post('properties', [PropertyController::class, 'store'])->name('properties.store');
        Route::get('properties/{property}', [PropertyController::class, 'show'])->name('properties.show');
        Route::put('properties/{property}', [PropertyController::class, 'update'])->name('properties.update');
        Route::delete('properties/{property}', [PropertyController::class, 'destroy'])->name('properties.destroy');
    });
    
    // Settings routes for tenants (distinct paths and names)
    Route::middleware(['auth'])->prefix('tenant/settings')->name('tenant.')->group(function () {
        Route::redirect('/', '/tenant/settings/profile');

        Route::get('profile', [\App\Http\Controllers\Settings\ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('profile', [\App\Http\Controllers\Settings\ProfileController::class, 'update'])->name('profile.update');
        Route::delete('profile', [\App\Http\Controllers\Settings\ProfileController::class, 'destroy'])->name('profile.destroy');

        Route::get('password', [\App\Http\Controllers\Settings\PasswordController::class, 'edit'])->name('password.edit');

        Route::put('password', [\App\Http\Controllers\Settings\PasswordController::class, 'update'])
            ->middleware('throttle:6,1')
            ->name('password.update');

        Route::get('appearance', function () {
            return Inertia::render('settings/appearance');
        })->name('appearance');
    });
    
    require __DIR__.'/tenant/auth.php';
});


