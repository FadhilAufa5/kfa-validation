<?php

return [
    'pembelian' => [
        'reguler' => [
            'doc_val' => 'im_purchases_and_return',
            'connector' => ['NOMOR PENERIMAAN', 'no_transaksi'],
            'sum' => ['JUMLAH NETTO', 'dpp'],
        ],
        'retur' => [
            'doc_val' => 'im_purchases_and_return',
            'connector' => ['Nomor Retur', 'no_transaksi'],
            'sum' => ['Jumlah Retur', 'dpp'],
        ],
        'urgent' => [
            'doc_val' => 'im_purchases_and_return',
            'connector' => ['Nomor Penerimaan', 'no_transaksi'],
            'sum' => ['Jumlah', 'dpp'],
        ],
    ],
    'penjualan' => [
        'reguler' => [
            'doc_val' => 'im_jual',
            'connector' => ['no_transaksi', 'transaction_id'],
            'sum' => ['total_omset', 'total_penjualan'],
        ],
        'ecommerce' => [
            'doc_val' => 'im_jual',
            'connector' => ['NO TRANSAKSI', 'transaction_id'],
            'sum' => ['DISKON ITEM * QTY', 'total'],
        ],
        'debitur' => [
            'doc_val' => 'im_jual',
            'connector' => ['NOMOR TRANSAKSI', 'transaction_id'],
            'sum' => ['OMSET', 'total_penjualan'],
        ],
        'konsi' => [
            'doc_val' => 'im_jual',
            'connector' => ['id_transaksi', 'no_transaksi'],
            'sum' => ['total_pembayaran', 'cogs'],
        ],
    ],
];
