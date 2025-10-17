<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('validations', function (Blueprint $table) {
            $table->id();
            $table->string('file_name');
            $table->string('role')->nullable();
            $table->string('category'); // Reguler, Retur, Urgent
            $table->decimal('score', 5, 2); // Skor bisa sampai 100.00
            $table->unsignedInteger('total_records');
            $table->unsignedInteger('matched_records');
            $table->unsignedInteger('discrepancy_records');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('validations');
    }
};