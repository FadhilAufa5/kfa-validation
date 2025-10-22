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
        $document_type = 'Reguler';
        return Inertia::render('pembelian/upload', [
            'document_type' => $document_type,
        ]);
    }

    public function retur()
    {
        $document_type = 'Retur';
        return Inertia::render('pembelian/upload', [
            'document_type' => $document_type,
        ]);
    }

    public function urgent()
    {
        $document_type = 'Urgent';
        return Inertia::render('pembelian/upload', [
            'document_type' => $document_type,
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


    public function storeRetur(Request $request)
    {
        $request->validate([
            'document' => 'required|file|mimes:xlsx,xls,csv|max:51200',
        ]);

        try {
            Excel::import(new PembelianReturImport, $request->file('document'));
            return back()->with('success', 'Data berhasil diimpor!');
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            // Handle validation errors inside the Excel file
            $failures = $e->failures();
            $messages = [];

            foreach ($failures as $failure) {
                $messages[] = 'Baris ' . $failure->row() . ': ' . implode(', ', $failure->errors());
            }

            \Log::error('Excel validation error', ['errors' => $messages]);

            return back()->with('error', 'Kesalahan validasi pada file Excel.')->with('failures', $messages);
        } catch (\Throwable $e) {
            \Log::error('Excel import error', ['message' => $e->getMessage()]);
            return back()->with('error', 'Terjadi kesalahan saat mengimpor: ' . $e->getMessage());
        }
    }


    public function storeReguler(Request $request)
    {
        $request->validate([
            'document' => 'required|file|mimes:xlsx,xls,csv|max:51200',
        ]);

        try {
            Excel::import(new PembelianRegulerImport, $request->file('document'));
        } catch (\Throwable $e) {
            \Log::error('Excel import error', ['message' => $e->getMessage()]);
            return back()->with('error', 'Terjadi kesalahan saat mengimpor: ' . $e->getMessage());
        }

        return back()->with('success', 'Dokumen Reguler berhasil diimpor!');
    }

    public function storeUrgent(Request $request)
    {
        $request->validate([
            'document' => 'required|file|mimes:xlsx,xls,csv|max:51200',
        ]);

        try {
            Excel::import(new PembelianUrgentImport, $request->file('document'));
        } catch (\Throwable $e) {
            \Log::error('Excel import error', ['message' => $e->getMessage()]);
            return back()->with('error', 'Terjadi kesalahan saat mengimpor: ' . $e->getMessage());
        }

        return back()->with('success', 'Dokumen Urgent berhasil diimpor!');
    }

    public function save(Request $request, $type)
    {
        $request->validate([
            'document' => 'required|file|mimes:xlsx,xls,csv|max:16240',
        ]);

        $file = $request->file('document');
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension();
        $fullFilename = $originalName . '.' . 'csv';
        $doc_type = $type;

        // Define the base directory for uploads
        $uploadDir = storage_path("app/private/uploads");

        // Ensure the uploads directory exists
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $csvPath = "{$uploadDir}/{$originalName}.csv";

        if (in_array(strtolower($extension), ['xls', 'xlsx'])) {
            // Convert Excel to CSV
            $spreadsheet = IOFactory::load($file->getRealPath());
            $writer = new Csv($spreadsheet);
            $writer->save($csvPath);
            $path = "uploads/{$originalName}.csv";
        } else {
            // Just save the CSV file as-is
            $path = $file->storeAs("uploads/$doc_type", $file->getClientOriginalName());
        }

        return response()->json(['filename' => $fullFilename]);
    }

    public function saveTemp(Request $request)
    {
        $request->validate([
            'document' => 'required|file|mimes:xlsx,xls,csv|max:10240', // Max 10MB
        ]);

        try {
            $file = $request->file('document');
            // Create a unique filename to avoid collisions
            $filename = uniqid('upload_', true) . '.' . $file->getClientOriginalExtension();

            // Store the file in the 'uploads' disk
            $file->storeAs('uploads', $filename);

            return response()->json(['filename' => $filename]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Gagal menyimpan file di server: ' . $e->getMessage(),
            ], 500);
        }
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

        if ($id == '2') {
            $dummyData = [
                'fileName' => 'laporan_q3_error.xlsx',
                'role' => 'Manager',
                'category' => 'Urgent',
                'score' => 85.50,
                'matched' => 1710,
                'total' => 2000,
                'discrepancy' => 290,
                'isValid' => false,
            ];
        } else {
            $dummyData = [
                'fileName' => 'beli_reg_sap.csv',
                'role' => 'Accountant',
                'category' => 'Reguler',
                'score' => 100.00,
                'matched' => 4020,
                'total' => 4020,
                'discrepancy' => 0,
                'isValid' => true,
            ];
        }


        return Inertia::render('pembelian/show', [
            'validationId' => $id,
            'validationData' => $dummyData,
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

