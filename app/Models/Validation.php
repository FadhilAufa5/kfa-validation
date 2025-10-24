<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Validation extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_name',
        'user_id',
        'role',
        'document_type',
        'document_category',
        'score',
        'total_records',
        'matched_records',
        'mismatched_records',
    ];
}