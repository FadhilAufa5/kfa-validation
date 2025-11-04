# Mapping Process Logging Guide

## Overview
Comprehensive logging has been added to the `MappedFileService` to track every step of the data mapping process, from individual row processing to bulk database insertion.

**Date**: 2025-11-03  
**Status**: ✅ Complete

---

## Logging Levels

The service uses different log levels for different types of events:

| Level | Purpose | When Used |
|-------|---------|-----------|
| **INFO** | Normal operations | Process start, successful completion, insertions |
| **DEBUG** | Detailed tracking | Individual row mappings (verbose) |
| **WARNING** | Non-critical issues | Skipped rows, file not found |
| **ERROR** | Critical failures | Failed rows, database errors, exceptions |

---

## Log Entries

### 1. Process Start

**When**: At the beginning of mapping process

**Log Level**: INFO

**Example**:
```
[INFO] Starting data mapping process
  filename: document_12345.csv
  document_type: pembelian
  document_category: reguler
  total_rows_to_process: 150
```

**Purpose**: Confirms process started and shows expected workload

---

### 2. Individual Row Mapping Success

**When**: Each row successfully mapped (verbose)

**Log Level**: DEBUG

**Example**:
```
[DEBUG] Row mapped successfully
  file: document_12345.csv
  row: 5
  connector: PR-2024-001
  sum_field: 125000.50
```

**Purpose**: Track which rows were mapped successfully (useful for debugging specific rows)

**Note**: This can generate many logs for large files. Use for debugging only.

---

### 3. Skipped Rows

**When**: Row missing connector value

**Log Level**: WARNING

**Example**:
```
[WARNING] Skipping row without connector value
  file: document_12345.csv
  row: 8
  reason: Empty connector value
```

**Purpose**: Track which rows were skipped and why

---

### 4. Failed Row Mapping

**When**: Exception during row mapping

**Log Level**: ERROR

**Example**:
```
[ERROR] Failed to map row data
  file: document_12345.csv
  row: 12
  error: Column 'KODE BM' not found in file
  trace: [stack trace...]
```

**Purpose**: Identify and debug specific row failures

---

### 5. Database Insertion Attempt

**When**: Before bulk insert

**Log Level**: INFO

**Example**:
```
[INFO] Attempting to insert mapped records into database
  filename: document_12345.csv
  records_count: 148
```

**Purpose**: Confirms database operation is about to start

---

### 6. Successful Insertion ✅

**When**: Bulk insert succeeds

**Log Level**: INFO

**Example**:
```
[INFO] ✅ Data inserted successfully into mapped_uploaded_files table
  filename: document_12345.csv
  document_type: pembelian
  document_category: reguler
  header_row: 1
  total_rows_in_file: 150
  successfully_inserted: 148
  skipped_rows: 2
  failed_rows: 0
  user_id: 5
```

**Purpose**: Comprehensive summary of entire mapping operation

---

### 7. Skipped Rows Summary

**When**: If any rows were skipped

**Log Level**: WARNING

**Example**:
```
[WARNING] Some rows were skipped during mapping
  filename: document_12345.csv
  skipped_count: 2
  skipped_details: [
    {"row": 8, "reason": "Empty connector value"},
    {"row": 15, "reason": "Empty connector value"}
  ]
```

**Purpose**: Detailed list of all skipped rows for review

---

### 8. Failed Rows Summary

**When**: If any rows failed to map

**Log Level**: ERROR

**Example**:
```
[ERROR] Some rows failed to map
  filename: document_12345.csv
  failed_count: 1
  failed_details: [
    {"row": 12, "error": "Column 'KODE BM' not found in file"}
  ]
```

**Purpose**: Detailed list of all failed rows for debugging

---

### 9. Database Insert Failure ❌

**When**: Insert operation fails

**Log Level**: ERROR

**Example**:
```
[ERROR] ❌ Failed to insert mapped records - Insert returned false
  filename: document_12345.csv
  records_count: 148
```

**Purpose**: Alert that database insertion failed

---

### 10. Database Exception ❌

**When**: Exception during insert

**Log Level**: ERROR

**Example**:
```
[ERROR] ❌ Exception occurred during data insertion
  filename: document_12345.csv
  document_type: pembelian
  document_category: reguler
  records_attempted: 148
  error: SQLSTATE[23000]: Integrity constraint violation
  trace: [stack trace...]
```

