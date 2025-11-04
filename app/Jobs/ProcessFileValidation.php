<?php

namespace App\Jobs;

use App\Models\Validation;
use App\Services\MappedFileService;
use App\Services\ValidationService;
use App\Services\ActivityLogger;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Exception;

class ProcessFileValidation implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     *
     * @var int
     */
    public $timeout = 600;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $filename,
        public string $documentType,
        public string $documentCategory,
        public int $headerRow,
        public ?int $userId,
        public int $validationId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(
        MappedFileService $mappedFileService,
        ValidationService $validationService
    ): void {
        Log::info('Starting async file validation job', [
            'validation_id' => $this->validationId,
            'filename' => $this->filename,
            'document_type' => $this->documentType,
            'document_category' => $this->documentCategory
        ]);

        try {
            // Step 1: Map uploaded file data to database
            Log::info('Starting file mapping process', [
                'validation_id' => $this->validationId,
                'filename' => $this->filename,
                'document_type' => $this->documentType,
                'document_category' => $this->documentCategory,
                'header_row' => $this->headerRow
            ]);

            $mappingResult = $mappedFileService->mapUploadedFile(
                filename: $this->filename,
                documentType: $this->documentType,
                documentCategory: $this->documentCategory,
                headerRow: $this->headerRow,
                userId: $this->userId
            );

            Log::info('File mapping completed successfully', [
                'validation_id' => $this->validationId,
                'filename' => $this->filename,
                'mapped_records' => $mappingResult['mapped_records'],
                'skipped_rows' => $mappingResult['skipped_rows'],
                'failed_rows' => $mappingResult['failed_rows']
            ]);

            ActivityLogger::log(
                action: 'File Mapping Selesai',
                description: "File {$this->filename} berhasil dimapping dengan {$mappingResult['mapped_records']} records",
                entityType: 'Validation',
                entityId: (string) $this->validationId,
                metadata: [
                    'validation_id' => $this->validationId,
                    'filename' => $this->filename,
                    'document_type' => ucfirst($this->documentType),
                    'document_category' => ucfirst(strtolower($this->documentCategory)),
                    'mapped_records' => $mappingResult['mapped_records'],
                    'skipped_rows' => $mappingResult['skipped_rows'],
                    'failed_rows' => $mappingResult['failed_rows']
                ]
            );

            // Step 2: Proceed with validation using existing validation ID
            $result = $validationService->validateDocument(
                filename: $this->filename,
                documentType: $this->documentType,
                documentCategory: $this->documentCategory,
                headerRow: $this->headerRow,
                userId: $this->userId,
                existingValidationId: $this->validationId
            );

            // Update processing details with mapping info
            $validation = Validation::find($this->validationId);
            if ($validation) {
                $validation->updateStatus('completed', [
                    'mapping_info' => [
                        'total_rows' => $mappingResult['total_rows'],
                        'mapped_records' => $mappingResult['mapped_records'],
                        'skipped_rows' => $mappingResult['skipped_rows'],
                        'failed_rows' => $mappingResult['failed_rows']
                    ],
                    'completed_at' => now()->toISOString()
                ]);
            }

            Log::info('Async file validation completed successfully', [
                'validation_id' => $this->validationId,
                'filename' => $this->filename,
                'status' => $result['status']
            ]);

        } catch (Exception $e) {
            Log::error('Async file validation failed', [
                'validation_id' => $this->validationId,
                'filename' => $this->filename,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Update validation record with failed status
            $validation = Validation::find($this->validationId);
            if ($validation) {
                $validation->updateStatus('failed', [
                    'error' => $e->getMessage(),
                    'failed_at' => now()->toISOString()
                ]);
            }

            ActivityLogger::log(
                action: 'Validasi File Gagal',
                description: "Validasi async file {$this->filename} gagal: {$e->getMessage()}",
                entityType: 'Validation',
                entityId: (string) $this->validationId,
                metadata: [
                    'validation_id' => $this->validationId,
                    'filename' => $this->filename,
                    'document_type' => ucfirst($this->documentType),
                    'document_category' => ucfirst(strtolower($this->documentCategory)),
                    'error' => $e->getMessage()
                ]
            );

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(Exception $exception): void
    {
        Log::error('File validation job failed permanently', [
            'validation_id' => $this->validationId,
            'filename' => $this->filename,
            'error' => $exception->getMessage()
        ]);

        // Mark validation as permanently failed
        $validation = Validation::find($this->validationId);
        if ($validation) {
            $validation->updateStatus('failed', [
                'error' => $exception->getMessage(),
                'permanently_failed_at' => now()->toISOString()
            ]);
        }
    }
}
