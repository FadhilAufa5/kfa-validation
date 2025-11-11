# Queue Worker Guide - How to Process Jobs

## Overview

Your async validation jobs are queued in the database but need a **queue worker** to execute them. Without a running worker, jobs will remain in the `jobs` table with status "pending" and never complete.

## Current Configuration

From your `.env` file:
```env
QUEUE_CONNECTION=database
```

This means jobs are stored in the `jobs` database table and processed by a worker.

## Quick Start

### Option 1: Simple Worker (Development)

Open a new terminal and run:

```bash
cd C:\Users\ZBOOK\Herd\kfa-validation
php artisan queue:work
```

**Keep this terminal open!** The worker runs continuously and processes jobs as they arrive.

### Option 2: Queue Listen (Auto-reload on code changes)

```bash
php artisan queue:listen
```

This automatically reloads when you change code (slower but good for development).

### Option 3: Process One Job at a Time

```bash
php artisan queue:work --once
```

Processes one job and stops. Good for testing.

## How It Works

```
┌─────────────────────────────────────────────────┐
│ User submits validation (async)                 │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Job added to 'jobs' table (status: pending)     │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ API returns 202 with validation_id               │
└─────────────────────────────────────────────────┘
                  
                  │ Queue Worker picks up job
                  ▼
┌─────────────────────────────────────────────────┐
│ ProcessFileValidation job executes               │
│ 1. Maps file data                               │
│ 2. Validates data                               │
│ 3. Updates validation record                    │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Job removed from 'jobs' table                   │
│ Validation status: 'completed' or 'failed'      │
└─────────────────────────────────────────────────┘
```

## Step-by-Step Instructions

### 1. Check Current Queue Status

```bash
# Check if there are pending jobs
php artisan queue:monitor database:default
```

Or query the database:
```sql
SELECT * FROM jobs;
```

### 2. Start the Queue Worker

**Windows PowerShell:**
```powershell
cd C:\Users\ZBOOK\Herd\kfa-validation
php artisan queue:work --tries=3 --timeout=600
```

**Windows CMD:**
```cmd
cd C:\Users\ZBOOK\Herd\kfa-validation
php artisan queue:work --tries=3 --timeout=600
```

### 3. What You'll See

```
[2025-11-04 08:47:00] Processing: App\Jobs\ProcessFileValidation
[2025-11-04 08:47:30] Processed:  App\Jobs\ProcessFileValidation
```

### 4. Monitor in Real-Time

Open another terminal and watch the logs:
```bash
tail -f storage/logs/laravel.log
```

Or on Windows:
```powershell
Get-Content storage\logs\laravel.log -Wait -Tail 50
```

## Worker Options Explained

| Option | Description | Example |
|--------|-------------|---------|
| `--queue=` | Specify queue name | `--queue=validations` |
| `--tries=3` | Max retry attempts | Retries 3 times on failure |
| `--timeout=600` | Max execution time (seconds) | 10 minutes timeout |
| `--sleep=3` | Sleep seconds when no jobs | Default is 3 seconds |
| `--once` | Process one job and exit | Good for testing |
| `--daemon` | Run as background process | Production mode |
| `--stop-when-empty` | Stop when queue is empty | Testing mode |

## Common Commands

### Start Worker
```bash
php artisan queue:work
```

### Start with Options
```bash
php artisan queue:work --tries=3 --timeout=600 --sleep=3
```

### Process Specific Queue
```bash
php artisan queue:work --queue=high,default
```

### Stop Worker Gracefully
Press `Ctrl+C` in the terminal

### View Failed Jobs
```bash
php artisan queue:failed
```

### Retry Failed Job
```bash
php artisan queue:retry {job-id}
```

### Retry All Failed Jobs
```bash
php artisan queue:retry all
```

### Clear Failed Jobs
```bash
php artisan queue:flush
```

### Restart All Workers
```bash
php artisan queue:restart
```

## Monitoring Jobs

### Check Database Directly

**Pending Jobs:**
```sql
SELECT id, queue, payload, attempts, created_at 
FROM jobs 
ORDER BY id DESC;
```

**Failed Jobs:**
```sql
SELECT id, queue, payload, exception, failed_at 
FROM failed_jobs 
ORDER BY failed_at DESC;
```

### Check Validation Status

```sql
SELECT id, file_name, status, processing_details, created_at
FROM validations
WHERE status = 'processing'
ORDER BY created_at DESC;
```

## Troubleshooting

### Problem: Jobs Not Processing

**Symptoms:**
- Jobs stay in `jobs` table
- Validation status remains 'processing'
- Nothing happens

**Solution:**
```bash
# Check if worker is running
# If not, start it:
php artisan queue:work
```

### Problem: Worker Stops After One Job

**Cause:** Using `--once` flag

**Solution:**
```bash
# Use regular queue:work (processes continuously)
php artisan queue:work
```

### Problem: Jobs Failing Immediately

**Check logs:**
```bash
# View recent logs
tail -50 storage/logs/laravel.log

# Or view failed jobs
php artisan queue:failed
```

**Common causes:**
- Missing file in storage
- Database connection issues
- Memory limit exceeded
- Timeout too short

### Problem: Worker Crashes

**Symptoms:**
- Worker terminal shows error
- Worker exits unexpectedly

**Solutions:**
```bash
# Increase memory limit
php -d memory_limit=512M artisan queue:work

# Increase timeout
php artisan queue:work --timeout=900
```

### Problem: Old Code Running

**Symptoms:**
- Code changes not reflected
- Worker using cached code

