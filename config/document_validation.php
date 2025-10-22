<?php

return [
    'penjualan' => [
        'reguler' => [
            'table' => 'im_jual',
            'connector' => ['no_transaksi'],
            'sum' => ['total_omset', 'total_penjualan'],
        ],
        'ecommerce' => [
            'table' => 'im_jual',
            'connector' => ['no_transaksi'],
            'sum' => ['total_penjualan'],
        ],
        'debitur' => [
            'table' => 'im_jual',
            'connector' => ['no_transaksi'],
            'sum' => ['omset', 'total_penjualan'],
        ],
        'konsi' => [
            'table' => 'im_jual',
            'connector' => ['id_transaksi', 'no_transaksi'],
            'sum' => ['total_pembayaran', 'cogs'],
        ],
    ],
    'pembelian' => [
        'reguler' => [
            'table' => 'im_purchases_and_return',
            'connector' => ['nomor_penerimaan', 'no_transaksi'],
            'sum' => ['jumlah', 'dpp'],
        ],
        'retur' => [
            'table' => 'im_purchases_and_return',
            'connector' => ['nomor_retur', 'no_transaksi'],
            'sum' => ['jumlah_retur', 'dpp'],
        ],
        'urgent' => [
            'table' => 'im_purchases_and_return',
            'connector' => ['nomor_penerimaan', 'no_transaksi'],
            'sum' => ['jumlah_netto', 'dpp'],
        ],
    ],
];
