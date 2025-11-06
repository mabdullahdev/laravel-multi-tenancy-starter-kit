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
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('address'); // Required - must have an address
            $table->string('city'); // Required - must know the city
            $table->string('province')->nullable(); // Optional - Province (e.g., Punjab, Sindh, Khyber Pakhtunkhwa)
            $table->string('postal_code', 10)->nullable(); // Optional - Pakistan postal code (5 digits)
            $table->decimal('price', 12, 2)->nullable(); // Optional - "price on request" or "contact for pricing"
            $table->decimal('security_deposit', 12, 2)->nullable(); // For rentals - security deposit amount
            $table->decimal('maintenance_charges', 12, 2)->nullable(); // For rentals - monthly maintenance charges
            $table->enum('price_unit', ['per_month', 'per_year', 'total'])->default('total'); // Price unit for rentals
            $table->enum('type', ['rental', 'sale']); // Required - must specify rental or sale
            $table->enum('status', ['available', 'pending', 'sold', 'rented'])->default('available'); // Required with default
            $table->enum('category', ['house', 'apartment', 'plot']); // Required - property category
            $table->enum('sub_category', ['residential', 'commercial', 'agricultural', 'industrial'])->nullable(); // Optional - for plots or other classifications
            $table->integer('bedrooms')->unsigned(); // Required (can be 0 for studio)
            $table->integer('bathrooms')->unsigned()->nullable(); // Optional - may not always be listed
            $table->integer('square_feet')->unsigned()->nullable(); // Optional - size may not be available initially
            $table->text('description')->nullable(); // Optional - marketing description
            $table->timestamps();
            
            // Indexes for filtering queries (type, status, and category filters)
            $table->index('type');
            $table->index('status');
            $table->index('category');
            
            // Indexes for location-based searches (address, city, postal code searches)
            $table->index('city');
            $table->index(['city', 'province']); // Composite index for city+province queries
            
            // Note: For advanced full-text search on address/city, consider:
            // - MySQL/MariaDB: Add fullText(['address', 'city']) after migration
            // - PostgreSQL: Use tsvector columns with GIN indexes
            // - SQLite: Use FTS5 virtual tables
            // Regular indexes above will handle basic LIKE '%query%' searches efficiently
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
