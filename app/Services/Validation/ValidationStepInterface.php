<?php

namespace App\Services\Validation;

/**
 * Validation Step Interface
 * 
 * All validation steps must implement this interface
 */
interface ValidationStepInterface
{
    /**
     * Execute the validation step
     * 
     * @param ValidationContext $context
     * @return ValidationContext
     * @throws \Exception
     */
    public function execute(ValidationContext $context): ValidationContext;

    /**
     * Get step name for logging
     */
    public function getName(): string;
}
