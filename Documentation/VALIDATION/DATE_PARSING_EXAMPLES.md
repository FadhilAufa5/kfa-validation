# Date Parsing Examples

## Visual Examples

### Example 1: Monthly Sales Report with Numeric Months

**Input CSV:**
```csv
No,Bulan,Nama Toko,Total Penjualan
1,1,Toko A,1000000
2,2,Toko B,1500000
3,7,Toko C,2000000
4,8,Toko D,2500000
5,12,Toko E,3000000
```

**Parsed Result in Database (`mapped_uploaded_files`):**

| row_index | date       | connector | sum_field | raw_data |
|-----------|------------|-----------|-----------|----------|
| 2         | 2025-01-01 | Toko A    | 1000000   | {...}    |
| 3         | 2025-02-01 | Toko B    | 1500000   | {...}    |
| 4         | 2025-07-01 | Toko C    | 2000000   | {...}    |
| 5         | 2025-08-01 | Toko D    | 2500000   | {...}    |
| 6         | 2025-12-01 | Toko E    | 3000000   | {...}    |

**Log Output:**
```
[2025-11-04 08:47:00] INFO: Converted numeric month to date
  file: sales_report.csv
  row: 2
  input: "1"
  month_number: 1
  output: "2025-01-01"

[2025-11-04 08:47:00] INFO: Converted numeric month to date
  file: sales_report.csv
  row: 5
  input: "8"
  month_number: 8
  output: "2025-08-01"
```

---

### Example 2: Tax Report with Indonesian Month Names

**Input CSV:**
```csv
No,Bulan,NPWP,Total Pajak
1,januari,123456789,50000
2,februari,987654321,60000
3,agustus,555555555,75000
```

**Parsed Result:**

| row_index | date       | connector  | sum_field | raw_data |
|-----------|------------|------------|-----------|----------|
| 2         | 2025-01-01 | 123456789  | 50000     | {...}    |
| 3         | 2025-02-01 | 987654321  | 60000     | {...}    |
| 4         | 2025-08-01 | 555555555  | 75000     | {...}    |

**Log Output:**
```
[2025-11-04 08:47:00] INFO: Converted month name to date
  file: tax_report.csv
  row: 2
  input: "januari"
  output: "2025-01-01"

[2025-11-04 08:47:00] INFO: Converted month name to date
  file: tax_report.csv
  row: 4
  input: "agustus"
  output: "2025-08-01"
```

---

### Example 3: Mixed Date Formats

**Input CSV:**
```csv
No,Tanggal,Deskripsi,Jumlah
1,8,Pembayaran Bulan Agustus,1000000
2,agustus,Bonus Agustus,500000
3,2025-08-15,Invoice #123,750000
4,August,Gaji Agustus,2000000
```

**Parsed Result:**

| row_index | date       | connector              | sum_field |
|-----------|------------|------------------------|-----------|
| 2         | 2025-08-01 | Pembayaran Bulan...    | 1000000   |
| 3         | 2025-08-01 | Bonus Agustus          | 500000    |
| 4         | 2025-08-15 | Invoice #123           | 750000    |
| 5         | 2025-08-01 | Gaji Agustus           | 2000000   |

**Analysis:**
- Row 2: `8` → Numeric month conversion
- Row 3: `agustus` → Indonesian month name
- Row 4: `2025-08-15` → ISO date (kept as-is)
- Row 5: `August` → English month name

---

### Example 4: Invalid Dates (Error Cases)

**Input CSV:**
```csv
No,Bulan,Item,Total
1,0,Item A,1000
2,13,Item B,1500
3,99,Item C,2000
4,invalid,Item D,2500
5,,Item E,3000
```

**Parsed Result:**

| row_index | date | connector | sum_field | notes            |
|-----------|------|-----------|-----------|------------------|
| 2         | NULL | Item A    | 1000      | 0 is out of range|
| 3         | NULL | Item B    | 1500      | 13 is out of range|
| 4         | NULL | Item C    | 2000      | 99 is out of range|
| 5         | NULL | Item D    | 2500      | Invalid text     |
| 6         | NULL | Item E    | 3000      | Empty value      |

**Log Output:**
```
[2025-11-04 08:47:00] WARNING: Failed to parse date
  file: invalid_dates.csv
  row: 2
  value: "0"
  error: "Month 0 is out of range 1-12"

[2025-11-04 08:47:00] WARNING: Failed to parse date
  file: invalid_dates.csv
  row: 3
  value: "13"
  error: "Month 13 is out of range 1-12"
```

---

## Conversion Table Reference

### Numeric to Date (Current Year: 2025)

| Input | Output       | Month Name |
|-------|--------------|------------|
| 1     | 2025-01-01   | January    |
| 2     | 2025-02-01   | February   |
| 3     | 2025-03-01   | March      |
| 4     | 2025-04-01   | April      |
| 5     | 2025-05-01   | May        |
| 6     | 2025-06-01   | June       |
| 7     | 2025-07-01   | July       |
| 8     | 2025-08-01   | August     |
| 9     | 2025-09-01   | September  |
| 10    | 2025-10-01   | October    |
| 11    | 2025-11-01   | November   |
| 12    | 2025-12-01   | December   |

### Month Names Supported

