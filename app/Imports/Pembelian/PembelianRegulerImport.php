<?php

namespace App\Imports\Pembelian;

use App\Models\PembelianReguler;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsOnFailure;
use Maatwebsite\Excel\Validators\Failure;

class PembelianRegulerImport implements ToCollection, WithValidation, WithHeadingRow, SkipsOnFailure
{
    /**
     * @param Collection $collection
     */
    public function collection(Collection $collection)
    {
        foreach ($collection as $row) {
            // Format and insert data into the model after validation
            PembelianReguler::create([
                'transaction_number' => $row['transaction_number'] ?? null,
                'kode_komunikasi_sap' => $row['kode_komunikasi_sap'] ?? 'YQ', // Default value if not provided
                'outlet_name' => $row['outlet_name'] ?? null,
                'date' => $row['date'] ?? null,
                'total' => $row['total'] ?? null,
            ]);
        }
    }

    /**
     * Tentukan aturan validasi untuk setiap baris.
     * @return array
     */
    public function rules(): array
    {
        return [
            // Pastikan heading kolom 'transaction_number' ada dan tidak kosong di setiap baris
            'transaction_number' => 'required',

            // Validasi berdasarkan 'notes/query filter'
            // 'kode_komunikasi_sap' harus ada dan nilainya harus 'YQ' atau 'Z5'
            'kode_komunikasi_sap' => ['required', Rule::in(['YQ', 'Z5'])],

            // Tambahkan validasi lain jika diperlukan, misal:
            'outlet_name' => 'required|string',
            'date' => 'required|date',
            'total' => 'required|numeric|min:0',
        ];
    }

    /**
     * Method ini akan dipanggil ketika validasi gagal.
     * Kita biarkan kosong agar proses bisa berlanjut dan error dikumpulkan.
     * @param Failure ...$failures
     */
    public function onFailure(Failure ...$failures)
    {
        // Biarkan kosong untuk mengumpulkan semua error
    }

    /**
     * Custom validation messages (Opsional).
     * @return array
     */
    public function customValidationMessages(): array
    {
        return [
            'transaction_number.required' => 'Transaction number is required.',
            'kode_komunikasi_sap.required' => 'Kode komunikasi SAP is required.',
            'kode_komunikasi_sap.in' => 'Kode komunikasi SAP must be YQ or Z5.',
            'outlet_name.required' => 'Outlet name is required.',
            'outlet_name.string' => 'Outlet name must be a string.',
            'date.required' => 'Date is required.',
            'date.date' => 'Date must be a valid date format.',
            'total.required' => 'Total is required.',
            'total.numeric' => 'Total must be a number.',
            'total.min' => 'Total must be at least 0.',
        ];
    }
}
