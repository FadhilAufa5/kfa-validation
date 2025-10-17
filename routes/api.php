<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CsvUploadController;

Route::post('/upload-csv', [CsvUploadController::class, 'store']);