# Database Migration Guide - Validation Details to Relational Tables

## Overview

This guide explains the migration from storing validation details in JSON format to using proper relational database tables for better performance, queryability, and data integrity.

**Date**: 2025-11-03  
**Status**: Ready for Migration

---

## What Changed?

### Before (JSON Storage)
```php
validations table:
├── validation_details (JSON column)
    ├── invalid_groups: {key: {data}}
    ├── invalid_rows: [{data}]
    ├── matched_groups: {key: {data}}
    └── matched_rows: [{data}]
```

**Problems**:
- ❌ Cannot query or filter efficiently
- ❌ No database indexes on validation data
- ❌ Large JSON blobs in single column
- ❌ Difficult to analyze trends
- ❌ No foreign key constraints

### After (Relational Tables)
```php
validations table (main)
├── validation_invalid_groups table
├── validation_matched_groups table
├── validation_invalid_rows table
└── validation_matched_rows table
```

**Benefits**:
- ✅ Proper indexing for fast queries
- ✅ Foreign key constraints for data integrity
- ✅ Easy filtering and sorting
- ✅ Better performance for large datasets
- ✅ Can analyze trends with SQL queries
- ✅ Backward compatible during transition

---

## New Database Schema

### 1. validation_invalid_groups
Stores groups that failed validation.

```sql
CREATE TABLE validation_invalid_groups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    validation_id BIGINT NOT NULL,
    key_value VARCHAR(255) NOT NULL,
    discrepancy_category VARCHAR(255) NOT NULL,  -- 'im_invalid', 'missing', 'discrepancy'
    error TEXT NOT NULL,
    uploaded_total DECIMAL(15, 2) NOT NULL,
    source_total DECIMAL(15, 2) NOT NULL,
    discrepancy_value DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (validation_id) REFERENCES validations(id) ON DELETE CASCADE,
    INDEX idx_validation_key (validation_id, key_value),
    INDEX idx_validation_category (validation_id, discrepancy_category)
);
```

### 2. validation_matched_groups
Stores groups that passed validation.

```sql
CREATE TABLE validation_matched_groups (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    validation_id BIGINT NOT NULL,
    key_value VARCHAR(255) NOT NULL,
    uploaded_total DECIMAL(15, 2) NOT NULL,
    source_total DECIMAL(15, 2) NOT NULL,
    difference DECIMAL(15, 2) NOT NULL,
    note VARCHAR(255) NOT NULL,  -- 'Sum Matched', 'Pembulatan', 'Retur Doesn\'t Record'
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (validation_id) REFERENCES validations(id) ON DELETE CASCADE,
    INDEX idx_validation_key (validation_id, key_value),
    INDEX idx_validation_note (validation_id, note)
);
```

### 3. validation_invalid_rows
Stores individual invalid rows with their errors.

```sql
CREATE TABLE validation_invalid_rows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    validation_id BIGINT NOT NULL,
    row_index INT UNSIGNED NOT NULL,
    key_value VARCHAR(255) NOT NULL,
    error TEXT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (validation_id) REFERENCES validations(id) ON DELETE CASCADE,
    INDEX idx_validation_key (validation_id, key_value)
);
```

### 4. validation_matched_rows
Stores individual matched rows.

```sql
CREATE TABLE validation_matched_rows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    validation_id BIGINT NOT NULL,
    row_index INT UNSIGNED NOT NULL,
    key_value VARCHAR(255) NOT NULL,
    validation_source_total DECIMAL(15, 2) NULLABLE,
    uploaded_total DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (validation_id) REFERENCES validations(id) ON DELETE CASCADE,
    INDEX idx_validation_key (validation_id, key_value)
);
```

---

## Migration Steps

### Step 1: Run Migrations

```bash
# Create the new tables
php artisan migrate

# Expected output:
# Migration: 2025_11_03_061316_create_validation_invalid_groups_table ✓
# Migration: 2025_11_03_061324_create_validation_matched_groups_table ✓
# Migration: 2025_11_03_061330_create_validation_invalid_rows_table ✓
# Migration: 2025_11_03_061336_create_validation_matched_rows_table ✓
```

### Step 2: Verify Tables Created

