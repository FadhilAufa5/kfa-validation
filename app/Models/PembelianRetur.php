<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class PembelianRetur extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'pembelian_retur';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'bulan',
        'kode_bm',
        'nama_bm',
        'kode_outlet',
        'nama_outlet',
        'nomor_penerimaan',
        'nomor_retur',
        'kode_obat',
        'nama_obat',
        'kode_kreditur',
        'nama_kreditur',
        'kode_pabrik',
        'nama_pabrik',
        'satuan_utuh',
        'isi_kemasan',
        'qty_retur',
        'harga_satuan',
        'jumlah_retur',
        'kode_dep',
        'departemen',
        'kode_group',
        'group',
        'kode_category',
        'category',
        'kode_sub_kategory',
        'sub_category',
        'konsinyasi',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'harga_satuan' => 'integer',
        'jumlah_retur' => 'integer',
        'qty_retur' => 'integer',
        'konsinyasi' => 'boolean',
        'sub_category' => 'string',
    ];
}
