<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pembelian_retur', function (Blueprint $table) {
            $table->id();
            $table->integer('bulan');
            $table->string('nama_bm');
            $table->string('kode_outlet');
            $table->string('nama_outlet');
            $table->string('nomor_penerimaan');
            $table->string('nomor_retur')->unique();
            $table->string('kode_obat');
            $table->string('nama_obat');
            $table->string('kode_kreditur');
            $table->string('nama_kreditur');
            $table->string('satuan_utuh');
            $table->integer('isi_kemasan');
            $table->integer('qty_retur');
            $table->integer('harga_satuan');
            $table->integer('jumlah_retur');
            $table->boolean('konsinyasi');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pembelian_retur');
    }
};