```bash
php artisan tinker

# Check tables exist
Schema::hasTable('validation_invalid_groups');
Schema::hasTable('validation_matched_groups');
Schema::hasTable('validation_invalid_rows');
Schema::hasTable('validation_matched_rows');

# Should all return: true
```

### Step 3: Test New Validation

Upload and validate a new document:
1. Upload a test file
2. Validate the file
3. Check that data is saved to new tables

```bash
php artisan tinker

# Check data in new tables
DB::table('validation_invalid_groups')->count();
DB::table('validation_matched_groups')->count();
DB::table('validation_invalid_rows')->count();
DB::table('validation_matched_rows')->count();
```

### Step 4: Verify Backward Compatibility

Check that old validations (with JSON data) still work:
1. View an old validation result
2. Verify charts and tables display correctly
3. Confirm filtering and sorting work

---

## Code Changes

### Models Created

1. **ValidationInvalidGroup.php**
```php
class ValidationInvalidGroup extends Model
{
    protected $fillable = [
        'validation_id',
        'key_value',
        'discrepancy_category',
        'error',
        'uploaded_total',
        'source_total',
        'discrepancy_value',
    ];

    public function validation(): BelongsTo
    {
        return $this->belongsTo(Validation::class);
    }
}
```

2. **ValidationMatchedGroup.php** - Similar structure
3. **ValidationInvalidRow.php** - Similar structure
4. **ValidationMatchedRow.php** - Similar structure

### Validation Model Updated

```php
class Validation extends Model
{
    // New relationships
    public function invalidGroups(): HasMany
    {
        return $this->hasMany(ValidationInvalidGroup::class);
    }

    public function matchedGroups(): HasMany
    {
        return $this->hasMany(ValidationMatchedGroup::class);
    }

    public function invalidRows(): HasMany
    {
        return $this->hasMany(ValidationInvalidRow::class);
    }

    public function matchedRows(): HasMany
    {
        return $this->hasMany(ValidationMatchedRow::class);
    }
}
```

### ValidationService Updated

Now saves to both JSON (for backward compatibility) and relational tables:

```php
private function saveValidationResult(...): Validation
{
    return DB::transaction(function () use (...) {
        // 1. Create main validation record (with JSON)
        $validation = Validation::create([...]);
        
        // 2. Save to relational tables
        foreach ($invalidGroups as $key => $group) {
            $validation->invalidGroups()->create([...]);
        }
        // ... (same for other tables)
        
        return $validation;
    });
}
```

### ValidationDataService Updated

Now reads from relational tables first, falls back to JSON:

```php
public function getAllInvalidGroups(int $id): array
{
    $validation = Validation::with('invalidGroups')->find($id);
    
    // Try relational tables first
    if ($validation->invalidGroups()->exists()) {
        return $validation->invalidGroups->map(...)->toArray();
    }
    
    // Fallback to JSON data
    return $this->getFromJSON($validation);
}
```

---

## Performance Improvements

### Before (JSON)
```php
// Query all validations with invalid groups
$validations = Validation::all()->filter(function ($v) {
    return count($v->validation_details['invalid_groups'] ?? []) > 0;
});
// ❌ Loads ALL validations into memory
// ❌ Cannot use database indexes
// ❌ Slow for large datasets
```

### After (Relational)
```php
// Query all validations with invalid groups
$validations = Validation::has('invalidGroups')->get();
// ✅ Uses database query with indexes
// ✅ Only loads matching records
// ✅ Fast even with millions of records
```

### Query Examples

```php
// Find validations with specific discrepancy category
$validations = Validation::whereHas('invalidGroups', function ($query) {
    $query->where('discrepancy_category', 'im_invalid');
})->get();

// Get average discrepancy value by category
DB::table('validation_invalid_groups')
    ->select('discrepancy_category', DB::raw('AVG(ABS(discrepancy_value)) as avg_discrepancy'))
    ->groupBy('discrepancy_category')
    ->get();

// Find most common validation errors
DB::table('validation_invalid_rows')
    ->select('error', DB::raw('COUNT(*) as count'))
    ->groupBy('error')
    ->orderBy('count', 'desc')
    ->limit(10)
    ->get();
```

---

## Backward Compatibility

### How It Works

The system maintains **100% backward compatibility**:

