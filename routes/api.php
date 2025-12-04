<?php

use App\Http\Controllers\Api\PropertyApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Properties API - Cross-tenant property listing
Route::prefix('properties')->group(function () {
    // Get all properties from all tenants with pagination
    // Supports optional filters: ?status=available&type=rental
    // Examples:
    //   GET /api/properties - All properties
    //   GET /api/properties?status=available - Available properties only
    //   GET /api/properties?type=rental - Rental properties only
    //   GET /api/properties?status=available&type=rental - Available rental properties
    Route::get('/', [PropertyApiController::class, 'index'])->name('api.properties.index');
    
    // Deprecated: Use GET /api/properties?status=available instead
    Route::get('/status', [PropertyApiController::class, 'byStatus'])->name('api.properties.by-status');
    
    // Deprecated: Use GET /api/properties?type=rental instead
    Route::get('/type', [PropertyApiController::class, 'byType'])->name('api.properties.by-type');
});

