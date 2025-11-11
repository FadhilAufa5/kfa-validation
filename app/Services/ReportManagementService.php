<?php

namespace App\Services;

use App\Models\ValidationReport;
use Illuminate\Pagination\LengthAwarePaginator;

class ReportManagementService
{
    /**
     * Get paginated accepted reports with filters
     */
    public function getAcceptedReports(array $filters): LengthAwarePaginator
    {
        $query = ValidationReport::with(['reporter', 'reviewer', 'validation'])
            ->where('status', 'accepted')
            ->orderBy('reviewed_at', 'desc');

        // Apply filters
        $this->applySearchFilter($query, $filters['search'] ?? null);
        $this->applyDateRangeFilter($query, $filters['date_from'] ?? null, $filters['date_to'] ?? null);
        $this->applyReportTypeFilter($query, $filters['report_type'] ?? null);

        $perPage = $filters['per_page'] ?? 10;

        return $query->paginate($perPage);
    }

    /**
     * Get paginated reports of all statuses with filters
     */
    public function getAllReports(array $filters): LengthAwarePaginator
    {
        $query = ValidationReport::with(['reporter', 'reviewer', 'validation'])
            ->orderBy('created_at', 'desc');

        // Apply filters
        $this->applySearchFilter($query, $filters['search'] ?? null);
        $this->applyStatusFilter($query, $filters['status'] ?? null);

        $perPage = $filters['per_page'] ?? 10;

        return $query->paginate($perPage);
    }

    /**
     * Transform report model to array for API response
     */
    public function transformAcceptedReport(ValidationReport $report): array
    {
        // Handle case where validation might be deleted (for old reports)
        $validation = $report->validation;
        
        return [
            'id' => $report->id,
            'validation_id' => $report->validation_id,
            'file_name' => $validation ? $validation->file_name : 'Deleted',
            'document_type' => $validation ? $validation->document_type : 'N/A',
            'document_category' => $validation ? $validation->document_category : 'N/A',
            'report_type' => $report->report_type,
            'report_message' => $report->report_message,
            'reported_by' => $report->reporter->name ?? 'Unknown',
            'reported_at' => $report->created_at->format('Y-m-d H:i'),
            'reviewed_by' => $report->reviewer->name ?? 'Unknown',
            'reviewed_at' => $report->reviewed_at ? $report->reviewed_at->format('Y-m-d H:i') : null,
            'review_notes' => $report->review_notes,
        ];
    }

    /**
     * Transform report model to array for all reports API response
     */
    public function transformReport(ValidationReport $report): array
    {
        return [
            'id' => $report->id,
            'validation_id' => $report->validation_id,
            'file_name' => $report->validation->file_name ?? 'Deleted',
            'document_type' => $report->validation->document_type ?? 'N/A',
            'report_type' => $report->report_type,
            'report_message' => $report->report_message,
            'reported_by' => $report->reporter->name ?? 'Unknown',
            'reported_at' => $report->created_at->format('Y-m-d H:i'),
            'status' => $report->status,
            'reviewed_by' => $report->reviewer->name ?? null,
            'reviewed_at' => $report->reviewed_at ? $report->reviewed_at->format('Y-m-d H:i') : null,
        ];
    }

    /**
     * Format pagination data for API response
     */
    public function formatPaginationData(LengthAwarePaginator $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
        ];
    }

    /**
     * Apply search filter to query
     */
    private function applySearchFilter($query, ?string $search): void
    {
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('validation', function ($vq) use ($search) {
                    $vq->where('file_name', 'LIKE', "%{$search}%");
                })
                ->orWhereHas('reporter', function ($uq) use ($search) {
                    $uq->where('name', 'LIKE', "%{$search}%");
                })
                ->orWhereHas('reviewer', function ($uq) use ($search) {
                    $uq->where('name', 'LIKE', "%{$search}%");
                })
                ->orWhere('report_message', 'LIKE', "%{$search}%");
            });
        }
    }

    /**
     * Apply date range filter to query
     */
    private function applyDateRangeFilter($query, ?string $dateFrom, ?string $dateTo): void
    {
        if ($dateFrom) {
            $query->whereDate('reviewed_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('reviewed_at', '<=', $dateTo);
        }
    }

    /**
     * Apply report type filter to query
     */
    private function applyReportTypeFilter($query, ?string $reportType): void
    {
        if ($reportType && $reportType !== 'all') {
            $query->where('report_type', $reportType);
        }
    }

    /**
     * Apply status filter to query
     */
    private function applyStatusFilter($query, ?string $status): void
    {
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
    }
}
