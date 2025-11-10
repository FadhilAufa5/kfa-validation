<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'status',
        'processing_details',
        'validation_details', // Keep for backward compatibility during migration
    ];

    protected $casts = [
        'validation_details' => 'array', // Keep for backward compatibility
        'processing_details' => 'array',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Update validation status
     */
    public function updateStatus(string $status, ?array $processingDetails = null): bool
    {
        $data = ['status' => $status];
        
        if ($processingDetails !== null) {
            $data['processing_details'] = array_merge(
                $this->processing_details ?? [],
                $processingDetails
            );
        }
        
        return $this->update($data);
    }
}