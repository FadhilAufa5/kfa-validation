# Date Parsing in MappedFileService

## Overview

The `MappedFileService` includes intelligent date parsing that handles multiple date formats commonly found in uploaded files, including numeric month representations.

## Supported Date Formats

### 1. Numeric Months (1-12)

When the date column contains a simple number between 1 and 12, it is interpreted as a month number and converted to the first day of that month in the current year.

**Examples:**
```
Input: 1  → Output: 2025-01-01 (January 1st, 2025)
Input: 6  → Output: 2025-06-01 (June 1st, 2025)
Input: 7  → Output: 2025-07-01 (July 1st, 2025)
Input: 8  → Output: 2025-08-01 (August 1st, 2025)
Input: 12 → Output: 2025-12-01 (December 1st, 2025)
```

**Invalid numeric values:**
- Numbers outside 1-12 range (e.g., 0, 13, 99) → NULL
- Negative numbers → NULL

### 2. Month Names (Indonesian & English)

Full month names and abbreviations in both Indonesian and English are supported.

**Indonesian Examples:**
```
januari  → 2025-01-01
februari → 2025-02-01
maret    → 2025-03-01
juni     → 2025-06-01
juli     → 2025-07-01
agustus  → 2025-08-01
```

**English Examples:**
```
January   → 2025-01-01
Jan       → 2025-01-01
June      → 2025-06-01
Jun       → 2025-06-01
August    → 2025-08-01
Aug       → 2025-08-01
```

**Case Insensitive:**
- `JUNI`, `Juni`, `juni` → All convert to 2025-06-01

### 3. Standard Date Formats

ISO 8601 and other common date formats are parsed using Carbon.

**Examples:**
```
2025-08-15      → 2025-08-15 (ISO 8601)
2025/08/15      → 2025-08-15
August 15, 2025 → 2025-08-15
15 Aug 2025     → 2025-08-15
```

### 4. Special Cases

**Empty/NULL values:**
```
NULL        → NULL
''          → NULL
'   '       → Today's date (if whitespace only)
```

**Invalid formats:**
```
'invalid'   → NULL
'abc123'    → NULL
'99'        → NULL (out of range)
```

## Implementation Details

### Processing Order

The `parseDate()` method checks formats in this order:

1. **Empty check** - Returns NULL if empty
2. **Numeric month check** - If value is 1-12, converts to first day of month
3. **Month name check** - Looks up in Indonesian/English month map
4. **Standard date parsing** - Uses Carbon to parse any other date format

### Code Location

**File:** `app/Services/MappedFileService.php`

**Method:** `parseDate($value, $filename, $rowIndex)`

### Logging

All date conversions are logged for audit purposes:

```php
Log::info("Converted numeric month to date", [
    'file' => $filename,
    'row' => $rowIndex,
    'input' => '8',
    'month_number' => 8,
    'output' => '2025-08-01'
]);
```

Failed parsing attempts are logged as warnings:

```php
Log::warning("Failed to parse date", [
    'file' => $filename,
    'row' => $rowIndex,
    'value' => 'invalid-date',
    'error' => 'Error message'
]);
```

## Use Cases

### Example 1: Monthly Sales Report

File contains month column with numeric values:

| Bulan | Total Sales |
|-------|-------------|
| 1     | 1000000     |
| 2     | 1500000     |
| 3     | 1200000     |

**Parsed as:**
- Row 1: date = 2025-01-01
- Row 2: date = 2025-02-01
- Row 3: date = 2025-03-01

### Example 2: Monthly Tax Report

File contains month names in Indonesian:

| Bulan    | Total Tax |
|----------|-----------|
| Januari  | 50000     |
| Februari | 60000     |
| Maret    | 55000     |

**Parsed as:**
- Row 1: date = 2025-01-01
- Row 2: date = 2025-02-01
- Row 3: date = 2025-03-01

### Example 3: Mixed Format

Files with different date formats:

