<?php

use App\Models\Client;
use App\Models\ContractDocument;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');

    $this->user = User::factory()->create();

    $this->client = Client::create(['name' => 'Ahmed Raza', 'phone' => '03001234567']);

    $this->project = Project::create([
        'client_id' => $this->client->id,
        'name' => 'Bahria Villa – Block C',
        'covered_area_sqft' => 2000,
        'status' => 'active',
    ]);

    // 2000 sqft x PKR 700 = 1,400,000
    $this->contract = $this->project->contracts()->create([
        'title' => 'Grey Structure',
        'type' => 'theka_per_sqft',
        'billable_area_sqft' => 2000,
        'rate_per_sqft' => 700,
        'currency' => 'PKR',
        'status' => 'active',
        'payment_terms' => '20% advance with work order.',
        'exclusions' => 'Boundary wall, landscaping.',
    ]);
});

it('streams a live pdf of the contract', function () {
    $response = $this->actingAs($this->user)->get(route('contracts.pdf', $this->contract));

    $response->assertOk()->assertHeader('Content-Type', 'application/pdf');
    expect($response->getContent())->toStartWith('%PDF');
});

it('issues a contract and freezes the pdf to disk', function () {
    $this->actingAs($this->user)
        ->post(route('contracts.issue', $this->contract))
        ->assertSessionHasNoErrors();

    $document = ContractDocument::sole();

    expect($document->type)->toBe('issued_contract')
        ->and($document->disk)->toBe('local')
        ->and($document->mime)->toBe('application/pdf')
        ->and((float) $document->amount_at_issue)->toBe(1400000.0)
        ->and($document->issued_at)->not->toBeNull();

    Storage::disk('local')->assertExists($document->path);
});

it('refuses to issue a draft contract', function () {
    $this->contract->update(['status' => 'draft']);

    $this->actingAs($this->user)
        ->post(route('contracts.issue', $this->contract))
        ->assertSessionHasErrors('issue');

    expect(ContractDocument::count())->toBe(0);
});

it('keeps every issued copy rather than overwriting', function () {
    $this->actingAs($this->user)->post(route('contracts.issue', $this->contract));

    // Re-rate and issue again: 2000 x 800 = 1,600,000
    $this->contract->update(['rate_per_sqft' => 800]);
    $this->actingAs($this->user)->post(route('contracts.issue', $this->contract));

    $amounts = ContractDocument::orderBy('id')->pluck('amount_at_issue')->map(fn ($a) => (float) $a);

    expect(ContractDocument::count())->toBe(2)
        ->and($amounts->all())->toBe([1400000.0, 1600000.0]);
});

it('refuses to re-issue when nothing has changed', function () {
    $this->actingAs($this->user)->post(route('contracts.issue', $this->contract));

    $this->actingAs($this->user)
        ->post(route('contracts.issue', $this->contract))
        ->assertSessionHasErrors('issue');

    expect(ContractDocument::count())->toBe(1);
});

// The bug this whole mechanism exists for: these all rewrite the client's copy
// without moving the price, so an amount-only check would miss every one.
it('flags an issued copy as stale when a change never touches the price', function (string $field, mixed $value) {
    $this->actingAs($this->user)->post(route('contracts.issue', $this->contract));
    $document = ContractDocument::sole();

    $before = (float) $this->contract->contract_amount;
    $this->contract->update([$field => $value]);

    expect((float) $this->contract->fresh()->contract_amount)->toBe($before)
        ->and($document->fresh()->isStale())->toBeTrue();
})->with([
    'exclusions' => ['exclusions', 'Boundary wall, landscaping, external development.'],
    'payment terms' => ['payment_terms', '50% advance. Balance on handover.'],
    'notes' => ['notes', 'Client supplies tiles.'],
    'quality tier' => ['quality_tier', 'premium'],
]);

it('flags an issued copy as stale when the schedule changes', function () {
    $this->actingAs($this->user)->post(route('contracts.issue', $this->contract));
    $document = ContractDocument::sole();

    $this->contract->milestones()->create(['name' => 'Advance', 'amount' => 280000, 'status' => 'pending']);

    expect($document->fresh()->isStale())->toBeTrue();
});

