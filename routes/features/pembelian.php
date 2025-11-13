<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Validation\PembelianController;
use App\Http\Controllers\Validation\ValidationDataController;
use App\Http\Controllers\ReportManagementController;

/*
|--------------------------------------------------------------------------
| Pembelian (Purchase) Routes
|--------------------------------------------------------------------------
|
| All routes related to purchase document validation
|
*/

Route::middleware(['auth', 'verified', 'check.validation.data'])->group(function () {
    
    // Main pages
    Route::get('/pembelian', [PembelianController::class, 'index'])->name('pembelian.index');
    Route::get('/history/pembelian', [PembelianController::class, 'history'])->name('pembelian.history');
    
    // Document category pages
    Route::get('/pembelian/reguler', [PembelianController::class, 'reguler'])->name('pembelian.reguler');
    Route::get('/pembelian/retur', [PembelianController::class, 'retur'])->name('pembelian.retur');
    Route::get('/pembelian/urgent', [PembelianController::class, 'urgent'])->name('pembelian.urgent');

    // File operations
    Route::post('/pembelian/save/{type}', [PembelianController::class, 'save'])->name('pembelian.save');
    Route::post('/pembelian/validate-{type}', [PembelianController::class, 'validateFile'])->name('pembelian.validateFile');
    Route::get('/pembelian/validation/{id}/status', fn($id) => app(ValidationDataController::class)->getValidationStatus($id, 'pembelian'))->name('pembelian.validation.status');
    Route::get('/pembelian/preview/{filename}', [PembelianController::class, 'preview'])->name('pembelian.preview');
    Route::post('/pembelian/process/{filename}', [PembelianController::class, 'processWithHeader'])->name('pembelian.processWithHeader');

    // Validation results
    Route::get('pembelian/{id}', [PembelianController::class, 'show'])->name('pembelian.show');
    Route::get('pembelian/{id}/chart-data', [ValidationDataController::class, 'getChartData'])->name('pembelian.chart-data');
    Route::get('pembelian/{id}/invalid-groups', [ValidationDataController::class, 'getInvalidGroups'])->name('pembelian.invalid-groups');
    Route::get('pembelian/{id}/invalid-groups/all', [ValidationDataController::class, 'getAllInvalidGroups'])->name('pembelian.invalid-groups-all');
    Route::get('pembelian/{id}/matched-records', [ValidationDataController::class, 'getMatchedRecords'])->name('pembelian.matched-records');
    Route::get('pembelian/{id}/matched-records/all', [ValidationDataController::class, 'getAllMatchedGroups'])->name('pembelian.matched-records-all');
    Route::get('pembelian/{id}/document-comparison', [ValidationDataController::class, 'getDocumentComparisonData'])->name('pembelian.document-comparison');
    
    // History and status
    Route::get('pembelian/history/data', fn(Request $request) => app(ValidationDataController::class)->getValidationHistory($request, 'pembelian'))->name('pembelian.history.data');
    Route::post('pembelian/history/check-processing', fn(Request $request) => app(ValidationDataController::class)->checkProcessingStatus($request, 'pembelian'))->name('pembelian.history.check-processing');

    // Reports
    Route::post('pembelian/{id}/report', [ReportManagementController::class, 'submitReport'])->name('pembelian.report.submit');
    Route::get('pembelian/{id}/report', [ReportManagementController::class, 'getReport'])->name('pembelian.report.get');
});