| Period        | Amount |
|---------------|--------|
| 8             | 1000   |
| agustus       | 1500   |
| 2025-08-15    | 2000   |

**Parsed as:**
- Row 1: date = 2025-08-01 (numeric month)
- Row 2: date = 2025-08-01 (month name)
- Row 3: date = 2025-08-15 (ISO date)

## Configuration

### Document Type Mapping

In `config/document_validation.php`, specify which column should be parsed as date:

```php
'mapping' => [
    'date' => 'Bulan',           // File column name
    'no_faktur' => 'No Faktur',
    'npwp' => 'NPWP',
    // ...
]
```

The `date` key in the mapping triggers date parsing.

## Testing

### Test Script

Run the date parsing test:

```bash
php test_date_parsing.php
```

### Expected Output

```
✅ Numeric month: 8 (August)
   Input: '8'
   Output: 2025-08-01

✅ Indonesian month name: agustus
   Input: 'agustus'
   Output: 2025-08-01

✅ ISO date: 2025-08-15
   Input: '2025-08-15'
   Output: 2025-08-15
```

### Manual Testing

Test with actual file upload:

1. Create CSV with numeric months:
```csv
No,Bulan,Nama
1,7,Item A
2,8,Item B
```

2. Upload through UI or API

3. Check logs:
```bash
tail -f storage/logs/laravel.log | grep "Converted numeric month"
```

4. Verify database:
```sql
SELECT date, raw_data FROM mapped_uploaded_files 
WHERE filename = 'your-file.csv' 
ORDER BY row_index;
```

## Month Number to Name Reference

| Number | Indonesian | English |
|--------|-----------|---------|
| 1      | Januari   | January |
| 2      | Februari  | February|
| 3      | Maret     | March   |
| 4      | April     | April   |
| 5      | Mei       | May     |
| 6      | Juni      | June    |
| 7      | Juli      | July    |
| 8      | Agustus   | August  |
| 9      | September | September|
| 10     | Oktober   | October |
| 11     | November  | November|
| 12     | Desember  | December|

## Troubleshooting

### Date Not Parsing Correctly

**Issue:** Date column shows NULL in database

**Solutions:**
1. Check log files for parsing warnings
2. Verify column is mapped as 'date' in config
3. Ensure numeric values are 1-12
4. Check for leading/trailing spaces

### Wrong Year

**Issue:** Dates show current year instead of expected year

**Solution:** If files contain year information, ensure the date format includes the year (e.g., `2024-08-01` instead of just `8`)

### Month Names Not Recognized

**Issue:** Month name not converting to date

**Solutions:**
1. Check spelling (must match supported names)
2. Verify language (Indonesian vs English)
3. Check for special characters or extra spaces

## API Response

When file is successfully mapped, response includes date parsing information:

```json
{
  "success": true,
  "filename": "sales_report.csv",
  "total_rows": 12,
  "mapped_records": 12,
  "skipped_rows": 0,
  "failed_rows": 0
}
```

Check logs for specific date conversions:

```
[2025-11-04 01:47:00] INFO: Converted numeric month to date
  file: sales_report.csv
  row: 2
  input: "8"
  month_number: 8
  output: "2025-08-01"
```

## Best Practices

1. **Consistent Format:** Use the same date format throughout a file
2. **Validation:** Verify parsed dates in logs after first upload
3. **Documentation:** Document expected date format for users
4. **Fallback:** If specific date needed, use ISO format (YYYY-MM-DD)

## Future Enhancements

- [ ] Support for custom year specification
- [ ] Support for date ranges
- [ ] Quarter notation (Q1, Q2, etc.)
- [ ] Fiscal year support
- [ ] Week number support

## Related Documentation

- [Mapped File Refactoring](./MAPPED_FILE_REFACTORING.md)
- [File Deletion and Bulan Handling](./FILE_DELETION_AND_BULAN_HANDLING.md)
- [Mapping Logging Guide](./MAPPING_LOGGING_GUIDE.md)
