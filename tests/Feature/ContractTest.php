<?php

use App\Models\Client;
use App\Models\Contract;
use App\Models\ContractAddon;
use App\Models\Project;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->user = User::factory()->create();

    $this->client = Client::create([
        'name' => 'Ahmed Raza',
        'phone' => '03001234567',
    ]);

    $this->project = Project::create([
        'client_id' => $this->client->id,
        'name' => 'Bahria Villa – Block C',
        'location' => 'Islamabad',
        'covered_area_sqft' => 2000,
        'status' => 'active',
    ]);
});

function thekaPayload(array $overrides = []): array
{
    return array_merge([
        'title' => 'Grey Structure',
        'type' => 'theka_per_sqft',
        'billable_area_sqft' => '2000',
        'rate_per_sqft' => '700',
        'quality_tier' => 'standard',
        'currency' => 'PKR',
        'signed_on' => '2026-01-10',
        'status' => 'active',
        'notes' => '',
        // 500 sqft basement at PKR 360/sqft = 180,000
        'addons' => [
            ['name' => 'Basement', 'unit' => 'sqft', 'quantity' => '500', 'rate' => '360'],
        ],
        'milestones' => [],
    ], $overrides);
}

it('defaults the billable area on the create form to the house area', function () {
    $this->actingAs($this->user)
        ->get(route('contracts.create', $this->project))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('contracts/create')
            ->where('contract.billable_area_sqft', '2000.00')
            ->where('contract.type', 'theka_per_sqft')
        );
});

it('stores a theka contract and computes base and contract amounts', function () {
    $this->actingAs($this->user)
        ->post(route('contracts.store', $this->project), thekaPayload())
        ->assertRedirect(route('projects.show', $this->project));

    $contract = Contract::sole();

    // 2000 sqft x PKR 700 = 1,400,000 base, + 180,000 add-ons = 1,580,000
    expect((float) $contract->base_amount)->toBe(1400000.0)
        ->and((float) $contract->contract_amount)->toBe(1580000.0)
        ->and($contract->project_id)->toBe($this->project->id);
});

it('rejects a theka contract with no rate', function () {
    $this->actingAs($this->user)
        ->post(route('contracts.store', $this->project), thekaPayload(['rate_per_sqft' => '']))
        ->assertSessionHasErrors('rate_per_sqft');

    expect(Contract::count())->toBe(0);
});

it('rejects an add-on with no rate', function () {
    $this->actingAs($this->user)
        ->post(route('contracts.store', $this->project), thekaPayload([
            'addons' => [['name' => 'Basement', 'unit' => 'sqft', 'quantity' => '500', 'rate' => '']],
        ]))
        ->assertSessionHasErrors('addons.0.rate');

    expect(Contract::count())->toBe(0);
});

it('itemises add-ons and rolls them into the contract amount', function () {
    $this->actingAs($this->user)->post(route('contracts.store', $this->project), thekaPayload([
        'addons' => [
            ['name' => 'Basement', 'unit' => 'sqft', 'quantity' => '500', 'rate' => '360'],
            ['name' => 'Solar prep', 'unit' => 'lump sum', 'quantity' => '1', 'rate' => '150000'],
            ['name' => 'Underground water tank', 'unit' => 'gallon', 'quantity' => '2000', 'rate' => '35'],
        ],
    ]));

    $contract = Contract::sole();

    // 180,000 + 150,000 + 70,000 = 400,000 of add-ons on a 1,400,000 base
    expect($contract->addons)->toHaveCount(3)
        ->and((float) $contract->addons->firstWhere('name', 'Basement')->amount)->toBe(180000.0)
        ->and((float) $contract->addons_amount)->toBe(400000.0)
        ->and((float) $contract->contract_amount)->toBe(1800000.0);
});

it('replaces the add-on list on edit and re-rolls the total', function () {
    $this->actingAs($this->user)->post(route('contracts.store', $this->project), thekaPayload());
    $contract = Contract::sole();

    expect((float) $contract->contract_amount)->toBe(1580000.0);

    // Drop the basement, add solar prep instead.
    $this->actingAs($this->user)->put(route('contracts.update', $contract), thekaPayload([
        'addons' => [['name' => 'Solar prep', 'unit' => 'lump sum', 'quantity' => '1', 'rate' => '150000']],
    ]));

    $contract->refresh();

    expect($contract->addons)->toHaveCount(1)
        ->and($contract->addons->first()->name)->toBe('Solar prep')
        ->and((float) $contract->addons_amount)->toBe(150000.0)
        ->and((float) $contract->contract_amount)->toBe(1550000.0);
});

