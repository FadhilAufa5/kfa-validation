<?php

namespace App\Services\Validation\Steps;

use App\Services\Validation\ValidationContext;
use App\Services\Validation\ValidationStepInterface;
use App\Repositories\Contracts\MappedFileRepositoryInterface;
use App\Services\ValidationConfigService;
use Illuminate\Support\Facades\Log;

/**
 * Categorize Rows Step
 * 
 * Categorizes individual rows as invalid or matched based on group validation results
 */
class CategorizeRowsStep implements ValidationStepInterface
{
    public function __construct(
        protected MappedFileRepositoryInterface $mappedFileRepo,
        protected ValidationConfigService $configService
    ) {}

    public function execute(ValidationContext $context): ValidationContext
    {
        $invalidRows = [];
        $matchedRows = [];
        $mismatchedRecordCount = 0;

        // Get invalid row keys
        $invalidKeys = array_keys($context->invalidGroups);
        
        // Process invalid rows in batches
        if (!empty($invalidKeys)) {
            foreach (array_chunk($invalidKeys, 500) as $keyChunk) {
                $records = $this->mappedFileRepo->getByConnectors(
                    $context->filename,
                    $context->documentType,
                    $context->documentCategory,
                    $keyChunk
                );

                foreach ($records as $record) {
                    $key = trim($record->connector);
                    if (isset($context->invalidGroups[$key])) {
                        $invalidRows[] = [
                            'row_index' => $record->row_index,
                            'key_value' => $key,
                            'error' => $context->invalidGroups[$key]['error']
                        ];
                        $mismatchedRecordCount++;
                    }
                }
            }
        }

        // Get matched keys (excluding invalid ones)
        $matchedKeys = [];
        $tolerance = $this->configService->getTolerance(
            $context->documentType,
            $context->documentCategory
        );

        foreach ($context->uploadedMapByGroup as $key => $uploadedValue) {
            if (isset($context->invalidGroups[$key])) {
                continue; // Skip invalid keys
            }

            $validationValue = $context->validationMap[$key] ?? null;
            
            // Check if it's a matched key
            if ($validationValue === null && $uploadedValue == 0) {
                $matchedKeys[] = $key; // Retur doesn't record
            } else if ($validationValue !== null) {
                $diff = abs($uploadedValue - $validationValue);
                if ($diff <= $tolerance) {
                    $matchedKeys[] = $key;
                }
            }
        }

        // Process matched rows in batches
        if (!empty($matchedKeys)) {
            foreach (array_chunk($matchedKeys, 500) as $keyChunk) {
                $records = $this->mappedFileRepo->getByConnectors(
                    $context->filename,
                    $context->documentType,
                    $context->documentCategory,
                    $keyChunk
                );

                foreach ($records as $record) {
                    $key = trim($record->connector);
                    $validationValue = $context->validationMap[$key] ?? null;
                    $uploadedValue = (float) $record->sum_field;

                    $matchedRows[] = [
                        'row_index' => $record->row_index,
                        'key_value' => $key,
                        'validation_source_total' => $validationValue,
                        'uploaded_total' => $uploadedValue,
                    ];
                }
            }
        }

        Log::info('Categorized rows from database', [
            'invalid_rows' => count($invalidRows),
            'matched_rows' => count($matchedRows),
            'mismatched_count' => $mismatchedRecordCount
        ]);

        $context->invalidRows = $invalidRows;
        $context->matchedRows = $matchedRows;
        $context->mismatchedRecordCount = $mismatchedRecordCount;

        return $context;
    }

    public function getName(): string
    {
        return 'CategorizeRowsStep';
    }
}
