<?php

namespace App\Services\Validation\Steps;

use App\Services\Validation\ValidationContext;
use App\Services\Validation\ValidationStepInterface;
use App\Services\ValidationConfigService;

/**
 * Compare Data Step
 * 
 * Compares uploaded and validation maps to identify discrepancies
 */
class CompareDataStep implements ValidationStepInterface
{
    public function __construct(
        protected ValidationConfigService $configService
    ) {}

    public function execute(ValidationContext $context): ValidationContext
    {
        $tolerance = $this->configService->getTolerance(
            $context->documentType,
            $context->documentCategory
        );

        $invalidGroups = [];
        $matchedGroups = [];

        foreach ($context->uploadedMapByGroup as $key => $uploadedValue) {
            $validationValue = $context->validationMap[$key] ?? null;

            if ($validationValue === null) {
                // Key not found in validation data
                if ($uploadedValue == 0) {
                    $matchedGroups[$key] = [
                        'uploaded_total' => $uploadedValue,
                        'source_total' => 0,
                        'difference' => 0,
                        'note' => $this->configService->getNote('retur_not_recorded')
                    ];
                } else {
                    $invalidGroups[$key] = [
                        'discrepancy_category' => 'im_invalid',
                        'error' => $this->configService->getErrorMessage('key_not_found'),
                        'uploaded_total' => $uploadedValue,
                        'source_total' => 0,
                        'discrepancy_value' => $uploadedValue
                    ];
                }
            } else {
                // Key exists in both
                if ($uploadedValue == 0 || $validationValue == 0) {
                    $invalidGroups[$key] = [
                        'discrepancy_category' => 'missing',
                        'error' => $this->configService->getErrorMessage('missing_value'),
                        'uploaded_total' => $uploadedValue,
                        'source_total' => $validationValue,
                        'discrepancy_value' => $uploadedValue - $validationValue
                    ];
                } else {
                    $difference = $uploadedValue - $validationValue;
                    
                    if (abs($difference) <= $tolerance) {
                        // Within tolerance - matched
                        $note = ($difference == 0) 
                            ? $this->configService->getNote('sum_matched')
                            : $this->configService->getNote('rounding');
                        
                        $matchedGroups[$key] = [
                            'uploaded_total' => $uploadedValue,
                            'source_total' => $validationValue,
                            'difference' => $difference,
                            'note' => $note
                        ];
                    } else {
                        // Beyond tolerance - invalid
                        $invalidGroups[$key] = [
                            'discrepancy_category' => 'discrepancy',
                            'error' => $this->configService->getErrorMessage('total_mismatch'),
                            'uploaded_total' => $uploadedValue,
                            'source_total' => $validationValue,
                            'discrepancy_value' => $difference
                        ];
                    }
                }
            }
        }

        $context->invalidGroups = $invalidGroups;
        $context->matchedGroups = $matchedGroups;

        return $context;
    }

    public function getName(): string
    {
        return 'CompareDataStep';
    }
}
