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
        Schema::create('mapped_uploaded_files', function (Blueprint $table) {
            $table->id();
            $table->string('filename'); // Original uploaded filename
            $table->string('document_type'); // pembelian or penjualan
            $table->string('document_category'); // reguler, retur, urgent, etc.
            $table->integer('header_row')->default(1); // Selected header row
            $table->unsignedBigInteger('user_id')->nullable(); // User who uploaded
            
            // Mapped columns (configurable per document type)
            $table->string('kode_bm')->nullable(); // Kode BM
            $table->string('nama_bm')->nullable(); // Nama BM
            $table->string('kode_outlet')->nullable(); // Kode Outlet
            $table->string('nama_outlet')->nullable(); // Nama Outlet
            $table->date('date')->nullable(); // Date
            $table->string('connector'); // Connector value (will be indexed below)
            $table->decimal('sum_field', 20, 2)->nullable(); // Sum field value
            
            // Additional metadata
            $table->integer('row_index'); // Original row number in uploaded file
            $table->json('raw_data')->nullable(); // Store complete row data as JSON for reference
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['filename', 'document_type', 'document_category'], 'idx_file_doc_cat');
            $table->index('connector', 'idx_connector');
            $table->index('user_id', 'idx_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mapped_uploaded_files');
    }
};