1. **Old validations** (with JSON only):
   - ValidationDataService detects no relational data
   - Automatically falls back to JSON data
   - Works exactly as before

2. **New validations** (after migration):
   - Saved to both JSON and relational tables
   - ValidationDataService uses relational tables (faster)
   - JSON kept for emergency fallback

3. **Transition period**:
   - Both old and new validations work simultaneously
   - No data loss
   - No frontend changes needed

### Gradual Migration Strategy

```php
// Optional: Migrate old data to new tables
php artisan make:command MigrateValidationData

// In the command:
public function handle()
{
    $oldValidations = Validation::whereDoesntHave('invalidGroups')->get();
    
    foreach ($oldValidations as $validation) {
        DB::transaction(function () use ($validation) {
            $details = $validation->validation_details;
            
            // Migrate invalid groups
            foreach ($details['invalid_groups'] ?? [] as $key => $group) {
                $validation->invalidGroups()->create([
                    'key_value' => $key,
                    ...
                ]);
            }
            // ... (migrate other tables)
        });
    }
}
```

---

## Testing Checklist

### Unit Tests
```bash
php artisan test --filter ValidationServiceTest
php artisan test --filter ValidationDataServiceTest
```

### Manual Testing
- [ ] Upload and validate new document (Pembelian Reguler)
- [ ] Check data appears in relational tables
- [ ] View validation results page
- [ ] Filter invalid groups by category
- [ ] Sort matched records
- [ ] Search by key value
- [ ] View old validation (should still work)
- [ ] Check validation history
- [ ] Verify charts display correctly
- [ ] Test document comparison
- [ ] Check activity logs

---

## Rollback Plan

If issues occur:

### Rollback Code Changes
```bash
# Restore original services
copy app\Services\ValidationService.php.backup app\Services\ValidationService.php
copy app\Services\ValidationDataService.php.backup app\Services\ValidationDataService.php

php artisan config:clear
php artisan cache:clear
```

### Keep or Drop New Tables
```bash
# Option 1: Keep tables (recommended)
# New validations will continue using relational tables
# Old validations continue using JSON

# Option 2: Drop tables (if needed)
php artisan migrate:rollback --step=4
```

---

## Benefits Summary

### For Users
- ✅ Faster page loads
- ✅ Better filtering and searching
- ✅ More responsive interface
- ✅ No changes to workflow

### For Developers
- ✅ Proper database structure
- ✅ Easy to query and analyze
- ✅ Better performance
- ✅ Can create reports with SQL
- ✅ Easier to maintain

### For System
- ✅ Better scalability
- ✅ Lower memory usage
- ✅ Faster database queries
- ✅ Data integrity enforced by database
- ✅ Easier to backup and restore

---

## Monitoring

### After Migration

```bash
# Check table sizes
SELECT 
    table_name,
    table_rows,
    data_length,
    index_length
FROM information_schema.tables
WHERE table_schema = DATABASE()
AND table_name LIKE 'validation%';

# Check index usage
SHOW INDEX FROM validation_invalid_groups;

# Monitor query performance
EXPLAIN SELECT * FROM validation_invalid_groups 
WHERE validation_id = 123 
AND discrepancy_category = 'im_invalid';
```

---

## Next Steps

1. **Immediate**:
   - ✅ Run migrations
   - ✅ Test new validations
   - ✅ Verify old validations still work

2. **Short-term** (optional):
   - Migrate existing JSON data to tables
   - Monitor performance improvements
   - Collect metrics

3. **Long-term**:
   - Remove `validation_details` JSON column (after all data migrated)
   - Add more indexes if needed
   - Create analytics dashboard using relational data

---

## Support

### Common Issues

**Issue**: Old validations show no data  
**Solution**: ValidationDataService automatically falls back to JSON - check logs

**Issue**: Migration fails  
**Solution**: Check database permissions and rollback if needed

**Issue**: Performance worse than before  
**Solution**: Ensure indexes are created (`php artisan migrate:status`)

### Logs
Check `storage/logs/laravel.log` for:
- Migration status
- Query performance
- Fallback usage

---

**Status**: ✅ Ready for Production  
**Last Updated**: 2025-11-03  
**Maintained By**: KFA Development Team
