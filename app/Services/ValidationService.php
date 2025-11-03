<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Validation;

class ValidationService
{
    private const TOLERANCE = 1000.01;

    public function __construct(
        private FileProcessingService $fileProcessingService
    ) {}

    public function validateDocument(
        string $filename,
        string $documentType,
        string $documentCategory,
        int $headerRow = 1,
        ?int $userId = null
    ): array {
        $startTime = microtime(true);

        Log::info('Starting validation process', [
            'type' => $documentCategory,
            'documentType' => $documentType,
            'filename' => $filename
        ]);

        $config = $this->getValidationConfig($documentType, $documentCategory);
        $validationRecords = $this->loadValidationData($config);
        $uploadedData = $this->fileProcessingService->readFileData($filename, $headerRow);

        $this->validateRequiredColumns($uploadedData['headers'], $config);

        $validationMap = $this->buildValidationMap($validationRecords, $config);
        $uploadedMapByGroup = $this->buildUploadedMap($uploadedData['data'], $config);

        [$invalidGroups, $matchedGroups] = $this->compareData($uploadedMapByGroup, $validationMap);
        [$invalidRows, $matchedRows, $mismatchedRecordCount] = $this->categorizeRows(
            $uploadedData['data'],
            $invalidGroups,
            $validationMap,
            $uploadedMapByGroup,
            $config
        );

        $executionTime = microtime(true) - $startTime;

        Log::info('Validation completed', [
            'invalidGroupCount' => count($invalidGroups),
            'invalidRowCount' => $mismatchedRecordCount,
            'executionTime' => $executionTime,
            'status' => $mismatchedRecordCount > 0 ? 'invalid' : 'valid'
        ]);

        $validationRecord = $this->saveValidationResult(
            $filename,
            $documentType,
            $documentCategory,
            count($uploadedData['data']),
            $mismatchedRecordCount,
            $invalidGroups,
            $invalidRows,
            $matchedGroups,
            $matchedRows,
            $userId
        );

        ActivityLogger::log(
            action: 'Validasi File Selesai',
            description: "Validasi file {$filename} selesai dengan status " . ($validationRecord->mismatched_records > 0 ? 'invalid' : 'valid') . " (Score: {$validationRecord->score}%)",
            entityType: 'Validation',
            entityId: (string) $validationRecord->id,
            metadata: [
                'validation_id' => $validationRecord->id,
                'filename' => $filename,
                'document_type' => $documentType,
                'document_category' => $documentCategory,
                'status' => $validationRecord->mismatched_records > 0 ? 'invalid' : 'valid',
                'score' => $validationRecord->score,
                'total_records' => $validationRecord->total_records,
                'matched_records' => $validationRecord->matched_records,
                'mismatched_records' => $validationRecord->mismatched_records,
                'invalid_groups_count' => count($invalidGroups),
                'execution_time' => round($executionTime, 2),
            ]
        );

        return [
            'status' => count($invalidGroups) > 0 ? 'invalid' : 'valid',
            'invalid_groups' => $invalidGroups,
            'invalid_rows' => $invalidRows,
            'validation_id' => $validationRecord->id,
        ];
    }

    private function getValidationConfig(string $documentType, string $documentCategory): array
    {
        $configKey = strtolower($documentType) . '.' . strtolower($documentCategory);
        $config = Config::get('document_validation.' . $configKey);

        if (!$config) {
            throw new \Exception('Tipe dokumen tidak valid.');
        }

        if (count($config['connector'] ?? []) < 2) {
            throw new \Exception('Konfigurasi connector tidak lengkap.');
        }

        return $config;
    }

    private function loadValidationData(array $config): array
    {
        try {
            $validationDoc = $config['doc_val'];
            $validationConnector = $config['connector'][1];
            $validationSum = $config['sum'][1] ?? null;

            $records = DB::table($validationDoc)
                ->select([$validationConnector, $validationSum])
                ->get()
                ->map(function ($record) use ($validationConnector, $validationSum) {
                    return [
                        $validationConnector => trim($record->{$validationConnector} ?? ''),
                        $validationSum => floatval($record->{$validationSum} ?? 0)
                    ];
                })
                ->toArray();

            Log::info('Validation data loaded from database', [
                'recordCount' => count($records),
                'table' => $validationDoc
            ]);

            if (empty($records)) {
                throw new \Exception("Tidak ada data validasi dalam tabel {$validationDoc}.");
            }

            return $records;
        } catch (\Exception $e) {
            Log::error('Failed to load validation data', [
                'table' => $config['doc_val'],
                'error' => $e->getMessage()
            ]);
            throw new \Exception('Gagal memuat data validasi dari database.');
        }
    }

