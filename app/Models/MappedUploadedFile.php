<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MappedUploadedFile extends Model
{
    protected $fillable = [
        'filename',
        'document_type',
        'document_category',
        'header_row',
        'user_id',
        'kode_bm',
        'nama_bm',
        'kode_outlet',
        'nama_outlet',
        'date',
        'connector',
        'sum_field',
        'row_index',
    ];

    protected $casts = [
        'date' => 'date',
        'sum_field' => 'decimal:2',
        'header_row' => 'integer',
        'row_index' => 'integer',
    ];

    /**
     * Get the user who uploaded this file
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter by filename
     */
    public function scopeByFilename($query, string $filename)
    {
        return $query->where('filename', $filename);
    }

    /**
     * Scope to filter by document type
     */
    public function scopeByDocumentType($query, string $documentType)
    {
        return $query->where('document_type', $documentType);
    }

    /**
     * Scope to filter by document category
     */
    public function scopeByDocumentCategory($query, string $documentCategory)
    {
        return $query->where('document_category', $documentCategory);
    }

    /**
     * Scope to filter by connector value
     */
    public function scopeByConnector($query, string $connector)
    {
        return $query->where('connector', $connector);
    }
}
