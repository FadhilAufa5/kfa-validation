<?php

namespace App\Services\Validation\Steps;

use App\Services\Validation\ValidationContext;
use App\Services\Validation\ValidationStepInterface;
use App\Repositories\Contracts\ValidationRepositoryInterface;
use App\Services\ActivityLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Save Results Step
 * 
 * Saves validation results to the database
 */
class SaveResultsStep implements ValidationStepInterface
{
    public function __construct(
        protected ValidationRepositoryInterface $validationRepo
    ) {}

    public function execute(ValidationContext $context): ValidationContext
    {
        $matchedRecords = $context->totalRecords - $context->mismatchedRecordCount;
        $score = $context->totalRecords > 0 
            ? round(($matchedRecords / $context->totalRecords) * 100, 2) 
            : 100.00;

        // Use database transaction
        $validationRecord = DB::transaction(function () use ($context, $matchedRecords, $score) {
            // Update existing or create new
            if ($context->existingValidationId) {
                $validation = $this->validationRepo->find($context->existingValidationId);
                
                if ($validation) {
                    // Delete existing relationships
                    $validation->invalidGroups()->delete();
                    $validation->invalidRows()->delete();
                    $validation->matchedGroups()->delete();
                    $validation->matchedRows()->delete();
                    
                    // Update validation record
                    $this->validationRepo->update($context->existingValidationId, [
                        'score' => $score,
                        'total_records' => $context->totalRecords,
                        'matched_records' => $matchedRecords,
                        'mismatched_records' => $context->mismatchedRecordCount,
                        'status' => 'completed',
                        'validation_details' => [
                            'invalid_groups' => $context->invalidGroups,
                            'invalid_rows' => $context->invalidRows,
                            'matched_groups' => $context->matchedGroups,
                            'matched_rows' => $context->matchedRows,
                        ],
                    ]);
                    
                    return $validation->fresh();
                }
            }

            // Create new validation record
            $validation = $this->validationRepo->create([
                'file_name' => $context->filename,
                'role' => auth()->user()?->role ?? 'unknown',
                'user_id' => $context->userId ?? auth()->user()?->id ?? null,
                'document_type' => $context->documentType,
                'document_category' => ucfirst(strtolower($context->documentCategory)),
                'score' => $score,
                'total_records' => $context->totalRecords,
                'matched_records' => $matchedRecords,
                'mismatched_records' => $context->mismatchedRecordCount,
                'status' => 'completed',
                'validation_details' => [
                    'invalid_groups' => $context->invalidGroups,
                    'invalid_rows' => $context->invalidRows,
                    'matched_groups' => $context->matchedGroups,
                    'matched_rows' => $context->matchedRows,
                ],
            ]);

            // Batch insert relationships
            $this->saveInvalidGroups($validation, $context->invalidGroups);
            $this->saveInvalidRows($validation, $context->invalidRows);
            $this->saveMatchedGroups($validation, $context->matchedGroups);
            $this->saveMatchedRows($validation, $context->matchedRows);

            return $validation;
        });

        // Log activity
        ActivityLogger::log(
            action: 'Validasi File Selesai',
            description: "Validasi file {$context->filename} selesai dengan status " . 
                        ($context->mismatchedRecordCount > 0 ? 'invalid' : 'valid') . 
                        " (Score: {$score}%)",
            entityType: 'Validation',
            entityId: (string) $validationRecord->id,
            metadata: [
                'validation_id' => $validationRecord->id,
                'filename' => $context->filename,
                'document_type' => $context->documentType,
                'document_category' => $context->documentCategory,
                'status' => $context->getStatus(),
                'score' => $score,
                'total_records' => $context->totalRecords,
                'matched_records' => $matchedRecords,
                'mismatched_records' => $context->mismatchedRecordCount,
                'invalid_groups_count' => count($context->invalidGroups),
                'execution_time' => round($context->getExecutionTime(), 2),
            ]
        );

        $context->validationRecord = $validationRecord;

        return $context;
    }

    public function getName(): string
    {
        return 'SaveResultsStep';
    }

    /**
     * Save invalid groups in batches
     */
    protected function saveInvalidGroups($validation, array $invalidGroups): void
    {
        if (empty($invalidGroups)) return;

        $data = [];
        foreach ($invalidGroups as $key => $group) {
            $data[] = [
                'validation_id' => $validation->id,
                'key_value' => $key,
                'discrepancy_category' => $group['discrepancy_category'],
                'error' => $group['error'],
                'uploaded_total' => $group['uploaded_total'],
                'source_total' => $group['source_total'],
                'discrepancy_value' => $group['discrepancy_value'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($data, 100) as $chunk) {
            $validation->invalidGroups()->insert($chunk);
        }
    }

    /**
     * Save invalid rows in batches
     */
    protected function saveInvalidRows($validation, array $invalidRows): void
    {
        if (empty($invalidRows)) return;

        $data = [];
        foreach ($invalidRows as $row) {
            $data[] = [
                'validation_id' => $validation->id,
                'row_index' => $row['row_index'],
                'key_value' => $row['key_value'],
                'error' => $row['error'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($data, 150) as $chunk) {
            $validation->invalidRows()->insert($chunk);
        }
    }

    /**
     * Save matched groups in batches
     */
    protected function saveMatchedGroups($validation, array $matchedGroups): void
    {
        if (empty($matchedGroups)) return;

        $data = [];
        foreach ($matchedGroups as $key => $group) {
            $data[] = [
                'validation_id' => $validation->id,
                'key_value' => $key,
                'uploaded_total' => $group['uploaded_total'],
                'source_total' => $group['source_total'],
                'difference' => $group['difference'],
                'note' => $group['note'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($data, 120) as $chunk) {
            $validation->matchedGroups()->insert($chunk);
        }
    }

    /**
     * Save matched rows in batches
     */
    protected function saveMatchedRows($validation, array $matchedRows): void
    {
        if (empty($matchedRows)) return;

        $data = [];
        foreach ($matchedRows as $row) {
            $data[] = [
                'validation_id' => $validation->id,
                'row_index' => $row['row_index'],
                'key_value' => $row['key_value'],
                'validation_source_total' => $row['validation_source_total'],
                'uploaded_total' => $row['uploaded_total'],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($data, 140) as $chunk) {
            $validation->matchedRows()->insert($chunk);
        }
    }
}
