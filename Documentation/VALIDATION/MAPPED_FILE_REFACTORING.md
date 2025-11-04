# Mapped File Refactoring Plan

## Overview
This document outlines the refactoring of the validation process to include an intermediate `MappedUploadedFile` table that stores normalized, mapped data from uploaded files before validation.

**Date**: 2025-11-03  
**Status**: 🚧 In Progress

---

## Objectives

1. **Normalize uploaded data** into a structured table before validation
2. **Improve validation performance** by pre-processing file data once
3. **Enable data analysis** on uploaded files independent of validation
4. **Simplify validation logic** by working with consistent database records
5. **Support configurable column mapping** per document type/category

---

## Architecture Changes

### Current Flow
```
User uploads file
    ↓
File saved to storage
    ↓
User selects header row
    ↓
ValidationService reads file directly
    ↓
Validation compares with database
    ↓
Results saved to validations table
```

### New Flow
```
User uploads file
    ↓
File saved to storage
    ↓
User selects header row
    ↓
MappedFileService maps file to database ← NEW
    ↓
Data inserted into mapped_uploaded_files table ← NEW
    ↓
ValidationService reads from mapped table ← MODIFIED
    ↓
Validation compares with validation source
    ↓
Results saved to validations table
```

---

## Database Schema

### New Table: `mapped_uploaded_files`

```sql
CREATE TABLE mapped_uploaded_files (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- File metadata
    filename VARCHAR(255) NOT NULL,
    document_type VARCHAR(255) NOT NULL,  -- 'pembelian' or 'penjualan'
    document_category VARCHAR(255) NOT NULL,  -- 'reguler', 'retur', etc.
    header_row INT DEFAULT 1,
    user_id BIGINT NULL,
    
    -- Mapped business columns (configurable)
    kode_bm VARCHAR(255) NULL,
    nama_bm VARCHAR(255) NULL,
    kode_outlet VARCHAR(255) NULL,
    nama_outlet VARCHAR(255) NULL,
    date DATE NULL,
    connector VARCHAR(255) NOT NULL,  -- Key field for matching
    sum_field DECIMAL(20,2) NULL,  -- Value field for validation
    
    -- Metadata
    row_index INT NOT NULL,  -- Original row number
    raw_data JSON NULL,  -- Complete row data
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    INDEX idx_file_doc (filename, document_type, document_category),
    INDEX idx_connector (connector),
    INDEX idx_user (user_id)
);
```

---

## Configuration Updates

### `config/document_validation.php`

Added `mapping` section to each document category:

```php
'pembelian' => [
    'reguler' => [
        'doc_val' => 'im_purchases_and_return',
        'connector' => ['NOMOR PENERIMAAN', 'no_transaksi'],
        'sum' => ['JUMLAH NETTO', 'dpp'],
        'mapping' => [  // ← NEW
            'kode_bm' => 'KODE BM',
            'nama_bm' => 'NAMA BM',
            'kode_outlet' => 'KODE OUTLET',
            'nama_outlet' => 'NAMA OUTLET',
            'date' => 'TANGGAL PENERIMAAN',
        ],
    ],
],
```

**Configuration Structure**:
- **Key**: Database column name in `mapped_uploaded_files`
- **Value**: Column name in uploaded file

---

## New Service: MappedFileService

### Location
`app/Services/MappedFileService.php`

### Key Methods

#### 1. `mapUploadedFile()`
**Purpose**: Process uploaded file and insert mapped data into database

**Parameters**:
- `$filename` - Uploaded filename
- `$documentType` - pembelian/penjualan
- `$documentCategory` - reguler/retur/urgent/etc
- `$headerRow` - Selected header row number
- `$userId` - User ID (optional)

**Process**:
1. Load mapping configuration
2. Read file using `FileProcessingService::processFileWithHeader()`
3. Delete existing mappings for this file (if re-processing)
4. For each row:
   - Extract configured columns based on mapping
   - Parse dates
   - Extract connector and sum values
   - Store complete row as JSON
5. Bulk insert all mapped records
6. Return summary

**Returns**:
```php
[
    'success' => true,
    'filename' => 'document.csv',
    'total_rows' => 150,
    'mapped_records' => 148,
    'skipped_rows' => 2,  // Rows without connector value
]
```

#### 2. `getMappedData()`
**Purpose**: Retrieve mapped data for a file

**Returns**: Eloquent collection of MappedUploadedFile records

#### 3. `getMappedDataGroupedByConnector()`
**Purpose**: Get mapped data grouped by connector key for validation

**Returns**: Array where keys are connector values, values are arrays of records

#### 4. `getMappedSummary()`
**Purpose**: Get statistics about mapped data

