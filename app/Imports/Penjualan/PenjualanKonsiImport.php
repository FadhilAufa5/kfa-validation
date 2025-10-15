<?php

namespace App\Imports;

use App\Models\PenjualanKonsi;
use Maatwebsite\Excel\Concerns\ToModel;

class PenjualanKonsiImport implements ToModel
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        return new PenjualanKonsi([
            //
        ]);
    }
}
