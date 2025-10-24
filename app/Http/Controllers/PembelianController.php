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
use League\Csv\Reader;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
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

        // 🔹 Load validation (source) CSV
        $validationPath = "validation/{$validationDoc}.csv";
        if (!Storage::exists($validationPath)) {
            Log::error('Validation document not found', ['path' => $validationPath]);
            return response()->json(['error' => "Dokumen validasi {$validationDoc}.csv tidak ditemukan."], 404);
        }

        $validationContent = Storage::get($validationPath);
        $encoding = mb_detect_encoding($validationContent, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
        if ($encoding !== 'UTF-8') {
            $validationContent = mb_convert_encoding($validationContent, 'UTF-8', $encoding);
        }

        $validationCsv = Reader::createFromString($validationContent);
        $validationCsv->setDelimiter(',');
        $validationCsv->setHeaderOffset(0);
        $validationHeaders = array_map('trim', $validationCsv->getHeader()); // Trim headers to be safe
        $validationRecords = iterator_to_array($validationCsv->getRecords());

        Log::info('Validation document loaded', ['recordCount' => count($validationRecords), 'headers' => $validationHeaders]);

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
            return response()->json(['error' => "Kolom '{$validationConnector}' tidak ditemukan dalam file validasi."], 400);
        }

        if ($uploadedSum && !in_array($uploadedSum, $headers)) {
            Log::error('Uploaded sum field missing', ['column' => $uploadedSum, 'availableHeaders' => $headers]);
            return response()->json(['error' => "Kolom '{$uploadedSum}' tidak ditemukan dalam file upload."], 400);
        }

        if ($validationSum && !in_array($validationSum, $validationHeaders)) {
            Log::error('Validation sum field missing', ['column' => $validationSum, 'availableHeaders' => $validationHeaders]);
            return response()->json(['error' => "Kolom '{$validationSum}' tidak ditemukan dalam file validasi."], 400);
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
                $invalidGroups[$key] = [
                    'error' => 'Key not found in validation data',
                    'uploaded_total' => $uploadedValue,
                    'source_total' => 0
                ];
            } else if (abs($uploadedValue - $validationValue) > 0.01) {
                $invalidGroups[$key] = [
                    'error' => 'Total mismatch between uploaded and source data',
                    'uploaded_total' => $uploadedValue,
                    'source_total' => $validationValue
                ];
            }
        }

        // 🔹 Count mismatched records before grouping (each individual record that belongs to an invalid group)
        $invalidRows = [];
        $mismatchedRecordCount = 0;
        
        foreach ($data as $index => $row) {
            $key = trim($row[$uploadedConnector] ?? '');
            if ($key === '')
                continue; // Skip empty keys
            
            // Check if this row's key belongs to an invalid group
            if (isset($invalidGroups[$key])) {
                // This row is part of an invalid group, so count it as mismatched
                $invalidRows[] = [
                    'row_index' => $index,
                    'key_value' => $key,
                    'total_omset' => $cleanAndParseFloat($row[$uploadedSum] ?? 0),
                    'error' => $invalidGroups[$key]['error']
                ];
                $mismatchedRecordCount++;
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

        \App\Models\Validation::create([
            'file_name' => $filename,
            'role' => auth()->user()?->role ?? 'unknown', // assuming user is authenticated, fallback to 'unknown'
            'user_id' => auth()->user()?->id ?? null, // assuming user is authenticated, fallback to null
            'document_type' => 'Pembelian',
            'document_category' => ucfirst(strtolower($type)), // Reguler, Retur, Urgent
            'score' => $score,
            'total_records' => $totalRecords,
            'matched_records' => $matchedRecords,
            'mismatched_records' => $mismatchedRecords,
        ]);

        return response()->json([
            'status' => count($invalidGroups) > 0 ? 'invalid' : 'valid',
            'invalid_groups' => $invalidGroups,
            'invalid_rows' => $invalidRows,
        ]);
    }


    public function dashboard()
    {
        $files = collect(Storage::files('uploads'))->map(function ($path) {
            $fullPath = storage_path("app/{$path}");
            return [
                'name' => basename($path),
                'path' => $path,
                // 'size' => round(File::size($fullPath) / 1024, 2), // size in KB
                // 'modified' => date('Y-m-d H:i:s', File::lastModified($fullPath)),
                // 'url' => route('files.download', ['filename' => basename($path)]),
            ];
        });

        return inertia('UploadsDashboard', [
            'files' => $files,
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


        return Inertia::render('pembelian/show', [
            'validationId' => $id,
            'validationData' => $validationData,
        ]);
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

