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
        Schema::create('boqs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('title'); // Required - e.g. "Tender Estimate"
            $table->unsignedInteger('revision')->default(1); // Version number of the estimate
            $table->string('currency', 3)->default('PKR'); // ISO currency code
            $table->enum('status', ['draft', 'finalized'])->default('draft');
            $table->decimal('total_amount', 15, 2)->default(0); // Denormalized sum of all item amounts
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('status');

            // A project can only have one BOQ per revision number.
            $table->unique(['project_id', 'revision']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('boqs');
    }
};
