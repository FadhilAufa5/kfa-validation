<?php

namespace App\Imports\Pembelian;

use App\Models\PembelianRetur;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\WithUpserts;
use Maatwebsite\Excel\Concerns\WithValidation;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class PembelianReturImport implements
    ToModel,
    WithHeadingRow,
    WithUpserts,
    // WithBatchInserts   // Performance: Inserts data in batches
    WithChunkReading,     // Performance: Reads the spreadsheet in chunks
    ShouldQueue
    // WithValidation        // Robustness: Validates data before creating a model
{
    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        // This method is now cleaner, focusing only on mapping the data.
        // Data transformation logic is handled separately for clarity.
        return new PembelianRetur([
            'bulan' => $row['bulan'],
            'nama_bm' => $row['nama_bm'],
            'kode_outlet' => $row['kode_outlet'],
            'nama_outlet' => $row['nama_outlet'],
            'nomor_penerimaan' => $row['nomor_penerimaan'],
            'nomor_retur' => $row['nomor_retur'],
            'kode_obat' => $row['kode_obat'],
            'nama_obat' => $row['nama_obat'],
            'kode_kreditur' => $row['kode_kreditur'],
            'nama_kreditur' => $row['nama_kreditur'],
            'satuan_utuh' => $row['satuan_utuh'],
            'isi_kemasan' => $row['isi_kemasan_utuh'],
            'qty_retur' => $row['qty_retur'],
            'harga_satuan' => $row['harga_satuan'],
            'jumlah_retur' => $row['jumlah_retur'],

            // Transformed Boolean field
            'konsinyasi' => filter_var($row['konsinyasi'], FILTER_VALIDATE_BOOLEAN),
        ]);
    }

    /**
     * Define the column that should be used for finding existing records.
     * For composite keys, return an array: ['nomor_retur', 'kode_obat'].
     */
    public function uniqueBy()
    {
        return 'nomor_retur';
    }

    /**
     * PERFORMANCE: Define the batch size for inserts.
     * This will group X model creations into a single INSERT query.
     */
    // public function batchSize(): int
    // {
    //     return 1000; // Adjust based on your server's memory
    // }

    /**
     * PERFORMANCE: Define the chunk size for reading.
     * This will read the spreadsheet in chunks of X rows, reducing memory usage.
     */
    public function headingRow(): int
    {
        return 1;
    }

    public function chunkSize(): int
    {
        return 1000;
    }

    /**
     * ROBUSTNESS: Define validation rules for each row.
     * If a row fails, it will be skipped, and the error can be caught.
     */
    // public function rules(): array
    // {
    //     return [
    //         // Example rules (adjust to your needs)
    //         'nomor_retur' => 'required|string|max:255',
    //         // 'kode_obat' => 'required|string|max:50',
    //         // 'nama_obat' => 'required|string|max:255',
    //         // 'qty' => 'required|integer',
    //         // 'harga_beli' => 'required|numeric',
    //         // 'nilai_retur' => 'required|numeric',
    //         // 'tanggal_retur' => 'required', // Can be 'date' if you ensure the format

    //         // Allow other fields to be nullable
    //         '*.bulan' => 'nullable|numeric',
    //         '*.kode_bm' => 'nullable|numeric',
    //         '*.jumlah_retur' => 'nullable|numeric',
    //         // ... add rules for other fields if needed
    //     ];
    // }

    /**
     * Helper function to robustly transform Excel dates.
     * Handles numeric dates from Excel, date strings, and existing Carbon/DateTime objects.
     */
    private function transformDate($value): ?Carbon
    {
        if (empty($value)) {
            return null;
        }

        // If it's already a Carbon or DateTime instance, just return it as Carbon
        if ($value instanceof \DateTime) {
            return Carbon::instance($value);
        }

        try {
            // If it's a numeric value (Excel's date format), convert it
            if (is_numeric($value)) {
                return Carbon::instance(Date::excelToDateTimeObject($value));
            }
            // Otherwise, try to parse it as a string (adjust format if needed)
            return Carbon::parse($value);
        } catch (\Exception $e) {
            // Return null or handle the invalid date format error
            return null;
        }
    }
}