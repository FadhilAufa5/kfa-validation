<?php

namespace App\Services\Validation\Steps;

use App\Services\Validation\ValidationContext;
use App\Services\Validation\ValidationStepInterface;

/**
 * Build Validation Map Step
 * 
 * Builds an aggregated map from validation records
 */
class BuildValidationMapStep implements ValidationStepInterface
{
    public function execute(ValidationContext $context): ValidationContext
    {
        $validationConnector = $context->config['connector'][1];
        $validationSum = $context->config['sum'][1];
        $map = [];

        foreach ($context->validationRecords as $record) {
            $key = trim($record[$validationConnector] ?? '');
            if ($key === '') continue;

            $value = $this->cleanAndParseFloat($record[$validationSum] ?? 0);
            $map[$key] = ($map[$key] ?? 0) + $value;
        }

        $context->validationMap = $map;

        return $context;
    }

    public function getName(): string
    {
        return 'BuildValidationMapStep';
    }

    /**
     * Clean and parse float value
     */
    private function cleanAndParseFloat($value): float
    {
        if (!is_string($value)) {
            return is_numeric($value) ? (float) $value : 0.0;
        }
        return (float) preg_replace('/[^\d.-]/', '', $value);
    }
}
