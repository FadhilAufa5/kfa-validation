<?php

namespace App\Services;

use App\Models\MappedUploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MappedFileService
{
    public function __construct(
        private FileProcessingService $fileProcessingService
    ) {}

    /**
     * Map uploaded file data to MappedUploadedFile table
     * 
     * @param string $filename
     * @param string $documentType (pembelian/penjualan)
     * @param string $documentCategory (reguler/retur/urgent/ecommerce/etc)
     * @param int $headerRow
     * @param int|null $userId
     * @return array
     */
    public function mapUploadedFile(
        string $filename,
        string $documentType,
        string $documentCategory,
        int $headerRow,
        ?int $userId = null
    ): array {
        // Load configuration
        $config = $this->getConfig($documentType, $documentCategory);
        
        if (!isset($config['mapping'])) {
            throw new \Exception('Mapping configuration not found for this document type');
        }

        // Process file with header
        $processedData = $this->fileProcessingService->processFileWithHeader($filename, $headerRow);
        
        if (empty($processedData['data'])) {
            throw new \Exception('No data found in uploaded file');
        }

        $mapping = $config['mapping'];
        $connectorColumn = $config['connector'][0];
        $sumColumn = $config['sum'][0] ?? null;

        // Delete existing mappings for this file (if re-processing)
        MappedUploadedFile::where('filename', $filename)
            ->where('document_type', $documentType)
            ->where('document_category', $documentCategory)
            ->delete();

        $mappedRecords = [];
        $rowIndex = $headerRow + 1; // Start counting from row after header
        $failedRows = [];
        $skippedRows = [];

        Log::info('Starting data mapping process', [
            'filename' => $filename,
            'document_type' => $documentType,
            'document_category' => $documentCategory,
            'total_rows_to_process' => count($processedData['data'])
        ]);

        foreach ($processedData['data'] as $row) {
            try {
                // Extract mapped values
                $mappedData = [
                    'filename' => $filename,
                    'document_type' => $documentType,
                    'document_category' => $documentCategory,
                    'header_row' => $headerRow,
                    'user_id' => $userId,
                    'row_index' => $rowIndex,
                    'raw_data' => $this->encodeRawRow($row, $filename, $rowIndex),
                ];

                // Map configured columns
                foreach ($mapping as $dbColumn => $fileColumn) {
                    $value = $row[$fileColumn] ?? null;
                    
                    // Handle date formatting
                    if ($dbColumn === 'date' && $value) {
                        $mappedData[$dbColumn] = $this->parseDate($value, $filename, $rowIndex);
                    } else {
                        $mappedData[$dbColumn] = $value;
                    }
                }

                // Map connector and sum fields
                $mappedData['connector'] = $row[$connectorColumn] ?? null;
                $mappedData['sum_field'] = $sumColumn ? ($row[$sumColumn] ?? null) : null;

                // Skip rows without connector value
                if (empty($mappedData['connector'])) {
                    Log::warning("Skipping row without connector value", [
                        'file' => $filename,
                        'row' => $rowIndex,
                        'reason' => 'Empty connector value'
                    ]);
                    $skippedRows[] = [
                        'row' => $rowIndex,
                        'reason' => 'Empty connector value'
                    ];
                    $rowIndex++;
                    continue;
                }

                $mappedRecords[] = $mappedData;
                
                // Log successful mapping for this row
                Log::debug("Row mapped successfully", [
                    'file' => $filename,
                    'row' => $rowIndex,
                    'connector' => $mappedData['connector'],
                    'sum_field' => $mappedData['sum_field']
                ]);
                
            } catch (\Exception $e) {
                Log::error("Failed to map row data", [
                    'file' => $filename,
                    'row' => $rowIndex,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                $failedRows[] = [
                    'row' => $rowIndex,
                    'error' => $e->getMessage()
                ];
            }
            
            $rowIndex++;
        }

        // Bulk insert mapped records using chunks for better performance
        if (!empty($mappedRecords)) {
            try {
                $chunkSize = 500; // Insert 500 records at a time
                $totalRecords = count($mappedRecords);
                $chunks = array_chunk($mappedRecords, $chunkSize);
                $totalChunks = count($chunks);
                
                Log::info('Attempting to insert mapped records into database using chunks', [
                    'filename' => $filename,
                    'total_records' => $totalRecords,
                    'chunk_size' => $chunkSize,
                    'total_chunks' => $totalChunks
                ]);

                $insertedCount = 0;
                foreach ($chunks as $chunkIndex => $chunk) {
                    $inserted = MappedUploadedFile::insert($chunk);
                    
                    if ($inserted) {
                        $insertedCount += count($chunk);
                        Log::debug('Chunk inserted successfully', [
                            'filename' => $filename,
                            'chunk' => $chunkIndex + 1,
                            'total_chunks' => $totalChunks,
                            'records_in_chunk' => count($chunk),
                            'total_inserted_so_far' => $insertedCount
                        ]);
                    } else {
                        Log::error('❌ Failed to insert chunk', [
                            'filename' => $filename,
                            'chunk' => $chunkIndex + 1,
                            'records_in_chunk' => count($chunk)
                        ]);
                        throw new \Exception("Database insert operation failed for chunk " . ($chunkIndex + 1));
                    }
                }
                
                Log::info('✅ Data inserted successfully into mapped_uploaded_files table', [
                    'filename' => $filename,
                    'document_type' => $documentType,
                    'document_category' => $documentCategory,
                    'header_row' => $headerRow,
                    'total_rows_in_file' => count($processedData['data']),
                    'successfully_inserted' => $insertedCount,
                    'skipped_rows' => count($skippedRows),
                    'failed_rows' => count($failedRows),
                    'chunks_processed' => $totalChunks,
                    'user_id' => $userId
                ]);

                // Log individual stats if there were issues
                if (!empty($skippedRows)) {
                    Log::warning('Some rows were skipped during mapping', [
                        'filename' => $filename,
                        'skipped_count' => count($skippedRows),
                        'skipped_details' => $skippedRows
                    ]);
                }

                if (!empty($failedRows)) {
                    Log::error('Some rows failed to map', [
                        'filename' => $filename,
                        'failed_count' => count($failedRows),
                        'failed_details' => $failedRows
                    ]);
                }
                
            } catch (\Exception $e) {
                Log::error('❌ Exception occurred during data insertion', [
                    'filename' => $filename,
                    'document_type' => $documentType,
                    'document_category' => $documentCategory,
                    'records_attempted' => count($mappedRecords),
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw new \Exception('Failed to insert mapped data into database: ' . $e->getMessage());
            }
        } else {
            Log::warning('No records to insert - all rows were skipped or failed', [
                'filename' => $filename,
                'total_rows' => count($processedData['data']),
                'skipped_rows' => count($skippedRows),
                'failed_rows' => count($failedRows)
            ]);
        }

        // Delete the CSV file after successful mapping
        $this->deleteUploadedFile($filename);

        return [
            'success' => true,
            'filename' => $filename,
            'total_rows' => count($processedData['data']),
            'mapped_records' => count($mappedRecords),
            'skipped_rows' => count($skippedRows),
            'failed_rows' => count($failedRows),
            'skipped_details' => $skippedRows,
            'failed_details' => $failedRows,
        ];
    }

    /**
     * Get mapped data for validation
     * 
     * @param string $filename
     * @param string $documentType
     * @param string $documentCategory
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getMappedData(string $filename, string $documentType, string $documentCategory)
    {
        return MappedUploadedFile::byFilename($filename)
            ->byDocumentType($documentType)
            ->byDocumentCategory($documentCategory)
            ->orderBy('row_index')
            ->get();
    }

    /**
     * Get mapped data grouped by connector for validation
     * 
     * @param string $filename
     * @param string $documentType
     * @param string $documentCategory
     * @return array Connector => array of records
     */
    public function getMappedDataGroupedByConnector(
        string $filename,
        string $documentType,
        string $documentCategory
    ): array {
        $mappedData = $this->getMappedData($filename, $documentType, $documentCategory);
        
        $grouped = [];
        foreach ($mappedData as $record) {
            $connector = trim((string) $record->connector);
            if (!isset($grouped[$connector])) {
                $grouped[$connector] = [];
            }
            $grouped[$connector][] = $record;
        }

        return $grouped;
    }

    /**
     * Get summary of mapped data
     * 
     * @param string $filename
     * @param string $documentType
     * @param string $documentCategory
     * @return array
     */
    public function getMappedSummary(
        string $filename,
        string $documentType,
        string $documentCategory
    ): array {
        $count = MappedUploadedFile::byFilename($filename)
            ->byDocumentType($documentType)
            ->byDocumentCategory($documentCategory)
            ->count();

        $uniqueConnectors = MappedUploadedFile::byFilename($filename)
            ->byDocumentType($documentType)
            ->byDocumentCategory($documentCategory)
            ->distinct('connector')
            ->count('connector');

        $totalSum = MappedUploadedFile::byFilename($filename)
            ->byDocumentType($documentType)
            ->byDocumentCategory($documentCategory)
            ->sum('sum_field');

        return [
            'total_records' => $count,
            'unique_connectors' => $uniqueConnectors,
            'total_sum' => $totalSum,
        ];
    }

    /**
     * Delete mapped data for a file
     * 
     * @param string $filename
     * @param string $documentType
     * @param string $documentCategory
     * @return int Number of deleted records
     */
    public function deleteMappedData(
        string $filename,
        string $documentType,
        string $documentCategory
    ): int {
        return MappedUploadedFile::byFilename($filename)
            ->byDocumentType($documentType)
            ->byDocumentCategory($documentCategory)
            ->delete();
    }

    /**
     * Get configuration for document type and category
     */
    private function getConfig(string $documentType, string $documentCategory): array
    {
        $configKey = strtolower($documentType) . '.' . strtolower($documentCategory);
        $config = Config::get('document_validation.' . $configKey);

        if (!$config) {
            throw new \Exception('Invalid document category');
        }

        return $config;
    }

    /**
     * Parse date value - handles regular dates, month names, and numeric months (1-12)
     * 
     * @param mixed $value Date value from file
     * @param string $filename For logging
     * @param int $rowIndex For logging
     * @return string|null Formatted date (Y-m-d) or null
     */
    private function parseDate($value, string $filename, int $rowIndex): ?string
    {
        if (empty($value)) {
            return null;
        }

        $value = trim((string) $value);

        // Check if value is a numeric month (1-12)
        if (is_numeric($value)) {
            $monthNumber = (int) $value;
            
            if ($monthNumber >= 1 && $monthNumber <= 12) {
                $currentYear = date('Y');
                
                try {
                    $date = \Carbon\Carbon::create($currentYear, $monthNumber, 1);
                    
                    Log::info("Converted numeric month to date", [
                        'file' => $filename,
                        'row' => $rowIndex,
                        'input' => $value,
                        'month_number' => $monthNumber,
                        'output' => $date->format('Y-m-d')
                    ]);
                    
                    return $date->format('Y-m-d');
                } catch (\Exception $e) {
                    Log::warning("Failed to create date from numeric month", [
                        'file' => $filename,
                        'row' => $rowIndex,
                        'value' => $value,
                        'error' => $e->getMessage()
                    ]);
                    return null;
                }
            }
        }

        // Try to detect if it's a month name (Bulan format)
        $monthMap = [
            'januari' => 1, 'january' => 1, 'jan' => 1,
            'februari' => 2, 'february' => 2, 'feb' => 2,
            'maret' => 3, 'march' => 3, 'mar' => 3,
            'april' => 4, 'apr' => 4,
            'mei' => 5, 'may' => 5,
            'juni' => 6, 'june' => 6, 'jun' => 6,
            'juli' => 7, 'july' => 7, 'jul' => 7,
            'agustus' => 8, 'august' => 8, 'aug' => 8, 'agu' => 8,
            'september' => 9, 'sep' => 9, 'sept' => 9,
            'oktober' => 10, 'october' => 10, 'oct' => 10, 'okt' => 10,
            'november' => 11, 'nov' => 11,
            'desember' => 12, 'december' => 12, 'des' => 12, 'dec' => 12,
        ];

        $valueLower = strtolower($value);

        // Check if value is a month name
        if (isset($monthMap[$valueLower])) {
            $month = $monthMap[$valueLower];
            $currentYear = date('Y');
            
            // Create date as first day of the month
            try {
                $date = \Carbon\Carbon::create($currentYear, $month, 1);
                
                Log::info("Converted month name to date", [
                    'file' => $filename,
                    'row' => $rowIndex,
                    'input' => $value,
                    'output' => $date->format('Y-m-d')
                ]);
                
                return $date->format('Y-m-d');
            } catch (\Exception $e) {
                Log::warning("Failed to create date from month", [
                    'file' => $filename,
                    'row' => $rowIndex,
                    'value' => $value,
                    'error' => $e->getMessage()
                ]);
                return null;
            }
        }

        // Try parsing as regular date
        try {
            $date = \Carbon\Carbon::parse($value);
            return $date->format('Y-m-d');
        } catch (\Exception $e) {
            Log::warning("Failed to parse date", [
                'file' => $filename,
                'row' => $rowIndex,
                'value' => $value,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Delete uploaded file from storage after successful mapping
     * 
     * @param string $filename
     * @return bool
     */
    private function deleteUploadedFile(string $filename): bool
    {
        $path = "uploads/{$filename}";
        
        if (Storage::exists($path)) {
            $deleted = Storage::delete($path);
            
            if ($deleted) {
                Log::info("Deleted uploaded file after mapping", [
                    'filename' => $filename,
                    'path' => $path
                ]);
            } else {
                Log::warning("Failed to delete uploaded file", [
                    'filename' => $filename,
                    'path' => $path
                ]);
            }
            
            return $deleted;
        }
        
        Log::warning("Uploaded file not found for deletion", [
            'filename' => $filename,
            'path' => $path
        ]);
        
        return false;
    }

    private function encodeRawRow(array $row, string $filename, int $rowIndex): string
    {
        $encoded = json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($encoded === false) {
            $error = json_last_error_msg();
            Log::error('Failed to encode raw row data', [
                'file' => $filename,
                'row' => $rowIndex,
                'error' => $error,
            ]);

            throw new \RuntimeException('Unable to encode raw row data: ' . $error);
        }

        return $encoded;
    }
}