**Returns**:
```php
[
    'total_records' => 148,
    'unique_connectors' => 145,
    'total_sum' => 1250000.50,
]
```

#### 5. `deleteMappedData()`
**Purpose**: Clean up mapped data for a file

---

## Model: MappedUploadedFile

### Location
`app/Models/MappedUploadedFile.php`

### Features
- **Fillable fields**: All mapped columns
- **Casts**: JSON for raw_data, date for date field, decimal for sum_field
- **Relationships**: BelongsTo User
- **Scopes**:
  - `byFilename($filename)`
  - `byDocumentType($type)`
  - `byDocumentCategory($category)`
  - `byConnector($connector)`

---

## Validation Service Updates

### Changes Required

#### 1. Inject MappedFileService
```php
public function __construct(
    private FileProcessingService $fileProcessingService,
    private MappedFileService $mappedFileService  // NEW
) {}
```

#### 2. Update `validateDocument()` Method

**Before**:
```php
$uploadedData = $this->fileProcessingService->readFileData($filename, $headerRow);
$uploadedMapByGroup = $this->buildUploadedMap($uploadedData['data'], $config);
```

**After**:
```php
// Get mapped data from database instead of reading file
$mappedData = $this->mappedFileService->getMappedDataGroupedByConnector(
    $filename,
    $documentType,
    $documentCategory
);

// Build map from mapped data
$uploadedMapByGroup = $this->buildUploadedMapFromMappedData($mappedData, $config);
```

#### 3. New Method: `buildUploadedMapFromMappedData()`

```php
private function buildUploadedMapFromMappedData(array $mappedData, array $config): array
{
    $map = [];
    
    foreach ($mappedData as $connector => $records) {
        $totalSum = array_sum(array_column($records, 'sum_field'));
        
        $map[$connector] = [
            'sum' => $totalSum,
            'records' => $records,
        ];
    }
    
    return $map;
}
```

---

## Controller Updates

### Changes Required

Both `PenjualanController` and `PembelianController` need updates in the `validateFile()` method.

#### Before
```php
public function validateFile(Request $request, $type)
{
    $request->validate([
        'filename' => 'required|string',
        'headerRow' => 'required|integer|min:1',
    ]);

    try {
        $result = $this->validationService->validateDocument(
            filename: $request->input('filename'),
            documentType: 'pembelian',
            documentCategory: $type,
            headerRow: (int) $request->input('headerRow', 1),
            userId: auth()->user()?->id
        );

        return response()->json($result);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 400);
    }
}
```

#### After
```php
public function validateFile(Request $request, $type)
{
    $request->validate([
        'filename' => 'required|string',
        'headerRow' => 'required|integer|min:1',
    ]);

    try {
        // Step 1: Map uploaded file data ← NEW
        $mappingResult = $this->mappedFileService->mapUploadedFile(
            filename: $request->input('filename'),
            documentType: 'pembelian',
            documentCategory: $type,
            headerRow: (int) $request->input('headerRow', 1),
            userId: auth()->user()?->id
        );

        // Step 2: Validate using mapped data
        $result = $this->validationService->validateDocument(
            filename: $request->input('filename'),
            documentType: 'pembelian',
            documentCategory: $type,
            headerRow: (int) $request->input('headerRow', 1),
            userId: auth()->user()?->id
        );

        // Include mapping info in response
        $result['mapping_info'] = $mappingResult;

        return response()->json($result);
    } catch (\Exception $e) {
        Log::error('Validation failed', ['error' => $e->getMessage()]);
        return response()->json(['error' => $e->getMessage()], 400);
    }
}
```

#### Inject MappedFileService
```php
public function __construct(
    private FileProcessingService $fileProcessingService,
    private ValidationService $validationService,
    private DocumentComparisonService $documentComparisonService,
    private ValidationDataService $validationDataService,
    private MappedFileService $mappedFileService  // NEW
) {}
```

---

## Benefits

### 1. **Performance Improvement**
- File is read and parsed only once during mapping
- Validation reads from indexed database table
- Faster subsequent validations if re-processing

### 2. **Data Quality**
- Normalized data structure
- Consistent column names across document types
- Date parsing handled once during mapping
- Data validation during mapping step

### 3. **Flexibility**
- Easy to add new mapped columns via configuration
- Can query uploaded data independently
- Enables data analysis before validation
- Support for data corrections without re-upload

### 4. **Maintainability**
- Clear separation: Mapping → Validation
- Easier to debug (inspect mapped_uploaded_files table)
- Simpler validation logic (works with clean data)

### 5. **Auditability**
- Complete uploaded data preserved in `raw_data` JSON
- Track which user uploaded which data
- History of mapped data per file

