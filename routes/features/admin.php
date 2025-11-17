<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\Settings\ValidationSettingController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ReportManagementController;

/*
|--------------------------------------------------------------------------
| Admin Routes (Super Admin Only)
|--------------------------------------------------------------------------
|
| Routes accessible only by super administrators
|
*/

Route::middleware(['auth', 'verified', 'check.validation.data'])->group(function () {
    
    // User management - require users.manage permission
    Route::middleware(['permission:users.manage'])->group(function () {
        Route::get('/users', [UsersController::class, 'index'])->name('users.index');
        Route::get('/users/{id}', [UsersController::class, 'show'])->name('users.show');
        Route::put('/users/{user}', [UsersController::class, 'update'])->name('users.update');
        Route::post('/users', [UsersController::class, 'store'])->name('users.store');
        Route::post('/users/check-email', [UsersController::class, 'checkEmail'])->name('users.check-email');
        Route::delete('/users/{user}', [UsersController::class, 'destroy'])->name('users.destroy');
    });

    // Activity logs - require logs.view permission
    Route::middleware(['permission:logs.view'])->group(function () {
        Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
        Route::get('/activity-logs/{activityLog}', [ActivityLogController::class, 'show'])->name('activity-logs.show');
    });

    // Permission management - require roles.manage permission
    Route::middleware(['permission:roles.manage'])->group(function () {
        Route::get('/permissions', [PermissionController::class, 'index'])->name('permissions.index');
        Route::post('/permissions/roles', [PermissionController::class, 'storeRole'])->name('permissions.roles.store');
        Route::put('/permissions/roles/{role}', [PermissionController::class, 'updateRole'])->name('permissions.roles.update');
        Route::delete('/permissions/roles/{role}', [PermissionController::class, 'destroyRole'])->name('permissions.roles.destroy');
        Route::post('/permissions/permissions', [PermissionController::class, 'storePermission'])->name('permissions.permissions.store');
        Route::put('/permissions/permissions/{permission}', [PermissionController::class, 'updatePermission'])->name('permissions.permissions.update');
        Route::delete('/permissions/permissions/{permission}', [PermissionController::class, 'destroyPermission'])->name('permissions.permissions.destroy');
    });

    // Report management - require roles.manage or users.manage permission
    Route::middleware(['permission.any:roles.manage,users.manage'])->group(function () {
        Route::get('/report-management', [ReportManagementController::class, 'index'])->name('report-management.index');
        Route::get('/report-management/accepted', [ReportManagementController::class, 'getAcceptedReports'])->name('report-management.accepted');
        Route::get('/report-management/all', [ReportManagementController::class, 'getAllReports'])->name('report-management.all');
        Route::post('/report-management/report/{id}/accept', [ReportManagementController::class, 'acceptReport'])->name('report-management.report.accept');
        Route::post('/report-management/report/{id}/revoke', [ReportManagementController::class, 'revokeReport'])->name('report-management.report.revoke');
    });
});

// Validation settings - require settings.validation permission (no check.validation.data middleware)
Route::middleware(['auth', 'verified', 'permission:settings.validation'])->group(function () {
    Route::get('/validation-setting', [ValidationSettingController::class, 'index'])->name('validation-setting.index');
    Route::post('/validation-setting/tolerance', [ValidationSettingController::class, 'updateTolerance'])->name('validation-setting.tolerance');
    Route::post('/validation-setting/upload-im-data', [ValidationSettingController::class, 'uploadImData'])->name('validation-setting.upload-im-data');
    Route::post('/validation-setting/refresh-count', [ValidationSettingController::class, 'refreshImDataCount'])->name('validation-setting.refresh-count');
});
