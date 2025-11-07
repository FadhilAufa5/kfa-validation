<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImDataInfo extends Model
{
    protected $table = 'im_data_info';
    
    protected $fillable = [
        'table_name',
        'row_count',
        'last_updated_at',
        'last_updated_by',
    ];

    protected $casts = [
        'last_updated_at' => 'datetime',
        'row_count' => 'integer',
    ];

    public static function updateInfo(string $tableName, int $rowCount, ?string $updatedBy = null): void
    {
        self::updateOrCreate(
            ['table_name' => $tableName],
            [
                'row_count' => $rowCount,
                'last_updated_at' => now(),
                'last_updated_by' => $updatedBy ?? 'System',
            ]
        );
    }

    public static function getInfo(string $tableName): ?self
    {
        return self::where('table_name', $tableName)->first();
    }

    public static function getAllInfo(): array
    {
        $pembelian = self::getInfo('im_purchases_and_return');
        $penjualan = self::getInfo('im_jual');

        return [
            'pembelian' => $pembelian ? [
                'row_count' => $pembelian->row_count,
                'last_updated_at' => $pembelian->last_updated_at?->format('Y-m-d H:i:s'),
                'last_updated_by' => $pembelian->last_updated_by,
                'last_updated_human' => $pembelian->last_updated_at?->diffForHumans(),
            ] : null,
            'penjualan' => $penjualan ? [
                'row_count' => $penjualan->row_count,
                'last_updated_at' => $penjualan->last_updated_at?->format('Y-m-d H:i:s'),
                'last_updated_by' => $penjualan->last_updated_by,
                'last_updated_human' => $penjualan->last_updated_at?->diffForHumans(),
            ] : null,
        ];
    }
}
