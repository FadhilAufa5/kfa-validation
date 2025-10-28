<?php

namespace App\Http\Controllers;

use App\Models\PembelianRetur;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationData;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Config;

use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\Pembelian\PembelianRegulerImport;
use App\Imports\Pembelian\PembelianReturImport;
use App\Imports\Pembelian\PembelianUrgentImport;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use League\Csv\Reader;
use DB;
use Illuminate\Support\Facades\Log;


class PembelianController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('pembelian/index');
    }

    public function history()
    {
        return Inertia::render('pembelian/history');
    }


    public function reguler()
    {
        $document_type = 'Pembelian';
        $document_category = 'Reguler';
        return Inertia::render('pembelian/upload', [
            'document_type' => $document_type,
            'document_category' => $document_category,
        ]);
    }

    public function retur()
    {
        $document_type = 'Pembelian';
        $document_category = 'Retur';
        return Inertia::render('pembelian/upload', [
            'document_type' => $document_type,
            'document_category' => $document_category,
        ]);
    }

    public function urgent()
    {
        $document_type = 'Pembelian';
        $document_category = 'Urgent';
        return Inertia::render('pembelian/upload', [
            'document_type' => $document_type,
            'document_category' => $document_category,
        ]);
    }

    // public function store(Request $request, $type)
    // {
    //     $request->validate([
    //         'document' => 'required|file|mimes:xlsx,xls,csv|max:51200',
    //     ]);

    //     $importMap = [
    //         'reguler' => \App\Imports\Pembelian\RegularImport::class,
    //         'retur' => \App\Imports\Pembelian\ReturImport::class,
    //         'urgent' => \App\Imports\Pembelian\UrgentImport::class,
    //     ];

    //     $key = strtolower($type);

    //     if (!isset($importMap[$key])) {
    //         return back()->with('error', 'Tipe dokumen tidak valid.');
    //     }

    //     try {
    //         Excel::import(new $importMap[$key], $request->file('document'));
    //     } catch (\Throwable $e) {
    //         \Log::error('Excel import error', ['message' => $e->getMessage()]);
    //         return back()->with('error', 'Terjadi kesalahan saat mengimpor: ' . $e->getMessage());
    //     }

    //     return back()->with('success', 'Dokumen ' . ucfirst($type) . ' berhasil diimpor!');
    // }


    // public function storeRetur(Request $request)
    // {
    //     $request->validate([
    //         'document' => 'required|file|mimes:xlsx,xls,csv|max:51200',
    //     ]);

    //     try {
    //         Excel::import(new PembelianReturImport, $request->file('document'));
    //         return back()->with('success', 'Data berhasil diimpor!');
    //     } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
    //         // Handle validation errors inside the Excel file
    //         $failures = $e->failures();
    //         $messages = [];

    //         foreach ($failures as $failure) {
    //             $messages[] = 'Baris ' . $failure->row() . ': ' . implode(', ', $failure->errors());
    //         }

    //         \Log::error('Excel validation error', ['errors' => $messages]);

    //         return back()->with('error', 'Kesalahan validasi pada file Excel.')->with('failures', $messages);
    //     } catch (\Throwable $e) {
    //         \Log::error('Excel import error', ['message' => $e->getMessage()]);
    //         return back()->with('error', 'Terjadi kesalahan saat mengimpor: ' . $e->getMessage());
    //     }
    // }


    // public function storeReguler(Request $request)
    // {
    //     $request->validate([
    //         'document' => 'required|file|mimes:xlsx,xls,csv|max:51200',
    //     ]);

    //     try {
    //         Excel::import(new PembelianRegulerImport, $request->file('document'));
    //     } catch (\Throwable $e) {
    //         \Log::error('Excel import error', ['message' => $e->getMessage()]);
    //         return back()->with('error', 'Terjadi kesalahan saat mengimpor: ' . $e->getMessage());
    //     }

    //     return back()->with('success', 'Dokumen Reguler berhasil diimpor!');
    // }

    // public function storeUrgent(Request $request)
    // {
    //     $request->validate([
    //         'document' => 'required|file|mimes:xlsx,xls,csv|max:51200',
    //     ]);

    //     try {
    //         Excel::import(new PembelianUrgentImport, $request->file('document'));
    //     } catch (\Throwable $e) {
    //         \Log::error('Excel import error', ['message' => $e->getMessage()]);
    //         return back()->with('error', 'Terjadi kesalahan saat mengimpor: ' . $e->getMessage());
    //     }

    //     return back()->with('success', 'Dokumen Urgent berhasil diimpor!');
    // }

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
        $uploadDir = storage_path("app/private/uploads/{$doc_type}");
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

            $path = "uploads/{$doc_type}/{$originalName}.csv";
        } else {
            // Move CSV as-is
            $path = $file->storeAs("uploads/{$doc_type}", "{$originalName}.csv");
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

        if (!Storage::exists($path)) {
            Log::warning('File not found for validation', ['path' => $path]);
            return response()->json(['error' => 'File tidak ditemukan.'], 404);
        }

        // 🔹 Load config for this document type
        $config = Config::get('pembelian_validation.' . strtolower($type));
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

        // 🔹 Load validation data from SQLite table
        try {
            // Get columns from the table to use as headers
            $tableColumns = DB::getSchemaBuilder()->getColumnListing($validationDoc);
            $validationHeaders = array_map('trim', $tableColumns);
            
            // Get all records from the table
            $validationRecords = DB::table($validationDoc)->get()->map(function ($record) {
                return (array) $record;
            })->toArray();
            
            Log::info('Validation data loaded from database', ['recordCount' => count($validationRecords), 'table' => $validationDoc]);
            
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

        Log::info('Loading uploaded file', ['extension' => $extension, 'path' => $fullPath]);

        if (in_array($extension, ['xlsx', 'xls'])) {
            // FIX 2: Correctly parse Excel files into associative arrays
            $spreadsheet = IOFactory::load($fullPath);
            $sheet = $spreadsheet->getActiveSheet();
            $headerRow = $sheet->rangeToArray('A1:' . $sheet->getHighestColumn() . '1', null, true, true, true)[1];
            $headers = array_map('trim', $headerRow); // Get headers from the first row

            // Start reading data from the second row
            foreach ($sheet->getRowIterator(2) as $row) {
                $rowData = [];
                $cellIterator = $row->getCellIterator();
                $cellIterator->setIterateOnlyExistingCells(false); // Iterate all cells, even if empty

                foreach ($cellIterator as $index => $cell) {
                    $headerName = $headers[$index] ?? null;
                    if ($headerName) {
                        $rowData[$headerName] = $cell->getValue();
                    }
                }
                // Only add non-empty rows
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

            $csv = Reader::createFromString($content);
            $csv->setDelimiter(',');
            $csv->setHeaderOffset(0);
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

        // 🔹 Validate required columns
        if (!in_array($uploadedConnector, $headers)) {
            Log::error('Uploaded connector missing', ['column' => $uploadedConnector, 'availableHeaders' => $headers]);
            return response()->json(['error' => "Kolom '{$uploadedConnector}' tidak ditemukan dalam file upload."], 400);
        }

        if (!in_array($validationConnector, $validationHeaders)) {
            Log::error('Validation connector missing', ['column' => $validationConnector, 'availableHeaders' => $validationHeaders]);
            return response()->json(['error' => "Kolom '{$validationConnector}' tidak ditemukan dalam tabel validasi."], 400);
        }

        if ($uploadedSum && !in_array($uploadedSum, $headers)) {
            Log::error('Uploaded sum field missing', ['column' => $uploadedSum, 'availableHeaders' => $headers]);
            return response()->json(['error' => "Kolom '{$uploadedSum}' tidak ditemukan dalam file upload."], 400);
        }

        if ($validationSum && !in_array($validationSum, $validationHeaders)) {
            Log::error('Validation sum field missing', ['column' => $validationSum, 'availableHeaders' => $validationHeaders]);
            return response()->json(['error' => "Kolom '{$validationSum}' tidak ditemukan dalam tabel validasi."], 400);
        }

        // A private helper function would be even cleaner, but this works well.
        $cleanAndParseFloat = function ($value) {
            if (!is_string($value)) {
                return is_numeric($value) ? (float) $value : 0.0;
            }
            // FIX 1: More robust number parsing. Removes anything not a digit, dot, or minus sign.
            // This handles currency symbols (Rp, $), thousand separators (,), etc.
            return (float) preg_replace('/[^\d.-]/', '', $value);
        };

        // 🔹 Build validation map (key to total value)
        $validationMap = [];
        foreach ($validationRecords as $record) {
            $key = trim($record[$validationConnector] ?? '');
            if ($key === '')
                continue; // Skip empty keys
            $value = $cleanAndParseFloat($record[$validationSum] ?? 0);
            $validationMap[$key] = ($validationMap[$key] ?? 0) + $value;
        }

        // 🔹 Create a map of uploaded values by key for validation comparison
        $uploadedMapByGroup = [];
        foreach ($data as $row) {
            $key = trim($row[$uploadedConnector] ?? '');
            if ($key === '')
                continue; // Skip empty keys
            $value = $cleanAndParseFloat($row[$uploadedSum] ?? 0);
            $uploadedMapByGroup[$key] = ($uploadedMapByGroup[$key] ?? 0) + $value;
        }

        // 🔹 Compare grouped totals and identify invalid groups
        $invalidGroups = [];
        foreach ($uploadedMapByGroup as $key => $uploadedValue) {
            $validationValue = $validationMap[$key] ?? null;
            if ($validationValue === null) {
                // Check if uploaded value is 0, then categorize as valid with note
                if ($uploadedValue == 0) {
                    // This is considered valid - no return value exists in either document
                    continue; // Skip adding to invalid groups
                } else {
                    // Key not found in validation but uploaded has value
                    $invalidGroups[$key] = [
                        'discrepancy_category' => 'im_invalid', // Key not found in validation
                        'error' => 'Key not found in validation data',
                        'uploaded_total' => $uploadedValue,
                        'source_total' => 0,
                        'discrepancy_value' => $uploadedValue // All uploaded value is discrepancy
                    ];
                }
            } else if (abs($uploadedValue - $validationValue) > 1000.01) { // Changed to allow tolerance of -100 to 100
                $discrepancy_value = $uploadedValue - $validationValue;
                $invalidGroups[$key] = [
                    'discrepancy_category' => 'discrepancy', // Value mismatch beyond tolerance
                    'error' => 'Total mismatch between uploaded and source data beyond tolerance',
                    'uploaded_total' => $uploadedValue,
                    'source_total' => $validationValue,
                    'discrepancy_value' => $discrepancy_value
                ];
            }
            // If the difference is within tolerance (-100 to 100), don't add to invalid groups, treat as matched
        }

        // 🔹 Create matched groups (similar to invalid groups)
        $matchedGroups = [];
        foreach ($uploadedMapByGroup as $key => $uploadedValue) {
            $validationValue = $validationMap[$key] ?? null;
            
            if ($validationValue === null) {
                // Check if uploaded value is 0, then categorize as valid with note
                if ($uploadedValue == 0) {
                    // Retur doesn't exist in validation and uploaded has 0 value
                    $matchedGroups[$key] = [
                        'uploaded_total' => $uploadedValue,
                        'source_total' => 0,
                        'difference' => 0,
                        'note' => 'Retur Doesn\'t Record'
                    ];
                }
                // else: already added to invalidGroups above
            } else {
                $difference = $uploadedValue - $validationValue;
                if (abs($difference) <= 1000.01) { // Within tolerance
                    if ($difference == 0) {
                        $note = 'Sum Matched';
                    } else {
                        $note = 'Pembulatan';
                    }
                    $matchedGroups[$key] = [
                        'uploaded_total' => $uploadedValue,
                        'source_total' => $validationValue,
                        'difference' => $difference,
                        'note' => $note
                    ];
                }
                // else: already added to invalidGroups above
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
                $invalidRows[] = [
                    'row_index' => $index,
                    'key_value' => $key,
                    'error' => $invalidGroups[$key]['error']
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

        // 🔹 Summary and response
        $executionTime = microtime(true) - $startTime;
        Log::info('Validation completed', [
            'invalidGroupCount' => count($invalidGroups),
            'invalidRowCount' => $mismatchedRecordCount,
            'executionTime' => $executionTime,
            'status' => $mismatchedRecordCount > 0 ? 'invalid' : 'valid'
        ]);

        // 🔹 Save validation result to database
        $totalRecords = count($data);
        $mismatchedRecords = $mismatchedRecordCount;
        $matchedRecords = $totalRecords - $mismatchedRecords;
        $score = $totalRecords > 0 ? round(($matchedRecords / $totalRecords) * 100, 2) : 100.00;

        $validationRecord = \App\Models\Validation::create([
            'file_name' => $filename,
            'role' => auth()->user()?->role ?? 'unknown', // assuming user is authenticated, fallback to 'unknown'
            'user_id' => auth()->user()?->id ?? null, // assuming user is authenticated, fallback to null
            'document_type' => 'Pembelian',
            'document_category' => ucfirst(strtolower($type)), // Reguler, Retur, Urgent
            'score' => $score,
            'total_records' => $totalRecords,
            'matched_records' => $matchedRecords,
            'mismatched_records' => $mismatchedRecords,
            'validation_details' => [
                'invalid_groups' => $invalidGroups,
                'invalid_rows' => $invalidRows,
                'matched_groups' => $matchedGroups,
                'matched_rows' => $matchedRows,
            ],
        ]);

        return response()->json([
            'status' => count($invalidGroups) > 0 ? 'invalid' : 'valid',
            'invalid_groups' => $invalidGroups,
            'invalid_rows' => $invalidRows,
            'validation_id' => $validationRecord->id, // Return the validation record ID for redirect
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

    public function validateDocument(Request $request)
    {
        $type = $request->type;
        $docType = $request->docType;
        $fileName = $request->fileName;

        $uploadedPath = storage_path("app/uploads/$fileName");
        $uploaded = collect(array_map('str_getcsv', file($uploadedPath)))->skip(1);

        $rule = config("document_validation.$type.$docType");
        [$uploadKey, $dbKey] = $rule['connector'];
        [$uploadSum, $dbSum] = $rule['sum'];
        $table = $rule['table'];

        $validation = DB::table($table)->get()->map(fn($r) => (array) $r);

        $invalidRows = $uploaded->filter(function ($row) use ($validation, $uploadKey, $dbKey, $uploadSum, $dbSum) {
            $match = $validation->firstWhere($dbKey, $row[$uploadKey] ?? null);
            if (!$match)
                return true; // connector not found
            return floatval($row[$uploadSum] ?? 0) != floatval($match[$dbSum] ?? 0); // value mismatch
        });

        return response()->json(['invalid_rows' => $invalidRows->values()]);
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
            return Inertia::render('pembelian/show', [
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
            'isValid' => $validation->mismatched_records === 0,
        ];

        // Only return basic validation data here, not the full details
        // The details will be loaded separately via new API endpoints

        return Inertia::render('pembelian/show', [
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

                // Handle comparison based on data type
                if (is_string($aValue) && is_string($bValue)) {
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
     * Get paginated matched groups data
     */
    public function getMatchedRecords($id, Request $request)
    {
        $validation = \App\Models\Validation::find($id);

        if (!$validation) {
            return response()->json(['error' => 'Validation data not found'], 404);
        }

        $matchedGroups = $validation->validation_details['matched_groups'] ?? [];

        // Convert to array format for easier processing
        $allItems = [];
        foreach ($matchedGroups as $key => $group) {
            $allItems[] = array_merge(['key' => $key], $group);
        }

        // Extract unique notes for filters
        $uniqueNotes = array_values(array_unique(array_map(function ($item) {
            return $item['note'];
        }, $allItems)));

        // Get request parameters for filtering and pagination
        $searchTerm = $request->input('search', '');
        $noteFilter = $request->input('note', '');
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

        // Apply note filter
        if ($noteFilter) {
            $filteredItems = array_filter($filteredItems, function ($item) use ($noteFilter) {
                return $item['note'] === $noteFilter;
            });
        }

        // Apply sorting
        if ($sortKey && $sortDirection) {
            usort($filteredItems, function ($a, $b) use ($sortKey, $sortDirection) {
                $aValue = $a[$sortKey] ?? null;
                $bValue = $b[$sortKey] ?? null;

                // Handle comparison based on data type
                if (is_string($aValue) && is_string($bValue)) {
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

        if (!$key || !$type) {
            Log::error('Missing required parameters');
            return response()->json(['error' => 'Missing required parameters'], 400);
        }

        try {
            // Get the document category to determine which config to use
            $docCategory = strtolower($validation->document_category);
            $config = Config::get('pembelian_validation.' . $docCategory);

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
                $data = $this->readFileAndFilterByKey($path, $key, $connectorColumn);
                Log::info('Uploaded Data Response', ['data' => $data]);

                return response()->json([
                    'filename' => $filename,
                    'connector_column' => $connectorColumn,
                    'key' => $key,
                    'data' => $data,
                ]);

            } elseif ($type === 'validation') {
                // Read validation data from database
                $validationTable = $config['doc_val'];
                
                try {
                    $connectorColumn = $config['connector'][1]; // e.g., 'no_transaksi'
                    $data = $this->readDatabaseAndFilterByKey($validationTable, $key, $connectorColumn);
                    Log::info('Validation Data Response', ['data' => $data]);

                    return response()->json([
                        'filename' => $validationTable,
                        'connector_column' => $connectorColumn,
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
    private function readFileAndFilterByKey($path, $key, $connectorColumn)
    {
        $fullPath = Storage::path($path);
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $allData = [];
        $headers = [];

        if (in_array($extension, ['xlsx', 'xls'])) {
            $spreadsheet = IOFactory::load($fullPath);
            $sheet = $spreadsheet->getActiveSheet();
            $headerRow = $sheet->rangeToArray('A1:' . $sheet->getHighestColumn() . '1', null, true, true, true)[1];
            $headers = array_map('trim', $headerRow);

            foreach ($sheet->getRowIterator(2) as $row) {
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
            $csv->setHeaderOffset(0);
            $headers = array_map('trim', $csv->getHeader());
            $allData = iterator_to_array($csv->getRecords());
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




/**
 * Show the form for editing the specified resource.
 */
// public function edit(string $id)
// {
//     //
// }

/**
 * Update the specified resource in storage.
 */
// public function update(Request $request, string $id)
// {
//     //
// }

/**
 * Remove the specified resource from storage.
 */
// public function destroy(string $id)
// {
//     //
// }

