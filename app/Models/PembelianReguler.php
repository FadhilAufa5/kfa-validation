<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PembelianReguler extends Model
{
    protected $fillable = [
        'transaction_number',
        // 'kode_komunikasi_sap',
        'outlet_name',
        'date',
        'total',
    ];
}
