<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CsvUploadController;

Route::post('/upload-csv', [CsvUploadController::class, 'store']);
Route::post('/upload-reguler', [CsvUploadController::class, 'uploadReguler']);
Route::post('/upload-retur', [CsvUploadController::class, 'uploadRetur']);
Route::post('/upload-mendesak', [CsvUploadController::class, 'uploadMendesak']);