<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Main application routes. Feature-specific routes are organized in
| the routes/features/ directory for better maintainability.
|
*/

// Public routes
Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Maintenance route (when validation data is empty)
Route::middleware(['auth'])->get('/maintenance', function () {
    $pembelianInfo = \App\Models\ImDataInfo::getInfo('im_purchases_and_return');
    $penjualanInfo = \App\Models\ImDataInfo::getInfo('im_jual');
    
    $isPembelianEmpty = !$pembelianInfo || $pembelianInfo->row_count === 0;
    $isPenjualanEmpty = !$penjualanInfo || $penjualanInfo->row_count === 0;
    
    $hasValidationData = !($isPembelianEmpty && $isPenjualanEmpty);
    
    return Inertia::render('maintenance', [
        'hasValidationData' => $hasValidationData,
    ]);
})->name('maintenance');

// Dashboard
Route::middleware(['auth', 'verified', 'check.validation.data'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

// Notifications (all authenticated users)
Route::middleware(['auth', 'verified', 'check.validation.data'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
    Route::post('/notifications/{id}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
    Route::post('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-as-read');
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
});

/*
|--------------------------------------------------------------------------
| Feature Routes
|--------------------------------------------------------------------------
|
| Load feature-specific routes from dedicated files
|
*/

require __DIR__ . '/features/penjualan.php';
require __DIR__ . '/features/pembelian.php';
require __DIR__ . '/features/admin.php';

/*
|--------------------------------------------------------------------------
| Auth & Settings Routes
|--------------------------------------------------------------------------
|
| Authentication and user settings routes
|
*/

require __DIR__ . '/auth.php';
require __DIR__ . '/settings.php';
