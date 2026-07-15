<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\BoqController;
use App\Http\Controllers\PaymentController;
use App\Http\Middleware\PreventAccessFromTenantDomains;

Route::get('/', function () {
    $tenants = DB::table('tenants')->get();
    return Inertia::render('welcome', compact('tenants'));
})->name('home');

Route::middleware([PreventAccessFromTenantDomains::class, 'auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('tenants', [TenantController::class, 'index'])->name('tenants');
    Route::get('tenants/create', [TenantController::class, 'create'])->name('tenants.create');
    Route::post('tenants', [TenantController::class, 'store'])->name('tenants.store');
    Route::delete('tenants/{tenant}', [TenantController::class, 'destroy'])->name('tenants.destroy');

    // BOQ feature (central) — clients, projects, and bills of quantities
    Route::resource('clients', ClientController::class)->except(['show']);
    Route::resource('projects', ProjectController::class);

    Route::post('boqs', [BoqController::class, 'store'])->name('boqs.store');
    Route::get('boqs/{boq}', [BoqController::class, 'show'])->name('boqs.show');
    Route::get('boqs/{boq}/pdf', [BoqController::class, 'pdf'])->name('boqs.pdf');
    Route::get('boqs/{boq}/edit', [BoqController::class, 'edit'])->name('boqs.edit');
    Route::put('boqs/{boq}', [BoqController::class, 'update'])->name('boqs.update');
    Route::delete('boqs/{boq}', [BoqController::class, 'destroy'])->name('boqs.destroy');
    Route::post('boqs/{boq}/revise', [BoqController::class, 'revise'])->name('boqs.revise');

    // Payments received against a BOQ
    Route::post('boqs/{boq}/payments', [PaymentController::class, 'store'])->name('boqs.payments.store');
    Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');
});

// Central-domain-only routes (settings + auth)
Route::middleware([PreventAccessFromTenantDomains::class])->group(function () {
    require __DIR__.'/settings.php';
    require __DIR__.'/auth.php';
});
