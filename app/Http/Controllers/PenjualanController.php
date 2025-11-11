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

class PenjualanController extends Controller
{
    public function __construct(
        private FileProcessingService $fileProcessingService,
        private ValidationService $validationService,
        private DocumentComparisonService $documentComparisonService,
        private ValidationDataService $validationDataService,
        private MappedFileService $mappedFileService,
        private ValidationReportService $reportService
    ) {
    }

    public function index()
    {
        return Inertia::render('penjualan/index');
    }

    public function history()
    {
        return Inertia::render('penjualan/history');
    }

    public function reguler()
    {
        return Inertia::render('penjualan/upload', [
            'document_type' => 'penjualan',
            'document_category' => 'Reguler',
        ]);
    }

    public function ecommerce()
    {
        return Inertia::render('penjualan/upload', [
            'document_type' => 'penjualan',
            'document_category' => 'ecommerce',
        ]);
    }

    public function debitur()
    {
        return Inertia::render('penjualan/upload', [
            'document_type' => 'penjualan',
            'document_category' => 'Debitur',
        ]);
    }

    public function konsi()
    {
        return Inertia::render('penjualan/upload', [
            'document_type' => 'penjualan',
            'document_category' => 'Konsi',
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
        $async = $request->input('async', true); // Default to async

        // If async is requested, use the async method
        if ($async) {
            return $this->validateFileAsync($request, $type);
        }

        // Otherwise, process synchronously (original logic)
        ActivityLogger::log(
            action: 'Validasi File Dimulai',
            description: "Memulai validasi file {$filename} untuk dokumen Penjualan {$type}",
            entityType: 'Validation',
            entityId: null,
            metadata: [
                'filename' => $filename,
                'document_type' => 'Penjualan',
                'document_category' => ucfirst(strtolower($type)),
                'header_row' => $headerRow,
            ]
        );

        try {
            // Step 1: Map uploaded file data to database
            Log::info('Starting file mapping process', [
                'filename' => $filename,
                'document_type' => 'penjualan',
                'document_category' => $type,
                'header_row' => $headerRow
            ]);

            $mappingResult = $this->mappedFileService->mapUploadedFile(
                filename: $filename,
                documentType: 'penjualan',
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
                    'document_type' => 'Penjualan',
                    'document_category' => ucfirst(strtolower($type)),
                    'mapped_records' => $mappingResult['mapped_records'],
                    'skipped_rows' => $mappingResult['skipped_rows'],
                    'failed_rows' => $mappingResult['failed_rows']
                ]
            );

            // Step 2: Proceed with validation (no existing validation ID for sync)
            $result = $this->validationService->validateDocument(
                filename: $filename,
                documentType: 'penjualan',
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
                    'document_type' => 'Penjualan',
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
            description: "Memulai validasi async file {$filename} untuk dokumen Penjualan {$type}",
            entityType: 'Validation',
            entityId: null,
            metadata: [
                'filename' => $filename,
                'document_type' => 'Penjualan',
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
                'document_type' => 'penjualan',
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
                documentType: 'penjualan',
                documentCategory: $type,
                headerRow: $headerRow,
                userId: $userId,
                validationId: $validation->id
            );

            Log::info('File validation job dispatched', [
                'validation_id' => $validation->id,
                'filename' => $filename,
                'document_type' => 'penjualan',
                'document_category' => $type
            ]);

            return response()->json([
                'status' => 'processing',
                'message' => 'File validation has been queued for processing',
                'validation_id' => $validation->id,
                'check_status_url' => route('penjualan.validation.status', ['id' => $validation->id])
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
                    'document_type' => 'Penjualan',
                    'document_category' => ucfirst(strtolower($type)),
                    'error' => $e->getMessage()
                ]
            );

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getValidationStatus($id)
    {
        try {
            $validation = Validation::find($id);

            if (!$validation) {
                return response()->json(['error' => 'Validation not found'], 404);
            }

            $response = [
                'validation_id' => $validation->id,
                'status' => $validation->status,
                'file_name' => $validation->file_name,
                'document_type' => $validation->document_type,
                'document_category' => $validation->document_category,
                'processing_details' => $validation->processing_details,
            ];

            // If completed, include full results
            if ($validation->status === 'completed') {
                $response['score'] = $validation->score;
                $response['total_records'] = $validation->total_records;
                $response['matched_records'] = $validation->matched_records;
                $response['mismatched_records'] = $validation->mismatched_records;
                $response['view_url'] = route('penjualan.show', ['id' => $validation->id]);
            }

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Failed to get validation status', [
                'validation_id' => $id,
                'error' => $e->getMessage()
            ]);
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
            return Inertia::render('penjualan/show', [
                'validationId' => $id,
                'validationData' => null,
                'error' => 'Validation data not found',
            ]);
        }

        return Inertia::render('penjualan/show', [
            'validationId' => $id,
            'validationData' => $validationData,
        ]);
    }

    public function getAllInvalidGroups($id, Request $request)
    {
        try {
            $data = $this->validationDataService->getAllInvalidGroups($id);
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    public function getAllMatchedGroups($id, Request $request)
    {
        try {
            $data = $this->validationDataService->getAllMatchedGroups($id);
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    public function getInvalidGroups($id, Request $request)
    {
        try {
            $filters = [
                'search' => $request->input('search', ''),
                'category' => $request->input('category', ''),
                'source' => $request->input('source', ''),
                'sort_key' => $request->input('sort_key', 'key'),
                'sort_direction' => $request->input('sort_direction', 'asc'),
                'page' => $request->input('page', 1),
                'per_page' => $request->input('per_page', 10),
            ];

            $data = $this->validationDataService->getInvalidGroupsPaginated($id, $filters);
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    public function getMatchedRecords($id, Request $request)
    {
        try {
            $filters = [
                'search' => $request->input('search', ''),
                'note' => $request->input('note', ''),
                'sort_key' => $request->input('sort_key', 'row_index'),
                'sort_direction' => $request->input('sort_direction', 'asc'),
                'page' => $request->input('page', 1),
                'per_page' => $request->input('per_page', 10),
            ];

            $data = $this->validationDataService->getMatchedRecordsPaginated($id, $filters);
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    public function getValidationHistory(Request $request)
    {
        $filters = [
            'search' => $request->input('search', ''),
            'status' => $request->input('status', 'All'),
            'page' => $request->input('page', 1),
            'per_page' => $request->input('per_page', 10),
            'document_type' => 'penjualan',
        ];

        $data = $this->validationDataService->getValidationHistory($filters);
        return response()->json($data);
    }

    public function checkProcessingStatus(Request $request)
    {
        $processingIds = $request->input('ids', []);
        
        if (empty($processingIds)) {
            return response()->json([]);
        }

        // Only query the specific processing jobs, not the entire table
        $updates = \App\Models\Validation::whereIn('id', $processingIds)
            ->where('document_type', 'penjualan')
            ->select('id', 'status', 'score', 'matched_records', 'mismatched_records')
            ->get()
            ->map(function ($validation) {
                // Determine display status based on validation status field
                $displayStatus = 'Valid';
                if ($validation->status === 'processing') {
                    $displayStatus = 'Processing';
                } elseif ($validation->status === 'failed') {
                    $displayStatus = 'Failed';
                } elseif ($validation->mismatched_records > 0) {
                    $displayStatus = 'Invalid';
                }

                return [
                    'id' => $validation->id,
                    'status' => $displayStatus,
                    'score' => number_format($validation->score, 2) . '%',
                    'processing_status' => $validation->status,
                ];
            });

        return response()->json($updates);
    }

    public function getDocumentComparisonData($id, Request $request)
    {
        $validation = \App\Models\Validation::find($id);

        if (!$validation) {
            return response()->json(['error' => 'Validation data not found'], 404);
        }

        $key = $request->input('key');
        $type = $request->input('type');
        $headerRow = $request->input('header_row', 1);

        if (!$key || !$type) {
            return response()->json(['error' => 'Missing required parameters'], 400);
        }

        try {
            $data = $this->documentComparisonService->getComparisonData(
                documentType: 'penjualan',
                documentCategory: $validation->document_category,
                filename: $validation->file_name,
                key: $key,
                type: $type,
                headerRow: $headerRow
            );

            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Document comparison failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function submitReport(Request $request, $id)
    {
        $request->validate([
            'report_type' => 'required|in:custom,wrong_document_type,dirty_data',
            'report_message' => 'nullable|string|max:1000',
        ]);

        try {
            $result = $this->reportService->submitReport(
                validationId: $id,
                reportType: $request->report_type,
                reportMessage: $request->report_message,
                userId: auth()->id()
            );

            return response()->json($result, 201);
        } catch (\Exception $e) {
            Log::error('Report submission failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getReport($id)
    {
        try {
            $report = $this->reportService->getReportByValidationId($id);

            if (!$report) {
                return response()->json(['error' => 'Report not found'], 404);
            }

            return response()->json($report);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function acceptReport(Request $request, $id)
    {
        try {
            // Only super admin can accept reports
            if (!$this->reportService->canReviewReports(auth()->user()->role)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $result = $this->reportService->acceptReport(
                reportId: $id,
                reviewerId: auth()->id(),
                reviewNotes: $request->input('review_notes')
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Accept report failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function revokeReport(Request $request, $id)
    {
        try {
            // Only super admin can revoke reports
            if (!$this->reportService->canReviewReports(auth()->user()->role)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $result = $this->reportService->revokeReport(
                reportId: $id,
                reviewerId: auth()->id(),
                reviewNotes: $request->input('review_notes')
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Revoke report failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
