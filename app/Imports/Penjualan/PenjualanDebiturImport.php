<?php

namespace App\Imports;

use App\Models\PenjualanDebitur;
use Maatwebsite\Excel\Concerns\ToModel;

class PenjualanDebiturImport implements ToModel
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        return new PenjualanDebitur([
            //
        ]);
    }
}
