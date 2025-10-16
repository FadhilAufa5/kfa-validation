<?php

namespace App\Imports\Pembelian;

use App\Models\PembelianRetur;
use Maatwebsite\Excel\Concerns\ToModel;

class PembelianReturImport implements ToModel
{
    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        return new PembelianRetur([
            //
        ]);
    }
}
