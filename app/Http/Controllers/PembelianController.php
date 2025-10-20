<?php

namespace App\Http\Controllers;

use App\Models\PembelianRetur;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationData;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\Pembelian\PembelianRegulerImport;
use App\Imports\Pembelian\PembelianReturImport;
use App\Imports\Pembelian\PembelianUrgentImport;

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

