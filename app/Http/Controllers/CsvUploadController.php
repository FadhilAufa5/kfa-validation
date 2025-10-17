<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CsvUser;
use League\Csv\Reader;
use League\Csv\Exception;
use Illuminate\Support\Facades\Storage;

class CsvUploadController extends Controller
{
    public function store(Request $request)
    {
        if (!$request->hasFile('file')) {
            return response()->json(['message' => 'File tidak ditemukan'], 400);
        }

        $file = $request->file('file');

        // Simpan sementara
        $path = $file->storeAs('uploads', $file->getClientOriginalName(), 'public');

        try {
            // Baca CSV
            $csv = Reader::createFromPath(storage_path("app/public/{$path}"), 'r');
            $csv->setHeaderOffset(0); 
            $records = $csv->getRecords();

            foreach ($records as $record) {
                CsvUser::updateOrCreate(
                    ['email' => $record['Email']],
                    [
                        'username' => $record['Username'] ?? null,
                        'role' => $record['Role'] ?? null,
                        'status' => $record['Status'] ?? null,
                    ]
                );
            }

            return response()->json(['message' => 'Data CSV berhasil disimpan ke database']);
        }   catch (Exception $e) {
            return response()->json(['message' => 'Gagal membaca file CSV', 'error' => $e->getMessage()], 500);
        }
    }
}
