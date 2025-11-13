<?php

/**
 * Validation Configuration
 * 
 * This file contains all validation rules, settings, and tolerances for the application.
 * Changes here will affect validation behavior without requiring code changes.
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Use Pipeline Pattern
    |--------------------------------------------------------------------------
    |
    | This option controls whether the new pipeline pattern should be used
    | for validation processing. Set to false to use the legacy implementation.
    |
    */
    'use_pipeline' => env('VALIDATION_USE_PIPELINE', true),

    /*
    |--------------------------------------------------------------------------
    | Default Validation Tolerance
    |--------------------------------------------------------------------------
    |
    | The default rounding tolerance used when comparing numerical values.
    | This can be overridden per document type if needed.
    |
    */
    'default_tolerance' => env('VALIDATION_TOLERANCE', 1000.01),

    /*
    |--------------------------------------------------------------------------
    | Validation Settings
    |--------------------------------------------------------------------------
    |
    | General validation settings and behaviors
    |
    */
    'settings' => [
        'enable_async_validation' => env('ENABLE_ASYNC_VALIDATION', true),
        'default_header_row' => 1,
        'max_file_size_mb' => 50,
        'supported_formats' => ['xlsx', 'xls', 'csv'],
        'chunk_size_for_bulk_insert' => 500,
        'sqlite_variable_limit' => 999, // SQLite has a limit of 999 variables per query
    ],

    /*
    |--------------------------------------------------------------------------
    | Pipeline Settings
    |--------------------------------------------------------------------------
    |
    | Settings for the validation pipeline pattern
    |
    */
    'batch_size' => 100,
    'enable_caching' => false,
    'cache_ttl' => 3600, // 1 hour

    /*
    |--------------------------------------------------------------------------
    | Document Type Tolerances
    |--------------------------------------------------------------------------
    |
    | Document-specific tolerance overrides
    |
    */
    'tolerances' => [
        'pembelian' => [
            'reguler' => null, // Uses default
            'retur' => null,
            'urgent' => null,
        ],
        'penjualan' => [
            'reguler' => null,
            'ecommerce' => null,
            'debitur' => null,
            'konsi' => null,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Validation Notes
    |--------------------------------------------------------------------------
    |
    | Predefined validation result notes
    |
    */
    'notes' => [
        'sum_matched' => 'Sum Matched',
        'rounding' => 'Pembulatan',
        'retur_not_recorded' => "Retur Doesn't Record",
    ],

    /*
    |--------------------------------------------------------------------------
    | Discrepancy Categories
    |--------------------------------------------------------------------------
    |
    | Categories for validation discrepancies
    |
    */
    'discrepancy_categories' => [
        'im_invalid' => 'IM Invalid',
        'missing' => 'Missing Data',
        'discrepancy' => 'Value Discrepancy',
    ],

    /*
    |--------------------------------------------------------------------------
    | Error Messages
    |--------------------------------------------------------------------------
    |
    | Standardized error messages for validation failures
    |
    */
    'error_messages' => [
        'key_not_found' => 'Key not found in validation data',
        'missing_value' => 'Key exists in both files but one has missing or zero value',
        'total_mismatch' => 'Total mismatch between uploaded and source data beyond tolerance',
        'no_validation_data' => 'Tidak ada data validasi dalam tabel',
        'invalid_document_type' => 'Tipe dokumen tidak valid',
        'incomplete_connector_config' => 'Konfigurasi connector tidak lengkap',
        'no_mapped_data' => 'No mapped data found for this file. Please ensure the file was properly mapped before validation.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Settings
    |--------------------------------------------------------------------------
    |
    | Settings related to performance optimization
    |
    */
    'performance' => [
        'use_database_aggregation' => true,
        'pagination_default_per_page' => 10,
        'pagination_max_per_page' => 100,
        'cache_validation_stats_ttl' => 300, // 5 minutes in seconds
        'cache_chart_data_ttl' => 600, // 10 minutes in seconds
    ],
];
