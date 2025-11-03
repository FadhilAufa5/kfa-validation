<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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
        $path = "uploads/{$filename}";

        if (!Storage::exists($path)) {
            throw new \Exception('Uploaded file not found');
        }

        $connectorColumn = $config['connector'][0];
        $sumField = $config['sum'][0] ?? null;
        
        // Use processFileWithHeader to properly read file with header offset
        $processedData = $this->fileProcessingService->processFileWithHeader($filename, $headerRow);
        
        // Filter data by key
        $filteredData = array_filter($processedData['data'], function ($row) use ($connectorColumn, $key) {
            $rowKey = trim((string) ($row[$connectorColumn] ?? ''));
            $searchKey = trim((string) $key);
            return strcasecmp($rowKey, $searchKey) === 0;
        });

        // Get headers from the processed data
        $headers = !empty($processedData['data']) ? array_keys($processedData['data'][0]) : [];

        Log::info('Uploaded Data Response', [
            'connector_column' => $connectorColumn,
            'key' => $key,
            'header_row' => $headerRow,
            'total_rows' => count($processedData['data']),
            'filtered_count' => count($filteredData)
        ]);

        // Return data in the same format as before: [headers, ...rows]
        return [
            'filename' => $filename,
            'connector_column' => $connectorColumn,
            'sum_field' => $sumField,
            'key' => $key,
            'data' => [
                $headers,
                ...array_values($filteredData)
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
