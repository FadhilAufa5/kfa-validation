<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ValidationInvalidRow extends Model
{
    protected $fillable = [
        'validation_id',
        'row_index',
        'key_value',
        'error',
    ];

    public function validation(): BelongsTo
    {
        return $this->belongsTo(Validation::class);
    }
}
