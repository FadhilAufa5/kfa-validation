<?php

namespace App\Exceptions\Validation;

class MappingException extends ValidationException
{
    public function __construct(
        string $message,
        array $details = [],
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            message: $message,
            errorCode: 'MAPPING_ERROR',
            details: $details,
            httpCode: 400,
            previous: $previous
        );
    }
}
