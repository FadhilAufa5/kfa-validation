<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Validation;

class ValidationModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_validation_model_can_be_created_and_retrieved()
    {
        $validation = Validation::create([
            'file_name' => 'test_file.csv',
            'role' => 'Admin',
            'category' => 'Reguler',
            'score' => 95.50,
            'total_records' => 100,
            'matched_records' => 95,
            'discrepancy_records' => 5,
        ]);

        $this->assertDatabaseHas('validations', [
            'file_name' => 'test_file.csv',
            'category' => 'Reguler',
            'score' => 95.50,
        ]);

        $retrieved = Validation::find($validation->id);
        $this->assertEquals('test_file.csv', $retrieved->file_name);
        $this->assertEquals('Reguler', $retrieved->category);
        $this->assertEquals(95.50, $retrieved->score);
        $this->assertEquals(100, $retrieved->total_records);
        $this->assertEquals(95, $retrieved->matched_records);
        $this->assertEquals(5, $retrieved->discrepancy_records);
    }

    public function test_validation_model_properties()
    {
        $validation = new Validation();
        
        $fillable = $validation->getFillable();
        
        $this->assertContains('file_name', $fillable);
        $this->assertContains('role', $fillable);
        $this->assertContains('category', $fillable);
        $this->assertContains('score', $fillable);
        $this->assertContains('total_records', $fillable);
        $this->assertContains('matched_records', $fillable);
        $this->assertContains('discrepancy_records', $fillable);
    }
}