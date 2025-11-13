<?php

namespace App\Services\Validation;

/**
 * Validation Context
 * 
 * Holds all data passed between validation steps in the pipeline
 */
class ValidationContext
{
    public function __construct(
        public string $filename,
        public string $documentType,
        public string $documentCategory,
        public int $headerRow,
        public ?int $userId = null,
        public ?int $existingValidationId = null,
        
        // Data populated by steps
        public array $config = [],
        public int $totalRecords = 0,
        public array $validationRecords = [],
        public array $validationMap = [],
        public array $uploadedMapByGroup = [],
        public array $invalidGroups = [],
        public array $matchedGroups = [],
        public array $invalidRows = [],
        public array $matchedRows = [],
        public int $mismatchedRecordCount = 0,
        public ?object $validationRecord = null,
        public float $executionTime = 0.0,
        
        // Metadata
        public float $startTime = 0.0,
    ) {
        $this->startTime = microtime(true);
    }

    /**
     * Get execution time
     */
    public function getExecutionTime(): float
    {
        return microtime(true) - $this->startTime;
    }

    /**
     * Get validation status
     */
    public function getStatus(): string
    {
        return $this->mismatchedRecordCount > 0 ? 'invalid' : 'valid';
    }

    /**
     * Convert to array for response
     */
    public function toArray(): array
    {
        return [
            'status' => $this->getStatus(),
            'validation_id' => $this->validationRecord?->id,
            'invalid_groups' => $this->invalidGroups,
            'invalid_rows' => $this->invalidRows,
        ];
    }
}
