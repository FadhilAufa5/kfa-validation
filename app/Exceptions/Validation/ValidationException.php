<?php

namespace App\Exceptions\Validation;

use Exception;

class ValidationException extends Exception
{
    protected $errorCode;
    protected $details;

    public function __construct(
        string $message = 'Validation error occurred',
        string $errorCode = 'VALIDATION_ERROR',
        array $details = [],
        int $httpCode = 400,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $httpCode, $previous);
        $this->errorCode = $errorCode;
        $this->details = $details;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getDetails(): array
    {
        return $this->details;
    }

    public function toArray(): array
    {
        return [
            'success' => false,
            'error' => [
                'code' => $this->errorCode,
                'message' => $this->getMessage(),
                'details' => $this->details,
            ],
        ];
    }
}
