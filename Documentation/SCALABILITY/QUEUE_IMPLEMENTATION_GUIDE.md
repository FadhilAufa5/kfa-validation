# Queue-Based Processing Implementation Guide

## Quick Start (2-3 Days Implementation)

This guide shows how to implement asynchronous queue processing to improve scalability from <100 to 500+ concurrent users.

---

## Prerequisites

- Laravel 10+
- Redis installed (or use database queue)
- Access to server configuration

---

## Step 1: Install Redis (15 minutes)

### Windows (Using WSL or Direct)
```bash
# Using Windows Subsystem for Linux
wsl sudo apt update
wsl sudo apt install redis-server
wsl sudo service redis-server start

# Or use Redis for Windows
# Download from: https://github.com/microsoftarchive/redis/releases
```

### Linux/Mac
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### Verify Redis Works
```bash
redis-cli ping
# Should return: PONG
```

---

## Step 2: Configure Laravel Queue (10 minutes)

### Update `.env`
```env
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### Test Configuration
```bash
php artisan queue:failed-table
php artisan migrate
```

---

## Step 3: Create Processing Job (30 minutes)

### Generate Job Class
```bash
php artisan make:job ProcessUploadedFile
```

### Implement Job Logic
See the complete implementation in `FILE_STORAGE_SCALABILITY_SOLUTIONS.md` Tier 2 section.

**File**: `app/Jobs/ProcessUploadedFile.php`

Key features:
- 5-minute timeout
- 3 retry attempts
- Automatic cleanup on success
- Error logging on failure

---

## Step 4: Update Controllers (30 minutes)

### For Pembelian
```php
// app/Http/Controllers/PembelianController.php

use App\Jobs\ProcessUploadedFile;

public function validateFile(Request $request, $type)
{
    $request->validate([
        'filename' => 'required|string',
        'headerRow' => 'required|integer|min:1',
    ]);

    // Dispatch to queue instead of immediate processing
    ProcessUploadedFile::dispatch(
        $request->input('filename'),
        'pembelian',
        $type,
        (int) $request->input('headerRow', 1),
        auth()->user()?->id
    );

    return response()->json([
        'message' => 'File queued for processing',
        'status' => 'queued'
    ]);
}
```

### For Penjualan
Same pattern - update `PenjualanController::validateFile()`

---

## Step 5: Run Queue Workers (5 minutes)

### Development
```bash
php artisan queue:work --verbose
```

### Production (with Supervisor)

**Install Supervisor**:
```bash
sudo apt install supervisor
```

**Configure Worker**:
```ini
# /etc/supervisor/conf.d/laravel-worker.conf
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/your/app/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/path/to/your/app/storage/logs/worker.log
stopwaitsecs=3600
```

**Start Worker**:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

---

## Step 6: Add Progress Tracking (Optional, 1 hour)

### Create Event
```bash
php artisan make:event FileProcessingCompleted
```

### Broadcast to Frontend
Use Laravel Echo + Pusher/Socket.io for real-time updates

---

## Testing

### Test Queue Works
```bash
# In tinker
php artisan tinker

>>> ProcessUploadedFile::dispatch('test.csv', 'pembelian', 'reguler', 1, 1);
>>> exit

# Check logs
tail -f storage/logs/laravel.log
```

### Test Failed Jobs
```bash
# View failed jobs
php artisan queue:failed

# Retry failed job
php artisan queue:retry {job-id}

# Retry all failed jobs
php artisan queue:retry all
```

---

## Monitoring

### Check Queue Status
```bash
# Number of jobs waiting
php artisan queue:monitor

# View logs
tail -f storage/logs/laravel.log | grep "Processing uploaded file"
```

### Add Laravel Horizon (Optional)
```bash
composer require laravel/horizon
php artisan horizon:install
php artisan horizon
```

Access dashboard at: `http://your-app.test/horizon`

---

## Expected Results

### Before (Synchronous)
- Upload time: 5-30 seconds (blocking)
- Max concurrent: ~10-20 users
- User experience: Must wait

### After (Asynchronous)
- Upload time: <1 second (non-blocking)
- Max concurrent: 100-500 users
- User experience: Immediate response

---

## Rollback Plan

If issues occur:

1. **Stop workers**:
   ```bash
   sudo supervisorctl stop laravel-worker:*
   ```

2. **Change queue to sync**:
   ```env
   QUEUE_CONNECTION=sync
   ```

3. **Revert controller changes**:
   - Call `MappedFileService` directly
   - Don't dispatch job

---

## Next Steps

After implementing queues:
1. Monitor performance for 1-2 weeks
2. When approaching 500 users, plan Tier 3 (Cloud Storage)
3. Consider adding progress bars for better UX

---

**Implementation Time**: 2-3 days  
**Difficulty**: Medium  
**Impact**: High (10x scalability improvement)  
**Cost**: $10-20/month (Redis hosting)

