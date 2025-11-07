# IM Data Information Feature

## Overview
Added IM Data information display to the Validation Setting page, showing real-time statistics about the IM tables including row counts, last update timestamps, and who performed the update.

## Feature Details

### Display Information
For each IM table (Pembelian and Penjualan), the following information is displayed:

1. **Total Rows** - Total number of records in the table
2. **Last Updated** - Timestamp of last data update (human-readable and exact datetime)
3. **Updated By** - Name of the user who performed the last update

### Visual Design

**IM Pembelian Data Card:**
- Blue database icon
- Shows `im_purchases_and_return` table information
- Real-time row count with Indonesian number formatting
- Last update time (e.g., "9 seconds ago", "2 hours ago")
- Exact timestamp (YYYY-MM-DD HH:MM:SS)
- Username of person who updated the data

**IM Penjualan Data Card:**
- Green database icon
- Shows `im_jual` table information
- Same information structure as Pembelian card

## Implementation Details

### Backend Components

#### 1. New Database Table: `im_data_info`
**Migration:** `database/migrations/2025_11_07_000002_create_im_data_info_table.php`

**Schema:**
```php
Schema::create('im_data_info', function (Blueprint $table) {
    $table->id();
    $table->string('table_name')->unique();
    $table->integer('row_count')->default(0);
    $table->timestamp('last_updated_at')->nullable();
    $table->string('last_updated_by')->nullable();
    $table->timestamps();
});
```

**Initial Data:**
- Automatically initializes with current row counts for both tables
- Sets "System" as initial updater
- Records current timestamp

#### 2. New Model: `ImDataInfo`
**File:** `app/Models/ImDataInfo.php`

**Methods:**
- `updateInfo($tableName, $rowCount, $updatedBy)` - Update table statistics
- `getInfo($tableName)` - Get info for specific table
- `getAllInfo()` - Get formatted info for both tables

**Features:**
- Automatic timestamp casting to Carbon
- Human-readable date formatting
- Formatted output for frontend consumption

#### 3. Updated Controller: `ValidationSettingController`
**File:** `app/Http/Controllers/ValidationSettingController.php`

**Changes:**
- Added `ImDataInfo` model import
- `index()` method now fetches IM data info
- Passes `imDataInfo` to frontend

```php
public function index()
{
    $currentTolerance = ValidationSetting::get('rounding_tolerance', 1000.01);
    $imDataInfo = ImDataInfo::getAllInfo();

    return Inertia::render('validation-setting/index', [
        'currentTolerance' => $currentTolerance,
        'imDataInfo' => $imDataInfo,
    ]);
}
```

#### 4. Updated Job: `ProcessImDataUpload`
**File:** `app/Jobs/ProcessImDataUpload.php`

**Changes:**
- Added `ImDataInfo` model import
- After successful processing, updates the info table:
  ```php
  $userName = $this->userId ? \App\Models\User::find($this->userId)?->name : 'System';
  ImDataInfo::updateInfo($tableName, $rowCount, $userName ?? 'System');
  ```

### Frontend Components

#### 1. Updated Page: `validation-setting/index.tsx`
**File:** `resources/js/pages/validation-setting/index.tsx`

**Added Imports:**
- `Database`, `Clock`, `User` icons from lucide-react

**New Interfaces:**
```typescript
interface ImDataDetails {
  row_count: number;
  last_updated_at: string | null;
  last_updated_by: string | null;
  last_updated_human: string | null;
}

interface ImDataInfo {
  pembelian: ImDataDetails | null;
  penjualan: ImDataDetails | null;
}
```

**New Helper Function:**
```typescript
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num);
};
```

**New UI Section:**
- Two new cards displaying IM data information
- Positioned above the Settings Cards section
- Responsive grid layout (2 columns on desktop, 1 on mobile)

## Data Flow

### On Page Load
1. User navigates to Validation Setting page
2. Controller fetches data from `im_data_info` table
3. Data formatted with human-readable timestamps
4. Passed to frontend via Inertia
5. Frontend displays formatted information in cards

### On IM Data Upload
1. User uploads new IM data file
2. Job processes file in background
3. After successful processing:
   - Job counts total rows inserted
   - Retrieves user name from user ID
   - Updates `im_data_info` table with new stats
4. Next page load shows updated information

## Example Output

### Database Content
```json
{
  "pembelian": {
    "row_count": 1536430,
    "last_updated_at": "2025-11-07 07:35:21",
    "last_updated_by": "System",
    "last_updated_human": "9 seconds ago"
  },
  "penjualan": {
    "row_count": 1780000,
    "last_updated_at": "2025-11-07 07:35:22",
    "last_updated_by": "System",
    "last_updated_human": "8 seconds ago"
  }
}
```

### Frontend Display

**IM Pembelian Data Card:**
```
┌─────────────────────────────────────┐
│ 📊 IM Pembelian Data                │
│ im_purchases_and_return table info  │
├─────────────────────────────────────┤
│ Total Rows    │    1,536,430        │
├─────────────────────────────────────┤
│ 🕐 Last Updated                     │
│    9 seconds ago                    │
│    2025-11-07 07:35:21              │
│                                     │
│ 👤 Updated By                       │
│    System                           │
└─────────────────────────────────────┘
```

