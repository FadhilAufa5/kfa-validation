<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ValidationSetting;
use App\Models\ImDataInfo;
use App\Models\ActivityLog;
use App\Jobs\ProcessImDataUpload;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ValidationSettingController extends Controller
{
    public function index()
    {
        $currentTolerance = ValidationSetting::get('rounding_tolerance', 1000.01);
        $imDataInfo = ImDataInfo::getAllInfo();

        // Get the last tolerance update from activity logs
        $lastToleranceUpdate = ActivityLog::where('action', 'Update Tolerance')
            ->where('entity_type', 'ValidationSetting')
            ->where('entity_id', 'rounding_tolerance')
            ->latest()
            ->first();

        $toleranceUpdateInfo = null;
        if ($lastToleranceUpdate) {
            $toleranceUpdateInfo = [
                'last_updated_at' => $lastToleranceUpdate->created_at->format('Y-m-d H:i:s'),
                'last_updated_by' => $lastToleranceUpdate->user_name,
                'last_updated_human' => $lastToleranceUpdate->created_at->diffForHumans(),
            ];
        }

        return Inertia::render('validation-setting/index', [
            'currentTolerance' => $currentTolerance,
            'toleranceUpdateInfo' => $toleranceUpdateInfo,
            'imDataInfo' => $imDataInfo,
        ]);
    }

    public function updateTolerance(Request $request)
    {
        $request->validate([
            'tolerance' => 'required|numeric|min:0',
        ]);

        $oldTolerance = ValidationSetting::get('rounding_tolerance', 1000.01);
        $newTolerance = $request->tolerance;

        ValidationSetting::set('rounding_tolerance', $newTolerance, 'float', 'Rounding tolerance for validation calculations');

        ActivityLogger::log(
            action: 'Update Tolerance',
            description: "Updated rounding tolerance from {$oldTolerance} to {$newTolerance}",
            entityType: 'ValidationSetting',
            entityId: 'rounding_tolerance',
            metadata: [
                'old_value' => $oldTolerance,
                'new_value' => $newTolerance,
            ]
        );

        return back()->with('success', 'Rounding tolerance updated successfully');
    }

    public function uploadImData(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:7168000', // Max 7GB
            'data_type' => 'required|in:pembelian,penjualan',
        ]);

        $file = $request->file('file');
        $dataType = $request->data_type;
        $originalName = $file->getClientOriginalName();

        // Validate filename based on data type
        $expectedFilenames = [
            'pembelian' => 'im_purchases_and_return',
            'penjualan' => 'im_jual',
        ];

        $expectedFilename = $expectedFilenames[$dataType];
        $fileNameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);

        if (stripos($fileNameWithoutExt, $expectedFilename) === false) {
            return back()->withErrors([
                'file' => "Invalid filename for {$dataType}. Expected filename containing '{$expectedFilename}'"
            ]);
        }

        try {
            // Store file temporarily
            $path = $file->store('im_data_uploads', 'local');
            $fullPath = Storage::path($path);

            Log::info('IM data file uploaded', [
                'filename' => $originalName,
                'data_type' => $dataType,
                'size' => $file->getSize(),
                'path' => $fullPath,
            ]);

            // Dispatch job to process the file
            ProcessImDataUpload::dispatch($fullPath, $dataType, $originalName, auth()->id());

            ActivityLogger::log(
                action: 'Upload IM Data',
                description: "Started processing IM data file: {$originalName} ({$dataType})",
                entityType: 'ImDataUpload',
                entityId: $path,
                metadata: [
                    'filename' => $originalName,
                    'data_type' => $dataType,
                    'size_mb' => round($file->getSize() / 1024 / 1024, 2),
                ]
            );

            return back()->with('success', 'File uploaded successfully and is being processed in the background.');
        } catch (\Exception $e) {
            Log::error('Failed to upload IM data', [
                'error' => $e->getMessage(),
                'filename' => $originalName,
            ]);

            return back()->withErrors(['file' => 'Failed to upload file: ' . $e->getMessage()]);
        }
    }

    public function refreshImDataCount(Request $request)
    {
        $request->validate([
            'table_name' => 'required|in:im_purchases_and_return,im_jual,all',
        ]);

        $tableName = $request->table_name;
        $userName = auth()->user()?->name ?? 'System';

        try {
            $updated = [];

            if ($tableName === 'all') {
                // Refresh both tables
                $pembelianCount = DB::table('im_purchases_and_return')->count();
                $penjualanCount = DB::table('im_jual')->count();

                ImDataInfo::updateInfo('im_purchases_and_return', $pembelianCount, $userName);
                ImDataInfo::updateInfo('im_jual', $penjualanCount, $userName);

                $updated = [
                    'im_purchases_and_return' => $pembelianCount,
                    'im_jual' => $penjualanCount,
                ];

                ActivityLogger::log(
                    action: 'Refresh IM Data Count',
                    description: "Refreshed validation data counts - Pembelian: {$pembelianCount} rows, Penjualan: {$penjualanCount} rows",
                    entityType: 'ImDataInfo',
                    entityId: 'all',
                    metadata: [
                        'pembelian_count' => $pembelianCount,
                        'penjualan_count' => $penjualanCount,
                    ]
                );
            } else {
                // Refresh specific table
                $count = DB::table($tableName)->count();
                ImDataInfo::updateInfo($tableName, $count, $userName);

                $updated[$tableName] = $count;

                $displayName = $tableName === 'im_purchases_and_return' ? 'Pembelian' : 'Penjualan';

                ActivityLogger::log(
                    action: 'Refresh IM Data Count',
                    description: "Refreshed {$displayName} validation data count: {$count} rows",
                    entityType: 'ImDataInfo',
                    entityId: $tableName,
                    metadata: [
                        'table_name' => $tableName,
                        'row_count' => $count,
                    ]
                );
            }

            return back()->with('success', 'Validation data count refreshed successfully')->with('updated_counts', $updated);

        } catch (\Exception $e) {
            Log::error('Failed to refresh IM data count', [
                'table_name' => $tableName,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors(['refresh' => 'Failed to refresh data count: ' . $e->getMessage()]);
        }
    }
}
