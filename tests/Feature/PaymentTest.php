<?php

use App\Mail\PaymentReceiptMail;
use App\Models\Client;
use App\Models\Contract;
use App\Models\ContractMilestone;
use App\Models\Payment;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Mail::fake();

    $this->user = User::factory()->create();

    $this->client = Client::create([
        'name' => 'Ahmed Raza',
        'email' => 'ahmed@example.com',
        'phone' => '03001234567',
    ]);

    $this->project = Project::create([
        'client_id' => $this->client->id,
        'name' => 'Bahria Villa – Block C',
        'covered_area_sqft' => 2000,
        'status' => 'active',
    ]);

    // 2000 sqft x PKR 700 = 1,400,000, no add-ons.
    $this->contract = $this->project->contracts()->create([
        'title' => 'Grey Structure',
        'type' => 'theka_per_sqft',
        'billable_area_sqft' => 2000,
        'rate_per_sqft' => 700,
        'currency' => 'PKR',
        'status' => 'active',
    ]);
});

function payload(array $overrides = []): array
{
    return array_merge([
        'amount' => '400000',
        'paid_on' => '2026-02-01',
        'method' => 'bank_transfer',
        'reference' => 'TXN-9931',
        'note' => 'Advance',
    ], $overrides);
}

it('records a payment against a contract', function () {
    $this->actingAs($this->user)
        ->post(route('contracts.payments.store', $this->contract), payload())
        ->assertSessionHasNoErrors();

    $payment = Payment::sole();

    expect($payment->contract_id)->toBe($this->contract->id)
        ->and((float) $payment->amount)->toBe(400000.0);
});

it('reports contracted, received and balance due', function () {
    $this->actingAs($this->user)->post(route('contracts.payments.store', $this->contract), payload());
    $this->actingAs($this->user)->post(route('contracts.payments.store', $this->contract), payload(['amount' => '100000']));

    $contract = $this->contract->fresh();

    // 1,400,000 contracted − 500,000 received
    expect((float) $contract->total_paid)->toBe(500000.0)
        ->and((float) $contract->balance_due)->toBe(900000.0)
        ->and($contract->payment_status)->toBe('partial');
});

it('refuses a payment on a draft contract', function () {
    $this->contract->update(['status' => 'draft']);

    $this->actingAs($this->user)
        ->post(route('contracts.payments.store', $this->contract), payload())
        ->assertSessionHasErrors('amount');

    expect(Payment::count())->toBe(0);
});

it('refuses a payment larger than the outstanding balance', function () {
    $this->actingAs($this->user)
        ->post(route('contracts.payments.store', $this->contract), payload(['amount' => '1500000']))
        ->assertSessionHasErrors('amount');

    expect(Payment::count())->toBe(0);
});

it('marks a contract paid once the full amount is received', function () {
    $this->actingAs($this->user)->post(route('contracts.payments.store', $this->contract), payload(['amount' => '1400000']));

    expect($this->contract->fresh()->payment_status)->toBe('paid');
});

it('emails a receipt to the client', function () {
    $this->actingAs($this->user)->post(route('contracts.payments.store', $this->contract), payload());

    Mail::assertQueued(PaymentReceiptMail::class, fn ($mail) => $mail->hasTo('ahmed@example.com'));
});

it('derives milestone amounts from the contract total', function () {
    $this->actingAs($this->user)->put(route('contracts.update', $this->contract), [
        'title' => 'Grey Structure',
        'type' => 'theka_per_sqft',
        'billable_area_sqft' => '2000',
        'rate_per_sqft' => '700',
        'quality_tier' => 'standard',
        'currency' => 'PKR',
        'signed_on' => '2026-01-10',
        'status' => 'active',
        'notes' => '',
        'addons' => [],
        'milestones' => [
            ['name' => 'Advance', 'percentage' => '20', 'amount' => '', 'due_on' => '2026-01-15'],
            ['name' => 'On lenter', 'percentage' => '30', 'amount' => '', 'due_on' => ''],
            ['name' => 'Retention', 'percentage' => '', 'amount' => '50000', 'due_on' => ''],
        ],
    ])->assertSessionHasNoErrors();

    $milestones = $this->contract->fresh()->milestones;

    // 20% and 30% of 1,400,000; the flat one keeps what was entered.
    expect($milestones)->toHaveCount(3)
        ->and((float) $milestones[0]->amount)->toBe(280000.0)
        ->and((float) $milestones[1]->amount)->toBe(420000.0)
        ->and((float) $milestones[2]->amount)->toBe(50000.0);
});

