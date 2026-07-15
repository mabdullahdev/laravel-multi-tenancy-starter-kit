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
        Schema::create('boq_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boq_section_id')->constrained('boq_sections')->onDelete('cascade');
            $table->string('item_code')->nullable(); // Optional - e.g. "C-101"
            $table->text('description'); // Required - e.g. "Supply & lay 1:2:4 cement concrete"
            $table->string('unit'); // Required - e.g. "bag", "m²", "cft", "kg"
            $table->decimal('quantity', 15, 3); // Fractional quantities allowed
            $table->decimal('rate', 15, 2); // Price per unit
            $table->decimal('amount', 15, 2); // Denormalized: quantity × rate
            $table->unsignedInteger('display_order')->default(0); // Order for displaying items
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('boq_items');
    }
};
