<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('validation_invalid_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('validation_id')->constrained('validations')->onDelete('cascade');
            $table->unsignedInteger('row_index');
            $table->string('key_value')->index();
            $table->text('error');
            $table->timestamps();

            $table->index(['validation_id', 'key_value']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('validation_invalid_rows');
    }
};
