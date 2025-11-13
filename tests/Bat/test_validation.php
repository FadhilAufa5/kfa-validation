<?php

require_once __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\Validation;

// Create a simple test
try {
    // Test creating a validation record
    $validation = new Validation([
        'file_name' => 'test_file.csv',
        'role' => 'Admin',
        'category' => 'Reguler',
        'score' => 95.50,
        'total_records' => 100,
        'matched_records' => 95,
        'discrepancy_records' => 5,
    ]);

    $validation->save();
    
    echo "Validation record created successfully with ID: " . $validation->id . "\n";
    
    // Retrieve and display the record
    $retrieved = Validation::find($validation->id);
    if ($retrieved) {
        echo "Retrieved record:\n";
        echo "File: " . $retrieved->file_name . "\n";
        echo "Category: " . $retrieved->category . "\n";
        echo "Score: " . $retrieved->score . "\n";
        echo "Total Records: " . $retrieved->total_records . "\n";
        echo "Matched Records: " . $retrieved->matched_records . "\n";
        echo "Discrepancy Records: " . $retrieved->discrepancy_records . "\n";
        echo "Is Valid: " . ($retrieved->discrepancy_records === 0 ? 'Yes' : 'No') . "\n";
    }
    
    // Delete the test record
    $validation->delete();
    echo "Test record deleted.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}