**Solution:**
```bash
# Restart worker (Ctrl+C, then restart)
php artisan queue:restart

# Or clear cache
php artisan cache:clear
php artisan config:clear
```

## Production Setup (Windows)

### Using Windows Task Scheduler

1. **Create a batch file** (`start_queue_worker.bat`):
```batch
@echo off
cd C:\Users\ZBOOK\Herd\kfa-validation
php artisan queue:work --tries=3 --timeout=600 --daemon
```

2. **Create Task in Task Scheduler:**
   - Open Task Scheduler
   - Create Basic Task
   - Name: "KFA Queue Worker"
   - Trigger: At startup
   - Action: Start a program
   - Program: `C:\Users\ZBOOK\Herd\kfa-validation\start_queue_worker.bat`
   - Settings: Run whether user is logged on or not

### Using NSSM (Non-Sucking Service Manager)

Better option for production on Windows:

```bash
# Download NSSM from https://nssm.cc/download

# Install as service
nssm install KFAQueueWorker "C:\path\to\php.exe" "artisan queue:work --tries=3 --timeout=600"
nssm set KFAQueueWorker AppDirectory "C:\Users\ZBOOK\Herd\kfa-validation"
nssm start KFAQueueWorker
```

## Development Workflow

### Recommended Setup

**Terminal 1: Application Server**
```bash
php artisan serve
# or Herd handles this
```

**Terminal 2: Queue Worker**
```bash
php artisan queue:listen
# Uses queue:listen for auto-reload during development
```

**Terminal 3: Logs**
```bash
Get-Content storage\logs\laravel.log -Wait -Tail 50
```

### Testing Workflow

1. **Start worker:**
```bash
php artisan queue:work --once --stop-when-empty
```

2. **Submit validation through UI or API**

3. **Check results:**
```bash
# View validation status
php artisan tinker
>>> App\Models\Validation::latest()->first();

# Or query directly
php artisan db:query "SELECT * FROM validations ORDER BY id DESC LIMIT 1"
```

## Best Practices

### Development
- ✅ Use `queue:listen` for auto-reload
- ✅ Keep worker terminal visible
- ✅ Monitor logs in separate terminal
- ✅ Use `--once` for testing specific jobs

### Production
- ✅ Use `queue:work --daemon` for efficiency
- ✅ Set up process manager (NSSM on Windows)
- ✅ Configure automatic restart on failure
- ✅ Monitor with `queue:monitor`
- ✅ Set up alerts for failed jobs

### Performance
- ✅ Run multiple workers for concurrent processing
- ✅ Adjust `--timeout` based on job complexity
- ✅ Use Redis instead of database for high volume
- ✅ Monitor memory usage

## Quick Reference Card

### Start Worker (Development)
```bash
php artisan queue:listen
```

### Start Worker (Production)
```bash
php artisan queue:work --tries=3 --timeout=600 --daemon
```

### Stop Worker
```
Ctrl+C (graceful stop)
```

### Check Status
```bash
php artisan queue:monitor
```

### View Failed Jobs
```bash
php artisan queue:failed
```

### Retry Failed Jobs
```bash
php artisan queue:retry all
```

### Clear All Jobs
```bash
php artisan queue:flush
```

## Examples

### Example 1: Process One Validation Job

```bash
# Terminal 1: Start worker
php artisan queue:work --once

# Terminal 2: Watch logs
Get-Content storage\logs\laravel.log -Wait -Tail 50

# Terminal 3: Submit validation via API or UI
curl -X POST http://localhost/pembelian/validate-reguler \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.csv","headerRow":1}'
```

### Example 2: Continuous Processing

```bash
# Start worker that runs continuously
php artisan queue:work --tries=3 --timeout=600

# Submit multiple validations
# Worker will process them one by one
```

### Example 3: High Volume Processing

```bash
# Terminal 1: Worker 1
php artisan queue:work --queue=high,default --name=worker1

# Terminal 2: Worker 2  
php artisan queue:work --queue=high,default --name=worker2

# Terminal 3: Worker 3
php artisan queue:work --queue=default --name=worker3

# Now 3 jobs can be processed simultaneously
```

## Health Check Script

Create `check_queue_health.php`:

```php
<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$pendingJobs = DB::table('jobs')->count();
$failedJobs = DB::table('failed_jobs')->count();
$processingValidations = DB::table('validations')
    ->where('status', 'processing')
    ->count();

echo "Queue Health Check\n";
echo "==================\n";
echo "Pending Jobs: {$pendingJobs}\n";
echo "Failed Jobs: {$failedJobs}\n";
echo "Processing Validations: {$processingValidations}\n";

if ($pendingJobs > 0) {
    echo "\n⚠️  Warning: {$pendingJobs} jobs waiting to be processed\n";
    echo "Start queue worker: php artisan queue:work\n";
} else {
    echo "\n✅ No pending jobs\n";
}

if ($failedJobs > 0) {
    echo "\n❌ {$failedJobs} jobs failed\n";
    echo "View failed jobs: php artisan queue:failed\n";
}
```

Run:
```bash
php check_queue_health.php
```

## Summary

**To process async validation jobs:**

1. **Open terminal**
2. **Navigate to project:**
   ```bash
   cd C:\Users\ZBOOK\Herd\kfa-validation
   ```
3. **Start worker:**
   ```bash
   php artisan queue:work
   ```
4. **Keep terminal open** while processing jobs
5. **Monitor progress** in logs or UI

**Key Point:** The queue worker must be running for jobs to execute. Without it, jobs will queue up but never process!
