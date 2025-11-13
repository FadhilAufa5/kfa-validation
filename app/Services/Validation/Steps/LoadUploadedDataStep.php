<?php

namespace App\Services\Validation\Steps;

use App\Services\Validation\ValidationContext;
use App\Services\Validation\ValidationStepInterface;
use App\Repositories\Contracts\MappedFileRepositoryInterface;
use App\Services\ValidationConfigService;
use Illuminate\Support\Facades\Log;

/**
 * Load Uploaded Data Step
 * 
 * Counts uploaded records and validates data exists
 */
class LoadUploadedDataStep implements ValidationStepInterface
{
    public function __construct(
        protected MappedFileRepositoryInterface $mappedFileRepo,
        protected ValidationConfigService $configService
    ) {}

    public function execute(ValidationContext $context): ValidationContext
    {
        $totalRecords = $this->mappedFileRepo->countByFile(
            $context->filename,
            $context->documentType,
            $context->documentCategory
        );

        if ($totalRecords === 0) {
            throw new \Exception(
                $this->configService->getErrorMessage('no_mapped_data')
            );
        }

        Log::info('Found mapped records', [
            'filename' => $context->filename,
            'total_records' => $totalRecords
        ]);

        $context->totalRecords = $totalRecords;

        return $context;
    }

    public function getName(): string
    {
        return 'LoadUploadedDataStep';
    }
}
