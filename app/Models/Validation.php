<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'validation_details', // Keep for backward compatibility during migration
    ];

    protected $casts = [
        'validation_details' => 'array', // Keep for backward compatibility
    ];

    public function invalidGroups(): HasMany
    {
        return $this->hasMany(ValidationInvalidGroup::class);
    }

    public function matchedGroups(): HasMany
    {
        return $this->hasMany(ValidationMatchedGroup::class);
    }

    public function invalidRows(): HasMany
    {
        return $this->hasMany(ValidationInvalidRow::class);
    }

    public function matchedRows(): HasMany
    {
        return $this->hasMany(ValidationMatchedRow::class);
    }
}