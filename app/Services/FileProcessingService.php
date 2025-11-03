<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use League\Csv\Reader;

class FileProcessingService
{
    public function saveAndConvertFile($file, string $type): string
    {
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = strtolower($file->getClientOriginalExtension());

        Log::info('File upload initiated', [
            'original_name' => $originalName,
            'extension' => $extension,
            'mime' => $file->getMimeType(),
            'size_kb' => round($file->getSize() / 1024, 2),
        ]);

        $uploadDir = "uploads";
        $csvPath = storage_path("app/{$uploadDir}/{$originalName}.csv");

        if (!Storage::exists($uploadDir)) {
            Storage::makeDirectory($uploadDir);
        }

        if (in_array($extension, ['xls', 'xlsx'])) {
            $this->convertExcelToCsv($file->getRealPath(), $csvPath);
        } else {
            $file->storeAs($uploadDir, "{$originalName}.csv");
        }

        Log::info('File saved successfully', ['filename' => "{$originalName}.csv"]);

        return "{$originalName}.csv";
    }

    private function convertExcelToCsv(string $sourcePath, string $destinationPath): void
    {
        Log::info('Converting Excel to CSV', ['source' => $sourcePath]);

        $reader = IOFactory::createReaderForFile($sourcePath);
        $reader->setReadDataOnly(false);
        $spreadsheet = $reader->load($sourcePath);

        $writer = new Csv($spreadsheet);
        $writer->setDelimiter(',');
        $writer->setEnclosure('"');
        $writer->setLineEnding("\r\n");
        $writer->setSheetIndex(0);
        $writer->setUseBOM(true);
        $writer->save($destinationPath);

        Log::info('Excel converted to CSV successfully');
    }

    public function readFileData(string $filename, int $headerRow = 1): array
    {
        $path = "uploads/{$filename}";

        if (!Storage::exists($path)) {
            throw new \Exception('File tidak ditemukan.');
        }

        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $fullPath = Storage::path($path);

        return match ($extension) {
            'xlsx', 'xls' => $this->readExcelFile($fullPath, $headerRow),
            'csv' => $this->readCsvFile($fullPath, $headerRow),
            default => throw new \Exception('Format file tidak didukung.'),
        };
    }

    private function readExcelFile(string $fullPath, int $headerRow): array
    {
        $spreadsheet = IOFactory::load($fullPath);
        $sheet = $spreadsheet->getActiveSheet();

        $highestRow = $sheet->getHighestRow();
        if ($headerRow > $highestRow) {
            throw new \Exception("Baris header #{$headerRow} tidak ditemukan dalam file.");
        }

        $headerRange = 'A' . $headerRow . ':' . $sheet->getHighestColumn() . $headerRow;
        $headerRowData = $sheet->rangeToArray($headerRange, null, true, true, true)[$headerRow];
        $headers = array_map('trim', $headerRowData);

        $dataRows = $sheet->rangeToArray(
            'A' . ($headerRow + 1) . ':' . $sheet->getHighestColumn() . $highestRow,
            null,
            true,
            false,
            false
        );

        $data = [];
        foreach ($dataRows as $row) {
            $rowData = [];
            foreach ($headers as $index => $headerName) {
                if ($headerName && isset($row[$index])) {
                    $rowData[$headerName] = $row[$index];
                }
            }

            if (count(array_filter($rowData))) {
                $data[] = $rowData;
            }
        }

        return ['headers' => $headers, 'data' => $data];
    }

    private function readCsvFile(string $fullPath, int $headerRow): array
    {
        $content = file_get_contents($fullPath);
        $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
        
        if ($encoding !== 'UTF-8') {
            $content = mb_convert_encoding($content, 'UTF-8', $encoding);
        }

        $tempCsv = Reader::createFromString($content);
        $tempCsv->setDelimiter(',');
        $allRows = iterator_to_array($tempCsv->getRecords());

        $headerOffset = $headerRow - 1;
        if (!isset($allRows[$headerOffset])) {
            throw new \Exception("Baris header #{$headerRow} tidak ditemukan dalam file.");
        }

        $csv = Reader::createFromString($content);
        $csv->setDelimiter(',');
        $csv->setHeaderOffset($headerOffset);
        $headers = array_map('trim', $csv->getHeader());
        $data = iterator_to_array($csv->getRecords());

        return ['headers' => $headers, 'data' => $data];
    }

    public function previewFile(string $filename, int $rows = 10): array
    {
        $path = "uploads/{$filename}";
        
        if (!Storage::exists($path)) {
            throw new \Exception('File tidak ditemukan.');
        }

        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $fullPath = Storage::path($path);

        if (in_array($extension, ['xlsx', 'xls'])) {
            $spreadsheet = IOFactory::load($fullPath);
            $sheet = $spreadsheet->getActiveSheet();
            $allRows = $sheet->toArray(null, true, true, true);
        } elseif ($extension === 'csv') {
            $content = file_get_contents($fullPath);
            $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
            
            if ($encoding !== 'UTF-8') {
                $content = mb_convert_encoding($content, 'UTF-8', $encoding);
            }

            $csv = Reader::createFromString($content);
            $csv->setDelimiter(',');
            $records = iterator_to_array($csv->getRecords());
            $allRows = array_values($records);
        } else {
            throw new \Exception('Format file tidak didukung.');
        }

        return array_slice($allRows, 0, $rows);
    }

