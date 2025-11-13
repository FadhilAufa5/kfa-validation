<?php

namespace App\Http\Controllers\Validation;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Services\FileProcessingService;
use App\Services\ValidationService;
use App\Services\DocumentComparisonService;
use App\Services\ValidationDataService;
use App\Services\ActivityLogger;
use App\Services\MappedFileService;
use App\Services\ValidationReportService;
use App\Jobs\ProcessFileValidation;
use App\Models\Validation;

abstract class BaseDocumentController extends Controller
{
    public function __construct(
        protected FileProcessingService $fileProcessingService,
        protected ValidationService $validationService,
        protected DocumentComparisonService $documentComparisonService,
        protected ValidationDataService $validationDataService,
        protected MappedFileService $mappedFileService,
        protected ValidationReportService $reportService
    ) {}

    /**
     * Get the document type (pembelian/penjualan)
     */
    abstract protected function getDocumentType(): string;

    /**
     * Get the base route name prefix
     */
    abstract protected function getRoutePrefix(): string;

    /**
     * Get the view path prefix
     */
    abstract protected function getViewPrefix(): string;

    public function index()
    {
        return Inertia::render($this->getViewPrefix() . '/index');
    }

    public function history()
    {
        return Inertia::render($this->getViewPrefix() . '/history');
    }

    protected function renderUploadPage(string $documentCategory): \Inertia\Response
    {
        return Inertia::render($this->getViewPrefix() . '/upload', [
            'document_type' => $this->getDocumentType(),
            'document_category' => $documentCategory,
        ]);
    }

