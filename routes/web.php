<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PenjualanController;
use App\Http\Controllers\PembelianController;
use App\Http\Controllers\UsersController;




Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

});
// penjualan
Route::get('/penjualan', [PenjualanController::class, 'index'])->name('penjualan.index');
Route::get('/historypenjualan', [PenjualanController::class, 'history'])->name('penjualan.history');
Route::get('/penjualan/reguler', [PenjualanController::class, 'reguler'])->name('penjualan.reguler');
Route::get('/penjualan/ecommerce', [PenjualanController::class, 'ecommerce'])->name('penjualan.ecommerce');
Route::get('/penjualan/debitur', [PenjualanController::class, 'debitur'])->name('penjualan.debitur');
Route::get('/penjualan/konsi', [PenjualanController::class, 'konsi'])->name('penjualan.konsi');

// pembelian
Route::get('/pembelian', [PembelianController::class, 'index'])->name('pembelian.index');
Route::get('/pembelian/history', [PembelianController::class, 'history'])->name('pembelian.history');
Route::get('/pembelian/reguler', [PembelianController::class, 'reguler'])->name('pembelian.reguler');
Route::post('/pembelian/reguler/upload', [PembelianController::class, 'upload'])->name('pembelian.reguler.upload');
Route::post('/pembelian/reguler/process', [PembelianController::class, 'process'])->name('pembelian.reguler.process');
Route::get('/pembelian/retur', [PembelianController::class, 'retur'])->name('pembelian.retur');
Route::get('/pembelian/urgent', [PembelianController::class, 'urgent'])->name('pembelian.urgent');
// Route::post('/pembelian/store/{type}', [PembelianController::class, 'store'])->name('pembelian.store');

Route::post('/pembelian/store-reguler', [PembelianController::class, 'storeReguler'])->name('pembelian.store-reguler');
Route::post('/pembelian/store-retur', [PembelianController::class, 'storeRetur'])->name('pembelian.store-retur');
Route::post('/pembelian/store-urgent', [PembelianController::class, 'storeUrgent'])->name('pembelian.store-urgent');

Route::post('/pembelian/save-{type}', [PembelianController::class, 'save'])
    ->name('pembelian.save');

// Add route for validation
Route::post('/pembelian/validate-{type}', [PembelianController::class, 'validateFile'])
    ->name('pembelian.validateFile');

//Dashboard/Uploads
Route::get('/dashboard/uploads', [PembelianController::class, 'dashboard'])->name('uploads.dashboard');
Route::delete('/dashboard/uploads/delete/{filename}', [PembelianController::class, 'delete'])->name('files.delete');
Route::get('/dashboard/uploads/process/{filename}', [PembelianController::class, 'process'])
    ->name('files.process');

Route::get('/dashboard/uploads/preview/{filename}', [PembelianController::class, 'preview'])
    ->name('files.preview');

Route::post('/dashboard/uploads/process-with-header/{filename}', [PembelianController::class, 'processWithHeader'])
    ->name('files.processWithHeader');

Route::post('/pembelian/save-temp/{type}', [PembelianController::class, 'saveTemp'])
    ->name('pembelian.save-temp');

Route::get('/pembelian/preview/{filename}', [PembelianController::class, 'preview'])
    ->name('pembelian.preview');

// Route to process the file with the selected header row (JSON)
Route::post('/pembelian/process/{filename}', [PembelianController::class, 'processWithHeader'])
    ->name('pembelian.processWithHeader');

Route::get('pembelian/{id}', [PembelianController::class, 'show'])->name('pembelian.show');

// user management 
Route::get('/users', [UsersController::class, 'index'])->name('users.index');



require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
