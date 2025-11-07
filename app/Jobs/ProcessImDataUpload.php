<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use League\Csv\Reader;
use App\Models\ImDataInfo;

class ProcessImDataUpload implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 7200; // 2 hours
    public $tries = 1;

    protected string $filePath;
    protected string $dataType;
    protected string $originalName;
    protected ?int $userId;

    public function __construct(string $filePath, string $dataType, string $originalName, ?int $userId = null)
    {
        $this->filePath = $filePath;
        $this->dataType = $dataType;
        $this->originalName = $originalName;
        $this->userId = $userId;
    }

    public function handle(): void
    {
        $startTime = microtime(true);
        $tableName = $this->dataType === 'pembelian' ? 'im_purchases_and_return' : 'im_jual';

        Log::info('Starting IM data processing', [
            'file' => $this->originalName,
            'data_type' => $this->dataType,
            'table' => $tableName,
        ]);

        try {
            $extension = strtolower(pathinfo($this->filePath, PATHINFO_EXTENSION));
            
            // Clear existing data
            DB::table($tableName)->truncate();
            Log::info('Truncated table', ['table' => $tableName]);

            // Read and process file
            $headers = [];
            $rowCount = 0;
            $batchSize = 500;
            $batch = [];

            if (in_array($extension, ['xlsx', 'xls'])) {
                $rowCount = $this->processExcelFile($tableName, $batchSize);
            } else {
                $rowCount = $this->processCsvFile($tableName, $batchSize);
            }

            // Clean up the file
            if (file_exists($this->filePath)) {
                unlink($this->filePath);
                Log::info('Cleaned up temporary file', ['path' => $this->filePath]);
            }

            $executionTime = microtime(true) - $startTime;

            // Update IM data info table
            $userName = $this->userId ? \App\Models\User::find($this->userId)?->name : 'System';
            ImDataInfo::updateInfo($tableName, $rowCount, $userName ?? 'System');

            Log::info('IM data processing completed', [
                'table' => $tableName,
                'rows_inserted' => $rowCount,
                'execution_time' => round($executionTime, 2),
            ]);

        } catch (\Exception $e) {
            Log::error('IM data processing failed', [
                'file' => $this->originalName,
                'table' => $tableName,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Clean up on error
            if (file_exists($this->filePath)) {
                unlink($this->filePath);
            }

            throw $e;
        }
    }

    private function processExcelFile(string $tableName, int $batchSize): int
    {
        $reader = IOFactory::createReaderForFile($this->filePath);
        $reader->setReadDataOnly(true);
        $spreadsheet = $reader->load($this->filePath);
        $sheet = $spreadsheet->getActiveSheet();

        // Handle merged cells
        $mergedCells = $sheet->getMergeCells();
        foreach ($mergedCells as $mergedRange) {
            $cells = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::extractAllCellReferencesInRange($mergedRange);
            $masterCell = $cells[0];
            $masterValue = $sheet->getCell($masterCell)->getValue();
            
            foreach ($cells as $cell) {
                if ($cell !== $masterCell) {
                    $sheet->getCell($cell)->setValue($masterValue);
                }
            }
        }

        foreach ($mergedCells as $mergedRange) {
            $sheet->unmergeCells($mergedRange);
        }

        // Get headers from first row
        $headers = [];
        $headerRow = $sheet->rangeToArray('A1:' . $sheet->getHighestColumn() . '1', null, true, false, false)[0];
        foreach ($headerRow as $index => $header) {
            $headers[$index] = $this->sanitizeColumnName(trim($header ?? ''));
        }

        // Ensure table has necessary columns
        $this->ensureTableColumns($tableName, $headers);

        $rowCount = 0;
        $batch = [];
        $highestRow = $sheet->getHighestRow();

        // Process rows in batches
        for ($rowIndex = 2; $rowIndex <= $highestRow; $rowIndex++) {
            $row = $sheet->rangeToArray(
                'A' . $rowIndex . ':' . $sheet->getHighestColumn() . $rowIndex,
                null,
                true,
                false,
                false
            )[0];

            $rowData = $this->prepareRowData($headers, $row);

            if (!empty(array_filter($rowData))) {
                $batch[] = $rowData;
                $rowCount++;

                if (count($batch) >= $batchSize) {
                    $this->insertBatch($tableName, $batch);
                    $batch = [];

                    if ($rowCount % 5000 === 0) {
                        Log::info('Progress update', [
                            'table' => $tableName,
                            'rows_processed' => $rowCount,
                        ]);
                    }
                }
            }
        }

        // Insert remaining rows
        if (!empty($batch)) {
            $this->insertBatch($tableName, $batch);
        }

        return $rowCount;
    }

    private function processCsvFile(string $tableName, int $batchSize): int
    {
        $content = file_get_contents($this->filePath);
        $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
        
        if ($encoding !== 'UTF-8') {
            $content = mb_convert_encoding($content, 'UTF-8', $encoding);
        }

        $csv = Reader::createFromString($content);
        $csv->setDelimiter(',');
        $csv->setHeaderOffset(0);

        $rawHeaders = $csv->getHeader();
        $headers = array_map(fn($h) => $this->sanitizeColumnName(trim($h)), $rawHeaders);

        // Ensure table has necessary columns
        $this->ensureTableColumns($tableName, $headers);

        $rowCount = 0;
        $batch = [];

        foreach ($csv->getRecords() as $record) {
            $rowData = $this->prepareRowData($headers, array_values($record));

            if (!empty(array_filter($rowData))) {
                $batch[] = $rowData;
                $rowCount++;

                if (count($batch) >= $batchSize) {
                    $this->insertBatch($tableName, $batch);
                    $batch = [];

                    if ($rowCount % 5000 === 0) {
                        Log::info('Progress update', [
                            'table' => $tableName,
                            'rows_processed' => $rowCount,
                        ]);
                    }
                }
            }
        }

        // Insert remaining rows
        if (!empty($batch)) {
            $this->insertBatch($tableName, $batch);
        }

        return $rowCount;
    }

    private function sanitizeColumnName(string $name): string
    {
        $name = strtolower($name);
        $name = preg_replace('/[^a-z0-9_]/', '_', $name);
        $name = preg_replace('/_+/', '_', $name);
        $name = trim($name, '_');
        
        if (empty($name) || is_numeric($name[0])) {
            $name = 'col_' . $name;
        }

        return $name;
    }

    private function ensureTableColumns(string $tableName, array $headers): void
    {
        $existingColumns = DB::getSchemaBuilder()->getColumnListing($tableName);
        
        foreach ($headers as $columnName) {
            if (!in_array($columnName, $existingColumns)) {
                DB::statement("ALTER TABLE {$tableName} ADD COLUMN {$columnName} TEXT");
                Log::info('Added column to table', [
                    'table' => $tableName,
                    'column' => $columnName,
                ]);
            }
        }
    }

    private function prepareRowData(array $headers, array $row): array
    {
        $data = [];

        foreach ($headers as $index => $columnName) {
            $value = $row[$index] ?? null;
            
            if ($value !== null && $value !== '') {
                $data[$columnName] = is_string($value) ? trim($value) : $value;
            } else {
                $data[$columnName] = null;
            }
        }

        return $data;
    }

    private function insertBatch(string $tableName, array $batch): void
    {
        try {
            DB::table($tableName)->insert($batch);
        } catch (\Exception $e) {
            Log::error('Batch insert failed', [
                'table' => $tableName,
                'batch_size' => count($batch),
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
}
