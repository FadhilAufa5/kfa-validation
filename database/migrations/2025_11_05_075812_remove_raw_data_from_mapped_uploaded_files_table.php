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
        Schema::table('mapped_uploaded_files', function (Blueprint $table) {
            $table->dropColumn('raw_data');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mapped_uploaded_files', function (Blueprint $table) {
            $table->json('raw_data')->nullable()->after('row_index');
        });
    }
};
