<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ValidationMatchedRow extends Model
{
    protected $fillable = [
        'validation_id',
        'row_index',
        'key_value',
        'validation_source_total',
        'uploaded_total',
    ];

    protected $casts = [
        'validation_source_total' => 'decimal:2',
        'uploaded_total' => 'decimal:2',
    ];

    public function validation(): BelongsTo
    {
        return $this->belongsTo(Validation::class);
    }
}
