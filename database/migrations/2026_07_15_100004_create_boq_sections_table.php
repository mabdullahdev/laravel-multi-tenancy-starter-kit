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
        Schema::create('boq_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boq_id')->constrained('boqs')->onDelete('cascade');
            $table->string('name'); // Required - e.g. "Excavation", "Superstructure"
            $table->unsignedInteger('display_order')->default(0); // Order for displaying sections
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('boq_sections');
    }
};
