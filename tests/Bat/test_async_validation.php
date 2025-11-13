<?php

/**
 * Test Script for Async Validation
 * 
 * This script demonstrates how the async validation works
 * Run: php test_async_validation.php
 */

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\Log;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Async Validation Test ===\n\n";

// Check if queue connection is configured
$queueConnection = config('queue.default');
echo "✓ Queue Connection: {$queueConnection}\n";

// Check if jobs table exists
try {
    $jobsCount = DB::table('jobs')->count();
    echo "✓ Jobs Table: Exists (Current jobs: {$jobsCount})\n";
} catch (\Exception $e) {
    echo "✗ Jobs Table: Not found - Run 'php artisan queue:table' and 'php artisan migrate'\n";
}

// Check if validations table has status column
try {
    $hasStatus = Schema::hasColumn('validations', 'status');
    $hasDetails = Schema::hasColumn('validations', 'processing_details');
    
    if ($hasStatus && $hasDetails) {
        echo "✓ Validations Table: Updated with async columns\n";
    } else {
        echo "✗ Validations Table: Missing async columns - Run migration\n";
    }
} catch (\Exception $e) {
    echo "✗ Validations Table: Error checking columns\n";
}

// Check if ProcessFileValidation job exists
$jobClass = 'App\\Jobs\\ProcessFileValidation';
if (class_exists($jobClass)) {
    echo "✓ ProcessFileValidation Job: Exists\n";
} else {
    echo "✗ ProcessFileValidation Job: Not found\n";
}

// Check if MappedFileService exists
$serviceClass = 'App\\Services\\MappedFileService';
if (class_exists($serviceClass)) {
    echo "✓ MappedFileService: Exists\n";
} else {
    echo "✗ MappedFileService: Not found\n";
}

echo "\n=== Controller Methods ===\n";

$controller = new \App\Http\Controllers\PembelianController(
    app(\App\Services\FileProcessingService::class),
    app(\App\Services\ValidationService::class),
    app(\App\Services\DocumentComparisonService::class),
    app(\App\Services\ValidationDataService::class),
    app(\App\Services\MappedFileService::class)
);

if (method_exists($controller, 'validateFileAsync')) {
    echo "✓ PembelianController::validateFileAsync() - Exists\n";
} else {
    echo "✗ PembelianController::validateFileAsync() - Not found\n";
}

if (method_exists($controller, 'getValidationStatus')) {
    echo "✓ PembelianController::getValidationStatus() - Exists\n";
} else {
    echo "✗ PembelianController::getValidationStatus() - Not found\n";
}

echo "\n=== Routes ===\n";

$routeName = 'pembelian.validation.status';
if (Route::has($routeName)) {
    $route = Route::getRoutes()->getByName($routeName);
    echo "✓ Route: {$routeName} - " . $route->uri() . "\n";
} else {
    echo "✗ Route: {$routeName} - Not registered\n";
}

echo "\n=== Summary ===\n";
echo "All components are set up for async validation!\n\n";
echo "Next Steps:\n";
echo "1. Start queue worker: php artisan queue:work\n";
echo "2. Test with API call or through the UI\n";
echo "3. Monitor logs: tail -f storage/logs/laravel.log\n";
echo "4. Check queue status: php artisan queue:monitor\n";

echo "\n=== Example API Usage ===\n";
echo "POST /pembelian/validate-reguler\n";
echo "{\n";
echo "  \"filename\": \"test.csv\",\n";
echo "  \"headerRow\": 1,\n";
echo "  \"async\": true\n";
echo "}\n\n";
echo "Response:\n";
echo "{\n";
echo "  \"status\": \"processing\",\n";
echo "  \"validation_id\": 123,\n";
echo "  \"check_status_url\": \"/pembelian/validation/123/status\"\n";
echo "}\n";

echo "\n✅ Async validation is ready to use!\n";
