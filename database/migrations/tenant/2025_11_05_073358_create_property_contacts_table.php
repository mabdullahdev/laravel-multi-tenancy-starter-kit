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
        Schema::create('property_contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->constrained('properties')->onDelete('cascade');
            $table->string('contact_name'); // Name of contact person
            $table->string('contact_phone'); // Primary phone number
            $table->string('contact_phone_secondary')->nullable(); // Secondary phone number
            $table->string('contact_email')->nullable(); // Email address
            $table->string('contact_whatsapp')->nullable(); // WhatsApp number (if different from phone)
            $table->enum('contact_type', ['owner', 'agent', 'broker', 'dealer'])->default('owner'); // Type of contact
            $table->boolean('is_primary')->default(false); // Primary contact for this property
            $table->text('notes')->nullable(); // Additional notes
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_contacts');
    }
};