it('drops add-ons back to zero when the list is emptied', function () {
    $this->actingAs($this->user)->post(route('contracts.store', $this->project), thekaPayload());
    $contract = Contract::sole();

    $this->actingAs($this->user)->put(route('contracts.update', $contract), thekaPayload(['addons' => []]));

    $contract->refresh();

    expect($contract->addons)->toHaveCount(0)
        ->and((float) $contract->addons_amount)->toBe(0.0)
        ->and((float) $contract->contract_amount)->toBe(1400000.0);
});

it('cascades add-ons away when the contract is deleted', function () {
    $this->actingAs($this->user)->post(route('contracts.store', $this->project), thekaPayload());

    $this->actingAs($this->user)->delete(route('contracts.destroy', Contract::sole()));

    expect(ContractAddon::count())->toBe(0);
});

it('allows a dihari contract with no rate or area', function () {
    $this->actingAs($this->user)
        ->post(route('contracts.store', $this->project), thekaPayload([
            'title' => 'Labour only',
            'type' => 'dihari',
            'billable_area_sqft' => '',
            'rate_per_sqft' => '',
            'quality_tier' => '',
            'addons' => [],
        ]))
        ->assertSessionHasNoErrors();

    expect((float) Contract::sole()->contract_amount)->toBe(0.0);
});

it('lets one project carry a grey structure and a finishing contract', function () {
    $this->actingAs($this->user)->post(route('contracts.store', $this->project), thekaPayload([
        'title' => 'Grey Structure', 'rate_per_sqft' => '700', 'addons' => [],
    ]));

    $this->actingAs($this->user)->post(route('contracts.store', $this->project), thekaPayload([
        'title' => 'Finishing', 'rate_per_sqft' => '500', 'addons' => [], 'signed_on' => '2026-07-01',
    ]));

    // Revenue for the project is both deals summed: 1,400,000 + 1,000,000
    $this->actingAs($this->user)
        ->get(route('projects.show', $this->project))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('projects/show')
            ->where('project.covered_area_sqft', '2000.00')
            ->has('project.contracts', 2)
            ->where('project.contracts.0.title', 'Grey Structure')
            ->where('project.contracts.1.title', 'Finishing')
            ->where('project.contracts_total', '2400000')
        );
});

it('recomputes the amount when the contract is edited', function () {
    $this->actingAs($this->user)->post(route('contracts.store', $this->project), thekaPayload(['addons' => []]));
    $contract = Contract::sole();

    $this->actingAs($this->user)
        ->put(route('contracts.update', $contract), thekaPayload(['rate_per_sqft' => '800', 'addons' => []]))
        ->assertRedirect(route('projects.show', $this->project));

    expect((float) $contract->fresh()->contract_amount)->toBe(1600000.0);
});

it('does not move a signed contract when the house area is corrected', function () {
    $this->actingAs($this->user)->post(route('contracts.store', $this->project), thekaPayload());
    $contract = Contract::sole();

    $this->project->update(['covered_area_sqft' => 2050]);

    expect((float) $contract->fresh()->contract_amount)->toBe(1580000.0);
});

it('deletes a contract', function () {
    $this->actingAs($this->user)->post(route('contracts.store', $this->project), thekaPayload());

    $this->actingAs($this->user)
        ->delete(route('contracts.destroy', Contract::sole()))
        ->assertRedirect(route('projects.show', $this->project));

    expect(Contract::count())->toBe(0);
});

it('saves the covered area from the project form', function () {
    $this->actingAs($this->user)
        ->post(route('projects.store'), [
            'client_id' => $this->client->id,
            'name' => 'DHA Phase 2 House',
            'location' => 'Lahore',
            'covered_area_sqft' => '2450.50',
            'status' => 'draft',
        ])
        ->assertSessionHasNoErrors();

    expect((float) Project::where('name', 'DHA Phase 2 House')->sole()->covered_area_sqft)->toBe(2450.50);
});
