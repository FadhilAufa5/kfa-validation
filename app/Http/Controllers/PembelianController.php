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

class PembelianController extends Controller
{
    public function __construct(
        private FileProcessingService $fileProcessingService,
        private ValidationService $validationService,
        private DocumentComparisonService $documentComparisonService,
        private ValidationDataService $validationDataService
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
        ]);

        ActivityLogger::log(
            action: 'Validasi File Dimulai',
            description: "Memulai validasi file {$request->input('filename')} untuk dokumen Pembelian {$type}",
            entityType: 'Validation',
            entityId: null,
            metadata: [
                'filename' => $request->input('filename'),
                'document_type' => 'Pembelian',
                'document_category' => ucfirst(strtolower($type)),
                'header_row' => $request->input('headerRow', 1),
            ]
        );

        try {
            $result = $this->validationService->validateDocument(
                filename: $request->input('filename'),
                documentType: 'pembelian',
                documentCategory: $type,
                headerRow: (int) $request->input('headerRow', 1),
                userId: auth()->user()?->id
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Validation failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 400);
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
            'document_type' => 'pembelian',
        ];

        $data = $this->validationDataService->getValidationHistory($filters);
        return response()->json($data);
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
                documentType: 'pembelian',
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
}
