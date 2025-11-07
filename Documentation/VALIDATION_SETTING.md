# Validation Setting (Super Admin Only)

## Overview
The Validation Setting page allows Super Admins to configure validation parameters and update IM (Internal Master) data used for validation processes.

## Access Control
- **Role Required:** `super_admin`
- **URL:** `/validation-setting`
- **Menu Location:** Admin section in sidebar (visible to super_admin only)

## Features

### 1. Adjust Rounding Tolerance

#### Purpose
Configure the tolerance value used in validation calculations. Values within this tolerance range are considered valid matches.

#### Default Value
- **Default Tolerance:** 1000.01

#### How to Use
1. Navigate to Validation Setting page
2. Click "Adjust Tolerance" button in the Rounding Tolerance card
3. Enter new tolerance value (must be a positive number)
4. Click "Update Tolerance" to save

#### Technical Details
- Stored in `validation_settings` table with key `rounding_tolerance`
- Cached for 1 hour to improve performance
- Used in `ValidationService` for all validation calculations
- Activity is logged for audit purposes

### 2. Update IM Data

#### Purpose
Upload and update validation data files for Pembelian (Purchases) or Penjualan (Sales) categories.

#### Supported Files
- **Pembelian:** Files containing `im_purchases_and_return` in filename
- **Penjualan:** Files containing `im_jual` in filename
- **Formats:** .xlsx, .xls, .csv
- **Max Size:** 7GB (7,168,000 KB)

#### How to Use
1. Navigate to Validation Setting page
2. Click "Upload IM Data" button
3. Select data type (Pembelian or Penjualan)
4. Upload file using drag-and-drop or file browser
5. Click "Upload & Process"

