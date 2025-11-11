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
        // Add indexes for validation_matched_groups
        Schema::table('validation_matched_groups', function (Blueprint $table) {
            $table->index(['validation_id', 'key_value'], 'idx_matched_groups_val_key');
        });

        // Add indexes for validation_matched_rows
        Schema::table('validation_matched_rows', function (Blueprint $table) {
            $table->index(['validation_id', 'key_value'], 'idx_matched_rows_val_key');
            $table->index('row_index', 'idx_matched_rows_row_idx');
        });

        // Add indexes for validation_invalid_groups
        Schema::table('validation_invalid_groups', function (Blueprint $table) {
            $table->index(['validation_id', 'key_value'], 'idx_invalid_groups_val_key');
            $table->index('discrepancy_category', 'idx_invalid_groups_category');
        });

        // Add indexes for validation_invalid_rows
        Schema::table('validation_invalid_rows', function (Blueprint $table) {
            $table->index(['validation_id', 'key_value'], 'idx_invalid_rows_val_key');
            $table->index('row_index', 'idx_invalid_rows_row_idx');
        });

        // Add compound index for mapped_uploaded_files
        Schema::table('mapped_uploaded_files', function (Blueprint $table) {
            $table->index(['filename', 'connector'], 'idx_mapped_filename_connector');
            $table->index(['document_type', 'document_category', 'connector'], 'idx_mapped_doc_connector');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('validation_matched_groups', function (Blueprint $table) {
            $table->dropIndex('idx_matched_groups_val_key');
        });

        Schema::table('validation_matched_rows', function (Blueprint $table) {
            $table->dropIndex('idx_matched_rows_val_key');
            $table->dropIndex('idx_matched_rows_row_idx');
        });

        Schema::table('validation_invalid_groups', function (Blueprint $table) {
            $table->dropIndex('idx_invalid_groups_val_key');
            $table->dropIndex('idx_invalid_groups_category');
        });

        Schema::table('validation_invalid_rows', function (Blueprint $table) {
            $table->dropIndex('idx_invalid_rows_val_key');
            $table->dropIndex('idx_invalid_rows_row_idx');
        });

        Schema::table('mapped_uploaded_files', function (Blueprint $table) {
            $table->dropIndex('idx_mapped_filename_connector');
            $table->dropIndex('idx_mapped_doc_connector');
        });
    }
};