**IM Penjualan Data Card:**
```
┌─────────────────────────────────────┐
│ 📊 IM Penjualan Data                │
│ im_jual table information           │
├─────────────────────────────────────┤
│ Total Rows    │    1,780,000        │
├─────────────────────────────────────┤
│ 🕐 Last Updated                     │
│    8 seconds ago                    │
│    2025-11-07 07:35:22              │
│                                     │
│ 👤 Updated By                       │
│    System                           │
└─────────────────────────────────────┘
```

## Benefits

### 1. Transparency
- Super Admins can see current data status at a glance
- No need to query database manually
- Immediate feedback after data updates

### 2. Audit Trail
- Track who updated the data
- Know when data was last refreshed
- Historical record in database

### 3. Data Quality
- Verify expected row counts
- Detect issues with data imports
- Monitor data freshness

### 4. User Experience
- Clean, professional interface
- Human-readable timestamps
- Formatted numbers (Indonesian locale)

## Technical Specifications

### Number Formatting
- Uses Indonesian locale: `new Intl.NumberFormat('id-ID')`
- Example: `1536430` → `1,536,430`

### Date Formatting
- Absolute: YYYY-MM-DD HH:MM:SS
- Relative: Carbon's `diffForHumans()` method
- Examples:
  - "9 seconds ago"
  - "2 minutes ago"
  - "3 hours ago"
  - "2 days ago"

### Performance
- Single database query on page load
- Data cached in table (no need to count rows every time)
- Minimal overhead

## Files Created/Modified

### Created (3 files)
1. `database/migrations/2025_11_07_000002_create_im_data_info_table.php`
2. `app/Models/ImDataInfo.php`
3. `IM_DATA_INFO_FEATURE.md` (this file)

### Modified (3 files)
1. `app/Http/Controllers/ValidationSettingController.php`
2. `app/Jobs/ProcessImDataUpload.php`
3. `resources/js/pages/validation-setting/index.tsx`

## Testing

### Verify Initial Data
```bash
php artisan tinker --execute="echo json_encode(App\Models\ImDataInfo::getAllInfo(), JSON_PRETTY_PRINT);"
```

Expected output:
```json
{
    "pembelian": {
        "row_count": <actual_count>,
        "last_updated_at": "<timestamp>",
        "last_updated_by": "System",
        "last_updated_human": "<human_readable>"
    },
    "penjualan": {
        "row_count": <actual_count>,
        "last_updated_at": "<timestamp>",
        "last_updated_by": "System",
        "last_updated_human": "<human_readable>"
    }
}
```

### Test Update Flow
1. Login as Super Admin
2. Navigate to Validation Setting page
3. Note current row counts and timestamps
4. Upload new IM data file
5. Wait for background processing to complete
6. Refresh page
7. Verify updated row counts and timestamps
8. Verify "Updated By" shows your username

### Manual Database Check
```sql
-- Check im_data_info table
SELECT * FROM im_data_info;

-- Verify row counts match actual data
SELECT 'pembelian' as table_name, COUNT(*) as actual_count 
FROM im_purchases_and_return
UNION ALL
SELECT 'penjualan', COUNT(*) 
FROM im_jual;
```

## Future Enhancements (Optional)

1. **Real-time Updates**
   - WebSocket integration for live updates
   - Show processing status while job is running

2. **Historical Tracking**
   - Keep history of all updates
   - Show trend graph of row counts over time

3. **Data Quality Metrics**
   - Add validation status (e.g., "Data validated ✓")
   - Show percentage change from previous update

4. **Export Functionality**
   - Export current IM data info as PDF/Excel
   - Include in system reports

5. **Alerts**
   - Email notification on large data changes
   - Warning if data hasn't been updated in X days

## Troubleshooting

### Info Not Updating After Upload
**Solution:**
1. Check queue worker is running: `php artisan queue:work`
2. Check job status: `SELECT * FROM jobs;`
3. Check failed jobs: `php artisan queue:failed`
4. Review logs: `tail -f storage/logs/laravel.log`

### Row Count Mismatch
**Solution:**
1. Manually update counts:
   ```php
   php artisan tinker
   
   $pembelianCount = DB::table('im_purchases_and_return')->count();
   App\Models\ImDataInfo::updateInfo('im_purchases_and_return', $pembelianCount, 'Manual Update');
   
   $penjualanCount = DB::table('im_jual')->count();
   App\Models\ImDataInfo::updateInfo('im_jual', $penjualanCount, 'Manual Update');
   ```

### "No data available" Message
**Solution:**
1. Check migration ran successfully
2. Verify data was initialized:
   ```sql
   SELECT * FROM im_data_info;
   ```
3. If empty, re-run migration or manually insert:
   ```php
   php artisan migrate:fresh --step
   ```

## Status

✅ **COMPLETED** - IM Data information feature fully implemented and tested.

**Current Statistics:**
- Pembelian: 1,536,430 rows
- Penjualan: 1,780,000 rows
- Last updated: Today (System initialization)
