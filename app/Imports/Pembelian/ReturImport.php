<?php
namespace App\Http\Imports\Pembelian;

use App\Models\PurchaseDocument;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ReturImport implements ToModel, WithHeadingRow
{
    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        // laravel-excel automatically converts header names to snake_case.
        // "Nomor Retur" -> "nomor_retur"
        // "Jumah Retur" -> "jumah_retur" (Handles the typo from your requirement)

        // Skip row if the main identifier is missing
        if (empty($row['nomor_retur'])) {
            return null;
        }

        return new PurchaseDocument([
            'transaction_number' => $row['nomor_retur'],
            // Clean the 'total' value to ensure it's a valid number
            'total' => preg_replace('/[^\d.]/', '', $row['jumah_retur']),
            'type' => 'retur', // Hard-code the type for this import
        ]);
    }
}