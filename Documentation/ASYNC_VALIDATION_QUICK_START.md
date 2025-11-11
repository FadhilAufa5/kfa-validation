# Async Validation - Quick Start Guide

## What Was Implemented

Asynchronous file validation using Laravel Queue system for better performance and user experience with large files.

## Files Created/Modified

### New Files
1. **`app/Jobs/ProcessFileValidation.php`** - Background job for async validation
2. **`database/migrations/2025_11_04_014701_add_status_to_validations_table.php`** - Migration for status tracking
3. **`Documentation/ASYNC_VALIDATION.md`** - Full documentation

### Modified Files
1. **`app/Http/Controllers/PembelianController.php`** - Added async validation methods
2. **`app/Models/Validation.php`** - Added status and processing_details fields
3. **`routes/web.php`** - Added status endpoint route

## Quick Usage

### 1. Start Queue Worker (Required!)

Before using async validation, you MUST start a queue worker:

```bash
# In terminal
cd C:\Users\ZBOOK\Herd\kfa-validation
php artisan queue:work
```

**Important**: Keep this terminal running in the background!

### 2. API Request

**Async Validation (Default):**
```bash
POST /pembelian/validate-reguler
{
  "filename": "test.csv",
  "headerRow": 1
}
```

Returns immediately with validation ID:
```json
{
  "status": "processing",
  "validation_id": 123,
  "check_status_url": "/pembelian/validation/123/status"
}
```

**Check Status:**
```bash
GET /pembelian/validation/123/status
```

**Sync Validation (Legacy):**
```bash
POST /pembelian/validate-reguler
{
  "filename": "test.csv",
  "headerRow": 1,
  "async": false
}
```

## Validation Status Flow

```
processing → completed ✅
           ↓
         failed ❌
```

## Testing

### Test Async Validation

1. Start queue worker:
```bash
php artisan queue:work
```

2. Upload and validate a file through the UI or API

3. Check status endpoint to monitor progress

4. View logs:
```bash
tail -f storage/logs/laravel.log
```

### Test Job Failure

To test retry logic:
```bash
# View failed jobs
php artisan queue:failed

# Retry specific job
php artisan queue:retry {job-id}

# Retry all failed jobs
php artisan queue:retry all
```

## Environment Setup

Make sure `.env` has:
```env
QUEUE_CONNECTION=database
```

## Production Deployment

### 1. Run Migration
```bash
php artisan migrate
```

### 2. Setup Supervisor (Recommended)

Create `/etc/supervisor/conf.d/kfa-validation-worker.conf`:
```ini
[program:kfa-validation-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/artisan queue:work --tries=3 --timeout=600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/path/to/storage/logs/worker.log
stopwaitsecs=3600
```

Then:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start kfa-validation-worker:*
```

### 3. Monitor Queue

```bash
# Check running jobs
php artisan queue:monitor database:default

# View failed jobs
php artisan queue:failed

# Clear old failed jobs (older than 48 hours)
php artisan queue:prune-failed --hours=48
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Jobs not processing | Start queue worker: `php artisan queue:work` |
| Validation stuck | Check logs, restart queue worker |
| Memory issues | Use `queue:work` with `--memory=512` option |
| Slow processing | Increase queue workers in supervisor config |

## Key Features

✅ **Non-blocking** - API returns immediately  
✅ **Retry Logic** - Automatic retry up to 3 times  
✅ **Status Tracking** - Real-time status checking  
✅ **Error Handling** - Graceful failure with error details  
✅ **Activity Logging** - Full audit trail  
✅ **Backward Compatible** - Sync mode still available  

## Performance Tips

- Use async for files with >1000 rows
- Run multiple queue workers for concurrent processing
- Consider Redis queue driver for high-volume production use
- Monitor memory usage with large files

## Next Steps

1. Update frontend to implement status polling
2. Add progress indicators in UI
3. Configure supervisor for production
4. Consider adding webhooks for completion notifications
5. Implement user notifications (email/push) when validation completes
