<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Validation extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_name',
        'role',
        'category',
        'score',
        'total_records',
        'matched_records',
        'discrepancy_records',
    ];
}