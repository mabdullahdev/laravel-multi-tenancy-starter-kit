<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\ContractDocumentController;
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

    // Contracts — the commercial agreement(s) covering a project
    Route::get('projects/{project}/contracts/create', [ContractController::class, 'create'])->name('contracts.create');
    Route::post('projects/{project}/contracts', [ContractController::class, 'store'])->name('contracts.store');
    Route::get('contracts/{contract}', [ContractController::class, 'show'])->name('contracts.show');
    Route::get('contracts/{contract}/edit', [ContractController::class, 'edit'])->name('contracts.edit');
    Route::put('contracts/{contract}', [ContractController::class, 'update'])->name('contracts.update');
    Route::delete('contracts/{contract}', [ContractController::class, 'destroy'])->name('contracts.destroy');

    // Contract documents — the live PDF, the frozen issued copy, and uploads
    Route::get('contracts/{contract}/pdf', [ContractDocumentController::class, 'pdf'])->name('contracts.pdf');
    Route::post('contracts/{contract}/issue', [ContractDocumentController::class, 'issue'])->name('contracts.issue');
    Route::post('contracts/{contract}/documents', [ContractDocumentController::class, 'store'])->name('contracts.documents.store');
    Route::get('contract-documents/{document}/download', [ContractDocumentController::class, 'download'])->name('contract-documents.download');
    Route::delete('contract-documents/{document}', [ContractDocumentController::class, 'destroy'])->name('contract-documents.destroy');

    Route::post('boqs', [BoqController::class, 'store'])->name('boqs.store');
    Route::get('boqs/{boq}', [BoqController::class, 'show'])->name('boqs.show');
    Route::get('boqs/{boq}/pdf', [BoqController::class, 'pdf'])->name('boqs.pdf');
    Route::get('boqs/{boq}/edit', [BoqController::class, 'edit'])->name('boqs.edit');
    Route::put('boqs/{boq}', [BoqController::class, 'update'])->name('boqs.update');
    Route::delete('boqs/{boq}', [BoqController::class, 'destroy'])->name('boqs.destroy');
    Route::post('boqs/{boq}/revise', [BoqController::class, 'revise'])->name('boqs.revise');

    // Payments received against a contract
    Route::post('contracts/{contract}/payments', [PaymentController::class, 'store'])->name('contracts.payments.store');
    Route::delete('payments/{payment}', [PaymentController::class, 'destroy'])->name('payments.destroy');
});

// Central-domain-only routes (settings + auth)
Route::middleware([PreventAccessFromTenantDomains::class])->group(function () {
    require __DIR__.'/settings.php';
    require __DIR__.'/auth.php';
});