    private function validateRequiredColumns(array $headers, array $config): void
    {
        $uploadedConnector = $config['connector'][0];
        $uploadedSum = $config['sum'][0] ?? null;

        if (!in_array($uploadedConnector, $headers)) {
            throw new \Exception("Kolom '{$uploadedConnector}' tidak ditemukan dalam file upload.");
        }

        if ($uploadedSum && !in_array($uploadedSum, $headers)) {
            throw new \Exception("Kolom '{$uploadedSum}' tidak ditemukan dalam file upload.");
        }
    }

    private function buildValidationMap(array $validationRecords, array $config): array
    {
        $validationConnector = $config['connector'][1];
        $validationSum = $config['sum'][1];
        $map = [];

        foreach ($validationRecords as $record) {
            $key = trim($record[$validationConnector] ?? '');
            if ($key === '') continue;

            $value = $this->cleanAndParseFloat($record[$validationSum] ?? 0);
            $map[$key] = ($map[$key] ?? 0) + $value;
        }

        return $map;
    }

    private function buildUploadedMap(array $data, array $config): array
    {
        $uploadedConnector = $config['connector'][0];
        $uploadedSum = $config['sum'][0];
        $map = [];

        foreach ($data as $row) {
            $key = trim($row[$uploadedConnector] ?? '');
            if ($key === '') continue;

            $value = $this->cleanAndParseFloat($row[$uploadedSum] ?? 0);
            $map[$key] = ($map[$key] ?? 0) + $value;
        }

        return $map;
    }

    private function compareData(array $uploadedMapByGroup, array $validationMap): array
    {
        $invalidGroups = [];
        $matchedGroups = [];

        foreach ($uploadedMapByGroup as $key => $uploadedValue) {
            $validationValue = $validationMap[$key] ?? null;

            if ($validationValue === null) {
                if ($uploadedValue == 0) {
                    $matchedGroups[$key] = [
                        'uploaded_total' => $uploadedValue,
                        'source_total' => 0,
                        'difference' => 0,
                        'note' => 'Retur Doesn\'t Record'
                    ];
                } else {
                    $invalidGroups[$key] = [
                        'discrepancy_category' => 'im_invalid',
                        'error' => 'Key not found in validation data',
                        'uploaded_total' => $uploadedValue,
                        'source_total' => 0,
                        'discrepancy_value' => $uploadedValue
                    ];
                }
            } else {
                if ($uploadedValue == 0 || $validationValue == 0) {
                    $invalidGroups[$key] = [
                        'discrepancy_category' => 'missing',
                        'error' => 'Key exists in both files but one has missing or zero value',
                        'uploaded_total' => $uploadedValue,
                        'source_total' => $validationValue,
                        'discrepancy_value' => $uploadedValue - $validationValue
                    ];
                } else {
                    $difference = $uploadedValue - $validationValue;
                    if (abs($difference) <= self::TOLERANCE) {
                        $note = ($difference == 0) ? 'Sum Matched' : 'Pembulatan';
                        $matchedGroups[$key] = [
                            'uploaded_total' => $uploadedValue,
                            'source_total' => $validationValue,
                            'difference' => $difference,
                            'note' => $note
                        ];
                    } else {
                        $invalidGroups[$key] = [
                            'discrepancy_category' => 'discrepancy',
                            'error' => 'Total mismatch between uploaded and source data beyond tolerance',
                            'uploaded_total' => $uploadedValue,
                            'source_total' => $validationValue,
                            'discrepancy_value' => $difference
                        ];
                    }
                }
            }
        }

        return [$invalidGroups, $matchedGroups];
    }

