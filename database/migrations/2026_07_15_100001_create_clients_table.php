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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Required - contact person's full name
            $table->string('company_name')->nullable(); // Optional - if the client is a business/firm
            $table->string('email')->nullable(); // Optional
            $table->string('phone'); // Required - primary phone
            $table->string('phone_secondary')->nullable(); // Optional - secondary phone
            $table->string('whatsapp')->nullable(); // Optional - WhatsApp number (if different from phone)
            $table->string('cnic')->nullable(); // Optional - National ID / tax number (Pakistan CNIC)
            $table->string('address')->nullable(); // Optional - street address
            $table->string('city')->nullable(); // Optional
            $table->string('province')->nullable(); // Optional - Punjab, Sindh, etc.
            $table->string('postal_code', 10)->nullable(); // Optional
            $table->text('notes')->nullable(); // Optional - anything else about the client
            $table->timestamps();

            // Indexes for lookups
            $table->index('name');
            $table->index('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
