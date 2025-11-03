<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ValidationMatchedGroup extends Model
{
    protected $fillable = [
        'validation_id',
        'key_value',
        'uploaded_total',
        'source_total',
        'difference',
        'note',
    ];

    protected $casts = [
        'uploaded_total' => 'decimal:2',
        'source_total' => 'decimal:2',
        'difference' => 'decimal:2',
    ];

    public function validation(): BelongsTo
    {
        return $this->belongsTo(Validation::class);
    }
}
