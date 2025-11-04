<?php

/**
 * Queue Health Check Script
 * 
 * Checks the status of the queue system
 * Run: php check_queue_health.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "╔════════════════════════════════════════╗\n";
echo "║     Queue Health Check                 ║\n";
echo "╚════════════════════════════════════════╝\n\n";

// Check database connection
try {
    DB::connection()->getPdo();
    echo "✅ Database Connection: OK\n";
} catch (\Exception $e) {
    echo "❌ Database Connection: FAILED\n";
    echo "   Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Check jobs table
$pendingJobs = 0;
try {
    $pendingJobs = DB::table('jobs')->count();
    echo "✅ Jobs Table: OK\n";
} catch (\Exception $e) {
    echo "❌ Jobs Table: NOT FOUND\n";
    echo "   Run: php artisan queue:table && php artisan migrate\n";
}

// Check failed_jobs table
$failedJobs = 0;
try {
    $failedJobs = DB::table('failed_jobs')->count();
    echo "✅ Failed Jobs Table: OK\n";
} catch (\Exception $e) {
    echo "⚠️  Failed Jobs Table: NOT FOUND\n";
    echo "   Run: php artisan queue:failed-table && php artisan migrate\n";
}

// Check validations with processing status
$processingValidations = DB::table('validations')
    ->where('status', 'processing')
    ->count();

$completedToday = DB::table('validations')
    ->where('status', 'completed')
    ->whereDate('created_at', date('Y-m-d'))
    ->count();

$failedToday = DB::table('validations')
    ->where('status', 'failed')
    ->whereDate('created_at', date('Y-m-d'))
    ->count();

echo "\n";
echo "╔════════════════════════════════════════╗\n";
echo "║     Queue Statistics                   ║\n";
echo "╚════════════════════════════════════════╝\n\n";

echo "Pending Jobs:           {$pendingJobs}\n";
echo "Failed Jobs:            {$failedJobs}\n";
echo "Processing Validations: {$processingValidations}\n";
echo "Completed Today:        {$completedToday}\n";
echo "Failed Today:           {$failedToday}\n";

echo "\n";
echo "╔════════════════════════════════════════╗\n";
echo "║     Status & Recommendations           ║\n";
echo "╚════════════════════════════════════════╝\n\n";

$hasIssues = false;

if ($pendingJobs > 0) {
    echo "⚠️  WARNING: {$pendingJobs} jobs waiting to be processed\n";
    echo "   Action: Start queue worker\n";
    echo "   Command: php artisan queue:work\n";
    echo "   Or run: start_queue_worker.bat\n\n";
    $hasIssues = true;
}

if ($processingValidations > 0) {
    echo "⏳ INFO: {$processingValidations} validations currently processing\n";
    echo "   These validations have status 'processing'\n";
    
    // Check if any are stuck (older than 30 minutes)
    $stuckValidations = DB::table('validations')
        ->where('status', 'processing')
        ->where('created_at', '<', now()->subMinutes(30))
        ->count();
    
    if ($stuckValidations > 0) {
        echo "   ⚠️  {$stuckValidations} validations stuck (>30 min)\n";
        echo "   Action: Check if queue worker is running\n";
        $hasIssues = true;
    }
    echo "\n";
}

if ($failedJobs > 0) {
    echo "❌ ERROR: {$failedJobs} jobs failed\n";
    echo "   Action: Review failed jobs\n";
    echo "   Command: php artisan queue:failed\n";
    echo "   To retry: php artisan queue:retry all\n\n";
    $hasIssues = true;
}

if (!$hasIssues && $pendingJobs === 0) {
    echo "✅ All systems operational!\n";
    echo "   No pending jobs\n";
    echo "   Queue is healthy\n\n";
}

// Recent validations
echo "╔════════════════════════════════════════╗\n";
echo "║     Recent Validations (Last 5)        ║\n";
echo "╚════════════════════════════════════════╝\n\n";

$recentValidations = DB::table('validations')
    ->select('id', 'file_name', 'status', 'score', 'created_at')
    ->orderBy('id', 'desc')
    ->limit(5)
    ->get();

if ($recentValidations->isEmpty()) {
    echo "No validations found.\n";
} else {
    foreach ($recentValidations as $validation) {
        $statusIcon = match($validation->status) {
            'completed' => '✅',
            'failed' => '❌',
            'processing' => '⏳',
            default => '❓'
        };
        
        $score = $validation->score ?? 'N/A';
        echo "{$statusIcon} ID: {$validation->id} | {$validation->file_name}\n";
        echo "   Status: {$validation->status} | Score: {$score}% | {$validation->created_at}\n\n";
    }
}

echo "╔════════════════════════════════════════╗\n";
echo "║     Quick Commands                     ║\n";
echo "╚════════════════════════════════════════╝\n\n";

echo "Start worker:    php artisan queue:work\n";
echo "Stop worker:     Ctrl+C (in worker terminal)\n";
echo "View failed:     php artisan queue:failed\n";
echo "Retry failed:    php artisan queue:retry all\n";
echo "Clear failed:    php artisan queue:flush\n";
echo "Monitor queue:   php artisan queue:monitor\n";
echo "\n";

// Check if worker might be running (very basic check)
$isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
if ($isWindows) {
    exec('tasklist /FI "IMAGENAME eq php.exe" 2>nul', $output);
    $phpProcesses = count($output) - 3; // Subtract header lines
    
    if ($phpProcesses > 1) {
        echo "ℹ️  INFO: {$phpProcesses} PHP processes detected\n";
        echo "   A queue worker might be running\n";
    } else {
        echo "⚠️  WARNING: No PHP processes detected\n";
        echo "   Queue worker might not be running\n";
    }
}

echo "\n✅ Health check complete!\n";
