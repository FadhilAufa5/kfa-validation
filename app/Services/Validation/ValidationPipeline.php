<?php

namespace App\Services\Validation;

use Illuminate\Support\Facades\Log;

/**
 * Validation Pipeline
 * 
 * Orchestrates the execution of validation steps in sequence
 */
class ValidationPipeline
{
    /**
     * @var ValidationStepInterface[]
     */
    protected array $steps = [];

    /**
     * Add a step to the pipeline
     */
    public function addStep(ValidationStepInterface $step): self
    {
        $this->steps[] = $step;
        return $this;
    }

    /**
     * Execute all steps in the pipeline
     * 
     * @throws \Exception
     */
    public function execute(ValidationContext $context): ValidationContext
    {
        Log::info('Starting validation pipeline', [
            'filename' => $context->filename,
            'document_type' => $context->documentType,
            'document_category' => $context->documentCategory,
            'total_steps' => count($this->steps)
        ]);

        foreach ($this->steps as $index => $step) {
            $stepName = $step->getName();
            $stepStart = microtime(true);

            try {
                Log::debug("Executing validation step", [
                    'step' => $stepName,
                    'step_number' => $index + 1,
                    'total_steps' => count($this->steps)
                ]);

                $context = $step->execute($context);

                $stepTime = microtime(true) - $stepStart;
                Log::debug("Validation step completed", [
                    'step' => $stepName,
                    'execution_time' => round($stepTime, 3)
                ]);

            } catch (\Exception $e) {
                Log::error("Validation step failed", [
                    'step' => $stepName,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw $e;
            }
        }

        $context->executionTime = $context->getExecutionTime();

        Log::info('Validation pipeline completed', [
            'filename' => $context->filename,
            'status' => $context->getStatus(),
            'total_execution_time' => round($context->executionTime, 3),
            'total_records' => $context->totalRecords,
            'mismatched_records' => $context->mismatchedRecordCount
        ]);

        return $context;
    }

    /**
     * Get all steps in the pipeline
     * 
     * @return ValidationStepInterface[]
     */
    public function getSteps(): array
    {
        return $this->steps;
    }

    /**
     * Clear all steps from the pipeline
     */
    public function clear(): self
    {
        $this->steps = [];
        return $this;
    }
}
