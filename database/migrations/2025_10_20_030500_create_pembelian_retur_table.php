<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pembelian_retur', function (Blueprint $table) {
            $table->id();
            $table->string('bulan')->nullable();
            $table->string('kode_bm')->nullable();
            $table->string('nama_bm')->nullable();
            $table->string('kode_outlet')->nullable();
            $table->string('nama_outlet')->nullable();
            $table->string('nomor_penerimaan')->nullable();
            $table->string('nomor_retur')->nullable();
            $table->unique('nomor_retur');
            $table->string('kode_obat')->nullable();
            $table->string('nama_obat')->nullable();
            $table->string('kode_kreditur')->nullable();
            $table->string('nama_kreditur')->nullable();
            $table->string('kode_pabrik')->nullable();
            $table->string('nama_pabrik')->nullable();
            $table->string('satuan_utuh')->nullable();
            $table->integer('isi_kemasan')->nullable();
            $table->integer('qty_retur')->nullable();
            $table->decimal('harga_satuan', 15, 2)->nullable();
            $table->decimal('jumlah_retur', 15, 2)->nullable();
            $table->string('kode_dep')->nullable();
            $table->string('departemen')->nullable();
            $table->string('kode_group')->nullable();
            $table->string('group')->nullable();
            $table->string('kode_category')->nullable();
            $table->string('category')->nullable();
            $table->string('kode_sub_kategory')->nullable();
            $table->string('sub_category')->nullable();
            $table->boolean('konsinyasi')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pembelian_retur');
    }
};

