<?php

/**
 * Test Script for Date Parsing
 * 
 * Tests the parseDate method with various inputs including numeric months
 * Run: php test_date_parsing.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Date Parsing Test ===\n\n";

// Use reflection to access the private parseDate method
$service = app(App\Services\MappedFileService::class);
$reflection = new ReflectionClass($service);
$method = $reflection->getMethod('parseDate');
$method->setAccessible(true);

// Test cases
$testCases = [
    // Numeric months (1-12)
    ['input' => '1', 'description' => 'Numeric month: 1 (January)'],
    ['input' => '6', 'description' => 'Numeric month: 6 (June)'],
    ['input' => '7', 'description' => 'Numeric month: 7 (July)'],
    ['input' => '8', 'description' => 'Numeric month: 8 (August)'],
    ['input' => '12', 'description' => 'Numeric month: 12 (December)'],
    
    // Edge cases for numeric
    ['input' => '0', 'description' => 'Invalid numeric: 0'],
    ['input' => '13', 'description' => 'Invalid numeric: 13'],
    ['input' => '99', 'description' => 'Invalid numeric: 99'],
    
    // Month names (Indonesian)
    ['input' => 'januari', 'description' => 'Indonesian month name: januari'],
    ['input' => 'Juni', 'description' => 'Indonesian month name: Juni (capitalized)'],
    ['input' => 'agustus', 'description' => 'Indonesian month name: agustus'],
    
    // Month names (English)
    ['input' => 'January', 'description' => 'English month name: January'],
    ['input' => 'jul', 'description' => 'English short month: jul'],
    ['input' => 'Dec', 'description' => 'English short month: Dec'],
    
    // Regular dates
    ['input' => '2025-08-15', 'description' => 'ISO date: 2025-08-15'],
    ['input' => '15/08/2025', 'description' => 'DMY format: 15/08/2025'],
    ['input' => '08-15-2025', 'description' => 'MDY format: 08-15-2025'],
    
    // Edge cases
    ['input' => '', 'description' => 'Empty string'],
    ['input' => '  ', 'description' => 'Whitespace only'],
    ['input' => 'invalid', 'description' => 'Invalid text'],
];

$currentYear = date('Y');
$passed = 0;
$failed = 0;

echo "Current Year: {$currentYear}\n\n";

foreach ($testCases as $test) {
    $input = $test['input'];
    $description = $test['description'];
    
    try {
        $result = $method->invoke($service, $input, 'test.csv', 1);
        
        if ($result === null) {
            echo "❌ {$description}\n";
            echo "   Input: '{$input}'\n";
            echo "   Output: NULL\n\n";
            $failed++;
        } else {
            echo "✅ {$description}\n";
            echo "   Input: '{$input}'\n";
            echo "   Output: {$result}\n\n";
            $passed++;
        }
    } catch (Exception $e) {
        echo "❌ {$description}\n";
        echo "   Input: '{$input}'\n";
        echo "   Error: {$e->getMessage()}\n\n";
        $failed++;
    }
}

echo "\n=== Summary ===\n";
echo "Passed: {$passed}\n";
echo "Failed: {$failed}\n";
echo "Total: " . count($testCases) . "\n";

echo "\n=== Expected Behavior ===\n";
echo "✓ Numeric 1-12 → First day of month (e.g., 8 → {$currentYear}-08-01)\n";
echo "✓ Month names → First day of month (e.g., 'agustus' → {$currentYear}-08-01)\n";
echo "✓ Regular dates → Parsed as-is\n";
echo "✓ Invalid inputs → NULL\n";

echo "\n=== Examples for Current Year ({$currentYear}) ===\n";
echo "Input: 1  → Output: {$currentYear}-01-01 (January 1st)\n";
echo "Input: 7  → Output: {$currentYear}-07-01 (July 1st)\n";
echo "Input: 8  → Output: {$currentYear}-08-01 (August 1st)\n";
echo "Input: 12 → Output: {$currentYear}-12-01 (December 1st)\n";

echo "\n✅ Date parsing test complete!\n";
