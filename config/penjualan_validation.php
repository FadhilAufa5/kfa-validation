<?php

return [
    'reguler' => [
        'doc_val' => 'im_jual',
        'connector' => ['no_transaksi', 'transaction_id'], // [uploaded_column, db_column]
        'sum' => ['total_omset', 'total_penjualan'], // [uploaded_column, db_column]
    ],
    'ecommerce' => [
        'doc_val' => 'im_jual',
        'connector' => ['NO TRANSAKSI', 'transaction_id'], // [uploaded_column, db_column]
        'sum' => ['DISKON ITEM * QTY', 'total'], // [uploaded_column, db_column]
    ],
    'debitur' => [
        'doc_val' => 'im_jual',
        'connector' => ['NOMOR TRANSAKSI', 'transaction_id'], // [uploaded_column, db_column]
        'sum' => ['OMSET', 'total_penjualan'], // [uploaded_column, db_column]
    ],
    'konsi' => [
        'doc_val' => 'im_jual',
        'connector' => ['id_transaksi', 'no_transaksi'], // [uploaded_column, db_column]
        'sum' => ['total_pembayaran', 'cogs'], // [uploaded_column, db_column]
    ],

];
