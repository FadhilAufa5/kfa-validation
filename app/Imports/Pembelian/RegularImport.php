<?php
namespace App\Http\Imports\Pembelian;

use App\Models\PurchaseDocument;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class RegularImport implements ToModel, WithHeadingRow
{
    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        // laravel-excel automatically converts header names to snake_case.
        // "Nomor Penerimaan" -> "nomor_penerimaan"
        // "Jumlah Netto"     -> "jumlah_netto"

        // Skip row if the main identifier is missing
        if (empty($row['nomor_penerimaan'])) {
            return null;
        }

        return new PurchaseDocument([
            'transaction_number' => $row['nomor_penerimaan'],
            // Clean the 'total' value to ensure it's a valid number
            'total' => preg_replace('/[^\d.]/', '', $row['jumlah_netto']),
            'type' => 'reguler', // Hard-code the type for this import
        ]);
    }
}