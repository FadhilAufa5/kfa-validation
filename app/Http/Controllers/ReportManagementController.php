<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Services\ReportManagementService;
use App\Services\ValidationReportService;

class ReportManagementController extends Controller
{
    public function __construct(
        private ReportManagementService $reportManagementService,
        private ValidationReportService $reportService
    ) {
    }

    public function index()
    {
        return Inertia::render('report-management/index');
    }

    public function getAcceptedReports(Request $request)
    {
        $filters = [
            'search' => $request->input('search'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'report_type' => $request->input('report_type'),
            'per_page' => $request->input('per_page', 10),
        ];

        $reports = $this->reportManagementService->getAcceptedReports($filters);

        $data = $reports->getCollection()->map(function ($report) {
            return $this->reportManagementService->transformAcceptedReport($report);
        });

        return response()->json([
            'data' => $data,
            'pagination' => $this->reportManagementService->formatPaginationData($reports),
        ]);
    }

    public function getAllReports(Request $request)
    {
        $filters = [
            'search' => $request->input('search'),
            'status' => $request->input('status'),
            'per_page' => $request->input('per_page', 10),
        ];

        $reports = $this->reportManagementService->getAllReports($filters);

        $data = $reports->getCollection()->map(function ($report) {
            return $this->reportManagementService->transformReport($report);
        });

        return response()->json([
            'data' => $data,
            'pagination' => $this->reportManagementService->formatPaginationData($reports),
        ]);
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
