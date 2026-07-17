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
        Schema::create('contract_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('contracts')->onDelete('cascade');
            $table->string('name'); // Required - e.g. "Basement", "Solar prep", "Underground water tank"
            $table->string('unit')->default('lump sum'); // e.g. "lump sum", "sqft", "gallon"
            $table->decimal('quantity', 15, 3)->default(1); // Fractional quantities allowed
            $table->decimal('rate', 15, 2); // Price per unit
            $table->decimal('amount', 15, 2); // Denormalized: quantity × rate
            $table->unsignedInteger('display_order')->default(0); // Order for displaying add-ons
            $table->timestamps();

            $table->index('contract_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_addons');
    }
};