| Indonesian | English   | Short | Output       |
|-----------|-----------|-------|--------------|
| januari   | january   | jan   | 2025-01-01   |
| februari  | february  | feb   | 2025-02-01   |
| maret     | march     | mar   | 2025-03-01   |
| april     | april     | apr   | 2025-04-01   |
| mei       | may       | -     | 2025-05-01   |
| juni      | june      | jun   | 2025-06-01   |
| juli      | july      | jul   | 2025-07-01   |
| agustus   | august    | aug   | 2025-08-01   |
| september | september | sep   | 2025-09-01   |
| oktober   | october   | oct   | 2025-10-01   |
| november  | november  | nov   | 2025-11-01   |
| desember  | december  | dec   | 2025-12-01   |

---

## API Response Examples

### Successful Mapping with Numeric Months

**Request:**
```http
POST /pembelian/validate-reguler
{
  "filename": "sales_august.csv",
  "headerRow": 1
}
```

**Response:**
```json
{
  "success": true,
  "filename": "sales_august.csv",
  "total_rows": 10,
  "mapped_records": 10,
  "skipped_rows": 0,
  "failed_rows": 0,
  "skipped_details": [],
  "failed_details": []
}
```

### With Some Failed Date Parsing

**Response:**
```json
{
  "success": true,
  "filename": "mixed_dates.csv",
  "total_rows": 15,
  "mapped_records": 12,
  "skipped_rows": 3,
  "failed_rows": 0,
  "skipped_details": [
    {
      "row": 5,
      "reason": "Empty connector value"
    }
  ],
  "failed_details": []
}
```

---

## Validation Query Examples

### Query 1: Check All Mapped August Data

```sql
SELECT 
    row_index,
    date,
    connector,
    sum_field,
    raw_data->>'Bulan' as original_bulan
FROM mapped_uploaded_files
WHERE filename = 'sales_august.csv'
  AND MONTH(date) = 8
ORDER BY row_index;
```

### Query 2: Verify Date Conversion

```sql
SELECT 
    raw_data->>'Bulan' as input_value,
    date as parsed_date,
    COUNT(*) as count
FROM mapped_uploaded_files
WHERE filename = 'sales_report.csv'
GROUP BY input_value, date
ORDER BY date;
```

**Example Output:**

| input_value | parsed_date | count |
|-------------|-------------|-------|
| 1           | 2025-01-01  | 5     |
| 7           | 2025-07-01  | 3     |
| 8           | 2025-08-01  | 8     |
| agustus     | 2025-08-01  | 2     |

---

## Testing Scenarios

### Test Case 1: All Numeric Months
```csv
Bulan
1
2
3
4
5
6
7
8
9
10
11
12
```

**Expected:** All convert to first day of respective month in 2025

### Test Case 2: Edge Cases
```csv
Bulan
0
1
12
13
-1
99
```

**Expected:**
- 0 → NULL
- 1 → 2025-01-01 ✅
- 12 → 2025-12-01 ✅
- 13 → NULL
- -1 → NULL
- 99 → NULL

### Test Case 3: Mixed Languages
```csv
Bulan
januari
January
JAN
jan
JANUARI
```

**Expected:** All convert to 2025-01-01 (case-insensitive)

---

## Troubleshooting Examples

### Problem: Date shows NULL in database

**Check 1: View the log**
```bash
tail -f storage/logs/laravel.log | grep "Failed to parse date"
```

**Check 2: Verify input value**
```sql
SELECT row_index, raw_data->>'Bulan' as bulan_value, date
FROM mapped_uploaded_files
WHERE date IS NULL;
```

**Common Causes:**
- Value is outside 1-12 range
- Misspelled month name
- Special characters in the value
- Empty or NULL value

### Problem: All dates show current date

**Cause:** Whitespace-only values in the date column

**Solution:** Clean the data before upload or update validation

---

## Real-World Use Case

### Scenario: Monthly VAT Report

**Business Requirement:**
Upload monthly VAT report where the "Bulan" column contains just the month number (1-12)

**Input File (`pajak_2025.csv`):**
```csv
No,Bulan,NPWP,Nama,Total Pajak
1,7,123456789,PT ABC,5000000
2,8,987654321,PT XYZ,7500000
3,8,555555555,CV DEF,3000000
```

**After Processing:**
- All month `7` entries: date = 2025-07-01
- All month `8` entries: date = 2025-08-01

**Validation Query:**
```sql
SELECT 
    DATE_FORMAT(date, '%Y-%m') as period,
    COUNT(*) as total_records,
    SUM(sum_field) as total_pajak
FROM mapped_uploaded_files
WHERE filename = 'pajak_2025.csv'
GROUP BY period
ORDER BY period;
```

**Result:**
| period  | total_records | total_pajak |
|---------|---------------|-------------|
| 2025-07 | 1             | 5000000     |
| 2025-08 | 2             | 10500000    |

---

## Summary

✅ **Numeric months (1-12)** → Converted to first day of month  
✅ **Month names (ID/EN)** → Converted to first day of month  
✅ **ISO dates** → Kept as-is  
✅ **Invalid values** → NULL with warning log  
✅ **Case-insensitive** → All variations work  
✅ **Fully logged** → All conversions tracked  

**Always converts to:** `YYYY-MM-01` format (first day of month)  
**Current year used:** When only month is provided