**Purpose**: Detailed error information for database issues

---

### 11. No Records to Insert

**When**: All rows were skipped or failed

**Log Level**: WARNING

**Example**:
```
[WARNING] No records to insert - all rows were skipped or failed
  filename: document_12345.csv
  total_rows: 150
  skipped_rows: 145
  failed_rows: 5
```

**Purpose**: Alert that no data was successfully mapped

---

### 12. File Deletion

**When**: After successful mapping

**Log Level**: INFO

**Example**:
```
[INFO] Deleted uploaded file after mapping
  filename: document_12345.csv
  path: uploads/document_12345.csv
```

**Purpose**: Confirm file cleanup completed

---

## Enhanced Return Data

The `mapUploadedFile()` method now returns detailed information:

```php
[
    'success' => true,
    'filename' => 'document_12345.csv',
    'total_rows' => 150,           // Total rows in file
    'mapped_records' => 148,        // Successfully inserted
    'skipped_rows' => 2,            // Skipped (missing connector)
    'failed_rows' => 0,             // Failed to map
    'skipped_details' => [          // Details of skipped rows
        ['row' => 8, 'reason' => 'Empty connector value'],
        ['row' => 15, 'reason' => 'Empty connector value']
    ],
    'failed_details' => []          // Details of failed rows
]
```

---

## Monitoring & Debugging

### View All Mapping Logs

```bash
# Real-time monitoring
tail -f storage/logs/laravel.log | grep "mapping"

# View recent mapping operations
tail -100 storage/logs/laravel.log | grep "Data inserted successfully"
```

### Find Failed Operations

```bash
# Find all failed insertions
grep "Failed to insert" storage/logs/laravel.log

# Find exceptions during mapping
grep "Exception occurred during data insertion" storage/logs/laravel.log
```

### Track Specific File

```bash
# All logs for a specific file
grep "document_12345.csv" storage/logs/laravel.log

# Only errors for specific file
grep "document_12345.csv" storage/logs/laravel.log | grep ERROR
```

### Count Success Rate

```bash
# Count successful insertions today
grep "$(date +%Y-%m-%d)" storage/logs/laravel.log | grep "Data inserted successfully" | wc -l

# Count failed insertions today
grep "$(date +%Y-%m-%d)" storage/logs/laravel.log | grep "Exception occurred during data insertion" | wc -l
```

---

## Troubleshooting Guide

### Issue: No Logs Appearing

**Possible Causes**:
1. Log level too high in config
2. Disk space full
3. Permission issues

**Check**:
```bash
# Check log file permissions
ls -la storage/logs/laravel.log

# Check disk space
df -h

# Check Laravel log level in .env
grep LOG_LEVEL .env
```

**Fix**:
```env
# In .env file
LOG_LEVEL=debug  # For detailed logs
```

---

### Issue: Too Many Logs (DEBUG)

**Problem**: Individual row logs flooding the log file

**Solution**: 
```php
// In MappedFileService.php, comment out or remove DEBUG logs:
// Log::debug("Row mapped successfully", [...]);
```

Or filter log level in production:
```env
LOG_LEVEL=info  # Skip debug logs
```

---

### Issue: Data Not Inserted But No Errors

**Diagnostic Steps**:

1. **Check if mapping started**:
   ```bash
   grep "Starting data mapping process" storage/logs/laravel.log | tail -1
   ```

2. **Check for skipped rows**:
   ```bash
   grep "Skipping row" storage/logs/laravel.log
   ```

3. **Check insertion logs**:
   ```bash
   grep "Attempting to insert" storage/logs/laravel.log | tail -1
   ```

4. **Check database directly**:
   ```sql
   SELECT COUNT(*) FROM mapped_uploaded_files 
   WHERE filename = 'your_file.csv';
   ```

---

### Issue: Some Rows Missing

**Find Missing Rows**:

1. **Check skipped rows**:
   ```bash
   grep "Skipping row" storage/logs/laravel.log | grep "your_file.csv"
   ```

2. **Check failed rows**:
   ```bash
   grep "Failed to map row" storage/logs/laravel.log | grep "your_file.csv"
   ```

