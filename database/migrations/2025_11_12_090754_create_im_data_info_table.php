<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('im_data_info', function (Blueprint $table) {
            $table->id();
            $table->string('table_name')->unique();
            $table->integer('row_count')->default(0);
            $table->timestamp('last_updated_at')->nullable();
            $table->string('last_updated_by')->nullable();
            $table->timestamps();
        });

        // Initialize data for both tables
        DB::table('im_data_info')->insert([
            [
                'table_name' => 'im_purchases_and_return',
                'row_count' => DB::table('im_purchases_and_return')->count(),
                'last_updated_at' => now(),
                'last_updated_by' => 'System',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'table_name' => 'im_jual',
                'row_count' => DB::table('im_jual')->count(),
                'last_updated_at' => now(),
                'last_updated_by' => 'System',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('im_data_info');
    }
};
