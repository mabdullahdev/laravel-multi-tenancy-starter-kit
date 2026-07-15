<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\TenantOwner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Stancl\Tenancy\Database\Models\Domain;

class TenantController extends Controller
{
    /**
     * Display the tenants page.
     */
    public function index()
    {
        $tenants = Tenant::with(['domains', 'owner'])->get();
        
        return Inertia::render('tenants/index', [
            'tenants' => $tenants
        ]);
    }

    /**
     * Show the form for creating a new tenant.
     */
    public function create()
    {
        return Inertia::render('tenants/create');
    }

    /**
     * Store a newly created tenant in storage.
     */
    public function store(Request $request)
    {
        $fullDomain = implode('.', array_filter([$request->domain, env('CENTRAL_DOMAIN', 'localhost')]));
        
        $request->validate([
            'id' => 'required|string|unique:tenants,id',
            'domain' => 'required|string|unique:domains,domain,' . $fullDomain,
            'owner_name' => 'required|string|max:255',
            'owner_email' => 'required|email|max:255',
            'owner_cellphone' => 'required|string',
        ]);

        // 1) Create owner first in central DB
        $owner = TenantOwner::create([
            'tenant_id' => $request->id,
            'name' => $request->owner_name,
            'email' => $request->owner_email,
            'cellphone' => $request->owner_cellphone,
        ]);

        // 2) Create tenant (this triggers the tenancy pipeline) and attach its domain.
        // Not wrapped in a DB transaction: Tenant::create() physically creates the tenant
        // database (DDL auto-commits) and dispatches queued side effects that a rollback
        // can't undo. Instead, compensate by deleting the tenant (drops its database) and
        // the central owner row if anything after the owner insert fails.
        try {
            $tenant = Tenant::create([
                'id' => $request->id,
                'owner_name' => $request->owner_name,
                'owner_email' => $request->owner_email,
                'owner_cellphone' => $request->owner_cellphone,
            ]);

            $tenant->domains()->create(['domain' => $fullDomain]);
        } catch (\Throwable $e) {
            if (isset($tenant)) {
                $tenant->delete(); // fires TenantDeleted → drops the tenant database
            }
            $owner->delete();

            throw $e;
        }

        return redirect()->route('tenants')->with('success', 'Tenant and domain created successfully.');
    }

    /**
     * Remove the specified tenant from storage.
     */
    public function destroy(Tenant $tenant)
    {
        // Delete the tenant (this will trigger TenantDeleted event and delete the database)
        $tenant->delete();

        return redirect()->route('tenants')->with('success', 'Tenant, database, and cache deleted successfully.');
    }
} 