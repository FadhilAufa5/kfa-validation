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
Route::get('/penjualan/reguler', [PenjualanController::class, 'reguler'])->name('penjualan.reguler');
Route::get('/penjualan/ecommerce', [PenjualanController::class, 'ecommerce'])->name('penjualan.ecommerce');
Route::get('/penjualan/debitur', [PenjualanController::class, 'debitur'])->name('penjualan.debitur');
Route::get('/penjualan/konsi', [PenjualanController::class, 'konsi'])->name('penjualan.konsi');

// pembelian
Route::get('/pembelian', [PembelianController::class, 'index'])->name('pembelian.index');
Route::get('/historypembelian', [PembelianController::class, 'history'])->name('pembelian.history');
Route::get('/pembelian/reguler', [PembelianController::class, 'reguler'])->name('pembelian.reguler');
Route::post('/pembelian/reguler/upload', [PembelianController::class, 'upload'])->name('pembelian.reguler.upload');
Route::post('/pembelian/reguler/process', [PembelianController::class, 'process'])->name('pembelian.reguler.process');
Route::get('/pembelian/retur', [PembelianController::class, 'retur'])->name('pembelian.retur');
Route::get('/pembelian/urgent', [PembelianController::class, 'urgent'])->name('pembelian.urgent');

Route::post('/upload', function (Request $request) {
    $path = $request->file('file')->store('uploads');
    return response()->json(['path' => $path]);
});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
