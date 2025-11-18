<?php

namespace App\Services;

use App\Models\Validation;
use Illuminate\Support\Facades\Log;

class ExportService
{
    public function exportInvalidData(int $validationId): array
    {
        $validation = Validation::find($validationId);

        if (!$validation) {
            throw new \Exception('Validation data not found');
        }

        $csvData = [];
        $csvData[] = [
            'Key',
            'Kategori Kesalahan',
            'Error',
            'Total Upload',
            'Total Sumber',
            'Selisih',
            'Sumber Label',
        ];

        // Try to get from database first
        if ($validation->invalidGroups()->exists()) {
            $invalidGroups = $validation->invalidGroups()
                ->orderBy('key_value', 'asc')
                ->get();

            foreach ($invalidGroups as $group) {
                $sourceLabel = $this->determineSourceLabelFromModel($group);
                
                $csvData[] = [
                    $group->key_value,
                    $group->discrepancy_category,
                    $group->error,
                    $group->uploaded_total,
                    $group->source_total,
                    $group->discrepancy_value,
                    $sourceLabel,
                ];
            }
        } else {
            // Fallback to JSON data from validation_details
            $invalidGroups = $validation->validation_details['invalid_groups'] ?? [];
            
            if (empty($invalidGroups)) {
                throw new \Exception('No invalid data found to export');
            }

            foreach ($invalidGroups as $key => $group) {
                $sourceLabel = $this->determineSourceLabelFromArray($group);
                
                $csvData[] = [
                    $key,
                    $group['discrepancy_category'] ?? '',
                    $group['error'] ?? '',
                    $group['uploaded_total'] ?? 0,
                    $group['source_total'] ?? 0,
                    $group['discrepancy_value'] ?? 0,
                    $sourceLabel,
                ];
            }
        }

        if (count($csvData) <= 1) {
            throw new \Exception('No invalid data found to export');
        }

        $filename = $this->generateFilename($validation->file_name, 'invalid');

        return [
            'data' => $csvData,
            'filename' => $filename,
        ];
    }

    public function exportMatchedData(int $validationId): array
    {
        $validation = Validation::find($validationId);

        if (!$validation) {
            throw new \Exception('Validation data not found');
        }

        $csvData = [];
        $csvData[] = [
            'Row Index',
            'Key',
            'Total Upload',
            'Total Sumber',
            'Selisih',
            'Note',
        ];

        // Try to get from database first
        if ($validation->matchedGroups()->exists()) {
            $matchedGroups = $validation->matchedGroups()
                ->orderBy('key_value', 'asc')
                ->get();

            foreach ($matchedGroups as $group) {
                $csvData[] = [
                    $group->row_index,
                    $group->key_value,
                    $group->uploaded_total,
                    $group->source_total,
                    $group->difference,
                    $group->note,
                ];
            }
        } else {
            // Fallback to JSON data from validation_details
            $matchedGroups = $validation->validation_details['matched_groups'] ?? [];
            
            if (empty($matchedGroups)) {
                throw new \Exception('No matched data found to export');
            }

            foreach ($matchedGroups as $key => $group) {
                $csvData[] = [
                    $group['row_index'] ?? '',
                    $key,
                    $group['uploaded_total'] ?? 0,
                    $group['source_total'] ?? 0,
                    $group['difference'] ?? 0,
                    $group['note'] ?? '',
                ];
            }
        }

        if (count($csvData) <= 1) {
            throw new \Exception('No matched data found to export');
        }

        $filename = $this->generateFilename($validation->file_name, 'matched');

        return [
            'data' => $csvData,
            'filename' => $filename,
        ];
    }

    private function determineSourceLabelFromModel($group): string
    {
        if ($group->discrepancy_category === 'im_invalid') {
            return 'Tidak Ditemukan di Sumber';
        }

        if ($group->uploaded_total > $group->source_total && $group->discrepancy_value > 0) {
            return 'File Sumber';
        }

        if ($group->source_total > $group->uploaded_total && $group->discrepancy_value < 0) {
            return 'File Diupload';
        }

        return 'Tidak Diketahui';
    }

    private function determineSourceLabelFromArray(array $group): string
    {
        $category = $group['discrepancy_category'] ?? '';
        $uploadedTotal = $group['uploaded_total'] ?? 0;
        $sourceTotal = $group['source_total'] ?? 0;
        $discrepancyValue = $group['discrepancy_value'] ?? 0;

        if ($category === 'im_invalid') {
            return 'Tidak Ditemukan di Sumber';
        }

        if ($uploadedTotal > $sourceTotal && $discrepancyValue > 0) {
            return 'File Sumber';
        }

        if ($sourceTotal > $uploadedTotal && $discrepancyValue < 0) {
            return 'File Diupload';
        }

        return 'Tidak Diketahui';
    }

    private function generateFilename(string $originalFilename, string $type): string
    {
        $filename = pathinfo($originalFilename, PATHINFO_FILENAME);
        $timestamp = now()->format('YmdHis');
        
        return "{$filename}_{$type}_{$timestamp}.csv";
    }

    public function generateCsvResponse(array $csvData, string $filename)
    {
        $output = fopen('php://temp', 'r+');
        
        foreach ($csvData as $row) {
            fputcsv($output, $row);
        }
        
        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        return response($csvContent, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
