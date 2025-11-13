<?php

namespace App\Exceptions\Validation;

class ValidationDataNotFoundException extends ValidationException
{
    public function __construct(
        int $validationId,
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            message: 'Validation data not found',
            errorCode: 'VALIDATION_NOT_FOUND',
            details: ['validation_id' => $validationId],
            httpCode: 404,
            previous: $previous
        );
    }
}
