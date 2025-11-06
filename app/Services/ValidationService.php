<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Validation;
use App\Models\MappedUploadedFile;

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
        ?int $userId = null,
        ?int $existingValidationId = null
    ): array {
        $startTime = microtime(true);

        Log::info('Starting validation process', [
            'type' => $documentCategory,
            'documentType' => $documentType,
            'filename' => $filename,
            'existing_validation_id' => $existingValidationId
        ]);

        $config = $this->getValidationConfig($documentType, $documentCategory);
        
        // Get total record count efficiently
        $totalRecords = $this->getTotalRecordCount($filename, $documentType, $documentCategory);
        
        if ($totalRecords === 0) {
            throw new \Exception('No mapped data found for this file. Please ensure the file was properly mapped before validation.');
        }

        Log::info('Found mapped records', [
            'filename' => $filename,
            'total_records' => $totalRecords
        ]);

        // Build validation map from validation data source
        $validationRecords = $this->loadValidationData($config);
        $validationMap = $this->buildValidationMap($validationRecords, $config);

        // Use database aggregation to get uploaded data grouped by connector
        $uploadedMapByGroup = $this->buildUploadedMapFromDatabase($filename, $documentType, $documentCategory);

        // Compare aggregated data
        [$invalidGroups, $matchedGroups] = $this->compareData($uploadedMapByGroup, $validationMap);
        
        // Categorize rows using database queries instead of loading all into memory
        [$invalidRows, $matchedRows, $mismatchedRecordCount] = $this->categorizeRowsFromDatabase(
            $filename,
            $documentType,
            $documentCategory,
            $invalidGroups,
            $validationMap,
            $uploadedMapByGroup
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
            $totalRecords,
            $mismatchedRecordCount,
            $invalidGroups,
            $invalidRows,
            $matchedGroups,
            $matchedRows,
            $userId,
            $existingValidationId
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

    /**
     * Get total record count efficiently without loading all data
     */
    private function getTotalRecordCount(
        string $filename,
        string $documentType,
        string $documentCategory
    ): int {
        return MappedUploadedFile::byFilename($filename)
            ->byDocumentType($documentType)
            ->byDocumentCategory($documentCategory)
            ->count();
    }

    /**
     * Build uploaded data map using database aggregation (optimized for large datasets)
     * Groups by connector and sums the sum_field directly in database
     */
    private function buildUploadedMapFromDatabase(
        string $filename,
        string $documentType,
        string $documentCategory
    ): array {
        $results = DB::table('mapped_uploaded_files')
            ->select('connector', DB::raw('SUM(CAST(sum_field AS REAL)) as total'))
            ->where('filename', $filename)
            ->where('document_type', $documentType)
            ->where('document_category', $documentCategory)
            ->whereNotNull('connector')
            ->where('connector', '!=', '')
            ->groupBy('connector')
            ->get();

        $map = [];
        foreach ($results as $result) {
            $key = trim($result->connector);
            if ($key !== '') {
                $map[$key] = (float) $result->total;
            }
        }

        Log::info('Built uploaded map from database aggregation', [
            'unique_keys' => count($map),
            'aggregated_groups' => $results->count()
        ]);

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

    /**
     * Categorize rows using database queries (optimized for large datasets)
     * Uses database filtering instead of loading all records into PHP memory
     */
    private function categorizeRowsFromDatabase(
        string $filename,
        string $documentType,
        string $documentCategory,
        array $invalidGroups,
        array $validationMap,
        array $uploadedMapByGroup
    ): array {
        $invalidRows = [];
        $matchedRows = [];
        $mismatchedRecordCount = 0;

        // Get invalid row keys
        $invalidKeys = array_keys($invalidGroups);
        
        // Process invalid rows in batches if there are any
        if (!empty($invalidKeys)) {
            foreach (array_chunk($invalidKeys, 500) as $keyChunk) {
                $records = DB::table('mapped_uploaded_files')
                    ->select('row_index', 'connector', 'sum_field')
                    ->where('filename', $filename)
                    ->where('document_type', $documentType)
                    ->where('document_category', $documentCategory)
                    ->whereIn('connector', $keyChunk)
                    ->get();

                foreach ($records as $record) {
                    $key = trim($record->connector);
                    if (isset($invalidGroups[$key])) {
                        $invalidRows[] = [
                            'row_index' => $record->row_index,
                            'key_value' => $key,
                            'error' => $invalidGroups[$key]['error']
                        ];
                        $mismatchedRecordCount++;
                    }
                }
            }
        }

        // Get matched keys (excluding invalid ones)
        $matchedKeys = [];
        foreach ($uploadedMapByGroup as $key => $uploadedValue) {
            if (isset($invalidGroups[$key])) {
                continue; // Skip invalid keys
            }

            $validationValue = $validationMap[$key] ?? null;
            
            // Check if it's a matched key
            if ($validationValue === null && $uploadedValue == 0) {
                $matchedKeys[] = $key; // Retur doesn't record
            } else if ($validationValue !== null) {
                $diff = abs($uploadedValue - $validationValue);
                if ($diff <= self::TOLERANCE) {
                    $matchedKeys[] = $key;
                }
            }
        }

        // Process matched rows in batches
        if (!empty($matchedKeys)) {
            foreach (array_chunk($matchedKeys, 500) as $keyChunk) {
                $records = DB::table('mapped_uploaded_files')
                    ->select('row_index', 'connector', 'sum_field')
                    ->where('filename', $filename)
                    ->where('document_type', $documentType)
                    ->where('document_category', $documentCategory)
                    ->whereIn('connector', $keyChunk)
                    ->get();

                foreach ($records as $record) {
                    $key = trim($record->connector);
                    $validationValue = $validationMap[$key] ?? null;
                    $uploadedValue = (float) $record->sum_field;

                    $matchedRows[] = [
                        'row_index' => $record->row_index,
                        'key_value' => $key,
                        'validation_source_total' => $validationValue,
                        'uploaded_total' => $uploadedValue,
                    ];
                }
            }
        }

        Log::info('Categorized rows from database', [
            'invalid_rows' => count($invalidRows),
            'matched_rows' => count($matchedRows),
            'mismatched_count' => $mismatchedRecordCount
        ]);

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
        ?int $userId,
        ?int $existingValidationId = null
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
            $userId,
            $existingValidationId
        ) {
            // If existing validation ID provided, update it instead of creating new
            if ($existingValidationId) {
                $validation = Validation::find($existingValidationId);
                if ($validation) {
                    // Delete existing relationships to avoid duplicates
                    $validation->invalidGroups()->delete();
                    $validation->invalidRows()->delete();
                    $validation->matchedGroups()->delete();
                    $validation->matchedRows()->delete();
                    
                    // Update validation record
                    $validation->update([
                        'score' => $score,
                        'total_records' => $totalRecords,
                        'matched_records' => $matchedRecords,
                        'mismatched_records' => $mismatchedRecords,
                        'status' => 'completed',
                        'validation_details' => [
                            'invalid_groups' => $invalidGroups,
                            'invalid_rows' => $invalidRows,
                            'matched_groups' => $matchedGroups,
                            'matched_rows' => $matchedRows,
                        ],
                    ]);
                } else {
                    throw new \Exception("Validation record with ID {$existingValidationId} not found");
                }
            } else {
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
                    'status' => 'completed',
                    // Keep validation_details for backward compatibility with existing data
                    'validation_details' => [
                        'invalid_groups' => $invalidGroups,
                        'invalid_rows' => $invalidRows,
                        'matched_groups' => $matchedGroups,
                        'matched_rows' => $matchedRows,
                    ],
                ]);
            }

            // Batch insert invalid groups (chunked to avoid SQLite 999 variable limit)
            if (!empty($invalidGroups)) {
                $invalidGroupsData = [];
                foreach ($invalidGroups as $key => $group) {
                    $invalidGroupsData[] = [
                        'validation_id' => $validation->id,
                        'key_value' => $key,
                        'discrepancy_category' => $group['discrepancy_category'],
                        'error' => $group['error'],
                        'uploaded_total' => $group['uploaded_total'],
                        'source_total' => $group['source_total'],
                        'discrepancy_value' => $group['discrepancy_value'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                // 9 columns per row, so chunk at 100 rows (900 variables) to stay under 999 limit
                foreach (array_chunk($invalidGroupsData, 100) as $chunk) {
                    $validation->invalidGroups()->insert($chunk);
                }
            }

            // Batch insert invalid rows (chunked to avoid SQLite 999 variable limit)
            if (!empty($invalidRows)) {
                $invalidRowsData = [];
                foreach ($invalidRows as $row) {
                    $invalidRowsData[] = [
                        'validation_id' => $validation->id,
                        'row_index' => $row['row_index'],
                        'key_value' => $row['key_value'],
                        'error' => $row['error'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                // 6 columns per row, so chunk at 150 rows (900 variables) to stay under 999 limit
                foreach (array_chunk($invalidRowsData, 150) as $chunk) {
                    $validation->invalidRows()->insert($chunk);
                }
            }

            // Batch insert matched groups (chunked to avoid SQLite 999 variable limit)
            if (!empty($matchedGroups)) {
                $matchedGroupsData = [];
                foreach ($matchedGroups as $key => $group) {
                    $matchedGroupsData[] = [
                        'validation_id' => $validation->id,
                        'key_value' => $key,
                        'uploaded_total' => $group['uploaded_total'],
                        'source_total' => $group['source_total'],
                        'difference' => $group['difference'],
                        'note' => $group['note'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                // 8 columns per row, so chunk at 120 rows (960 variables) to stay under 999 limit
                foreach (array_chunk($matchedGroupsData, 120) as $chunk) {
                    $validation->matchedGroups()->insert($chunk);
                }
            }

            // Batch insert matched rows (chunked to avoid SQLite 999 variable limit)
            if (!empty($matchedRows)) {
                $matchedRowsData = [];
                foreach ($matchedRows as $row) {
                    $matchedRowsData[] = [
                        'validation_id' => $validation->id,
                        'row_index' => $row['row_index'],
                        'key_value' => $row['key_value'],
                        'validation_source_total' => $row['validation_source_total'],
                        'uploaded_total' => $row['uploaded_total'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                // 7 columns per row, so chunk at 140 rows (980 variables) to stay under 999 limit
                foreach (array_chunk($matchedRowsData, 140) as $chunk) {
                    $validation->matchedRows()->insert($chunk);
                }
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
