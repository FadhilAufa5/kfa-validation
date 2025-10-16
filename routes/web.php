<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PenjualanController;
use App\Http\Controllers\PembelianController;


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

// pemebelian
Route::get('/pembelian', [PembelianController::class, 'index'])->name('pembelian.index');
Route::get('/pembelian/history', [PembelianController::class, 'history'])->name('pembelian.history');
Route::get('/pembelian/reguler', [PembelianController::class, 'reguler'])->name('pembelian.reguler');
Route::get('/pembelian/retur', [PembelianController::class, 'retur'])->name('pembelian.retur');
Route::get('/pembelian/urgent', [PembelianController::class, 'urgent'])->name('pembelian.urgent');
Route::post('/pembelian/{type}', [PembelianController::class, 'store'])->name('pembelian.store');


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
