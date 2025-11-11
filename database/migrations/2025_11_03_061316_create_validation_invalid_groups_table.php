<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('validation_invalid_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('validation_id')->constrained('validations')->onDelete('cascade');
            $table->string('key_value')->index();
            $table->string('discrepancy_category'); // 'im_invalid', 'missing', 'discrepancy'
            $table->text('error');
            $table->decimal('uploaded_total', 15, 2);
            $table->decimal('source_total', 15, 2);
            $table->decimal('discrepancy_value', 15, 2);
            $table->timestamps();

            $table->index(['validation_id', 'discrepancy_category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('validation_invalid_groups');
    }
};