---

## Implementation Steps

### Phase 1: Database Setup ✅
- [x] Create migration for `mapped_uploaded_files` table
- [x] Create `MappedUploadedFile` model
- [ ] Run migration: `php artisan migrate`

### Phase 2: Service Layer ✅
- [x] Create `MappedFileService`
- [x] Add mapping configuration to `document_validation.php`
- [ ] Update `ValidationService` to use mapped data
- [ ] Add tests for `MappedFileService`

### Phase 3: Controller Updates
- [ ] Update `PenjualanController::validateFile()`
- [ ] Update `PembelianController::validateFile()`
- [ ] Add error handling for mapping failures

### Phase 4: Testing
- [ ] Test file mapping with various document types
- [ ] Test validation using mapped data
- [ ] Test re-processing same file
- [ ] Test with different header row selections
- [ ] Performance testing

### Phase 5: Documentation
- [ ] Update SYSTEM_ARCHITECTURE.md
- [ ] Update REFACTORING_SUMMARY.md
- [ ] Add inline code documentation
- [ ] Create user guide for new flow

---

## Migration Command

```bash
# Run the migration
php artisan migrate

# Check the table was created
php artisan db:table mapped_uploaded_files
```

---

## Testing Checklist

### Unit Tests
- [ ] MappedFileService::mapUploadedFile() with valid data
- [ ] MappedFileService::mapUploadedFile() with missing columns
- [ ] MappedFileService::mapUploadedFile() with invalid dates
- [ ] MappedFileService::getMappedDataGroupedByConnector()
- [ ] MappedUploadedFile model scopes

### Integration Tests
- [ ] Complete flow: Upload → Map → Validate
- [ ] Re-processing same file overwrites old mappings
- [ ] Validation works with mapped data
- [ ] Different header rows produce correct mappings

### Manual Testing
- [ ] Upload Pembelian Reguler file
- [ ] Select header row
- [ ] Verify data in mapped_uploaded_files table
- [ ] Run validation
- [ ] Check validation results
- [ ] Repeat for all document types

---

## Rollback Plan

If issues occur:

1. **Disable mapping temporarily**:
   ```php
   // In controllers, comment out mapping step
   // $mappingResult = $this->mappedFileService->mapUploadedFile(...);
   ```

2. **Revert ValidationService changes**:
   - Restore reading from file instead of mapped table

3. **Drop table if needed**:
   ```bash
   php artisan migrate:rollback --step=1
   ```

---

## Performance Considerations

### Indexes
- `connector` column indexed for fast lookups
- Composite index on (filename, document_type, document_category)
- user_id indexed for user-specific queries

### Bulk Operations
- Use `insert()` for bulk inserts (faster than individual creates)
- Delete old mappings before re-processing
- Consider chunking for very large files (10K+ rows)

### Query Optimization
- Use eager loading when fetching with user relationships
- Select only needed columns
- Use `groupBy` at database level for aggregations

---

## Future Enhancements

1. **Background Processing**
   - Queue mapping for large files
   - Progress tracking via jobs

2. **Data Validation**
   - Add business rules during mapping
   - Validate data types, formats
   - Flag suspicious values

3. **Data Corrections**
   - Allow editing mapped data
   - Re-run validation without re-upload

4. **Analytics**
   - Dashboard of uploaded data
   - Trends analysis
   - Outlet/BM performance metrics

5. **Export**
   - Export mapped data to Excel
   - Generate reports from mapped data

---

## Files Created/Modified

### Created ✅
1. `database/migrations/2025_11_03_073329_create_mapped_uploaded_files_table.php`
2. `app/Models/MappedUploadedFile.php`
3. `app/Services/MappedFileService.php`
4. `Documentation/VALIDATION/MAPPED_FILE_REFACTORING.md` (this file)

### Modified ✅
1. `config/document_validation.php` - Added `mapping` configuration

### To Modify
1. `app/Services/ValidationService.php` - Use mapped data
2. `app/Http/Controllers/PenjualanController.php` - Call mapping service
3. `app/Http/Controllers/PembelianController.php` - Call mapping service

---

## Summary

This refactoring introduces an intermediate mapping step that:
- ✅ Normalizes uploaded file data into a structured database table
- ✅ Uses configuration-driven column mapping
- ✅ Improves validation performance
- ✅ Enables independent data analysis
- ✅ Maintains clean separation of concerns

**Status**: Foundation complete, implementation in progress

**Next Steps**:
1. Run migration
2. Update ValidationService
3. Update controllers
4. Test end-to-end flow

---

**Last Updated**: 2025-11-03  
**Author**: KFA Development Team  
**Review Status**: Pending implementation

