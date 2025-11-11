<?php

return [
    'pembelian' => [
        'reguler' => [
            'doc_val' => 'im_purchases_and_return',
            'connector' => ['NOMOR PENERIMAAN', 'no_transaksi'],
            'sum' => ['JUMLAH NETTO', 'dpp'],
            'mapping' => [
                'kode_bm' => 'KODE BM',
                'nama_bm' => 'NAMA BM',
                'kode_outlet' => 'KODE OUTLET',
                'nama_outlet' => 'NAMA OUTLET',
                'date' => 'TANGGAL PENERIMAAN',
            ],
        ],
        'retur' => [
            'doc_val' => 'im_purchases_and_return',
            'connector' => ['Nomor Retur', 'no_transaksi'],
            'sum' => ['Jumlah Retur', 'dpp'],
            'mapping' => [
                'kode_bm' => 'Kode BM',
                'nama_bm' => 'Nama BM',
                'kode_outlet' => 'Kode Outlet',
                'nama_outlet' => 'Nama Outlet',
                'date' => 'Bulan',
            ],
        ],
        'urgent' => [
            'doc_val' => 'im_purchases_and_return',
            'connector' => ['Nomor Penerimaan', 'no_transaksi'],
            'sum' => ['Jumlah', 'dpp'],
            'mapping' => [
                'kode_bm' => 'Kode BM',
                'nama_bm' => 'Nama BM',
                'kode_outlet' => 'Kode Outlet',
                'nama_outlet' => 'Nama Outlet',
                'date' => 'Bulan',
            ],
        ],
    ],
    'penjualan' => [
        'reguler' => [
            'doc_val' => 'im_jual',
            'connector' => ['NOMOR TRANSAKSI', 'transaction_id'],
            'sum' => ['TOTAL OMSET', 'total_penjualan'],
            'mapping' => [
                'kode_bm' => 'KODE BM',
                'nama_bm' => 'NAMA BM',
                'kode_outlet' => 'KODE OUTLET',
                'nama_outlet' => 'NAMA OUTLET',
                'date' => 'BULAN',
            ],
        ],
        'ecommerce' => [
            'doc_val' => 'im_jual',
            'connector' => ['NO TRANSAKSI', 'transaction_id'],
            'sum' => ['DISKON ITEM * QTY', 'total'],
            'mapping' => [
                'kode_bm' => 'KODE BM',
                'nama_bm' => 'NAMA BM',
                'kode_outlet' => 'KODE OUTLET',
                'nama_outlet' => 'NAMA OUTLET',
                'date' => 'BULAN',
            ],
        ],
        'debitur' => [
            'doc_val' => 'im_jual',
            'connector' => ['NOMOR TRANSAKSI', 'transaction_id'],
            'sum' => ['OMSET', 'total_penjualan'],
            'mapping' => [
                'kode_bm' => 'KODE BM',
                'nama_bm' => 'NAMA BM',
                'kode_outlet' => 'KODE OUTLET',
                'nama_outlet' => 'NAMA OUTLET',
                'date' => 'BULAN',
            ],
        ],
        'konsi' => [
            'doc_val' => 'im_jual',
            'connector' => ['ID Transaksi', 'transaction_id'],
            'sum' => ['Total Pembayaran', 'cogs'],
            'mapping' => [
                'kode_bm' => 'Kode Unit Bisnis',
                'nama_bm' => 'Unit Bisnis',
                'kode_outlet' => 'Kode Apotek',
                'nama_outlet' => 'Nama Apotek',
                'date' => 'LIPH Date',
            ],
        ],
    ],
];
