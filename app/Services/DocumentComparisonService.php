<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Models\MappedUploadedFile;

class DocumentComparisonService
{
    public function __construct(
        private FileProcessingService $fileProcessingService
    ) {}

    public function getComparisonData(
        string $documentType,
        string $documentCategory,
        string $filename,
        string $key,
        string $type,
        int $headerRow = 1
    ): array {
        $config = $this->getConfig($documentType, $documentCategory);

        if ($type === 'uploaded') {
            return $this->getUploadedData($filename, $key, $config, $headerRow);
        } elseif ($type === 'validation') {
            return $this->getValidationData($key, $config);
        }

        throw new \Exception('Invalid type parameter');
    }

    private function getConfig(string $documentType, string $documentCategory): array
    {
        $configKey = strtolower($documentType) . '.' . strtolower($documentCategory);
        $config = Config::get('document_validation.' . $configKey);

        if (!$config) {
            throw new \Exception('Invalid document category');
        }

        return $config;
    }

    private function getUploadedData(string $filename, string $key, array $config, int $headerRow): array
    {
        $connectorColumn = $config['connector'][0];
        $sumField = $config['sum'][0] ?? null;
        $mapping = $config['mapping'] ?? [];
        
        // Load from mapped_uploaded_files table
        $mappedRecords = MappedUploadedFile::where('filename', $filename)
            ->where('connector', $key)
            ->orderBy('row_index')
            ->get();

        if ($mappedRecords->isEmpty()) {
            throw new \Exception('File data not found. The file may have been processed and removed from storage.');
        }

        // Build headers and rows from mapped columns configuration
        $headers = [];
        $rows = [];
        
        // Get column labels from config mapping (the file column names)
        foreach ($mapping as $dbColumn => $fileColumn) {
            $headers[] = $fileColumn;
        }
        
        // Add connector and sum field columns if they're not already in mapping
        if (!in_array($connectorColumn, $headers)) {
            $headers[] = $connectorColumn;
        }
        if ($sumField && !in_array($sumField, $headers)) {
            $headers[] = $sumField;
        }
        
        // Build rows from mapped records
        foreach ($mappedRecords as $record) {
            $row = [];
            
            // Map database columns back to file column names
            foreach ($mapping as $dbColumn => $fileColumn) {
                $value = $record->{$dbColumn};
                
                // Format date fields to Y-m-d format
                if ($dbColumn === 'date' && $value instanceof \DateTimeInterface) {
                    $value = $value->format('Y-m-d');
                } elseif ($dbColumn === 'date' && is_string($value)) {
                    // Handle string dates
                    try {
                        $dateObj = new \DateTime($value);
                        $value = $dateObj->format('Y-m-d');
                    } catch (\Exception $e) {
                        // Keep original value if date parsing fails
                    }
                }
                
                $row[$fileColumn] = $value;
            }
            
            // Add connector and sum field values
            $row[$connectorColumn] = $record->connector;
            if ($sumField) {
                $row[$sumField] = $record->sum_field;
            }
            
            $rows[] = $row;
        }

        Log::info('Uploaded Data Response (from mapped_uploaded_files)', [
            'connector_column' => $connectorColumn,
            'key' => $key,
            'filtered_count' => count($rows),
            'headers' => $headers
        ]);

        return [
            'filename' => $filename,
            'connector_column' => $connectorColumn,
            'sum_field' => $sumField,
            'key' => $key,
            'data' => [
                $headers,
                ...$rows
            ],
        ];
    }

    private function getValidationData(string $key, array $config): array
    {
        $validationTable = $config['doc_val'];
        $connectorColumn = $config['connector'][1];
        $sumField = $config['sum'][1] ?? null;

        try {
            $data = $this->readDatabaseAndFilterByKey($validationTable, $key, $connectorColumn);

            Log::info('Validation Data Response', ['data' => $data]);

            return [
                'filename' => $validationTable,
                'connector_column' => $connectorColumn,
                'sum_field' => $sumField,
                'key' => $key,
                'data' => $data,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to read validation data from database', [
                'table' => $validationTable,
                'error' => $e->getMessage()
            ]);
            throw new \Exception('Gagal membaca data validasi dari database');
        }
    }

    private function readDatabaseAndFilterByKey(string $tableName, string $key, string $connectorColumn): array
    {
        try {
            $headers = DB::getSchemaBuilder()->getColumnListing($tableName);
            $headers = array_map('trim', $headers);

            $exactRecords = DB::table($tableName)
                ->where(DB::raw('LOWER(TRIM(' . $connectorColumn . '))'), '=', strtolower(trim($key)))
                ->get()
                ->map(function ($record) {
                    return (array) $record;
                })
                ->toArray();

            if (empty($exactRecords)) {
                $records = DB::table($tableName)
                    ->where($connectorColumn, 'LIKE', '%' . trim($key) . '%')
                    ->get()
                    ->map(function ($record) {
                        return (array) $record;
                    })
                    ->toArray();
            } else {
                $records = $exactRecords;
            }

            Log::info('Database filtered data count', [
                'table' => $tableName,
                'connector_column' => $connectorColumn,
                'key' => $key,
                'filtered_count' => count($records),
                'exact_match' => !empty($exactRecords)
            ]);

            return [
                $headers,
                ...array_values($records)
            ];
        } catch (\Exception $e) {
            Log::error('Error reading database table', [
                'table' => $tableName,
                'column' => $connectorColumn,
                'key' => $key,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}