    public function save(Request $request, $type)
    {
        $request->validate([
            'document' => 'required|file|mimes:xlsx,xls,csv|max:50240',
        ]);

        try {
            $filename = $this->fileProcessingService->saveAndConvertFile($request->file('document'), $type);
            return response()->json(['filename' => $filename]);
        } catch (\Exception $e) {
            Log::error('File save failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Gagal menyimpan file.'], 500);
        }
    }

    public function validateFile(Request $request, $type)
    {
        $request->validate([
            'filename' => 'required|string',
            'async' => 'sometimes|boolean',
        ]);

        $filename = $request->input('filename');
        $headerRow = (int) $request->input('headerRow', 1);
        $userId = auth()->user()?->id;
        $async = $request->input('async', true);

        if ($async) {
            return $this->validateFileAsync($request, $type);
        }

        $documentType = $this->getDocumentType();
        $documentTypeDisplay = ucfirst($documentType);

        ActivityLogger::log(
            action: 'Validasi File Dimulai',
            description: "Memulai validasi file {$filename} untuk dokumen {$documentTypeDisplay} {$type}",
            entityType: 'Validation',
            entityId: null,
            metadata: [
                'filename' => $filename,
                'document_type' => $documentTypeDisplay,
                'document_category' => ucfirst(strtolower($type)),
                'header_row' => $headerRow,
            ]
        );

        try {
            Log::info('Starting file mapping process', [
                'filename' => $filename,
                'document_type' => $documentType,
                'document_category' => $type,
                'header_row' => $headerRow
            ]);

            $mappingResult = $this->mappedFileService->mapUploadedFile(
                filename: $filename,
                documentType: $documentType,
                documentCategory: $type,
                headerRow: $headerRow,
                userId: $userId
            );

            Log::info('File mapping completed successfully', [
                'filename' => $filename,
                'mapped_records' => $mappingResult['mapped_records'],
                'skipped_rows' => $mappingResult['skipped_rows'],
                'failed_rows' => $mappingResult['failed_rows']
            ]);

            ActivityLogger::log(
                action: 'File Mapping Selesai',
                description: "File {$filename} berhasil dimapping dengan {$mappingResult['mapped_records']} records",
                entityType: 'Validation',
                entityId: null,
                metadata: [
                    'filename' => $filename,
                    'document_type' => $documentTypeDisplay,
                    'document_category' => ucfirst(strtolower($type)),
                    'mapped_records' => $mappingResult['mapped_records'],
                    'skipped_rows' => $mappingResult['skipped_rows'],
                    'failed_rows' => $mappingResult['failed_rows']
                ]
            );

            $result = $this->validationService->validateDocument(
                filename: $filename,
                documentType: $documentType,
                documentCategory: $type,
                headerRow: $headerRow,
                userId: $userId,
                existingValidationId: null
            );

            $result['mapping_info'] = [
                'total_rows' => $mappingResult['total_rows'],
                'mapped_records' => $mappingResult['mapped_records'],
                'skipped_rows' => $mappingResult['skipped_rows'],
                'failed_rows' => $mappingResult['failed_rows']
            ];

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Validation failed', [
                'filename' => $filename,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            ActivityLogger::log(
                action: 'Validasi File Gagal',
                description: "Validasi file {$filename} gagal: {$e->getMessage()}",
                entityType: 'Validation',
                entityId: null,
                metadata: [
                    'filename' => $filename,
                    'document_type' => $documentTypeDisplay,
                    'document_category' => ucfirst(strtolower($type)),
                    'error' => $e->getMessage()
                ]
            );
            
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function validateFileAsync(Request $request, $type)
    {
        $request->validate([
            'filename' => 'required|string',
        ]);

        $filename = $request->input('filename');
        $headerRow = (int) $request->input('headerRow', 1);
        $userId = auth()->user()?->id;
        $documentType = $this->getDocumentType();
        $documentTypeDisplay = ucfirst($documentType);

        ActivityLogger::log(
            action: 'Validasi File Async Dimulai',
            description: "Memulai validasi async file {$filename} untuk dokumen {$documentTypeDisplay} {$type}",
            entityType: 'Validation',
            entityId: null,
            metadata: [
                'filename' => $filename,
                'document_type' => $documentTypeDisplay,
                'document_category' => ucfirst(strtolower($type)),
                'header_row' => $headerRow,
                'async' => true,
            ]
        );

        try {
            $validation = Validation::create([
                'file_name' => $filename,
                'role' => auth()->user()?->role ?? 'unknown',
                'user_id' => $userId,
                'document_type' => $documentType,
                'document_category' => ucfirst(strtolower($type)),
                'score' => 0,
                'total_records' => 0,
                'matched_records' => 0,
                'mismatched_records' => 0,
                'status' => 'processing',
                'processing_details' => [
                    'header_row' => $headerRow,
                    'started_at' => now()->toISOString()
                ]
            ]);

            ProcessFileValidation::dispatch(
                filename: $filename,
                documentType: $documentType,
                documentCategory: $type,
                headerRow: $headerRow,
                userId: $userId,
                validationId: $validation->id
            );

            Log::info('File validation job dispatched', [
                'validation_id' => $validation->id,
                'filename' => $filename,
                'document_type' => $documentType,
                'document_category' => $type
            ]);

            return response()->json([
                'status' => 'processing',
                'message' => 'File validation has been queued for processing',
                'validation_id' => $validation->id,
                'check_status_url' => route($this->getRoutePrefix() . '.validation.status', ['id' => $validation->id])
            ], 202);

        } catch (\Exception $e) {
            Log::error('Failed to dispatch validation job', [
                'filename' => $filename,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            ActivityLogger::log(
                action: 'Validasi File Async Gagal',
                description: "Gagal memulai validasi async file {$filename}: {$e->getMessage()}",
                entityType: 'Validation',
                entityId: null,
                metadata: [
                    'filename' => $filename,
                    'document_type' => $documentTypeDisplay,
                    'document_category' => ucfirst(strtolower($type)),
                    'error' => $e->getMessage()
                ]
            );
            
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function preview($filename)
    {
        try {
            $preview = $this->fileProcessingService->previewFile($filename, 10);

            return response()->json([
                'filename' => $filename,
                'preview' => $preview,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    public function processWithHeader($filename, Request $request)
    {
        try {
            $result = $this->fileProcessingService->processFileWithHeader(
                $filename,
                (int) $request->input('headerRow', 1)
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Process with header failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $validationData = $this->validationDataService->getValidationSummary($id);

        if (!$validationData) {
            return Inertia::render($this->getViewPrefix() . '/show', [
                'validationId' => $id,
                'validationData' => null,
                'error' => 'Validation data not found',
            ]);
        }

        return Inertia::render($this->getViewPrefix() . '/show', [
            'validationId' => $id,
            'validationData' => $validationData,
        ]);
    }
}
