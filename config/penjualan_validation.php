<?php

return [
    'reguler' => [
        'doc_val' => 'im_jual',
        'connector' => ['no_transaksi'],
        'sum' => ['total_omset', 'total_penjualan'],
    ],
    'ecommerce' => [
        'doc_val' => 'im_jual',
        'connector' => ['no_transaksi'],
        'sum' => ['total_penjualan'],
    ],
    'debitur' => [
        'doc_val' => 'im_jual',
        'connector' => ['no_transaksi'],
        'sum' => ['omset', 'total_penjualan'],
    ],
    'konsi' => [
        'doc_val' => 'im_jual',
        'connector' => ['id_transaksi', 'no_transaksi'],
        'sum' => ['total_pembayaran', 'cogs'],
    ],

];
