# Asynchronous File Validation

This document explains the asynchronous file validation feature implemented in the KFA Validation system.

## Overview

The asynchronous validation feature allows large files to be processed in the background using Laravel's queue system. This prevents timeouts and provides a better user experience by not blocking the HTTP request while processing is happening.

## How It Works

### 1. Validation Request
When a validation request is made with `async: true` (default), the system:
- Creates a placeholder `Validation` record with `status: 'processing'`
- Dispatches a background job (`ProcessFileValidation`)
- Immediately returns HTTP 202 (Accepted) with validation ID and status URL

### 2. Background Processing
The background job (`ProcessFileValidation`) handles:
- File mapping to `mapped_uploaded_files` table
- Data validation against source documents
- Updating the validation record with results
- Error handling and retry logic (up to 3 attempts)

### 3. Status Checking
Clients can poll the status endpoint to check validation progress and get results when completed.

## API Usage

### Submit File for Validation (Async)

**Request:**
```http
POST /pembelian/validate-{type}
Content-Type: application/json

{
  "filename": "uploaded_file.csv",
  "headerRow": 1,
  "async": true  // Default is true
}
```

**Response (202 Accepted):**
```json
{
  "status": "processing",
  "message": "File validation has been queued for processing",
  "validation_id": 123,
  "check_status_url": "/pembelian/validation/123/status"
}
```

### Check Validation Status

**Request:**
```http
GET /pembelian/validation/{id}/status
```

**Response (Processing):**
```json
{
  "validation_id": 123,
  "status": "processing",
  "file_name": "uploaded_file.csv",
  "document_type": "pembelian",
  "document_category": "Reguler",
  "processing_details": {
    "header_row": 1,
    "started_at": "2025-11-04T01:47:00.000Z"
  }
}
```

**Response (Completed):**
```json
{
  "validation_id": 123,
  "status": "completed",
  "file_name": "uploaded_file.csv",
  "document_type": "pembelian",
  "document_category": "Reguler",
  "score": 98.5,
  "total_records": 1000,
  "matched_records": 985,
  "mismatched_records": 15,
  "view_url": "/pembelian/123",
  "processing_details": {
    "mapping_info": {
      "total_rows": 1000,
      "mapped_records": 998,
      "skipped_rows": 2,
      "failed_rows": 0
    },
    "completed_at": "2025-11-04T01:48:30.000Z"
  }
}
```

**Response (Failed):**
```json
{
  "validation_id": 123,
  "status": "failed",
  "file_name": "uploaded_file.csv",
  "document_type": "pembelian",
  "document_category": "Reguler",
  "processing_details": {
    "error": "Mapping configuration not found for this document type",
    "failed_at": "2025-11-04T01:47:15.000Z"
  }
}
```

## Synchronous Validation (Legacy)

For backward compatibility or small files, synchronous validation is still available:

**Request:**
```http
POST /pembelian/validate-{type}
Content-Type: application/json

{
  "filename": "uploaded_file.csv",
  "headerRow": 1,
  "async": false
}
```

This will process the validation immediately and return results in the response (same as before).

## Queue Configuration

The system uses Laravel's queue system. Default configuration uses the `database` driver.

### Running the Queue Worker

To process background jobs, you must run a queue worker:

```bash
# Production (with supervisor or similar process manager)
php artisan queue:work --tries=3 --timeout=600

# Development
php artisan queue:listen
```

### Queue Settings

- **Driver**: Database (default)
- **Max Attempts**: 3
- **Timeout**: 600 seconds (10 minutes)
- **Queue Name**: default

## Database Schema Changes

New columns added to `validations` table:

| Column | Type | Description |
|--------|------|-------------|
| `status` | string | Current status: 'processing', 'completed', 'failed' |
| `processing_details` | json | Additional processing metadata and timestamps |

## Job Details

**Job Class**: `App\Jobs\ProcessFileValidation`

**Properties**:
- `$tries = 3` - Maximum retry attempts
- `$timeout = 600` - Maximum execution time (10 minutes)

**Parameters**:
- `filename` - Name of uploaded file
- `documentType` - Document type (pembelian/penjualan)
- `documentCategory` - Category (reguler/retur/urgent)
- `headerRow` - Header row number
- `userId` - User ID initiating validation
- `validationId` - Validation record ID to update

## Error Handling

1. **Temporary Failures**: Job retries up to 3 times
2. **Permanent Failures**: Status set to 'failed' with error details
3. **Logging**: All errors logged with context for debugging

## Best Practices

### For Frontend Integration

1. **Submit Validation Request** → Get validation ID
2. **Poll Status Endpoint** → Every 2-5 seconds
3. **Show Progress Indicator** → While status is 'processing'
4. **Handle Completion** → Redirect to results or show summary
5. **Handle Failures** → Show error message with option to retry

### Example Polling Logic (JavaScript)

```javascript
async function pollValidationStatus(validationId) {
  const maxAttempts = 120; // 10 minutes with 5-second intervals
  let attempts = 0;
  
  const poll = async () => {
    if (attempts >= maxAttempts) {
      throw new Error('Validation timeout');
    }
    
    const response = await fetch(`/pembelian/validation/${validationId}/status`);
    const data = await response.json();
    
    if (data.status === 'completed') {
      // Redirect to results page
      window.location.href = data.view_url;
      return;
    }
    
    if (data.status === 'failed') {
      // Show error message
      alert('Validation failed: ' + data.processing_details.error);
      return;
    }
    
    // Still processing, poll again
    attempts++;
    setTimeout(poll, 5000); // Poll every 5 seconds
  };
  
  await poll();
}

// Usage
submitValidation({ filename, headerRow, async: true })
  .then(response => pollValidationStatus(response.validation_id));
```

## Monitoring

Monitor queue jobs using:

```bash
# View failed jobs
php artisan queue:failed

# Retry failed job
php artisan queue:retry {job-id}

# Clear failed jobs
php artisan queue:flush
```

## Performance Considerations

- **Large Files**: Async validation is recommended for files with >1000 rows
- **Concurrent Jobs**: Configure queue workers based on server capacity
- **Database Load**: Queue polling creates database queries; consider Redis for production
- **Timeout Settings**: Adjust `timeout` in job if validations take longer

## Migration to Async

Existing code using synchronous validation will continue to work. To migrate:

1. Update frontend to pass `async: true` (or omit, as it's default)
2. Implement status polling logic
3. Update UI to show processing status
4. Test with various file sizes

## Troubleshooting

### Jobs Not Processing
- Ensure queue worker is running: `php artisan queue:work`
- Check queue configuration in `.env`: `QUEUE_CONNECTION=database`
- Verify `jobs` table exists: `php artisan queue:table` then `php artisan migrate`

### Validation Stuck in Processing
- Check Laravel logs: `storage/logs/laravel.log`
- Review failed jobs: `php artisan queue:failed`
- Verify timeout settings are sufficient

### Performance Issues
- Consider using Redis instead of database queue driver
- Increase number of queue workers
- Optimize database queries in validation logic
