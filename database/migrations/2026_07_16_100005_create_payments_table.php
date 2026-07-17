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

            // A payment settles the commercial agreement, not the estimate. The BOQ
            // is what the work is expected to cost; the contract is what the client
            // agreed to pay, so that is what a receipt is against.
            $table->foreignId('contract_id')->constrained('contracts')->onDelete('cascade');

            // Optionally the stage this payment was against ("30% on lenter"). Null
            // for an ad-hoc payment that doesn't line up with the schedule.
            $table->foreignId('contract_milestone_id')->nullable()->constrained('contract_milestones')->nullOnDelete();

            $table->decimal('amount', 15, 2); // Amount received
            $table->date('paid_on'); // When the payment was received
            $table->enum('method', ['cash', 'bank_transfer', 'cheque', 'online', 'other'])->default('cash');
            $table->string('reference')->nullable(); // Cheque no. / transaction ID
            $table->string('note')->nullable(); // e.g. "Advance", "Plinth stage"
            $table->timestamps();

            $table->index('contract_id');
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
