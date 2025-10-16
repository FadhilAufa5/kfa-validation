<?php

namespace App\Imports;

use App\Models\PenjualanECommerce;
use Maatwebsite\Excel\Concerns\ToModel;

class PenjualanECommerceImport implements ToModel
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        return new PenjualanECommerce([
            //
        ]);
    }
}
