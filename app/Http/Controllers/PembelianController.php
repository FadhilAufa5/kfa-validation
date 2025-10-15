<?php

namespace App\Http\Controllers;

use App\Imports\Pembelian\PembelianRegulerImport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

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
        return Inertia::render('pembelian/reguler');
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,txt|max:51200', // 50MB
        ]);

        try {
            $path = $request->file('file')->getRealPath();

            // Ambil sheet pertama & baris pertama (header)
            $collection = Excel::toCollection(null, $path)->first();
            $headers = $collection->first()->keys()->toArray();

            // Kolom wajib sesuai dengan import yang diharapkan
            $required = ['transaction_number', 'kode_komunikasi_sap', 'outlet_name', 'date', 'total'];

            // Cek kolom
            $missing = array_diff($required, $headers);
            $extra = array_diff($headers, $required);

            if (!empty($missing)) {
                return response()->json([
                    'success' => false,
                    'missing_columns' => array_values($missing),
                    'found_columns' => $headers,
                    'extra_columns' => array_values($extra),
                ], 422);
            }

            return response()->json([
                'success' => true,
                'found_columns' => $headers,
                'extra_columns' => array_values($extra),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Gagal membaca file: ' . $e->getMessage(),
            ], 422);
        }
    }

    public function process(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,txt|max:51200', // 50MB
        ]);

        try {
            $import = new PembelianRegulerImport();
            Excel::import($import, $request->file('file'));

            return response()->json([
                'success' => true,
                'message' => 'File berhasil diproses dan data dimasukkan ke database.'
            ]);
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            
            $errors = [];
            foreach ($failures as $failure) {
                $errors[] = [
                    'row' => $failure->row(),
                    'attribute' => $failure->attribute(),
                    'errors' => $failure->errors(),
                    'values' => $failure->values(),
                ];
            }

            return response()->json([
                'success' => false,
                'errors' => $errors,
                'message' => 'Validasi gagal, terdapat kesalahan pada data.'
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Gagal memproses file: ' . $e->getMessage(),
            ], 422);
        }
    }

    public function retur()
    {
        return Inertia::render('pembelian/retur');
    }

    public function urgent()
    {
        return Inertia::render('pembelian/urgent');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
