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
        Schema::create('contract_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('contracts')->onDelete('cascade');
            $table->string('name'); // Required - e.g. "Advance", "On lenter", "On handover"

            // A milestone is usually a share of the contract ("20% on grey structure"),
            // but can be a flat figure instead. percentage is null in that case.
            $table->decimal('percentage', 5, 2)->nullable();
            $table->decimal('amount', 15, 2)->default(0); // Denormalized: percentage × contract_amount, or the flat figure

            $table->date('due_on')->nullable();
            $table->enum('status', ['pending', 'invoiced', 'paid'])->default('pending');

            // Set when the milestone is billed. Once invoiced, amount is frozen:
            // re-deriving it from a later contract edit would move a figure the
            // client has already been given.
            $table->string('invoice_no')->nullable();
            $table->date('invoiced_on')->nullable();

            $table->unsignedInteger('display_order')->default(0); // Order for displaying milestones
            $table->timestamps();

            $table->index('contract_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_milestones');
    }
};
