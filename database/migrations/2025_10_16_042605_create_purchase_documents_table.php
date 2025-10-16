<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('purchase_documents', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number');
            $table->decimal('total', 15, 2);
            $table->enum('type', ['reguler', 'retur', 'urgent']); // To identify the document type
            $table->timestamps();

            // Optional but recommended: A unique key to prevent importing the same
            // document number for the same type twice.
            $table->unique(['transaction_number', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_documents');
    }
};