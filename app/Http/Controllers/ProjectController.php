<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Client;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;

class ProjectController extends Controller
{
    /**
     * Display a listing of projects.
     */
    public function index()
    {
        $projects = Project::with('client')
            ->withCount('boqs')
            ->latest()
            ->get()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'location' => $project->location,
                'status' => $project->status,
                'client_name' => $project->client?->name,
                'boqs_count' => $project->boqs_count,
            ]);

        return inertia('projects/index', [
            'projects' => $projects,
        ]);
    }

    /**
     * Show the form for creating a new project.
     */
    public function create()
    {
        return inertia('projects/create', [
            'clients' => $this->clientOptions(),
        ]);
    }

    /**
     * Store a newly created project.
     */
    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $project = Project::create($request->validated());

        return redirect()
            ->route('projects.show', $project)
            ->with('success', 'Project created successfully!');
    }

    /**
     * Display the specified project with its BOQs.
     */
    public function show(Project $project)
    {
        $project->load(['client', 'boqs' => fn ($q) => $q->orderByDesc('revision')]);

        return inertia('projects/show', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'location' => $project->location,
                'status' => $project->status,
                'client' => [
                    'id' => $project->client->id,
                    'name' => $project->client->name,
                    'company_name' => $project->client->company_name,
                    'phone' => $project->client->phone,
                    'email' => $project->client->email,
                ],
                'boqs' => $project->boqs->map(fn ($boq) => [
                    'id' => $boq->id,
                    'title' => $boq->title,
                    'revision' => $boq->revision,
                    'currency' => $boq->currency,
                    'status' => $boq->status,
                    'total_amount' => $boq->total_amount,
                ])->values()->all(),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(Project $project)
    {
        return inertia('projects/edit', [
            'project' => [
                'id' => $project->id,
                'client_id' => (string) $project->client_id,
                'name' => $project->name,
                'location' => $project->location ?? '',
                'status' => $project->status,
            ],
            'clients' => $this->clientOptions(),
        ]);
    }

    /**
     * Update the specified project.
     */
    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $project->update($request->validated());

        return redirect()
            ->route('projects.show', $project)
            ->with('success', 'Project updated successfully!');
    }

    /**
     * Remove the specified project.
     */
    public function destroy(Project $project): RedirectResponse
    {
        $project->delete();

        return redirect()
            ->route('projects.index')
            ->with('success', 'Project deleted successfully!');
    }

    /**
     * Client options for select dropdowns.
     *
     * @return array<int, array{value: string, label: string}>
     */
    private function clientOptions(): array
    {
        return Client::orderBy('name')
            ->get()
            ->map(fn (Client $client) => [
                'value' => (string) $client->id,
                'label' => $client->company_name
                    ? "{$client->name} ({$client->company_name})"
                    : $client->name,
            ])
            ->all();
    }
}
