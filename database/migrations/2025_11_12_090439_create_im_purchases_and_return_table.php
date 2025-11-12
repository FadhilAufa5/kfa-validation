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
        Schema::create('im_purchases_and_return', function (Blueprint $table) {
            $table->string('nama_outlet', 50)->nullable();
            $table->string('kode_outlet', 50)->nullable();
            $table->string('nama_bm', 50)->nullable();
            $table->integer('kode_bm')->nullable();
            $table->string('kode_doc_type', 50)->nullable();
            $table->string('deskripsi_kode_type', 50)->nullable();
            $table->integer('dpp')->nullable();
            $table->integer('ppn')->nullable();
            $table->integer('total')->nullable();
            $table->integer('document_id')->nullable();
            $table->string('no_transaksi', 50)->nullable();
            $table->string('tanggal', 50)->nullable();
            $table->string('no_referensi', 50)->nullable();
            
            $table->index('no_transaksi');
            $table->index('document_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('im_purchases_and_return');
    }
};
