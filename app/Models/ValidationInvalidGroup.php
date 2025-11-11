<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ValidationInvalidGroup extends Model
{
    protected $fillable = [
        'validation_id',
        'key_value',
        'discrepancy_category',
        'error',
        'uploaded_total',
        'source_total',
        'discrepancy_value',
    ];

    protected $casts = [
        'uploaded_total' => 'decimal:2',
        'source_total' => 'decimal:2',
        'discrepancy_value' => 'decimal:2',
    ];

    public function validation(): BelongsTo
    {
        return $this->belongsTo(Validation::class);
    }
}
