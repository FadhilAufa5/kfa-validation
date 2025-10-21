<?php

namespace App\Http\Controllers;

use App\Models\PembelianRetur;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationData;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\Pembelian\PembelianRegulerImport;
use App\Imports\Pembelian\PembelianReturImport;
use App\Imports\Pembelian\PembelianUrgentImport;

use PhpOffice\PhpSpreadsheet\IOFactory;
use League\Csv\Reader;
use PhpOffice\PhpSpreadsheet\Writer\Csv;


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

        // Define the base directory for uploads
        $uploadDir = storage_path('app/private/uploads');

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
            $path = $file->storeAs('uploads', $file->getClientOriginalName());
        }

        return back()->with('success', "File berhasil disimpan di: {$path}");
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

        $headerRow = (int) $request->input('headerRow', 0);
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $fullPath = Storage::path($path);
        $data = [];

        try {
            if ($extension === 'csv') {
                $content = file_get_contents($fullPath);
                $encoding = mb_detect_encoding($content, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
                if ($encoding !== 'UTF-8') {
                    $content = mb_convert_encoding($content, 'UTF-8', $encoding);
                }

                // Create CSV reader
                $csv = Reader::createFromString($content);
                $csv->setDelimiter(',');

                // ✅ Read all rows first
                $allRows = iterator_to_array($csv->getRecords());

                // ✅ Extract header & data rows correctly
                if (!isset($allRows[$headerRow])) {
                    throw new \Exception("Baris header ($headerRow) tidak ditemukan.");
                }

                $headers = array_values($allRows[$headerRow]);
                $dataRows = array_slice($allRows, $headerRow + 1);

                // ✅ Combine headers with the data rows
                $data = array_map(function ($row) use ($headers) {
                    // Match headers with row values safely
                    return array_combine($headers, array_pad(array_values($row), count($headers), null));
                }, $dataRows);
            } elseif (in_array($extension, ['xlsx', 'xls'])) {
                $spreadsheet = IOFactory::load($fullPath);
                $sheet = $spreadsheet->getActiveSheet();
                $allRows = $sheet->toArray(null, true, true, true);

                if (!isset($allRows[$headerRow + 1])) {
                    throw new \Exception("Baris header ($headerRow) tidak ditemukan.");
                }

                // Convert to 0-based index for array_slice
                $headers = array_values($allRows[$headerRow]);
                $dataRows = array_slice($allRows, $headerRow + 1);

                $data = array_map(function ($row) use ($headers) {
                    return array_combine($headers, array_values($row));
                }, $dataRows);
            }

            return response()->json([
                'filename' => $filename,
                'header_row' => $headerRow,
                'data_count' => count($data),
                'data' => $data,
            ]);
        } catch (\Exception $e) {
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