it('does not flag an issued copy stale when only client details change', function () {
    $this->actingAs($this->user)->post(route('contracts.issue', $this->contract));
    $document = ContractDocument::sole();

    // The PDF prints the phone, but correcting it is not an amendment to the deal.
    $this->client->update(['phone' => '03119999999']);

    expect($document->fresh()->isStale())->toBeFalse();
});

it('does not flag an issued copy stale when the contract is completed', function () {
    $this->actingAs($this->user)->post(route('contracts.issue', $this->contract));
    $document = ContractDocument::sole();

    $this->contract->update(['status' => 'completed']);

    expect($document->fresh()->isStale())->toBeFalse();
});

it('never treats an uploaded scan as stale', function () {
    $this->actingAs($this->user)->post(route('contracts.documents.store', $this->contract), [
        'type' => 'signed_scan',
        'file' => UploadedFile::fake()->create('signed.pdf', 20, 'application/pdf'),
    ]);

    $this->contract->update(['rate_per_sqft' => 900]);

    expect(ContractDocument::sole()->fresh()->isStale())->toBeFalse();
});

it('flags an issued copy as stale once the contract moves', function () {
    $this->actingAs($this->user)->post(route('contracts.issue', $this->contract));

    $document = ContractDocument::sole();
    expect($document->isStale())->toBeFalse();

    $this->contract->update(['rate_per_sqft' => 800]);

    expect($document->fresh()->isStale())->toBeTrue();
});

it('uploads a signed scan', function () {
    $this->actingAs($this->user)
        ->post(route('contracts.documents.store', $this->contract), [
            'type' => 'signed_scan',
            'name' => '',
            'file' => UploadedFile::fake()->create('signed.pdf', 120, 'application/pdf'),
        ])
        ->assertSessionHasNoErrors();

    $document = ContractDocument::sole();

    expect($document->type)->toBe('signed_scan')
        ->and($document->name)->toBe('signed.pdf');

    Storage::disk('local')->assertExists($document->path);
});

it('refuses an upload posing as an issued contract', function () {
    $this->actingAs($this->user)
        ->post(route('contracts.documents.store', $this->contract), [
            'type' => 'issued_contract',
            'file' => UploadedFile::fake()->create('fake.pdf', 10, 'application/pdf'),
        ])
        ->assertSessionHasErrors('type');

    expect(ContractDocument::count())->toBe(0);
});

it('refuses an executable upload', function () {
    $this->actingAs($this->user)
        ->post(route('contracts.documents.store', $this->contract), [
            'type' => 'other',
            'file' => UploadedFile::fake()->create('payload.php', 10, 'application/x-php'),
        ])
        ->assertSessionHasErrors('file');
});

it('downloads a stored document', function () {
    $this->actingAs($this->user)->post(route('contracts.issue', $this->contract));

    $this->actingAs($this->user)
        ->get(route('contract-documents.download', ContractDocument::sole()))
        ->assertOk();
});

it('does not serve documents to a guest', function () {
    $this->actingAs($this->user)->post(route('contracts.issue', $this->contract));

    $this->post('/logout');

    $this->get(route('contract-documents.download', ContractDocument::sole()))
        ->assertRedirect(route('login'));
});

it('deletes the file when the document row is deleted', function () {
    $this->actingAs($this->user)->post(route('contracts.issue', $this->contract));

    $document = ContractDocument::sole();
    $path = $document->path;

    $this->actingAs($this->user)->delete(route('contract-documents.destroy', $document));

    Storage::disk('local')->assertMissing($path);
    expect(ContractDocument::count())->toBe(0);
});

it('clears the files when the whole contract is deleted', function () {
    $this->actingAs($this->user)->post(route('contracts.issue', $this->contract));

    $path = ContractDocument::sole()->path;

    $this->contract->delete();

    // The rows cascade in the database, which never fires the model event —
    // Contract::deleting must clear the directory or the files are orphaned.
    Storage::disk('local')->assertMissing($path);
    expect(ContractDocument::count())->toBe(0);
});
