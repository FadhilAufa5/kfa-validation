# Implementation Guide - File Processing Refactoring

## Quick Start

### Step 1: Run Migrations
Ensure the status column exists in validations table:
```bash
php artisan migrate
```

### Step 2: Start Queue Worker
The validation process now runs in the background via queue jobs:
```bash
# Windows
start_queue_worker.bat

# Or manually
php artisan queue:work --tries=3 --timeout=600
```

### Step 3: Test the Flow

#### Upload a File:
1. Navigate to `/pembelian` or `/penjualan`
2. Upload a document (Excel/CSV)
3. Click "Validate"

#### Monitor Progress:
1. You'll be redirected to the history page
2. The validation status will show as "Processing" with a spinner
3. Page auto-refreshes every 5 seconds
4. Browser notification appears when complete

#### View Results:
1. Click "Detail" button once processing completes
2. View validation results as before

## Testing Commands

### Test File Upload & Mapping
```bash
php artisan tinker

# Upload and map a test file
$service = app(App\Services\MappedFileService::class);
$result = $service->mapUploadedFile(
    'test-file.csv',
    'pembelian',
    'reguler',
    1,
    1 // user_id
);

dd($result);
```

### Check Mapped Data
```bash
php artisan tinker

# View mapped records
use App\Models\MappedUploadedFile;

$records = MappedUploadedFile::where('filename', 'test-file.csv')->get();
dd($records->count());
```

### Test Validation from Mapped Data
```bash
php artisan tinker

$service = app(App\Services\ValidationService::class);
$result = $service->validateDocument(
    'test-file.csv',
    'pembelian',
    'reguler',
    1,
    1 // user_id
);

dd($result);
```

### Check Validation Status
```bash
php artisan tinker

use App\Models\Validation;

$validation = Validation::latest()->first();
echo "Status: {$validation->status}\n";
echo "Score: {$validation->score}%\n";
dd($validation->processing_details);
```

## How It Works Now

### Before (Old Flow):
```
Upload File → Save to Storage → Read from Storage → Validate → Keep File
```

### After (New Flow):
```
Upload File → Save to Storage → Map to Database → Delete File → 
Queue Job → Read from Database → Validate → Update Status → Notify User
```

## Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| File Storage | Kept indefinitely | Deleted after mapping |
| Validation Source | Reads from storage | Reads from database |
| Processing | Synchronous | Asynchronous (queued) |
| Progress Tracking | None | Real-time status updates |
| User Notification | None | Browser notifications |
| File Access | Required for validation | Only needed for comparison |

## Troubleshooting

### Problem: No mapped data found error
**Solution**: Ensure the file was properly mapped before validation
```bash
# Check if records exist
php artisan tinker
App\Models\MappedUploadedFile::where('filename', 'your-file.csv')->count();
```

### Problem: Browser notifications not showing
**Solution**: 
1. Check browser notification permissions
2. Ensure user has granted permission
3. Check browser console for errors

### Problem: Status stuck on "Processing"
**Solution**: 
1. Check if queue worker is running
2. Check queue status:
```bash
php artisan queue:failed
```
3. Restart queue worker

### Problem: Document comparison fails
**Solution**: The system falls back to storage files if mapped data unavailable
- Older validations may still use storage files
- Check `storage/app/uploads/` directory

## Configuration

### Queue Settings
Edit `.env` to configure queue:
```env
QUEUE_CONNECTION=database
QUEUE_FAILED_DRIVER=database
```

### Notification Settings
Browser notifications are requested automatically. No configuration needed.

### Auto-Refresh Interval
Edit history page to change refresh interval:
```javascript
// In history.tsx
setInterval(() => {
    fetchLogs();
}, 5000); // Change 5000 to desired milliseconds
```

## Performance Tips

1. **Queue Workers**: Run multiple workers for concurrent processing
   ```bash
   php artisan queue:work --queue=default --tries=3 &
   php artisan queue:work --queue=default --tries=3 &
   ```

2. **Database Indexing**: Ensure indexes exist on mapped_uploaded_files
   ```sql
   CREATE INDEX idx_mapped_files ON mapped_uploaded_files(filename, document_type, document_category);
   ```

3. **Chunk Size**: Adjust chunk size in MappedFileService if needed (default: 500)

## API Usage

### Check Validation Status via API
```javascript
// Poll validation status
const checkStatus = async (validationId) => {
    const response = await fetch(`/pembelian/validation/${validationId}/status`);
    const data = await response.json();
    console.log(data.status); // 'processing', 'completed', or 'failed'
};
```

### Get History with Filters
```javascript
const getHistory = async () => {
    const response = await axios.get('/pembelian/history/data', {
        params: {
            search: 'test',
            status: 'Processing', // 'All', 'Valid', 'Invalid', 'Processing', 'Failed'
            page: 1
        }
    });
    return response.data;
};
```

## Rollback Instructions

If you need to rollback to the old system:

1. **Revert ValidationService changes** - Use old `readFileData()` method
2. **Keep files in storage** - Don't delete after mapping
3. **Remove queue processing** - Use sync validation
4. **Rollback migration**:
   ```bash
   php artisan migrate:rollback
   ```

## Next Steps

After successful implementation:

1. Monitor queue jobs for failures
2. Check Laravel logs for errors
3. Gather user feedback on notifications
4. Consider implementing real-time updates with WebSockets
5. Add job retry mechanism for failed validations

## Support Resources

- Laravel Queue Documentation: https://laravel.com/docs/queues
- Browser Notifications API: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API
- Project Documentation: `/Documentation` directory
