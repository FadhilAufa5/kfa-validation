<?php

namespace App\Imports\Pembelian;

use App\Models\PembelianUrgent;
use Maatwebsite\Excel\Concerns\ToModel;

class PembelianUrgentImport implements ToModel
{
    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        return new PembelianUrgent([
            //
        ]);
    }
}