it('settles a milestone when its payment covers it', function () {
    $milestone = $this->contract->milestones()->create([
        'name' => 'Advance', 'percentage' => 20, 'amount' => 280000, 'status' => 'pending',
    ]);

    $this->actingAs($this->user)->post(route('contracts.payments.store', $this->contract), payload([
        'amount' => '280000',
        'contract_milestone_id' => $milestone->id,
    ]))->assertSessionHasNoErrors();

    expect($milestone->fresh()->status)->toBe('paid');
});

it('leaves a milestone pending when only part is paid', function () {
    $milestone = $this->contract->milestones()->create([
        'name' => 'Advance', 'percentage' => 20, 'amount' => 280000, 'status' => 'pending',
    ]);

    $this->actingAs($this->user)->post(route('contracts.payments.store', $this->contract), payload([
        'amount' => '100000',
        'contract_milestone_id' => $milestone->id,
    ]));

    expect($milestone->fresh()->status)->toBe('pending');
});

it('walks a milestone back from paid when its payment is removed', function () {
    $milestone = $this->contract->milestones()->create([
        'name' => 'Advance', 'percentage' => 20, 'amount' => 280000, 'status' => 'pending',
    ]);

    $this->actingAs($this->user)->post(route('contracts.payments.store', $this->contract), payload([
        'amount' => '280000',
        'contract_milestone_id' => $milestone->id,
    ]));

    expect($milestone->fresh()->status)->toBe('paid');

    $this->actingAs($this->user)->delete(route('payments.destroy', Payment::sole()));

    expect($milestone->fresh()->status)->toBe('pending');
});

it('refuses a payment against another contract milestone', function () {
    $other = $this->project->contracts()->create([
        'title' => 'Finishing', 'type' => 'theka_per_sqft',
        'billable_area_sqft' => 2000, 'rate_per_sqft' => 500, 'currency' => 'PKR', 'status' => 'active',
    ]);

    $foreign = $other->milestones()->create(['name' => 'Advance', 'amount' => 100000, 'status' => 'pending']);

    $this->actingAs($this->user)
        ->post(route('contracts.payments.store', $this->contract), payload(['contract_milestone_id' => $foreign->id]))
        ->assertSessionHasErrors('contract_milestone_id');
});

it('does not move an invoiced milestone when the contract amount changes', function () {
    $milestone = $this->contract->milestones()->create([
        'name' => 'Advance', 'percentage' => 20, 'amount' => 280000,
        'status' => 'invoiced', 'invoice_no' => 'INV-001', 'invoiced_on' => '2026-01-15',
    ]);

    // Re-rate the contract: 2000 x 800 = 1,600,000. An unbilled 20% would become 320,000.
    $this->contract->update(['rate_per_sqft' => 800]);

    expect((float) $milestone->fresh()->amount)->toBe(280000.0);
});

it('re-derives an unbilled milestone when the contract amount changes', function () {
    $milestone = $this->contract->milestones()->create([
        'name' => 'Advance', 'percentage' => 20, 'amount' => 280000, 'status' => 'pending',
    ]);

    $this->contract->update(['rate_per_sqft' => 800]);

    // 20% of the new 1,600,000
    expect((float) $milestone->fresh()->amount)->toBe(320000.0);
});

it('cascades payments and milestones away when the contract is deleted', function () {
    $milestone = $this->contract->milestones()->create(['name' => 'Advance', 'amount' => 280000]);
    $this->actingAs($this->user)->post(route('contracts.payments.store', $this->contract), payload([
        'contract_milestone_id' => $milestone->id,
    ]));

    $this->contract->delete();

    expect(Payment::count())->toBe(0)
        ->and(ContractMilestone::count())->toBe(0);
});
