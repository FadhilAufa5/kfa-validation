<?php

namespace App\Http\Controllers\Validation;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Services\ValidationDataService;
use App\Services\DocumentComparisonService;

class ValidationDataController extends Controller
{
    public function __construct(
        private ValidationDataService $validationDataService,
        private DocumentComparisonService $documentComparisonService
    ) {}

    public function getValidationStatus($id, $documentType)
    {
        try {
            $routeName = $documentType . '.show';
            $response = $this->validationDataService->getValidationStatus($id, $routeName);

            if (!$response) {
                return response()->json(['error' => 'Validation not found'], 404);
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

    public function getChartData($id)
    {
        try {
            $data = $this->validationDataService->getChartData($id);
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getAllInvalidGroups($id)
    {
        try {
            $data = $this->validationDataService->getAllInvalidGroups($id);
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    public function getAllMatchedGroups($id)
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

    public function getValidationHistory(Request $request, $documentType)
    {
        $filters = [
            'search' => $request->input('search', ''),
            'status' => $request->input('status', 'All'),
            'page' => $request->input('page', 1),
            'per_page' => $request->input('per_page', 10),
            'document_type' => $documentType,
        ];

        $data = $this->validationDataService->getValidationHistory($filters);
        return response()->json($data);
    }

    public function checkProcessingStatus(Request $request, $documentType)
    {
        $processingIds = $request->input('ids', []);
        $updates = $this->validationDataService->getProcessingStatus($processingIds, $documentType);
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
                documentType: $validation->document_type,
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
