<?php

namespace App\Services\Validation\Steps;

use App\Services\Validation\ValidationContext;
use App\Services\Validation\ValidationStepInterface;
use App\Exceptions\Validation\InvalidDocumentTypeException;
use Illuminate\Support\Facades\Config;

/**
 * Load Configuration Step
 * 
 * Loads and validates the configuration for the specified document type
 */
class LoadConfigStep implements ValidationStepInterface
{
    public function execute(ValidationContext $context): ValidationContext
    {
        $configKey = strtolower($context->documentType) . '.' . strtolower($context->documentCategory);
        $config = Config::get('document_validation.' . $configKey);

        if (!$config) {
            throw new InvalidDocumentTypeException(
                $context->documentType,
                $context->documentCategory
            );
        }

        if (count($config['connector'] ?? []) < 2) {
            throw new InvalidDocumentTypeException(
                $context->documentType,
                $context->documentCategory
            );
        }

        $context->config = $config;

        return $context;
    }

    public function getName(): string
    {
        return 'LoadConfigStep';
    }
}
