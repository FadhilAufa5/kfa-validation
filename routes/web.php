<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PenjualanController;
use App\Http\Controllers\PembelianController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\ActivityLogController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Routes are organized by:
| 1. Public routes
| 2. Authenticated routes
| 3. Penjualan (Sales) routes
| 4. Pembelian (Purchase) routes
| 5. Admin routes (user management, activity logs)
|
| Note: Controllers delegate to Services for all business logic
*/

// Public Routes
Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

/*
|--------------------------------------------------------------------------
| Penjualan (Sales) Routes
|--------------------------------------------------------------------------
*/
Route::get('/penjualan', [PenjualanController::class, 'index'])->name('penjualan.index');
Route::get('/history/penjualan', [PenjualanController::class, 'history'])->name('penjualan.history');
Route::get('/penjualan/reguler', [PenjualanController::class, 'reguler'])->name('penjualan.reguler');
Route::get('/penjualan/ecommerce', [PenjualanController::class, 'ecommerce'])->name('penjualan.ecommerce');
Route::get('/penjualan/debitur', [PenjualanController::class, 'debitur'])->name('penjualan.debitur');
Route::get('/penjualan/konsi', [PenjualanController::class, 'konsi'])->name('penjualan.konsi');

// File Operations (Upload, Validation, Preview)
Route::post('/penjualan/save/{type}', [PenjualanController::class, 'save'])->name('penjualan.save');
Route::post('/penjualan/validate-{type}', [PenjualanController::class, 'validateFile'])->name('penjualan.validateFile');
Route::get('/penjualan/validation/{id}/status', [PenjualanController::class, 'getValidationStatus'])->name('penjualan.validation.status');
Route::get('/penjualan/preview/{filename}', [PenjualanController::class, 'preview'])->name('penjualan.preview');
Route::post('/penjualan/process/{filename}', [PenjualanController::class, 'processWithHeader'])->name('penjualan.processWithHeader');

// Validation Results
Route::get('penjualan/{id}', [PenjualanController::class, 'show'])->name('penjualan.show');
Route::get('penjualan/{id}/invalid-groups', [PenjualanController::class, 'getInvalidGroups'])->name('penjualan.invalid-groups');
Route::get('penjualan/{id}/invalid-groups/all', [PenjualanController::class, 'getAllInvalidGroups'])->name('penjualan.invalid-groups-all');
Route::get('penjualan/{id}/matched-records', [PenjualanController::class, 'getMatchedRecords'])->name('penjualan.matched-records');
Route::get('penjualan/{id}/matched-records/all', [PenjualanController::class, 'getAllMatchedGroups'])->name('penjualan.matched-records-all');
Route::get('penjualan/{id}/document-comparison', [PenjualanController::class, 'getDocumentComparisonData'])->name('penjualan.document-comparison');
Route::get('penjualan/history/data', [PenjualanController::class, 'getValidationHistory'])->name('penjualan.history.data');
Route::post('penjualan/history/check-processing', [PenjualanController::class, 'checkProcessingStatus'])->name('penjualan.history.check-processing');

/*
|--------------------------------------------------------------------------
| Pembelian (Purchase) Routes
|--------------------------------------------------------------------------
*/
Route::get('/pembelian', [PembelianController::class, 'index'])->name('pembelian.index');
Route::get('/history/pembelian', [PembelianController::class, 'history'])->name('pembelian.history');
Route::get('/pembelian/reguler', [PembelianController::class, 'reguler'])->name('pembelian.reguler');
Route::get('/pembelian/retur', [PembelianController::class, 'retur'])->name('pembelian.retur');
Route::get('/pembelian/urgent', [PembelianController::class, 'urgent'])->name('pembelian.urgent');

// File Operations (Upload, Validation, Preview)
Route::post('/pembelian/save/{type}', [PembelianController::class, 'save'])->name('pembelian.save');
Route::post('/pembelian/validate-{type}', [PembelianController::class, 'validateFile'])->name('pembelian.validateFile');
Route::get('/pembelian/validation/{id}/status', [PembelianController::class, 'getValidationStatus'])->name('pembelian.validation.status');
Route::get('/pembelian/preview/{filename}', [PembelianController::class, 'preview'])->name('pembelian.preview');
Route::post('/pembelian/process/{filename}', [PembelianController::class, 'processWithHeader'])->name('pembelian.processWithHeader');

// Validation Results
Route::get('pembelian/{id}', [PembelianController::class, 'show'])->name('pembelian.show');
Route::get('pembelian/{id}/invalid-groups', [PembelianController::class, 'getInvalidGroups'])->name('pembelian.invalid-groups');
Route::get('pembelian/{id}/invalid-groups/all', [PembelianController::class, 'getAllInvalidGroups'])->name('pembelian.invalid-groups-all');
Route::get('pembelian/{id}/matched-records', [PembelianController::class, 'getMatchedRecords'])->name('pembelian.matched-records');
Route::get('pembelian/{id}/matched-records/all', [PembelianController::class, 'getAllMatchedGroups'])->name('pembelian.matched-records-all');
Route::get('pembelian/{id}/document-comparison', [PembelianController::class, 'getDocumentComparisonData'])->name('pembelian.document-comparison');
Route::get('pembelian/history/data', [PembelianController::class, 'getValidationHistory'])->name('pembelian.history.data');
Route::post('pembelian/history/check-processing', [PembelianController::class, 'checkProcessingStatus'])->name('pembelian.history.check-processing');

/*
|--------------------------------------------------------------------------
| Admin Routes (Super Admin Only)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'role:super_admin'])->group(function () {
    Route::get('/users', [UsersController::class, 'index'])->name('users.index');
    Route::get('/users/{id}', [UsersController::class, 'show'])->name('users.show');
    Route::put('/users/{user}', [UsersController::class, 'update'])->name('users.update');
    Route::post('/users', [UsersController::class, 'store'])->name('users.store');
    Route::post('/users/check-email', [UsersController::class, 'checkEmail'])->name('users.check-email');
    Route::delete('/users/{user}', [UsersController::class, 'destroy'])->name('users.destroy');
});

// Activity Logs
Route::middleware(['auth', 'verified', 'role:super_admin'])->group(function () {
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
    Route::get('/activity-logs/{activityLog}', [ActivityLogController::class, 'show'])->name('activity-logs.show');
});

// Validation Settings (Super Admin Only)
Route::middleware(['auth', 'verified', 'role:super_admin'])->group(function () {
    Route::get('/validation-setting', [App\Http\Controllers\ValidationSettingController::class, 'index'])->name('validation-setting.index');
    Route::post('/validation-setting/tolerance', [App\Http\Controllers\ValidationSettingController::class, 'updateTolerance'])->name('validation-setting.tolerance');
    Route::post('/validation-setting/upload-im-data', [App\Http\Controllers\ValidationSettingController::class, 'uploadImData'])->name('validation-setting.upload-im-data');
});

// Include additional route files
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
