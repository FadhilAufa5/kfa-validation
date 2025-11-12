<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Services\FileProcessingService;
use App\Services\ValidationService;
use App\Services\DocumentComparisonService;
use App\Services\ValidationDataService;
use App\Services\ActivityLogger;
use App\Services\MappedFileService;
use App\Services\ValidationReportService;
use App\Jobs\ProcessFileValidation;
use App\Models\Validation;

class PembelianController extends Controller
{
    public function __construct(
        private FileProcessingService $fileProcessingService,
        private ValidationService $validationService,
        private DocumentComparisonService $documentComparisonService,
        private ValidationDataService $validationDataService,
        private MappedFileService $mappedFileService,
        private ValidationReportService $reportService
    ) {}

    public function index()
    {
        return Inertia::render('pembelian/index');
    }

    public function history()
    {
        return Inertia::render('pembelian/history');
    }

    public function reguler()
    {
        return Inertia::render('pembelian/upload', [
            'document_type' => 'Pembelian',
            'document_category' => 'Reguler',
        ]);
    }

    public function retur()
    {
        return Inertia::render('pembelian/upload', [
            'document_type' => 'Pembelian',
            'document_category' => 'Retur',
        ]);
    }

    public function urgent()
    {
        return Inertia::render('pembelian/upload', [
            'document_type' => 'Pembelian',
            'document_category' => 'Urgent',
        ]);
    }

    public function save(Request $request, $type)
    {
        $request->validate([
            'document' => 'required|file|mimes:xlsx,xls,csv|max:16240',
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
        $async = $request->input('async', true); // Default to async

        // If async is requested, use the async method
        if ($async) {
            return $this->validateFileAsync($request, $type);
        }

        // Otherwise, process synchronously (original logic)
        ActivityLogger::log(
            action: 'Validasi File Dimulai',
            description: "Memulai validasi file {$filename} untuk dokumen Pembelian {$type}",
            entityType: 'Validation',
            entityId: null,
            metadata: [
                'filename' => $filename,
                'document_type' => 'Pembelian',
                'document_category' => ucfirst(strtolower($type)),
                'header_row' => $headerRow,
            ]
        );

        try {
            // Step 1: Map uploaded file data to database
            Log::info('Starting file mapping process', [
                'filename' => $filename,
                'document_type' => 'pembelian',
                'document_category' => $type,
                'header_row' => $headerRow
            ]);

            $mappingResult = $this->mappedFileService->mapUploadedFile(
                filename: $filename,
                documentType: 'pembelian',
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
                    'document_type' => 'Pembelian',
                    'document_category' => ucfirst(strtolower($type)),
                    'mapped_records' => $mappingResult['mapped_records'],
                    'skipped_rows' => $mappingResult['skipped_rows'],
                    'failed_rows' => $mappingResult['failed_rows']
                ]
            );

            // Step 2: Proceed with validation (no existing validation ID for sync)
            $result = $this->validationService->validateDocument(
                filename: $filename,
                documentType: 'pembelian',
                documentCategory: $type,
                headerRow: $headerRow,
                userId: $userId,
                existingValidationId: null
            );

            // Include mapping info in response
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
                    'document_type' => 'Pembelian',
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

        ActivityLogger::log(
            action: 'Validasi File Async Dimulai',
            description: "Memulai validasi async file {$filename} untuk dokumen Pembelian {$type}",
            entityType: 'Validation',
            entityId: null,
            metadata: [
                'filename' => $filename,
                'document_type' => 'Pembelian',
                'document_category' => ucfirst(strtolower($type)),
                'header_row' => $headerRow,
                'async' => true,
            ]
        );

        try {
            // Create a placeholder validation record
            $validation = Validation::create([
                'file_name' => $filename,
                'role' => auth()->user()?->role ?? 'unknown',
                'user_id' => $userId,
                'document_type' => 'pembelian',
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

            // Dispatch the job
            ProcessFileValidation::dispatch(
                filename: $filename,
                documentType: 'pembelian',
                documentCategory: $type,
                headerRow: $headerRow,
                userId: $userId,
                validationId: $validation->id
            );

            Log::info('File validation job dispatched', [
                'validation_id' => $validation->id,
                'filename' => $filename,
                'document_type' => 'pembelian',
                'document_category' => $type
            ]);

            return response()->json([
                'status' => 'processing',
                'message' => 'File validation has been queued for processing',
                'validation_id' => $validation->id,
                'check_status_url' => route('pembelian.validation.status', ['id' => $validation->id])
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
                    'document_type' => 'Pembelian',
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
            return Inertia::render('pembelian/show', [
                'validationId' => $id,
                'validationData' => null,
                'error' => 'Validation data not found',
            ]);
        }

        return Inertia::render('pembelian/show', [
            'validationId' => $id,
            'validationData' => $validationData,
        ]);
    }

}
