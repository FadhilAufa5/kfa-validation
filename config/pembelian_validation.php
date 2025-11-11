<?php

return [

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
];