    public function processFileWithHeader(string $filename, int $headerRow = 1): array
    {
        $path = "uploads/{$filename}";
        
        if (!Storage::exists($path)) {
            throw new \Exception('File tidak ditemukan.');
        }

        if ($headerRow < 1) {
            throw new \Exception('Baris header tidak valid.');
        }

        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $fullPath = Storage::path($path);
        $headerIndex = $headerRow - 1;

        $allRows = [];

        if ($extension === 'csv') {
            $content = file_get_contents($fullPath);
            $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
            
            if ($encoding !== 'UTF-8') {
                $content = mb_convert_encoding($content, 'UTF-8', $encoding);
            }
            
            $csv = Reader::createFromString($content);
            $csv->setDelimiter(',');
            $allRows = iterator_to_array($csv->getRecords());
        } elseif (in_array($extension, ['xlsx', 'xls'])) {
            $spreadsheet = IOFactory::load($fullPath);
            $sheet = $spreadsheet->getActiveSheet();
            $allRows = $sheet->toArray(null, true, true, false);

            $allRows = array_filter($allRows, function ($row) {
                return !empty(array_filter($row, fn($cell) => $cell !== null && $cell !== ''));
            });
            $allRows = array_values($allRows);
        }

        if (!isset($allRows[$headerIndex])) {
            throw new \Exception("Baris header #{$headerRow} tidak ditemukan dalam file.");
        }

        $headers = $allRows[$headerIndex];
        $headers = array_map(fn($h) => trim($h ?? ''), $headers);

        $dataRows = array_slice($allRows, $headerIndex + 1);

        $data = array_map(function ($row) use ($headers) {
            $paddedRow = array_pad($row, count($headers), null);
            $trimmedRow = array_slice($paddedRow, 0, count($headers));
            return array_combine($headers, $trimmedRow);
        }, $dataRows);

        return [
            'filename' => $filename,
            'header_row' => $headerRow,
            'data_count' => count($data),
            'data' => $data,
        ];
    }

    public function readFileAndFilterByKey(string $path, string $key, string $connectorColumn, int $headerRow = 1): array
    {
        $fullPath = Storage::path($path);
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $allData = [];
        $headers = [];
        $headerOffset = $headerRow - 1;

        if (in_array($extension, ['xlsx', 'xls'])) {
            $spreadsheet = IOFactory::load($fullPath);
            $sheet = $spreadsheet->getActiveSheet();

            $headerRange = 'A' . $headerRow . ':' . $sheet->getHighestColumn() . $headerRow;
            $headerRowData = $sheet->rangeToArray($headerRange, null, true, true, true)[$headerRow];
            $headers = array_map('trim', $headerRowData);

            foreach ($sheet->getRowIterator($headerRow + 1) as $row) {
                $rowData = [];
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false);

                foreach ($cellIterator as $index => $cell) {
                    $headerName = $headers[$index] ?? null;
                    if ($headerName) {
                        $rowData[$headerName] = $cell->getValue();
                    }
                }

                if (count(array_filter($rowData))) {
                    $allData[] = $rowData;
                }
            }
        } elseif ($extension === 'csv') {
            $content = file_get_contents($fullPath);
            $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
            
            if ($encoding !== 'UTF-8') {
                $content = mb_convert_encoding($content, 'UTF-8', $encoding);
            }

            $csv = Reader::createFromString($content);
            $csv->setDelimiter(',');
            $allRows = iterator_to_array($csv->getRecords());

            if (!isset($allRows[$headerOffset])) {
                throw new \Exception("Baris header #{$headerRow} tidak ditemukan dalam file.");
            }

            $rawHeaders = $allRows[$headerOffset];
            $headers = [];
            $headerCount = [];

            foreach ($rawHeaders as $index => $header) {
                $trimmedHeader = trim($header ?? '');
                if ($trimmedHeader === '') {
                    $trimmedHeader = "Column_" . $index;
                }

                if (!isset($headerCount[$trimmedHeader])) {
                    $headerCount[$trimmedHeader] = 0;
                    $headers[] = $trimmedHeader;
                } else {
                    $headerCount[$trimmedHeader]++;
                    $headers[] = $trimmedHeader . '_' . $headerCount[$trimmedHeader];
                }
            }

            $dataRows = array_slice($allRows, $headerOffset + 1);
            foreach ($dataRows as $row) {
                $rowData = [];
                foreach ($headers as $index => $headerName) {
                    $rowData[$headerName] = $row[$index] ?? null;
                }
                if (count(array_filter($rowData))) {
                    $allData[] = $rowData;
                }
            }
        }

        $filteredData = array_filter($allData, function ($row) use ($connectorColumn, $key) {
            $rowKey = trim((string) ($row[$connectorColumn] ?? ''));
            $searchKey = trim((string) $key);
            return strcasecmp($rowKey, $searchKey) === 0;
        });

        Log::info('Filtered data count', [
            'connector_column' => $connectorColumn,
            'key' => $key,
            'total_rows' => count($allData),
            'filtered_count' => count($filteredData)
        ]);

        return [
            $headers,
            ...array_values($filteredData)
        ];
    }
}
