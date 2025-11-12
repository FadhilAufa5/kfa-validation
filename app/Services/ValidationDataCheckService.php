<?php

namespace App\Services;

use App\Models\ImDataInfo;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Illuminate\Notifications\DatabaseNotification;

class ValidationDataCheckService
{
    public function checkValidationData(): array
    {
        $pembelianInfo = ImDataInfo::getInfo('im_purchases_and_return');
        $penjualanInfo = ImDataInfo::getInfo('im_jual');
        
        $isPembelianEmpty = !$pembelianInfo || $pembelianInfo->row_count === 0;
        $isPenjualanEmpty = !$penjualanInfo || $penjualanInfo->row_count === 0;
        
        return [
            'is_pembelian_empty' => $isPembelianEmpty,
            'is_penjualan_empty' => $isPenjualanEmpty,
            'pembelian_count' => $pembelianInfo?->row_count ?? 0,
            'penjualan_count' => $penjualanInfo?->row_count ?? 0,
            'has_empty_data' => $isPembelianEmpty || $isPenjualanEmpty,
            'pembelian_info' => $pembelianInfo ? [
                'row_count' => $pembelianInfo->row_count,
                'last_updated_at' => $pembelianInfo->last_updated_at?->format('Y-m-d H:i:s'),
                'last_updated_by' => $pembelianInfo->last_updated_by,
            ] : null,
            'penjualan_info' => $penjualanInfo ? [
                'row_count' => $penjualanInfo->row_count,
                'last_updated_at' => $penjualanInfo->last_updated_at?->format('Y-m-d H:i:s'),
                'last_updated_by' => $penjualanInfo->last_updated_by,
            ] : null,
        ];
    }

    public function createNotificationForSuperAdmin(User $superAdmin): void
    {
        $validationStatus = $this->checkValidationData();
        
        if (!$validationStatus['has_empty_data']) {
            return;
        }

        // Check if there's already an unread notification about this
        $existingNotification = $superAdmin->notifications()
            ->where('type', 'App\Notifications\ValidationDataEmptyNotification')
            ->whereNull('read_at')
            ->first();

        // Don't create duplicate notification if one already exists
        if ($existingNotification) {
            return;
        }

        $emptyTables = [];
        if ($validationStatus['is_pembelian_empty']) {
            $emptyTables[] = 'IM Purchases and Return (Pembelian)';
        }
        if ($validationStatus['is_penjualan_empty']) {
            $emptyTables[] = 'IM Jual (Penjualan)';
        }

        // Create a database notification
        $superAdmin->notify(new \App\Notifications\ValidationDataEmptyNotification($emptyTables));
    }

    public function notifyAllSuperAdmins(): void
    {
        $validationStatus = $this->checkValidationData();
        
        if (!$validationStatus['has_empty_data']) {
            return;
        }

        $superAdmins = User::where('role', 'super_admin')->get();
        
        foreach ($superAdmins as $superAdmin) {
            $this->createNotificationForSuperAdmin($superAdmin);
        }
    }
}
