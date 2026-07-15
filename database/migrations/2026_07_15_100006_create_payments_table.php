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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('boq_id')->constrained('boqs')->onDelete('cascade');
            $table->decimal('amount', 15, 2); // Amount received
            $table->date('paid_on'); // When the payment was received
            $table->enum('method', ['cash', 'bank_transfer', 'cheque', 'online', 'other'])->default('cash');
            $table->string('reference')->nullable(); // Cheque no. / transaction ID
            $table->string('note')->nullable(); // e.g. "Advance", "Plinth stage"
            $table->timestamps();

            $table->index('boq_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
