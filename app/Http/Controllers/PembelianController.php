<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Imports\Pembelian\RegularImport;
use App\Http\Imports\Pembelian\ReturImport;
use App\Http\Imports\Pembelian\UrgentImport;

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

    public function store(Request $request, $type)
    {
        $request->validate([
            'document' => 'required|file|mimes:xlsx,xls,csv|max:51200',
        ]);

        $importMap = [
            'reguler' => \App\Http\Imports\Pembelian\RegularImport::class,
            'retur' => \App\Http\Imports\Pembelian\ReturImport::class,
            'urgent' => \App\Http\Imports\Pembelian\UrgentImport::class,
        ];

        $key = strtolower($type);

        if (!isset($importMap[$key])) {
            return back()->with('error', 'Tipe dokumen tidak valid.');
        }

        try {
            Excel::import(new $importMap[$key], $request->file('document'));
        } catch (\Throwable $e) {
            \Log::error('Excel import error', ['message' => $e->getMessage()]);
            return back()->with('error', 'Terjadi kesalahan saat mengimpor: ' . $e->getMessage());
        }

        return back()->with('success', 'Dokumen ' . ucfirst($type) . ' berhasil diimpor!');
    }


    public function create()
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
