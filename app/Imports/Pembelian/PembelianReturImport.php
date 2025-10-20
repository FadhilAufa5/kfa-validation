<?php

namespace App\Imports\Pembelian;

use App\Models\PembelianRetur;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithUpserts;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class PembelianReturImport implements ToModel, WithHeadingRow, WithUpserts
{
    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        dd(123);
        return new PembelianRetur([
            'bulan' => $row['bulan'] ?? null,
            'kode_bm' => $row['kode_bm'] ?? null,
            'nama_bm' => $row['nama_bm'] ?? null,
            'kode_outlet' => $row['kode_outlet'] ?? null,
            'nama_outlet' => $row['nama_outlet'] ?? null,
            'nomor_penerimaan' => $row['nomor_penerimaan'] ?? null,
            'nomor_retur' => $row['nomor_retur'] ?? null,
            'kode_obat' => $row['kode_obat'] ?? null,
            'nama_obat' => $row['nama_obat'] ?? null,
            'kode_kreditur' => $row['kode_kreditur'] ?? null,
            'nama_kreditur' => $row['nama_kreditur'] ?? null,
            'tanggal_retur' => $row['tanggal_retur'] ?? null,
            'tanggal_penerimaan' => $row['tanggal_penerimaan'] ?? null,
            'no_batch' => $row['no_batch'] ?? null,
            'expired_date' => $row['expired_date'] ?? null,
            'qty' => isset($row['qty']) ? (int) $row['qty'] : null,
            'harga_beli' => isset($row['harga_beli']) ? (float) $row['harga_beli'] : null,
            'nilai_retur' => isset($row['nilai_retur']) ? (float) $row['nilai_retur'] : null,
            'jumlah_retur' => $row['jumlah_retur'] ?? null,
            'kode_dep' => $row['kode_dep'] ?? null,
            'departemen' => $row['departemen'] ?? null,
            'kode_group' => $row['kode_group'] ?? null,
            'group' => $row['group'] ?? null,
            'kode_category' => $row['kode_category'] ?? null,
            'category' => $row['category'] ?? null,
            'kode_sub_kategory' => $row['kode_sub_kategory'] ?? null,
            'sub_category' => $row['sub_category'] ?? null,
            'konsinyasi' => isset($row['konsinyasi']) ? filter_var($row['konsinyasi'], FILTER_VALIDATE_BOOLEAN) : false,
        ]);
    }

    public function uniqueBy()
    {
        return 'nomor_retur';
    }
}
