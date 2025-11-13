<?php

namespace App\Exceptions\Validation;

class FileProcessingException extends ValidationException
{
    public function __construct(
        string $message,
        string $filename,
        array $additionalDetails = [],
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            message: $message,
            errorCode: 'FILE_PROCESSING_ERROR',
            details: array_merge(['filename' => $filename], $additionalDetails),
            httpCode: 400,
            previous: $previous
        );
    }
}
