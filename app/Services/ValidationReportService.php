<?php

namespace App\Services;

use App\Models\Validation;
use App\Models\ValidationReport;
use App\Services\ActivityLogger;
use Illuminate\Support\Facades\Log;

class ValidationReportService
{
    /**
     * Submit a new report for a validation
     */
    public function submitReport(int $validationId, string $reportType, ?string $reportMessage, int $userId): array
    {
        $validation = Validation::findOrFail($validationId);

        // Check if already reported
        $existingReport = ValidationReport::where('validation_id', $validationId)
            ->where('status', 'pending')
            ->first();

        if ($existingReport) {
            throw new \Exception('This validation has already been reported');
        }

        $report = ValidationReport::create([
            'validation_id' => $validationId,
            'reported_by' => $userId,
            'report_type' => $reportType,
            'report_message' => $reportMessage,
            'status' => 'pending',
        ]);

        // Log activity
        ActivityLogger::log(
            action: 'Laporan Validasi Dibuat',
            description: "User melaporkan validasi {$validation->file_name} dengan alasan: " . 
                ($reportType === 'custom' ? $reportMessage : $reportType),
            entityType: 'ValidationReport',
            entityId: $report->id,
            metadata: [
                'validation_id' => $validationId,
                'report_type' => $reportType,
                'file_name' => $validation->file_name,
            ]
        );

        return [
            'success' => true,
            'report' => $report->load(['reporter', 'reviewer']),
        ];
    }

    /**
     * Get report by validation ID
     */
    public function getReportByValidationId(int $validationId): ?ValidationReport
    {
        return ValidationReport::with(['reporter', 'reviewer'])
            ->where('validation_id', $validationId)
            ->latest()
            ->first();
    }

    /**
     * Get report by report ID
     */
    public function getReportById(int $reportId): ?ValidationReport
    {
        return ValidationReport::with(['reporter', 'reviewer', 'validation'])
            ->findOrFail($reportId);
    }

    /**
     * Accept a report (change status to accepted)
     */
    public function acceptReport(int $reportId, int $reviewerId, ?string $reviewNotes): array
    {
        $report = ValidationReport::findOrFail($reportId);
        $validation = $report->validation;

        if (!$validation) {
            throw new \Exception('Validation not found');
        }

        // Update report status
        $report->update([
            'status' => 'accepted',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'review_notes' => $reviewNotes,
        ]);

        // Log activity
        ActivityLogger::log(
            action: 'Laporan Diterima',
            description: "Super admin menerima laporan untuk {$validation->file_name}",
            entityType: 'ValidationReport',
            entityId: $report->id,
            metadata: [
                'validation_id' => $validation->id,
                'file_name' => $validation->file_name,
                'report_type' => $report->report_type,
            ]
        );

        return ['success' => true];
    }

    /**
     * Revoke a report (decline it)
     */
    public function revokeReport(int $reportId, int $reviewerId, ?string $reviewNotes): array
    {
        $report = ValidationReport::findOrFail($reportId);
        $validation = $report->validation;

        if (!$validation) {
            throw new \Exception('Validation not found');
        }

        // Update report status
        $report->update([
            'status' => 'revoked',
            'reviewed_by' => $reviewerId,
            'reviewed_at' => now(),
            'review_notes' => $reviewNotes,
        ]);

        // Log activity
        ActivityLogger::log(
            action: 'Laporan Ditolak',
            description: "Super admin menolak laporan untuk {$validation->file_name}",
            entityType: 'ValidationReport',
            entityId: $report->id,
            metadata: [
                'validation_id' => $validation->id,
                'file_name' => $validation->file_name,
            ]
        );

        return ['success' => true];
    }

    /**
     * Check if user is authorized to review reports (Super Admin only)
     */
    public function canReviewReports(string $userRole): bool
    {
        return $userRole === 'super_admin';
    }
}