3. **Check summary**:
   ```bash
   grep "Data inserted successfully" storage/logs/laravel.log | grep "your_file.csv"
   ```

Look for:
- `successfully_inserted`: X
- `skipped_rows`: Y
- `failed_rows`: Z

Total should be: X + Y + Z = total_rows_in_file

---

## Log Rotation

### Prevent Log Files from Growing Too Large

**Laravel Configuration** (`config/logging.php`):

```php
'daily' => [
    'driver' => 'daily',
    'path' => storage_path('logs/laravel.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'days' => 14, // Keep logs for 14 days
],
```

**Manual Rotation**:
```bash
# Archive old logs
cd storage/logs
gzip laravel-2025-11-01.log

# Clear current log (careful!)
> laravel.log
```

---

## Performance Considerations

### Log Levels in Production

**Recommended**:
```env
# Production
LOG_LEVEL=info

# Staging
LOG_LEVEL=debug

# Development
LOG_LEVEL=debug
```

### Reducing Log Volume

1. **Comment out DEBUG logs** in production
2. **Use INFO for success**, ERROR for failures
3. **Log summaries** instead of individual row details
4. **Implement log rotation**

### When to Use Each Level

| Operation | Development | Production |
|-----------|-------------|------------|
| Row mapping success | DEBUG | (skip) |
| Process start | INFO | INFO |
| Successful insertion | INFO | INFO |
| Skipped rows | WARNING | WARNING |
| Failed rows | ERROR | ERROR |
| Database exceptions | ERROR | ERROR |

---

## Example Log Flow (Successful)

```
[2025-11-03 10:15:22] INFO: Starting data mapping process
  filename: sales_november.csv
  total_rows_to_process: 100

[2025-11-03 10:15:22] DEBUG: Row mapped successfully (row: 2, connector: TRX-001)
[2025-11-03 10:15:22] DEBUG: Row mapped successfully (row: 3, connector: TRX-002)
... (98 more rows)

[2025-11-03 10:15:23] WARNING: Skipping row without connector value
  row: 45

[2025-11-03 10:15:23] INFO: Attempting to insert mapped records into database
  records_count: 99

[2025-11-03 10:15:23] INFO: ✅ Data inserted successfully
  successfully_inserted: 99
  skipped_rows: 1
  failed_rows: 0

[2025-11-03 10:15:23] INFO: Deleted uploaded file after mapping
  filename: sales_november.csv
```

---

## Example Log Flow (With Errors)

```
[2025-11-03 10:20:15] INFO: Starting data mapping process
  filename: purchase_data.csv
  total_rows_to_process: 50

[2025-11-03 10:20:15] DEBUG: Row mapped successfully (row: 2, connector: PR-001)
...

[2025-11-03 10:20:15] ERROR: Failed to map row data
  row: 10
  error: Column 'KODE BM' not found in file

[2025-11-03 10:20:15] WARNING: Skipping row without connector value
  row: 25

[2025-11-03 10:20:16] INFO: Attempting to insert mapped records into database
  records_count: 48

[2025-11-03 10:20:16] INFO: ✅ Data inserted successfully
  successfully_inserted: 48
  skipped_rows: 1
  failed_rows: 1

[2025-11-03 10:20:16] ERROR: Some rows failed to map
  failed_count: 1
  failed_details: [{"row": 10, "error": "Column 'KODE BM' not found"}]

[2025-11-03 10:20:16] INFO: Deleted uploaded file after mapping
```

---

## Summary

### Logging Coverage

✅ **Process Initiation**: When mapping starts  
✅ **Individual Rows**: Each successful mapping (DEBUG)  
✅ **Skipped Rows**: With reason  
✅ **Failed Rows**: With error details  
✅ **Database Operations**: Insert attempts and results  
✅ **Success Summary**: Complete statistics  
✅ **Error Details**: Stack traces for debugging  
✅ **File Cleanup**: Deletion confirmation  

### Benefits

✅ **Complete Visibility**: Every step logged  
✅ **Easy Debugging**: Detailed error information  
✅ **Performance Tracking**: Success/failure rates  
✅ **Audit Trail**: Who uploaded what and when  
✅ **Problem Detection**: Quick identification of issues  

---

**Last Updated**: 2025-11-03  
**Author**: KFA Development Team  
**Status**: ✅ Production Ready

