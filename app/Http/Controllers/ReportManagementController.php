<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\ReportManagementService;

class ReportManagementController extends Controller
{
    public function __construct(
        private ReportManagementService $reportManagementService
    ) {}

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
}
