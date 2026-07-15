<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;

class ClientController extends Controller
{
    /**
     * Display a listing of clients.
     */
    public function index()
    {
        $clients = Client::withCount('projects')
            ->latest()
            ->get()
            ->map(fn (Client $client) => [
                'id' => $client->id,
                'name' => $client->name,
                'company_name' => $client->company_name,
                'email' => $client->email,
                'phone' => $client->phone,
                'city' => $client->city,
                'projects_count' => $client->projects_count,
            ]);

        return inertia('clients/index', [
            'clients' => $clients,
        ]);
    }

    /**
     * Show the form for creating a new client.
     */
    public function create()
    {
        return inertia('clients/create');
    }

    /**
     * Store a newly created client.
     */
    public function store(StoreClientRequest $request): RedirectResponse
    {
        Client::create($request->validated());

        return redirect()
            ->route('clients.index')
            ->with('success', 'Client created successfully!');
    }

    /**
     * Show the form for editing the specified client.
     */
    public function edit(Client $client)
    {
        return inertia('clients/edit', [
            'client' => [
                'id' => $client->id,
                'name' => $client->name,
                'company_name' => $client->company_name ?? '',
                'email' => $client->email ?? '',
                'phone' => $client->phone,
                'phone_secondary' => $client->phone_secondary ?? '',
                'whatsapp' => $client->whatsapp ?? '',
                'cnic' => $client->cnic ?? '',
                'address' => $client->address ?? '',
                'city' => $client->city ?? '',
                'province' => $client->province ?? '',
                'postal_code' => $client->postal_code ?? '',
                'notes' => $client->notes ?? '',
            ],
        ]);
    }

    /**
     * Update the specified client.
     */
    public function update(UpdateClientRequest $request, Client $client): RedirectResponse
    {
        $client->update($request->validated());

        return redirect()
            ->route('clients.index')
            ->with('success', 'Client updated successfully!');
    }

    /**
     * Remove the specified client.
     */
    public function destroy(Client $client): RedirectResponse
    {
        $client->delete();

        return redirect()
            ->route('clients.index')
            ->with('success', 'Client deleted successfully!');
    }
}
