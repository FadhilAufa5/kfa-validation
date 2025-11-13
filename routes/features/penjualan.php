<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\PenjualanController;
use App\Http\Controllers\ValidationDataController;
use App\Http\Controllers\ReportManagementController;

/*
|--------------------------------------------------------------------------
| Penjualan (Sales) Routes
|--------------------------------------------------------------------------
|
| All routes related to sales document validation
|
*/

Route::middleware(['auth', 'verified', 'check.validation.data'])->group(function () {
    
    // Main pages
    Route::get('/penjualan', [PenjualanController::class, 'index'])->name('penjualan.index');
    Route::get('/history/penjualan', [PenjualanController::class, 'history'])->name('penjualan.history');
    
    // Document category pages
    Route::get('/penjualan/reguler', [PenjualanController::class, 'reguler'])->name('penjualan.reguler');
    Route::get('/penjualan/ecommerce', [PenjualanController::class, 'ecommerce'])->name('penjualan.ecommerce');
    Route::get('/penjualan/debitur', [PenjualanController::class, 'debitur'])->name('penjualan.debitur');
    Route::get('/penjualan/konsi', [PenjualanController::class, 'konsi'])->name('penjualan.konsi');

    // File operations
    Route::post('/penjualan/save/{type}', [PenjualanController::class, 'save'])->name('penjualan.save');
    Route::post('/penjualan/validate-{type}', [PenjualanController::class, 'validateFile'])->name('penjualan.validateFile');
    Route::get('/penjualan/validation/{id}/status', fn($id) => app(ValidationDataController::class)->getValidationStatus($id, 'penjualan'))->name('penjualan.validation.status');
    Route::get('/penjualan/preview/{filename}', [PenjualanController::class, 'preview'])->name('penjualan.preview');
    Route::post('/penjualan/process/{filename}', [PenjualanController::class, 'processWithHeader'])->name('penjualan.processWithHeader');

    // Validation results
    Route::get('penjualan/{id}', [PenjualanController::class, 'show'])->name('penjualan.show');
    Route::get('penjualan/{id}/chart-data', [ValidationDataController::class, 'getChartData'])->name('penjualan.chart-data');
    Route::get('penjualan/{id}/invalid-groups', [ValidationDataController::class, 'getInvalidGroups'])->name('penjualan.invalid-groups');
    Route::get('penjualan/{id}/invalid-groups/all', [ValidationDataController::class, 'getAllInvalidGroups'])->name('penjualan.invalid-groups-all');
    Route::get('penjualan/{id}/matched-records', [ValidationDataController::class, 'getMatchedRecords'])->name('penjualan.matched-records');
    Route::get('penjualan/{id}/matched-records/all', [ValidationDataController::class, 'getAllMatchedGroups'])->name('penjualan.matched-records-all');
    Route::get('penjualan/{id}/document-comparison', [ValidationDataController::class, 'getDocumentComparisonData'])->name('penjualan.document-comparison');
    
    // History and status
    Route::get('penjualan/history/data', fn(Request $request) => app(ValidationDataController::class)->getValidationHistory($request, 'penjualan'))->name('penjualan.history.data');
    Route::post('penjualan/history/check-processing', fn(Request $request) => app(ValidationDataController::class)->checkProcessingStatus($request, 'penjualan'))->name('penjualan.history.check-processing');

    // Reports
    Route::post('penjualan/{id}/report', [ReportManagementController::class, 'submitReport'])->name('penjualan.report.submit');
    Route::get('penjualan/{id}/report', [ReportManagementController::class, 'getReport'])->name('penjualan.report.get');
});
