<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('title'); // Required - e.g. "Grey Structure", "Finishing", "Turnkey"
            $table->enum('type', ['theka_per_sqft', 'dihari'])->default('theka_per_sqft');

            // Per-sqft theka terms. Area and rate are snapshotted onto the contract
            // rather than read live off the project, so correcting the house's
            // covered area later can never move an amount the client already agreed to.
            $table->decimal('billable_area_sqft', 12, 2)->nullable();
            $table->decimal('rate_per_sqft', 10, 2)->nullable();
            $table->enum('quality_tier', ['basic', 'standard', 'premium'])->nullable();

            $table->decimal('base_amount', 15, 2)->default(0); // Denormalized: billable_area_sqft × rate_per_sqft
            $table->decimal('addons_amount', 15, 2)->default(0); // Denormalized sum of add-ons (basement, solar prep, etc.)
            $table->decimal('contract_amount', 15, 2)->default(0); // Denormalized: base + add-ons. The revenue for this deal.
            $table->string('currency', 3)->default('PKR'); // ISO currency code

            $table->text('payment_terms')->nullable(); // Client-specific terms shown on the contract (advance %, stage payments)
            $table->text('exclusions')->nullable(); // What the price does NOT cover - e.g. "boundary wall, landscaping"

            $table->date('signed_on')->nullable();
            $table->enum('status', ['draft', 'active', 'completed'])->default('draft');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('project_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