#### Processing Details
- Large files (300MB - 7GB) are processed in the background using queue system
- Existing data in target table will be **replaced** with new data
- Processing includes:
  - Handling merged cells in Excel files
  - Encoding detection and conversion to UTF-8
  - Batch insertion (500 rows per batch) to prevent memory issues
  - Dynamic column creation if new columns found
  - Progress logging every 5,000 rows
  - No automatic timestamps (IM tables don't use created_at/updated_at)

#### Target Tables
- **Pembelian:** `im_purchases_and_return`
- **Penjualan:** `im_jual`

## Technical Implementation

### Backend Components

#### 1. ValidationSetting Model
**File:** `app/Models/ValidationSetting.php`

Features:
- `get($key, $default)` - Retrieve setting value with caching
- `set($key, $value, $type, $description)` - Update/create setting
- Automatic type casting (int, float, bool, json, string)
- Cache invalidation on updates

#### 2. ValidationSettingController
**File:** `app/Http/Controllers/ValidationSettingController.php`

Methods:
- `index()` - Display validation setting page
- `updateTolerance(Request $request)` - Update rounding tolerance
- `uploadImData(Request $request)` - Handle IM data file upload

Validations:
- Tolerance: required, numeric, min:0
- File: required, mimes:xlsx,xls,csv, max:7168000 (7GB)
- Data type: required, in:pembelian,penjualan
- Filename validation based on data type

#### 3. ProcessImDataUpload Job
**File:** `app/Jobs/ProcessImDataUpload.php`

Features:
- Background processing with 2-hour timeout
- Handles both Excel and CSV files
- Merged cell handling for Excel files
- Dynamic column creation
- Batch insertion (500 rows per batch)
- Progress logging every 5,000 rows
- Automatic cleanup of temporary files
- Comprehensive error logging

#### 4. Updated ValidationService
**File:** `app/Services/ValidationService.php`

Changes:
- Replaced hardcoded `TOLERANCE` constant with `getTolerance()` method
- Dynamically retrieves tolerance from database
- Falls back to default value (1000.01) if not set

### Frontend Components

#### 1. Validation Setting Page
**File:** `resources/js/pages/validation-setting/index.tsx`

Features:
- Display current tolerance value
- Two main action cards (Tolerance & Upload)
- Information section explaining features
- Integration with dialog components

#### 2. Tolerance Dialog
**File:** `resources/js/components/ToleranceDialog.tsx`

Features:
- Input validation (positive numbers only)
- Display current tolerance value
- Real-time error messages
- Confirmation before updating

#### 3. IM Data Upload Dialog
**File:** `resources/js/components/ImDataUploadDialog.tsx`

Features:
- Data type selection (Pembelian/Penjualan)
- Drag-and-drop file upload
- File browser fallback
- Filename validation
- File type validation
- File size display
- Information about background processing

### Database Schema

#### validation_settings Table
```php
Schema::create('validation_settings', function (Blueprint $table) {
    $table->id();
    $table->string('key')->unique();
    $table->text('value');
    $table->string('type')->default('string');
    $table->text('description')->nullable();
    $table->timestamps();
});
```

**Default Data:**
- key: `rounding_tolerance`
- value: `1000.01`
- type: `float`
- description: `Rounding tolerance for validation calculations`

### Routes
**File:** `routes/web.php`

```php
// Validation Settings (Super Admin Only)
Route::middleware(['auth', 'verified', 'role:super_admin'])->group(function () {
    Route::get('/validation-setting', [ValidationSettingController::class, 'index'])
        ->name('validation-setting.index');
    
    Route::post('/validation-setting/tolerance', [ValidationSettingController::class, 'updateTolerance'])
        ->name('validation-setting.tolerance');
    
    Route::post('/validation-setting/upload-im-data', [ValidationSettingController::class, 'uploadImData'])
        ->name('validation-setting.upload-im-data');
});
```

### Navigation
**File:** `resources/js/components/app-sidebar.tsx`

Added to `uyNavItems` array (Super Admin section):
```tsx
{
    title: 'Validation Setting',
    href: '/validation-setting',
    icon: Settings,
}
```

## Queue Processing

### Setup
The queue is already configured with database driver in `.env`:
```
QUEUE_CONNECTION=database
```

### Running Queue Worker
To process background jobs:

```bash
# Windows
php artisan queue:work

# Or use the existing batch file
check_queue.bat
```

### Monitoring
- Jobs are stored in `jobs` table
- Failed jobs are stored in `failed_jobs` table
- Check logs in `storage/logs/laravel.log` for progress updates

## Activity Logging

All actions are logged:

### Tolerance Update
```php
ActivityLogger::log(
    action: 'Update Tolerance',
    description: "Updated rounding tolerance from {old} to {new}",
    entityType: 'ValidationSetting',
    entityId: 'rounding_tolerance',
    metadata: ['old_value', 'new_value']
);
```

### IM Data Upload
```php
ActivityLogger::log(
    action: 'Upload IM Data',
    description: "Started processing IM data file: {filename} ({dataType})",
    entityType: 'ImDataUpload',
    entityId: $path,
    metadata: ['filename', 'data_type', 'size_mb']
);
```

## Security Features

### 1. Role-Based Access Control
- Backend: Route protected with `role:super_admin` middleware
- Frontend: Menu item visible only to super_admin users
- Direct URL access blocked for non-super_admin users

### 2. File Upload Security
- File type validation (only xlsx, xls, csv)
- File size limit (7GB max)
- Filename validation based on data type
- Files stored in protected storage directory
- Automatic cleanup after processing

### 3. Input Validation
- Tolerance: numeric validation with minimum value check
- Data type: enum validation (only pembelian/penjualan)
- File: comprehensive validation before processing

## Error Handling

### Tolerance Update Errors
- Non-numeric values rejected
- Negative values rejected
- Database errors logged and displayed to user

### File Upload Errors
- Invalid file type → User notified
- Incorrect filename → User notified with expected format
- Upload failure → Logged and user notified
- Processing failure → Logged with full stack trace

### Job Processing Errors
- Failed jobs stored in `failed_jobs` table
- Full error trace logged
- Temporary files cleaned up on error
- Can be retried using `php artisan queue:retry {id}`

## Testing

### Test Super Admin Access
1. Login as super_admin
2. Verify "Validation Setting" appears in sidebar
3. Navigate to `/validation-setting`
4. Verify page loads successfully

### Test Regular User Restriction
1. Login as regular user (role: user)
2. Verify "Validation Setting" NOT in sidebar
3. Try accessing `/validation-setting` directly
4. Should receive 403 Forbidden error

### Test Tolerance Update
1. Note current tolerance value
2. Click "Adjust Tolerance"
3. Enter new value
4. Confirm update
5. Verify value updated in UI
6. Check activity logs for entry

### Test IM Data Upload
1. Prepare test file with correct filename format
2. Click "Upload IM Data"
3. Select data type
4. Upload file
5. Verify success message
6. Check queue worker processing
7. Verify data in target table

## Performance Considerations

### 1. Tolerance Caching
- Settings cached for 1 hour
- Reduces database queries
- Cache cleared on updates

### 2. Batch Processing
- 500 rows per batch insertion
- Prevents memory overflow
- Progress logged every 5,000 rows

### 3. Background Processing
- Large files processed asynchronously
- Doesn't block user interface
- 2-hour timeout for processing

### 4. SQLite Variable Limit
- Chunked insertions respect 999 variable limit
- Different chunk sizes for different table structures
- Prevents SQLite "too many SQL variables" error

## Troubleshooting

### Queue Not Processing
```bash
# Check if queue worker is running
php artisan queue:work

# Check failed jobs
php artisan queue:failed

# Retry failed job
php artisan queue:retry {id}
```

### File Upload Too Large
- Check PHP settings: `upload_max_filesize` and `post_max_size`
- Increase if needed in `php.ini`
- Restart server after changes

### Permission Denied
- Verify user role is exactly `super_admin` (case-sensitive)
- Clear application cache: `php artisan optimize:clear`
- Check middleware is properly registered

### Processing Takes Too Long
- Normal for large files (300MB - 7GB)
- Check logs for progress updates
- Verify queue worker is running
- Check system resources (memory, disk space)

## Best Practices

1. **Before Uploading IM Data:**
   - Backup current data if needed
   - Verify filename follows naming convention
   - Check file format is correct
   - Ensure file is not corrupted

2. **Tolerance Adjustments:**
   - Document reason for changes
   - Test with sample data first
   - Monitor validation results after change
   - Keep activity logs for audit trail

3. **Queue Management:**
   - Keep queue worker running in production
   - Monitor failed jobs regularly
   - Set up alerts for job failures
   - Review logs for processing issues

4. **Security:**
   - Regularly review super_admin accounts
   - Monitor activity logs for unusual actions
   - Keep backup of validation settings
   - Restrict file upload directory access
