<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationData;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Config;

use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use League\Csv\Reader;
use DB;
use Illuminate\Support\Facades\Log;


class PenjualanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('penjualan/index');
    }

    public function history()
    {
        return Inertia::render('pembelian/history');
    }


    public function reguler()
    {
        $document_type = 'penjualan';
        $document_category = 'Reguler';
        return Inertia::render('penjualan/upload', [
            'document_type' => $document_type,
            'document_category' => $document_category,
        ]);
    }

    public function ecommerce()
    {
        $document_type = 'penjualan';
        $document_category = 'ecommerce';
        return Inertia::render('penjualan/upload', [
            'document_type' => $document_type,
            'document_category' => $document_category,
        ]);
    }

    public function debitur()
    {
        $document_type = 'penjualan';
        $document_category = 'Debitur';
        return Inertia::render('penjualan/upload', [
            'document_type' => $document_type,
            'document_category' => $document_category,
        ]);
    }

    public function konsi()
    {
        $document_type = 'penjualan';
        $document_category = 'Konsi';
        return Inertia::render('penjualan/upload', [
            'document_type' => $document_type,
            'document_category' => $document_category,
        ]);
    }

    public function save(Request $request, $type)
    {
        $request->validate([
            'document' => 'required|file|mimes:xlsx,xls,csv|max:16240',
        ]);

        $file = $request->file('document');
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = strtolower($file->getClientOriginalExtension());
        $doc_type = $type;

        // Define the base directory for uploads
        $uploadDir = storage_path("app/private/uploads");
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $csvPath = "{$uploadDir}/{$originalName}.csv";

        if (in_array($extension, ['xls', 'xlsx'])) {
            // Load spreadsheet with data type preservation
            $reader = IOFactory::createReaderForFile($file->getRealPath());
            $reader->setReadDataOnly(false);
            $spreadsheet = $reader->load($file->getRealPath());

            // Write to CSV preserving numeric and string values
            $writer = new Csv($spreadsheet);
            $writer->setDelimiter(',');
            $writer->setEnclosure('"');
            $writer->setLineEnding("\r\n");
            $writer->setSheetIndex(0);
            $writer->setUseBOM(true); // Helps for UTF-8 safety
            $writer->save($csvPath);

            $path = "uploads/{$originalName}.csv";
        } else {
            // Move CSV as-is
            $path = $file->storeAs("uploads/", "{$originalName}.csv");
        }

        return response()->json(['filename' => "{$originalName}.csv"]);
    }

    public function validateFile(Request $request, $type)
    {
        $startTime = microtime(true);
        Log::info('Starting validation process', ['type' => $type, 'filename' => $request->input('filename')]);

        $request->validate([
            'filename' => 'required|string',
        ]);

        $filename = $request->input('filename');
        $path = "uploads/{$filename}";

        // Get header row from request, default to 1 (first row) if not provided
        $headerRow = (int) $request->input('headerRow', 1);
        if ($headerRow < 1) {
            Log::error('Invalid header row provided', ['headerRow' => $headerRow]);
            return response()->json(['error' => 'Baris header tidak valid.'], 400);
        }
        // Convert to 0-based index for CSV processing
        $headerOffset = $headerRow - 1;

        if (!Storage::exists($path)) {
            Log::warning('File not found for validation', ['path' => $path]);
            return response()->json(['error' => 'File tidak ditemukan.'], 404);
        }

        // 🔹 Load config for this document type
        $config = Config::get('penjualan_validation.' . strtolower($type));
        if (!$config) {
            Log::error('Invalid document type for validation', ['type' => $type]);
            return response()->json(['error' => 'Tipe dokumen tidak valid.'], 400);
        }

        $validationDoc = $config['doc_val'];
        $connector = $config['connector']; // e.g. ['Nomor Retur', 'no_transaksi']
        $sumFields = $config['sum'];       // e.g. ['jumlah_retur', 'dpp']

        // 🔹 Ensure both connector values exist
        if (count($connector) < 2) {
            return response()->json(['error' => 'Konfigurasi connector tidak lengkap.'], 400);
        }

        $uploadedConnector = $connector[0];
        $validationConnector = $connector[1];
        $uploadedSum = $sumFields[0] ?? null;
        $validationSum = $sumFields[1] ?? null;

        Log::info('Validation configuration loaded', [
            'validationDoc' => $validationDoc,
            'uploadedConnector' => $uploadedConnector,
            'validationConnector' => $validationConnector,
            'uploadedSum' => $uploadedSum,
            'validationSum' => $validationSum,
        ]);

        // 🔹 Load validation data from SQLite table with optimization
        try {
            // Get validation data with only necessary columns
            $validationRecords = DB::table($validationDoc)
                ->select([$validationConnector, $validationSum]) // Only fetch columns used for comparison
                ->get()
                ->map(function ($record) use ($validationConnector, $validationSum) {
                    return [
                        $validationConnector => trim($record->{$validationConnector} ?? ''),
                        $validationSum => floatval($record->{$validationSum} ?? 0)
                    ];
                })
                ->toArray();

            Log::info('Validation data loaded from database (optimized)', ['recordCount' => count($validationRecords), 'table' => $validationDoc]);

            if (empty($validationRecords)) {
                Log::error('No validation data found in table', ['table' => $validationDoc]);
                return response()->json(['error' => "Tidak ada data validasi dalam tabel {$validationDoc}."], 404);
            }

        } catch (\Exception $e) {
            Log::error('Failed to load validation data from database', ['table' => $validationDoc, 'error' => $e->getMessage()]);
            return response()->json(['error' => 'Gagal memuat data validasi dari database.'], 500);
        }

        // 🔹 Load uploaded file
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $fullPath = Storage::path($path);
        $data = [];
        $headers = [];

        Log::info('Loading uploaded file', ['extension' => $extension, 'path' => $fullPath, 'headerRow' => $headerRow]);

        if (in_array($extension, ['xlsx', 'xls'])) {
            // Optimized Excel reading with chunked processing
            $spreadsheet = IOFactory::load($fullPath);
            $sheet = $spreadsheet->getActiveSheet();

            // Validate that the header row exists
            $highestRow = $sheet->getHighestRow();
            if ($headerRow > $highestRow) {
                Log::error('Header row not found in Excel file', ['headerRow' => $headerRow, 'totalRows' => $highestRow]);
                return response()->json(['error' => "Baris header #{$headerRow} tidak ditemukan dalam file."], 400);
            }

            // Get headers from the specified header row
            $headerRange = 'A' . $headerRow . ':' . $sheet->getHighestColumn() . $headerRow;
            $headerRowData = $sheet->rangeToArray($headerRange, null, true, true, true)[$headerRow];
            $headers = array_map('trim', $headerRowData);

            // Read all data rows after header without chunking
            $dataRows = $sheet->rangeToArray('A' . ($headerRow + 1) . ':' . $sheet->getHighestColumn() . $highestRow, null, true, false, false);

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

        } elseif ($extension === 'csv') {
            $content = file_get_contents($fullPath);
            $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
            if ($encoding !== 'UTF-8') {
                $content = mb_convert_encoding($content, 'UTF-8', $encoding);
            }

            // First validate that the header row exists by reading all rows
            $tempCsv = Reader::createFromString($content);
            $tempCsv->setDelimiter(',');
            $allRows = iterator_to_array($tempCsv->getRecords());

            if (!isset($allRows[$headerOffset])) {
                Log::error('Header row not found in CSV file', ['headerRow' => $headerRow, 'totalRows' => count($allRows)]);
                return response()->json(['error' => "Baris header #{$headerRow} tidak ditemukan dalam file."], 400);
            }

            $csv = Reader::createFromString($content);
            $csv->setDelimiter(',');
            $csv->setHeaderOffset($headerOffset); // Use dynamic header offset instead of hardcoded 0
            $headers = array_map('trim', $csv->getHeader()); // Trim headers to be safe
            $data = iterator_to_array($csv->getRecords());

        } else {
            Log::error('Unsupported file format', ['extension' => $extension]);
            return response()->json(['error' => 'Format file tidak didukung.'], 400);
        }

        if (empty($data)) {
            Log::error('Uploaded file has no data', ['filename' => $filename]);
            return response()->json(['error' => 'File tidak memiliki data.'], 400);
        }

        Log::info('Uploaded file loaded', ['rowCount' => count($data), 'headers' => $headers]);

        // 🔹 Validate required columns in uploaded file
        if (!in_array($uploadedConnector, $headers)) {
            Log::error('Uploaded connector missing', ['column' => $uploadedConnector, 'availableHeaders' => $headers]);
            return response()->json(['error' => "Kolom '{$uploadedConnector}' tidak ditemukan dalam file upload."], 400);
        }

        if ($uploadedSum && !in_array($uploadedSum, $headers)) {
            Log::error('Uploaded sum field missing', ['column' => $uploadedSum, 'availableHeaders' => $headers]);
            return response()->json(['error' => "Kolom '{$uploadedSum}' tidak ditemukan dalam file upload."], 400);
        }

        // Helper function for robust number parsing
        $cleanAndParseFloat = function ($value) {
            if (!is_string($value)) {
                return is_numeric($value) ? (float) $value : 0.0;
            }
            // Removes anything not a digit, dot, or minus sign
            return (float) preg_replace('/[^\d.-]/', '', $value);
        };

        // 🔹 Optimized single-pass validation: build all maps efficiently
        $validationMap = [];
        $uploadedMapByGroup = [];

        // Stream validation data and build validation map
        foreach ($validationRecords as $record) {
            $key = trim($record[$validationConnector] ?? '');
            if ($key === '')
                continue;

            $value = $cleanAndParseFloat($record[$validationSum] ?? 0);
            $validationMap[$key] = ($validationMap[$key] ?? 0) + $value;
        }

        // Stream uploaded data and build uploaded map
        foreach ($data as $row) {
            $key = trim($row[$uploadedConnector] ?? '');
            if ($key === '')
                continue;

            $value = $cleanAndParseFloat($row[$uploadedSum] ?? 0);
            $uploadedMapByGroup[$key] = ($uploadedMapByGroup[$key] ?? 0) + $value;
        }

        // 🔹 Compare grouped totals and identify invalid groups
        $invalidGroups = [];
        $matchedGroups = [];

        foreach ($uploadedMapByGroup as $key => $uploadedValue) {
            $validationValue = $validationMap[$key] ?? null;

            if ($validationValue === null) {
                // Key not found in validation data
                if ($uploadedValue == 0) {
                    // Retur doesn't exist in validation and uploaded has 0 value
                    $matchedGroups[$key] = [
                        'uploaded_total' => $uploadedValue,
                        'source_total' => 0,
                        'difference' => 0,
                        'note' => 'Retur Doesn\'t Record'
                    ];
                } else {
                    // Key not found in validation but uploaded has value
                    $invalidGroups[$key] = [
                        'discrepancy_category' => 'im_invalid',
                        'error' => 'Key not found in validation data',
                        'uploaded_total' => $uploadedValue,
                        'source_total' => 0,
                        'discrepancy_value' => $uploadedValue
                    ];
                }
            } else {
                // Key exists in both files
                // Check if either value is 0 or null (missing data case)
                if ($uploadedValue == 0 || $validationValue == 0) {
                    // Missing data in one of the files
                    $invalidGroups[$key] = [
                        'discrepancy_category' => 'missing',
                        'error' => 'Key exists in both files but one has missing or zero value',
                        'uploaded_total' => $uploadedValue,
                        'source_total' => $validationValue,
                        'discrepancy_value' => $uploadedValue - $validationValue
                    ];
                } else {
                    // Both values exist and are non-zero
                    $difference = $uploadedValue - $validationValue;
                    if (abs($difference) <= 1000.01) {
                        // Within tolerance
                        $note = ($difference == 0) ? 'Sum Matched' : 'Pembulatan';
                        $matchedGroups[$key] = [
                            'uploaded_total' => $uploadedValue,
                            'source_total' => $validationValue,
                            'difference' => $difference,
                            'note' => $note
                        ];
                    } else {
                        // Value mismatch beyond tolerance
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

        // 🔹 Count mismatched records and track matched records
        $invalidRows = [];
        $matchedRows = [];
        $mismatchedRecordCount = 0;

        foreach ($data as $index => $row) {
            $key = trim($row[$uploadedConnector] ?? '');
            if ($key === '')
                continue; // Skip empty keys

            // Find the validation value for this key
            $validationValue = $validationMap[$key] ?? null;
            $uploadedValue = $cleanAndParseFloat($row[$uploadedSum] ?? 0);
            $groupUploadedValue = $uploadedMapByGroup[$key] ?? 0;

            $isMatched = false;
            $isIgnoredZero = false;

            if ($validationValue === null) {
                // Key not found in validation data
                if ($groupUploadedValue == 0) {
                    // This entire group is considered valid/ignored since total is 0
                    $isIgnoredZero = true;
                    // Add to matched rows
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
                // Check if the difference is within tolerance
                $diff = abs($groupUploadedValue - $validationValue);
                $isMatched = $diff <= 1000.01; // Within tolerance of -100 to 100
            }

            // If this record belongs to a key that is not matched (invalid), count it as mismatched
            if (!$isMatched && !$isIgnoredZero && isset($invalidGroups[$key])) {
                // This row is part of an invalid group, so count it as mismatched
                $error = $invalidGroups[$key]['error'];
                $invalidRows[] = [
                    'row_index' => $index,
                    'key_value' => $key,
                    'error' => $error
                ];
                $mismatchedRecordCount++;
            } else if ($isMatched && !$isIgnoredZero) {
                // This row is part of a matched group, track it as matched
                $matchedRows[] = [
                    'row_index' => $index,
                    'key_value' => $key,
                    'validation_source_total' => $validationValue,
                    'uploaded_total' => $uploadedValue,
                ];
            }
        }

        // 🔹 Use invalid groups directly
        $allInvalidGroups = $invalidGroups;

        // 🔹 Summary and response
        $executionTime = microtime(true) - $startTime;
        Log::info('Validation completed', [
            'invalidGroupCount' => count($allInvalidGroups),
            'invalidRowCount' => $mismatchedRecordCount,
            'executionTime' => $executionTime,
            'status' => $mismatchedRecordCount > 0 ? 'invalid' : 'valid'
        ]);

        // 🔹 Save validation result to database
        $totalRecords = count($data);
        $mismatchedRecords = $mismatchedRecordCount;
        $matchedRecords = $totalRecords - $mismatchedRecords;
        $score = $totalRecords > 0 ? round(($matchedRecords / $totalRecords) * 100, 2) : 100.00;

        // 🔹 Debug logging to understand the mismatch
        Log::info('Matched vs Mismatch Analysis', [
            'matchedGroupsCount' => count($matchedGroups),
            'matchedRowsCount' => count($matchedRows),
            'mismatchedRecordCount' => $mismatchedRecordCount,
            'totalRecords' => $totalRecords,
            'matched_records_calculation' => $totalRecords - $mismatchedRecordCount,
            'sampleMatchedGroups' => array_slice($matchedGroups, 0, 3, true),
            'sampleMatchedRows' => array_slice($matchedRows, 0, 3, true)
        ]);

        $validationRecord = \App\Models\Validation::create([
            'file_name' => $filename,
            'role' => auth()->user()?->role ?? 'unknown',
            'user_id' => auth()->user()?->id ?? null,
            'document_type' => 'penjualan',
            'document_category' => ucfirst(strtolower($type)),
            'score' => $score,
            'total_records' => $totalRecords,
            'matched_records' => $matchedRecords,
            'mismatched_records' => $mismatchedRecords,
            'validation_details' => [
                'invalid_groups' => $allInvalidGroups,
                'invalid_rows' => $invalidRows,
                'matched_groups' => $matchedGroups,
                'matched_rows' => $matchedRows,
            ],
        ]);

        return response()->json([
            'status' => count($allInvalidGroups) > 0 ? 'invalid' : 'valid',
            'invalid_groups' => $allInvalidGroups,
            'invalid_rows' => $invalidRows,
            'validation_id' => $validationRecord->id,
        ]);
    }


    public function delete($filename)
    {
        $path = "uploads/{$filename}";
        if (!Storage::exists($path)) {
            return back()->with('error', 'File tidak ditemukan.');
        }

        Storage::delete($path);

        return back()->with('success', "File {$filename} berhasil dihapus.");
    }

    public function process($filename)
    {
        $path = "uploads/{$filename}";

        if (!Storage::exists($path)) {
            return back()->with('error', 'File tidak ditemukan.');
        }

        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $fullPath = Storage::path($path);
        $data = [];

        try {
            if (in_array($extension, ['xlsx', 'xls'])) {
                $spreadsheet = IOFactory::load($fullPath);
                $sheet = $spreadsheet->getActiveSheet();
                $data = $sheet->toArray(null, true, true, true);
            } elseif ($extension === 'csv') {
                // Read file as text and normalize encoding
                $content = file_get_contents($fullPath);
                $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
                if ($encoding !== 'UTF-8') {
                    $content = mb_convert_encoding($content, 'UTF-8', $encoding);
                }

                // Create CSV reader
                $csv = Reader::createFromString($content);
                $csv->setDelimiter(','); // Adjust if needed (e.g., ';')

                // ✅ Auto-detect header row (find first non-empty row with text headers)
                $records = iterator_to_array($csv->getRecords());
                $headerRowIndex = null;

                foreach ($records as $i => $row) {
                    // Heuristic: if most columns have non-numeric text, it’s likely the header
                    $textCount = count(array_filter($row, fn($cell) => !is_numeric($cell) && trim($cell) !== ''));
                    if ($textCount >= count($row) / 2) {
                        $headerRowIndex = $i;
                        break;
                    }
                }

                if ($headerRowIndex === null) {
                    throw new \Exception('Tidak dapat menemukan header yang valid dalam file CSV.');
                }

                // Re-read CSV with header offset set
                $csv = Reader::createFromString($content);
                $csv->setHeaderOffset($headerRowIndex);
                $data = iterator_to_array($csv->getRecords());
            } else {
                return back()->with('error', 'Format file tidak didukung.');
            }

            // Normalize to UTF-8
            $data = $this->utf8ize($data);

            return response()->json([
                'filename' => $filename,
                'header_row' => $headerRowIndex ?? 0,
                'row_count' => count($data),
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Gagal memproses file: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function preview($filename)
    {
        $path = "uploads/{$filename}";
        if (!Storage::exists($path)) {
            return response()->json(['error' => 'File tidak ditemukan.'], 404);
        }

        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $fullPath = Storage::path($path);
        $rows = [];

        try {
            if (in_array($extension, ['xlsx', 'xls'])) {
                $spreadsheet = IOFactory::load($fullPath);
                $sheet = $spreadsheet->getActiveSheet();
                $rows = $sheet->toArray(null, true, true, true);
            } elseif ($extension === 'csv') {
                $content = file_get_contents($fullPath);
                $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
                if ($encoding !== 'UTF-8') {
                    $content = mb_convert_encoding($content, 'UTF-8', $encoding);
                }

                $csv = Reader::createFromString($content);
                $csv->setDelimiter(',');
                $records = iterator_to_array($csv->getRecords());
                $rows = array_values($records);
            } else {
                return response()->json(['error' => 'Format file tidak didukung.'], 400);
            }

            // Return only first 10 rows for preview
            $preview = array_slice($rows, 0, 10);

            return response()->json([
                'filename' => $filename,
                'preview' => $preview,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal membaca file: ' . $e->getMessage()], 500);
        }
    }

    public function processWithHeader($filename, Request $request)
    {
        $path = "uploads/{$filename}";
        if (!Storage::exists($path)) {
            return response()->json(['error' => 'File tidak ditemukan.'], 404);
        }

        // Get 1-based header row from user, default to 1 if not provided.
        $headerRow = (int) $request->input('headerRow', 1);
        if ($headerRow < 1) {
            return response()->json(['error' => 'Baris header tidak valid.'], 400);
        }
        // ✨ Convert the 1-based user input to a 0-based index for PHP arrays.
        $headerIndex = $headerRow - 1;

        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $fullPath = Storage::path($path);
        $data = [];

        try {
            $allRows = [];

            if ($extension === 'csv') {
                $content = file_get_contents($fullPath);
                $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
                if ($encoding !== 'UTF-8') {
                    $content = mb_convert_encoding($content, 'UTF-8', $encoding);
                }
                $csv = Reader::createFromString($content);
                $csv->setDelimiter(',');
                // This correctly returns a 0-indexed array of arrays.
                $allRows = iterator_to_array($csv->getRecords());
            } elseif (in_array($extension, ['xlsx', 'xls'])) {
                $spreadsheet = IOFactory::load($fullPath);
                $sheet = $spreadsheet->getActiveSheet();
                // ✨ CRITICAL CHANGE: Get rows as a simple 0-indexed array.
                // By setting the last parameter to `false`, we get a standard numeric array,
                // making the logic identical to the CSV processor.
                $allRows = $sheet->toArray(null, true, true, false);

                // Clean up any trailing empty rows that PhpSpreadsheet might return.
                $allRows = array_filter($allRows, function ($row) {
                    return !empty(array_filter($row, fn($cell) => $cell !== null && $cell !== ''));
                });
                $allRows = array_values($allRows); // Re-index array after filtering
            }

            // --- UNIFIED PROCESSING LOGIC ---

            if (!isset($allRows[$headerIndex])) {
                throw new \Exception("Baris header #{$headerRow} tidak ditemukan dalam file.");
            }

            // Get the header row using the correct 0-based index.
            $headers = $allRows[$headerIndex];
            // Sanitize headers: trim whitespace and handle potential null values.
            $headers = array_map(fn($h) => trim($h ?? ''), $headers);

            // Get all rows *after* the header row.
            $dataRows = array_slice($allRows, $headerIndex + 1);

            $data = array_map(function ($row) use ($headers) {
                // Ensure the data row has the same number of elements as the header.
                // Pad with nulls if it's shorter.
                $paddedRow = array_pad($row, count($headers), null);
                // Trim if it's longer.
                $trimmedRow = array_slice($paddedRow, 0, count($headers));

                // This will now combine correctly.
                return array_combine($headers, $trimmedRow);
            }, $dataRows);

            return response()->json([
                'filename' => $filename,
                'header_row' => $headerRow, // Return the original 1-based number for context
                'data_count' => count($data),
                'data' => $data, // This is now correctly formatted!
            ]);

        } catch (\Exception $e) {
            // Provide a more specific error message if array_combine fails
            if (str_contains($e->getMessage(), 'array_combine')) {
                return response()->json([
                    'error' => 'Gagal memproses file: Terjadi ketidakcocokan jumlah kolom antara header dan baris data. Pastikan file terformat dengan benar.',
                ], 500);
            }
            return response()->json([
                'error' => 'Gagal memproses file: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function utf8ize($data)
    {
        if (is_array($data)) {
            return array_map([$this, 'utf8ize'], $data);
        } elseif (is_string($data)) {
            // Detect if not UTF-8, then convert
            return mb_convert_encoding($data, 'UTF-8', 'UTF-8, ISO-8859-1, Windows-1252');
        }
        return $data;
    }

    public function create()
    {
        //
    }


    /**
     * Display the specified resource.
     */


    public function show($id)
    {
        $validation = \App\Models\Validation::find($id);

        if (!$validation) {
            return Inertia::render('penjualan/show', [
                'validationId' => $id,
                'validationData' => null,
                'error' => 'Validation data not found',
            ]);
        }

        $validationData = [
            'fileName' => $validation->file_name,
            'role' => $validation->role,
            'category' => $validation->document_category,
            'score' => $validation->score,
            'matched' => $validation->matched_records,
            'total' => $validation->total_records,
            'mismatched' => $validation->mismatched_records,
            'invalidGroups' => count($validation->validation_details['invalid_groups'] ?? []),
            'matchedGroups' => count($validation->validation_details['matched_groups'] ?? []),
            'isValid' => $validation->mismatched_records === 0,
        ];

        // Only return basic validation data here, not the full details
        // The details will be loaded separately via new API endpoints

        return Inertia::render('penjualan/show', [
            'validationId' => $id,
            'validationData' => $validationData,
        ]);
    }

    /**
     * Get uploaded document data by filename
     */
    public function getUploadedDocumentData($filename)
    {
        try {
            $path = "uploads/{$filename}";

            if (!Storage::exists($path)) {
                return response()->json(['error' => 'File tidak ditemukan.'], 404);
            }

            $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            $fullPath = Storage::path($path);
            $data = [];

            if (in_array($extension, ['xlsx', 'xls'])) {
                $spreadsheet = IOFactory::load($fullPath);
                $sheet = $spreadsheet->getActiveSheet();
                $data = $sheet->toArray(null, true, true, true);
            } elseif ($extension === 'csv') {
                $content = file_get_contents($fullPath);
                $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
                if ($encoding !== 'UTF-8') {
                    $content = mb_convert_encoding($content, 'UTF-8', $encoding);
                }

                $csv = Reader::createFromString($content);
                $csv->setDelimiter(',');
                $records = iterator_to_array($csv->getRecords());
                $data = array_values($records);
            } else {
                return response()->json(['error' => 'Format file tidak didukung.'], 400);
            }

            // Return only first 100 rows for performance
            $preview = array_slice($data, 0, 100);

            return response()->json([
                'filename' => $filename,
                'data' => $preview,
                'total_rows' => count($data),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal membaca file: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get validation document data by filename
     */
    public function getValidationDocumentData($filename)
    {
        try {
            $path = "validation/{$filename}";

            if (!Storage::exists($path)) {
                return response()->json(['error' => 'File validasi tidak ditemukan.'], 404);
            }

            $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
            $fullPath = Storage::path($path);
            $data = [];

            if (in_array($extension, ['xlsx', 'xls'])) {
                $spreadsheet = IOFactory::load($fullPath);
                $sheet = $spreadsheet->getActiveSheet();
                $data = $sheet->toArray(null, true, true, true);
            } elseif ($extension === 'csv') {
                $content = file_get_contents($fullPath);
                $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
                if ($encoding !== 'UTF-8') {
                    $content = mb_convert_encoding($content, 'UTF-8', $encoding);
                }

                $csv = Reader::createFromString($content);
                $csv->setDelimiter(',');
                $records = iterator_to_array($csv->getRecords());
                $data = array_values($records);
            } else {
                return response()->json(['error' => 'Format file validasi tidak didukung.'], 400);
            }

            // Return only first 100 rows for performance
            $preview = array_slice($data, 0, 100);

            return response()->json([
                'filename' => $filename,
                'data' => $preview,
                'total_rows' => count($data),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Gagal membaca file validasi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get all invalid groups data for charts (without pagination)
     */
    public function getAllInvalidGroups($id, Request $request)
    {
        $validation = \App\Models\Validation::find($id);

        if (!$validation) {
            return response()->json(['error' => 'Validation data not found'], 404);
        }

        $invalidGroups = $validation->validation_details['invalid_groups'] ?? [];

        // Convert to array format for easier processing
        $allItems = [];
        foreach ($invalidGroups as $key => $group) {
            $allItems[] = array_merge(['key' => $key], $group, [
                // Determine source label for filtering
                'sourceLabel' => $this->getSourceLabel($group),
            ]);
        }

        return response()->json($allItems);
    }

    /**
     * Get all matched records data for charts (without pagination)
     */
    public function getAllMatchedGroups($id, Request $request)
    {
        $validation = \App\Models\Validation::find($id);

        if (!$validation) {
            return response()->json(['error' => 'Validation data not found'], 404);
        }

        // Get individual matched rows
        $matchedRows = $validation->validation_details['matched_rows'] ?? [];

        // Get matched groups once to avoid repeated lookups
        $matchedGroups = $validation->validation_details['matched_groups'] ?? [];

        // Process all matched records without limits
        $allItems = [];

        foreach ($matchedRows as $row) {
            $key = $row['key_value'];
            $groupInfo = $matchedGroups[$key] ?? null;

            $allItems[] = [
                'key' => $key,
                'uploaded_total' => $row['uploaded_total'],
                'source_total' => $row['validation_source_total'],
                'difference' => $row['uploaded_total'] - ($row['validation_source_total'] ?? 0),
                'note' => $groupInfo['note'] ?? 'Sum Matched',
                'is_individual_row' => true,
            ];
        }

        return response()->json($allItems);
    }

    /**
     * Get paginated invalid groups data
     */
    public function getInvalidGroups($id, Request $request)
    {
        $validation = \App\Models\Validation::find($id);

        if (!$validation) {
            return response()->json(['error' => 'Validation data not found'], 404);
        }

        $invalidGroups = $validation->validation_details['invalid_groups'] ?? [];

        // Convert to array format for easier processing
        $allItems = [];
        foreach ($invalidGroups as $key => $group) {
            $allItems[] = array_merge(['key' => $key], $group, [
                // Determine source label for filtering
                'sourceLabel' => $this->getSourceLabel($group),
            ]);
        }

        // Extract unique categories and sources for filters
        $uniqueCategories = array_values(array_unique(array_map(function ($item) {
            return $item['discrepancy_category'];
        }, $allItems)));

        $uniqueSources = array_values(array_unique(array_map(function ($item) {
            return $item['sourceLabel'];
        }, $allItems)));

        // Get request parameters for filtering and pagination
        $searchTerm = $request->input('search', '');
        $categoryFilter = $request->input('category', '');
        $sourceFilter = $request->input('source', '');
        $sortKey = $request->input('sort_key', 'key');
        $sortDirection = $request->input('sort_direction', 'asc');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);

        // Apply search filter - search in the 'key' field (Kunci column)
        $filteredItems = $allItems;
        if ($searchTerm) {
            $filteredItems = array_filter($filteredItems, function ($item) use ($searchTerm) {
                return stripos($item['key'], $searchTerm) !== false;
            });
        }

        // Apply category filter
        if ($categoryFilter) {
            $filteredItems = array_filter($filteredItems, function ($item) use ($categoryFilter) {
                return $item['discrepancy_category'] === $categoryFilter;
            });
        }

        // Apply source filter
        if ($sourceFilter) {
            $filteredItems = array_filter($filteredItems, function ($item) use ($sourceFilter) {
                return $item['sourceLabel'] === $sourceFilter;
            });
        }

        // Apply sorting
        if ($sortKey && $sortDirection) {
            usort($filteredItems, function ($a, $b) use ($sortKey, $sortDirection) {
                $aValue = $a[$sortKey] ?? null;
                $bValue = $b[$sortKey] ?? null;

                // Handle sorting for discrepancy_value by absolute value
                if ($sortKey === 'discrepancy_value') {
                    $result = abs($aValue) <=> abs($bValue);
                }
                // Handle comparison based on data type
                else if (is_string($aValue) && is_string($bValue)) {
                    $result = strcasecmp($aValue, $bValue);
                } else {
                    $result = $aValue <=> $bValue;
                }

                return $sortDirection === 'desc' ? -$result : $result;
            });
        }

        // Calculate pagination
        $totalItems = count($filteredItems);
        $offset = ($page - 1) * $perPage;
        $paginatedItems = array_slice($filteredItems, $offset, $perPage);

        return response()->json([
            'data' => $paginatedItems,
            'pagination' => [
                'current_page' => (int) $page,
                'per_page' => (int) $perPage,
                'total' => $totalItems,
                'total_pages' => ceil($totalItems / $perPage),
            ],
            'filters' => [
                'search' => $searchTerm,
                'category' => $categoryFilter,
                'source' => $sourceFilter,
            ],
            'sort' => [
                'key' => $sortKey,
                'direction' => $sortDirection,
            ],
            'uniqueFilters' => [
                'categories' => $uniqueCategories,
                'sources' => $uniqueSources,
            ],
        ]);
    }

    /**
     * Get paginated matched records data (individual rows)
     */
    public function getMatchedRecords($id, Request $request)
    {
        $validation = \App\Models\Validation::find($id);

        if (!$validation) {
            return response()->json(['error' => 'Validation data not found'], 404);
        }

        // Get individual matched rows, not matched groups
        $matchedRows = $validation->validation_details['matched_rows'] ?? [];

        // Get matched groups once to avoid repeated lookups
        $matchedGroups = $validation->validation_details['matched_groups'] ?? [];

        // Get request parameters for filtering and pagination
        $searchTerm = $request->input('search', '');
        $noteFilter = $request->input('note', '');
        $sortKey = $request->input('sort_key', 'row_index');
        $sortDirection = $request->input('sort_direction', 'asc');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);

        // Build a set of unique notes efficiently while filtering
        $uniqueNotesSet = [];
        $filteredItems = [];

        // Process rows with early filtering to avoid processing all items
        foreach ($matchedRows as $row) {
            $key = $row['key_value'];

            // Apply search filter early
            if ($searchTerm && stripos($key, $searchTerm) === false) {
                continue;
            }

            $groupInfo = $matchedGroups[$key] ?? null;
            $note = $groupInfo['note'] ?? 'Sum Matched';

            // Track unique notes
            $uniqueNotesSet[$note] = true;

            // Apply note filter early
            if ($noteFilter && $note !== $noteFilter) {
                continue;
            }

            $filteredItems[] = [
                'row_index' => $row['row_index'],
                'key' => $key,
                'uploaded_total' => $row['uploaded_total'],
                'source_total' => $row['validation_source_total'],
                'difference' => $row['uploaded_total'] - ($row['validation_source_total'] ?? 0),
                'note' => $note,
                'is_individual_row' => true,
            ];
        }

        $uniqueNotes = array_keys($uniqueNotesSet);

        // Apply sorting only on filtered items
        if ($sortKey && $sortDirection) {
            usort($filteredItems, function ($a, $b) use ($sortKey, $sortDirection) {
                $aValue = $a[$sortKey] ?? null;
                $bValue = $b[$sortKey] ?? null;

                // Handle sorting for difference by absolute value
                if ($sortKey === 'difference') {
                    $result = abs($aValue) <=> abs($bValue);
                }
                // Handle comparison based on data type
                else if (is_string($aValue) && is_string($bValue)) {
                    $result = strcasecmp($aValue, $bValue);
                } else {
                    $result = $aValue <=> $bValue;
                }

                return $sortDirection === 'desc' ? -$result : $result;
            });
        }

        // Calculate pagination
        $totalItems = count($filteredItems);
        $offset = ($page - 1) * $perPage;
        $paginatedItems = array_slice($filteredItems, $offset, $perPage);

        return response()->json([
            'data' => $paginatedItems,
            'pagination' => [
                'current_page' => (int) $page,
                'per_page' => (int) $perPage,
                'total' => $totalItems,
                'total_pages' => ceil($totalItems / $perPage),
            ],
            'filters' => [
                'search' => $searchTerm,
                'note' => $noteFilter,
            ],
            'sort' => [
                'key' => $sortKey,
                'direction' => $sortDirection,
            ],
            'uniqueFilters' => [
                'notes' => $uniqueNotes,
            ],
        ]);
    }

    /**
     * Helper method to determine source label for filtering
     */
    private function getSourceLabel($group)
    {
        // Determine if discrepancy is from validation or uploaded file
        $isFromValidation = $group['source_total'] > $group['uploaded_total'] && $group['discrepancy_value'] < 0;
        $isFromUploaded = $group['uploaded_total'] > $group['source_total'] && $group['discrepancy_value'] > 0;
        $isKeyNotFound = $group['discrepancy_category'] === 'im_invalid';

        if ($isKeyNotFound) {
            return 'Tidak Ditemukan di Sumber';
        } else if ($isFromUploaded) {
            return 'File Sumber';
        } else if ($isFromValidation) {
            return 'File Diupload';
        } else {
            return 'Tidak Diketahui';
        }
    }

    /**
     * Get validation history with search and filter
     */
    public function getValidationHistory(Request $request)
    {
        $search = $request->input('search', '');
        $filterStatus = $request->input('status', 'All');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);

        $query = \App\Models\Validation::query();

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('file_name', 'LIKE', "%{$search}%")
                    ->orWhere('role', 'LIKE', "%{$search}%")
                    ->orWhere('document_type', 'LIKE', "%{$search}%")
                    ->orWhere('document_category', 'LIKE', "%{$search}%");
            });
        }

        // Apply status filter
        if ($filterStatus !== 'All') {
            if ($filterStatus === 'Valid') {
                $query->where('mismatched_records', 0);
            } elseif ($filterStatus === 'Invalid') {
                $query->where('mismatched_records', '>', 0);
            }
        }

        $query->orderBy('created_at', 'desc');

        $validations = $query->paginate($perPage, ['*'], 'page', $page);

        // Transform the data to match the table format
        $data = $validations->getCollection()->map(function ($validation) {
            $isValid = $validation->mismatched_records === 0;

            return [
                'id' => $validation->id,
                'user' => $validation->role,
                'fileName' => $validation->file_name,
                'documentCategory' => $validation->document_category,
                'uploadTime' => $validation->created_at->format('Y-m-d H:i'),
                'score' => number_format($validation->score, 2) . '%',
                'status' => $isValid ? 'Valid' : 'Invalid',
            ];
        });

        return response()->json([
            'data' => $data,
            'pagination' => [
                'current_page' => $validations->currentPage(),
                'last_page' => $validations->lastPage(),
                'per_page' => $validations->perPage(),
                'total' => $validations->total(),
                'from' => $validations->firstItem(),
                'to' => $validations->lastItem(),
            ],
            'filters' => [
                'search' => $search,
                'status' => $filterStatus,
            ],
        ]);
    }

    /**
     * Get document comparison data for a specific key
     */
    public function getDocumentComparisonData($id, Request $request)
    {
        $validation = \App\Models\Validation::find($id);

        if (!$validation) {
            Log::error('Validation data not found');
            return response()->json(['error' => 'Validation data not found'], 404);
        }

        $key = $request->input('key');
        $type = $request->input('type'); // 'uploaded' or 'validation'
        $headerRow = $request->input('header_row', 1); // Get header row from frontend, default to 1

        if (!$key || !$type) {
            Log::error('Missing required parameters');
            return response()->json(['error' => 'Missing required parameters'], 400);
        }

        try {
            // Get the document category to determine which config to use
            $docCategory = strtolower($validation->document_category);
            Log::info('Document comparison request details', [
                'validation_id' => $id,
                'key' => $key,
                'type' => $type,
                'document_category' => $validation->document_category,
                'docCategory_lower' => $docCategory,
                'available_configs' => array_keys(Config::get('penjualan_validation')),
            ]);

            $config = Config::get('penjualan_validation.' . $docCategory);

            if (!$config) {
                Log::error('Invalid document category');
                return response()->json(['error' => 'Invalid document category'], 400);
            }

            if ($type === 'uploaded') {
                // Read uploaded file
                $filename = $validation->file_name;
                $path = "uploads/{$filename}";

                if (!Storage::exists($path)) {
                    Log::error('Uploaded file not found');
                    return response()->json(['error' => 'Uploaded file not found'], 404);
                }

                $connectorColumn = $config['connector'][0]; // e.g., 'NOMOR PENERIMAAN'
                $sumField = $config['sum'][0] ?? null; // e.g., 'jumlah_retur'
                $data = $this->readFileAndFilterByKey($path, $key, $connectorColumn, $headerRow);
                Log::info('Uploaded Data Response', ['data' => $data]);

                return response()->json([
                    'filename' => $filename,
                    'connector_column' => $connectorColumn,
                    'sum_field' => $sumField,
                    'key' => $key,
                    'data' => $data,
                ]);

            } elseif ($type === 'validation') {
                // Read validation data from database
                $validationTable = $config['doc_val'];

                try {
                    $connectorColumn = $config['connector'][1]; // e.g., 'no_transaksi'
                    $sumField = $config['sum'][1] ?? null; // e.g., 'dpp'
                    $data = $this->readDatabaseAndFilterByKey($validationTable, $key, $connectorColumn);
                    Log::info('Validation Data Response', ['data' => $data]);

                    return response()->json([
                        'filename' => $validationTable,
                        'connector_column' => $connectorColumn,
                        'sum_field' => $sumField,
                        'key' => $key,
                        'data' => $data,
                    ]);

                } catch (\Exception $e) {
                    Log::error('Failed to read validation data from database', ['table' => $validationTable, 'error' => $e->getMessage()]);
                    return response()->json(['error' => 'Gagal membaca data validasi dari database'], 500);
                }
            }

            return response()->json(['error' => 'Invalid type parameter'], 400);

        } catch (\Exception $e) {
            Log::error('Error fetching document comparison data', [
                'error' => $e->getMessage(),
                'validation_id' => $id,
                'key' => $key,
                'type' => $type,
            ]);
            return response()->json(['error' => 'Failed to fetch document data: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Helper method to read database and filter by key
     */
    private function readDatabaseAndFilterByKey($tableName, $key, $connectorColumn)
    {
        try {
            // Get table columns to use as headers
            $headers = DB::getSchemaBuilder()->getColumnListing($tableName);
            $headers = array_map('trim', $headers);

            // Query the database to get records matching the key (case-insensitive exact match first, fallback to LIKE)
            $exactRecords = DB::table($tableName)
                ->where(DB::raw('LOWER(TRIM(' . $connectorColumn . '))'), '=', strtolower(trim($key)))
                ->get()
                ->map(function ($record) {
                    return (array) $record;
                })
                ->toArray();

            if (empty($exactRecords)) {
                // Fallback to LIKE search if no exact match found
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

            // Add headers as first element
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

    /**
     * Helper method to read file and filter by key
     */
    private function readFileAndFilterByKey($path, $key, $connectorColumn, $headerRow = 1)
    {
        $fullPath = Storage::path($path);
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $allData = [];
        $headers = [];

        // Convert 1-based header row to 0-based index
        $headerOffset = $headerRow - 1;

        if (in_array($extension, ['xlsx', 'xls'])) {
            $spreadsheet = IOFactory::load($fullPath);
            $sheet = $spreadsheet->getActiveSheet();

            // Use dynamic header row instead of hardcoded row 1
            $headerRange = 'A' . $headerRow . ':' . $sheet->getHighestColumn() . $headerRow;
            $headerRowData = $sheet->rangeToArray($headerRange, null, true, true, true)[$headerRow];
            $headers = array_map('trim', $headerRowData);

            // Read data rows starting after the header row
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

            // Read all rows without using setHeaderOffset to avoid duplicate column name error
            $allRows = iterator_to_array($csv->getRecords());

            if (!isset($allRows[$headerOffset])) {
                Log::error('Header row not found in CSV for document comparison', [
                    'headerRow' => $headerRow,
                    'totalRows' => count($allRows)
                ]);
                throw new \Exception("Baris header #{$headerRow} tidak ditemukan dalam file.");
            }

            // Get headers manually and handle duplicates by appending index
            $rawHeaders = $allRows[$headerOffset];
            $headers = [];
            $headerCount = [];

            foreach ($rawHeaders as $index => $header) {
                $trimmedHeader = trim($header ?? '');
                if ($trimmedHeader === '') {
                    $trimmedHeader = "Column_" . $index;
                }

                // Handle duplicate headers by appending a counter
                if (!isset($headerCount[$trimmedHeader])) {
                    $headerCount[$trimmedHeader] = 0;
                    $headers[] = $trimmedHeader;
                } else {
                    $headerCount[$trimmedHeader]++;
                    $headers[] = $trimmedHeader . '_' . $headerCount[$trimmedHeader];
                }
            }

            // Build associative array data manually
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

        // Filter data by the connector key (case-insensitive and trimmed)
        $filteredData = array_filter($allData, function ($row) use ($connectorColumn, $key) {
            $rowKey = trim((string) ($row[$connectorColumn] ?? ''));
            $searchKey = trim((string) $key);
            return strcasecmp($rowKey, $searchKey) === 0; // Case-insensitive comparison
        });

        Log::info('Filtered data count', [
            'connector_column' => $connectorColumn,
            'key' => $key,
            'total_rows' => count($allData),
            'filtered_count' => count($filteredData)
        ]);

        // Add headers as first element
        return [
            $headers,
            ...array_values($filteredData)
        ];
    }
}

