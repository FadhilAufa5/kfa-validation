<?php

namespace App\Exceptions\Validation;

class InvalidDocumentTypeException extends ValidationException
{
    public function __construct(
        string $documentType,
        ?string $documentCategory = null,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            message: 'Invalid document type or category',
            errorCode: 'INVALID_DOCUMENT_TYPE',
            details: [
                'document_type' => $documentType,
                'document_category' => $documentCategory,
            ],
            httpCode: 400,
            previous: $previous
        );
    }
}
