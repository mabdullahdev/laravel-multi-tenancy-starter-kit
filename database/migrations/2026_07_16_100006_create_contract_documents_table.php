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
        Schema::create('contract_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained('contracts')->onDelete('cascade');

            // issued_contract: a PDF this system generated and froze at issue time.
            // signed_scan:     the copy the client signed and sent back.
            $table->enum('type', ['issued_contract', 'signed_scan', 'other'])->default('other');

            $table->string('name'); // Display name - e.g. "Contract — Grey Structure (16 Jul 2026)"
            $table->string('path'); // Path on the disk below
            $table->string('disk')->default('local'); // 'local' = storage/app/private. These are client documents, not public assets.
            $table->string('mime')->nullable();
            $table->unsignedBigInteger('size')->nullable(); // Bytes

            // Fingerprint of everything the document was rendered from, taken at issue
            // time. This is what decides whether the issued copy is out of date: the
            // total alone would miss a change to the exclusions or the schedule, which
            // move the paper without moving the price.
            $table->string('content_hash', 64)->nullable();

            // The contract total at the moment this document was issued. Not used to
            // detect staleness (content_hash does that) — this is what makes the
            // message readable: "issued at 1.58M but the contract now says 1.78M".
            $table->decimal('amount_at_issue', 15, 2)->nullable();

            $table->timestamp('issued_at')->nullable();
            $table->timestamps();

            $table->index(['contract_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_documents');
    }
};
