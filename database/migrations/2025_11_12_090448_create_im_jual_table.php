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
        Schema::create('im_jual', function (Blueprint $table) {
            $table->string('regional_name', 50)->nullable();
            $table->integer('pc')->nullable();
            $table->string('noreff', 50)->nullable();
            $table->string('id', 50)->nullable();
            $table->string('kode_komunikasi_sap', 50)->nullable();
            $table->string('kd_profit_center', 50)->nullable();
            $table->string('transaction_id', 50)->nullable();
            $table->string('transaction_time', 50)->nullable();
            $table->string('type_profit_center', 50)->nullable();
            $table->string('tanggal_retrieve', 50)->nullable();
            $table->string('tanggal', 50)->nullable();
            $table->decimal('total', 15, 2)->nullable();
            $table->decimal('dpp', 15, 2)->nullable();
            $table->decimal('ppn', 15, 2)->nullable();
            $table->string('cogs', 50)->nullable();
            $table->integer('carabayar')->nullable();
            $table->string('reference_number', 50)->nullable();
            $table->string('kd_customer', 50)->nullable();
            $table->string('document_id', 50)->nullable();
            $table->string('no_invoice', 50)->nullable();
            $table->string('tanggal_invoice', 50)->nullable();
            $table->string('kd_profit_center_klinik', 50)->nullable();
            $table->string('total_uangmuka', 50)->nullable();
            $table->string('total_penjualan', 50)->nullable();
            $table->string('total_pelunasan', 50)->nullable();
            $table->string('cogs_kons', 50)->nullable();
            $table->string('kapitasi', 50)->nullable();
            $table->string('ongkir', 50)->nullable();
            $table->string('point', 50)->nullable();
            $table->string('kd_profit_center_apotek', 50)->nullable();
            
            $table->index('transaction_id');
            $table->index('document_id');
            $table->index('no_invoice');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('im_jual');
    }
};
