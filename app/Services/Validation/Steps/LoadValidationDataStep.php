<?php

namespace App\Services\Validation\Steps;

use App\Services\Validation\ValidationContext;
use App\Services\Validation\ValidationStepInterface;
use App\Services\ValidationConfigService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Load Validation Data Step
 * 
 * Loads validation data from the source database table
 */
class LoadValidationDataStep implements ValidationStepInterface
{
    public function __construct(
        protected ValidationConfigService $configService
    ) {}

    public function execute(ValidationContext $context): ValidationContext
    {
        $validationDoc = $context->config['doc_val'];
        $validationConnector = $context->config['connector'][1];
        $validationSum = $context->config['sum'][1] ?? null;

        try {
            $records = DB::table($validationDoc)
                ->select([$validationConnector, $validationSum])
                ->get()
                ->map(function ($record) use ($validationConnector, $validationSum) {
                    return [
                        $validationConnector => trim($record->{$validationConnector} ?? ''),
                        $validationSum => floatval($record->{$validationSum} ?? 0)
                    ];
                })
                ->toArray();

            Log::info('Validation data loaded from database', [
                'record_count' => count($records),
                'table' => $validationDoc
            ]);

            if (empty($records)) {
                throw new \Exception(
                    $this->configService->getErrorMessage('no_validation_data') . " {$validationDoc}"
                );
            }

            $context->validationRecords = $records;

        } catch (\Exception $e) {
            Log::error('Failed to load validation data', [
                'table' => $validationDoc,
                'error' => $e->getMessage()
            ]);
            throw new \Exception('Gagal memuat data validasi dari database.');
        }

        return $context;
    }

    public function getName(): string
    {
        return 'LoadValidationDataStep';
    }
}