    private function categorizeRows(
        array $data,
        array $invalidGroups,
        array $validationMap,
        array $uploadedMapByGroup,
        array $config
    ): array {
        $invalidRows = [];
        $matchedRows = [];
        $mismatchedRecordCount = 0;

        $uploadedConnector = $config['connector'][0];
        $uploadedSum = $config['sum'][0];

        foreach ($data as $index => $row) {
            $key = trim($row[$uploadedConnector] ?? '');
            if ($key === '') continue;

            $validationValue = $validationMap[$key] ?? null;
            $uploadedValue = $this->cleanAndParseFloat($row[$uploadedSum] ?? 0);
            $groupUploadedValue = $uploadedMapByGroup[$key] ?? 0;

            $isMatched = false;
            $isIgnoredZero = false;

            if ($validationValue === null) {
                if ($groupUploadedValue == 0) {
                    $isIgnoredZero = true;
                    $matchedRows[] = [
                        'row_index' => $index,
                        'key_value' => $key,
                        'validation_source_total' => $validationValue,
                        'uploaded_total' => $uploadedValue,
                    ];
                } else {
                    $isMatched = false;
                }
            } else {
                $diff = abs($groupUploadedValue - $validationValue);
                $isMatched = $diff <= self::TOLERANCE;
            }

            if (!$isMatched && !$isIgnoredZero && isset($invalidGroups[$key])) {
                $error = $invalidGroups[$key]['error'];
                $invalidRows[] = [
                    'row_index' => $index,
                    'key_value' => $key,
                    'error' => $error
                ];
                $mismatchedRecordCount++;
            } else if ($isMatched && !$isIgnoredZero) {
                $matchedRows[] = [
                    'row_index' => $index,
                    'key_value' => $key,
                    'validation_source_total' => $validationValue,
                    'uploaded_total' => $uploadedValue,
                ];
            }
        }

        return [$invalidRows, $matchedRows, $mismatchedRecordCount];
    }

    private function saveValidationResult(
        string $filename,
        string $documentType,
        string $documentCategory,
        int $totalRecords,
        int $mismatchedRecords,
        array $invalidGroups,
        array $invalidRows,
        array $matchedGroups,
        array $matchedRows,
        ?int $userId
    ): Validation {
        $matchedRecords = $totalRecords - $mismatchedRecords;
        $score = $totalRecords > 0 ? round(($matchedRecords / $totalRecords) * 100, 2) : 100.00;

        // Use database transaction to ensure data integrity
        return DB::transaction(function () use (
            $filename,
            $documentType,
            $documentCategory,
            $score,
            $totalRecords,
            $matchedRecords,
            $mismatchedRecords,
            $invalidGroups,
            $invalidRows,
            $matchedGroups,
            $matchedRows,
            $userId
        ) {
            // Create the main validation record
            $validation = Validation::create([
                'file_name' => $filename,
                'role' => auth()->user()?->role ?? 'unknown',
                'user_id' => $userId ?? auth()->user()?->id ?? null,
                'document_type' => $documentType,
                'document_category' => ucfirst(strtolower($documentCategory)),
                'score' => $score,
                'total_records' => $totalRecords,
                'matched_records' => $matchedRecords,
                'mismatched_records' => $mismatchedRecords,
                // Keep validation_details for backward compatibility with existing data
                'validation_details' => [
                    'invalid_groups' => $invalidGroups,
                    'invalid_rows' => $invalidRows,
                    'matched_groups' => $matchedGroups,
                    'matched_rows' => $matchedRows,
                ],
            ]);

            // Save invalid groups to separate table
            foreach ($invalidGroups as $key => $group) {
                $validation->invalidGroups()->create([
                    'key_value' => $key,
                    'discrepancy_category' => $group['discrepancy_category'],
                    'error' => $group['error'],
                    'uploaded_total' => $group['uploaded_total'],
                    'source_total' => $group['source_total'],
                    'discrepancy_value' => $group['discrepancy_value'],
                ]);
            }

            // Save invalid rows to separate table
            foreach ($invalidRows as $row) {
                $validation->invalidRows()->create([
                    'row_index' => $row['row_index'],
                    'key_value' => $row['key_value'],
                    'error' => $row['error'],
                ]);
            }

            // Save matched groups to separate table
            foreach ($matchedGroups as $key => $group) {
                $validation->matchedGroups()->create([
                    'key_value' => $key,
                    'uploaded_total' => $group['uploaded_total'],
                    'source_total' => $group['source_total'],
                    'difference' => $group['difference'],
                    'note' => $group['note'],
                ]);
            }

            // Save matched rows to separate table
            foreach ($matchedRows as $row) {
                $validation->matchedRows()->create([
                    'row_index' => $row['row_index'],
                    'key_value' => $row['key_value'],
                    'validation_source_total' => $row['validation_source_total'],
                    'uploaded_total' => $row['uploaded_total'],
                ]);
            }

            return $validation;
        });
    }

    private function cleanAndParseFloat($value): float
    {
        if (!is_string($value)) {
            return is_numeric($value) ? (float) $value : 0.0;
        }
        return (float) preg_replace('/[^\d.-]/', '', $value);
    }
}
