<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('validation_matched_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('validation_id')->constrained('validations')->onDelete('cascade');
            $table->string('key_value')->index();
            $table->decimal('uploaded_total', 15, 2);
            $table->decimal('source_total', 15, 2);
            $table->decimal('difference', 15, 2);
            $table->string('note'); // 'Sum Matched', 'Pembulatan', 'Retur Doesn\'t Record'
            $table->timestamps();

            $table->index(['validation_id', 'note']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('validation_matched_groups');
    }
};
