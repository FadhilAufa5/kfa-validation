<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Validation;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;

class PembelianValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_validate_file_creates_validation_record()
    {
        Storage::fake('private');
        
        // Create a test CSV file
        $csvContent = "No Transaksi,DPP\n1,100.00\n2,200.00\n3,300.00";
        Storage::put('uploads/test_file.csv', $csvContent);
        
        // Create a validation file
        $validationContent = "no_transaksi,dpp\n1,100.00\n2,200.00\n3,300.00";
        Storage::put('validation/test_validation.csv', $validationContent);
        
        $response = $this->postJson('/api/pembelian/validate/Retur', [
            'filename' => 'test_file.csv'
        ]);
        
        $response->assertJsonStructure([
            'status',
            'invalid_groups',
            'invalid_rows'
        ]);
        
        $this->assertDatabaseHas('validations', [
            'file_name' => 'test_file.csv',
            'category' => 'Retur',
            'score' => 100.00,
            'total_records' => 3,
            'matched_records' => 3,
            'discrepancy_records' => 0
        ]);
    }

    public function test_show_validation_returns_data_from_database()
    {
        $validation = Validation::create([
            'file_name' => 'test.csv',
            'category' => 'Reguler',
            'score' => 90.50,
            'total_records' => 10,
            'matched_records' => 9,
            'discrepancy_records' => 1
        ]);

        $response = $this->get("/pembelian/{$validation->id}");

        $response->assertStatus(200);
        $response->assertSee('test.csv');
        $response->assertSee('90.50');
        $response->assertSee('Reguler');
    }

    public function test_show_validation_returns_null_for_nonexistent_id()
    {
        $response = $this->get('/pembelian/999');

        $response->assertStatus(200);
        $response->assertSee('validationData');
    }
}