<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;

class ValidationConfigService
{
    /**
     * Get validation tolerance for specific document type and category
     */
    public function getTolerance(?string $documentType = null, ?string $documentCategory = null): float
    {
        // Try document-specific tolerance first
        if ($documentType && $documentCategory) {
            $specificTolerance = Config::get("validation.tolerances.{$documentType}.{$documentCategory}");
            if ($specificTolerance !== null) {
                return (float) $specificTolerance;
            }
        }

        // Try from ValidationSetting model (database)
        $dbTolerance = \App\Models\ValidationSetting::get('rounding_tolerance');
        if ($dbTolerance !== null) {
            return (float) $dbTolerance;
        }

        // Fall back to config default
        return (float) Config::get('validation.default_tolerance', 1000.01);
    }

    /**
     * Get validation note by key
     */
    public function getNote(string $key): string
    {
        return Config::get("validation.notes.{$key}", '');
    }

    /**
     * Get error message by key
     */
    public function getErrorMessage(string $key): string
    {
        return Config::get("validation.error_messages.{$key}", 'Validation error occurred');
    }

    /**
     * Get discrepancy category label
     */
    public function getDiscrepancyCategory(string $key): string
    {
        return Config::get("validation.discrepancy_categories.{$key}", $key);
    }

    /**
     * Check if async validation is enabled
     */
    public function isAsyncValidationEnabled(): bool
    {
        return Config::get('validation.settings.enable_async_validation', true);
    }

    /**
     * Get supported file formats
     */
    public function getSupportedFormats(): array
    {
        return Config::get('validation.settings.supported_formats', ['xlsx', 'xls', 'csv']);
    }

    /**
     * Get max file size in MB
     */
    public function getMaxFileSizeMb(): int
    {
        return Config::get('validation.settings.max_file_size_mb', 50);
    }

    /**
     * Get default header row
     */
    public function getDefaultHeaderRow(): int
    {
        return Config::get('validation.settings.default_header_row', 1);
    }

    /**
     * Get chunk size for bulk inserts
     */
    public function getChunkSize(): int
    {
        return Config::get('validation.settings.chunk_size_for_bulk_insert', 500);
    }

    /**
     * Get SQLite variable limit
     */
    public function getSqliteVariableLimit(): int
    {
        return Config::get('validation.settings.sqlite_variable_limit', 999);
    }

    /**
     * Get default pagination per page
     */
    public function getDefaultPerPage(): int
    {
        return Config::get('validation.performance.pagination_default_per_page', 10);
    }

    /**
     * Get max pagination per page
     */
    public function getMaxPerPage(): int
    {
        return Config::get('validation.performance.pagination_max_per_page', 100);
    }

    /**
     * Get cache TTL for validation stats
     */
    public function getStatsCacheTtl(): int
    {
        return Config::get('validation.performance.cache_validation_stats_ttl', 300);
    }

    /**
     * Get cache TTL for chart data
     */
    public function getChartDataCacheTtl(): int
    {
        return Config::get('validation.performance.cache_chart_data_ttl', 600);
    }

    /**
     * Check if database aggregation should be used
     */
    public function useDatabaseAggregation(): bool
    {
        return Config::get('validation.performance.use_database_aggregation', true);
    }

    /**
     * Get all validation rules
     */
    public function getAllRules(): array
    {
        return Config::get('validation', []);
    }
}
