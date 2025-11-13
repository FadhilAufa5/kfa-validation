<?php

namespace App\Services\Validation\Steps;

use App\Services\Validation\ValidationContext;
use App\Services\Validation\ValidationStepInterface;
use App\Repositories\Contracts\MappedFileRepositoryInterface;
use Illuminate\Support\Facades\Log;

/**
 * Build Uploaded Map Step
 * 
 * Builds aggregated map from uploaded data using database aggregation
 */
class BuildUploadedMapStep implements ValidationStepInterface
{
    public function __construct(
        protected MappedFileRepositoryInterface $mappedFileRepo
    ) {}

    public function execute(ValidationContext $context): ValidationContext
    {
        $uploadedMapByGroup = $this->mappedFileRepo->getAggregatedByConnector(
            $context->filename,
            $context->documentType,
            $context->documentCategory
        );

        Log::info('Built uploaded map from database aggregation', [
            'unique_keys' => count($uploadedMapByGroup),
            'filename' => $context->filename
        ]);

        $context->uploadedMapByGroup = $uploadedMapByGroup;

        return $context;
    }

    public function getName(): string
    {
        return 'BuildUploadedMapStep';
    }
}
