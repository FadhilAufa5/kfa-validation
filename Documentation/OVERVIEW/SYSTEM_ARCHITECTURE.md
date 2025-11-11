# System Architecture Documentation

## Overview

This document provides comprehensive information about the KFA Validation system architecture, following Clean Code principles with clear separation of concerns between Services, Controllers, and Routes.

## Table of Contents
1. [Architecture Pattern](#architecture-pattern)
2. [Directory Structure](#directory-structure)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Configuration](#configuration)
6. [Service Layer](#service-layer)
7. [Controller Layer](#controller-layer)
8. [Routes](#routes)
9. [Maintenance Guide](#maintenance-guide)

---

## Architecture Pattern

The system follows a **Service-Oriented Architecture** pattern with three distinct layers:

```
┌─────────────────────────────────────────────────┐
│              Routes (web.php)                   │
│     - Page Rendering Only                       │
│     - No Business Logic                         │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│             Controllers                         │
│     - Request Validation                        │
│     - Delegating to Services                    │
│     - Response Formatting                       │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│             Services                            │
│     - Business Logic                            │
│     - Data Processing                           │
│     - Validation Logic                          │
│     - File Operations                           │
└─────────────────────────────────────────────────┘
```

### Key Principles

1. **Single Responsibility**: Each service handles one specific domain
2. **Dependency Injection**: Services are injected into controllers
3. **Configuration-Driven**: Validation rules stored in config files
4. **Reusability**: Shared logic extracted to services
5. **Testability**: Business logic separated from HTTP concerns

---

## Directory Structure

```
kfa-validation/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── PenjualanController.php      # Sales validation controller
│   │       ├── PembelianController.php      # Purchase validation controller
│   │       ├── UsersController.php          # User management controller
│   │       └── ActivityLogController.php    # Activity log controller
│   │
│   ├── Services/
│   │   ├── FileProcessingService.php        # File upload, conversion, reading
│   │   ├── ValidationService.php            # Document validation logic
│   │   ├── DocumentComparisonService.php    # Document comparison operations
│   │   ├── ValidationDataService.php        # Validation results retrieval
│   │   ├── ActivityLogger.php               # Activity logging service
│   │   └── OtpService.php                   # OTP verification service
│   │
│   └── Models/
│       └── Validation.php                   # Validation result model
│
├── config/
│   ├── document_validation.php              # Unified validation config
│   ├── pembelian_validation.php             # [DEPRECATED] Purchase config
│   └── penjualan_validation.php             # [DEPRECATED] Sales config
│
└── routes/
    └── web.php                              # Application routes
```

---

## Core Components

### 1. Services Layer

#### FileProcessingService
**Purpose**: Handle all file operations including upload, conversion, and reading

**Key Methods**:
- `saveAndConvertFile($file, $type)`: Upload and convert Excel/CSV files
- `readFileData($filename, $headerRow)`: Read file data with dynamic headers
- `previewFile($filename, $rows)`: Preview first N rows of file
- `processFileWithHeader($filename, $headerRow)`: Process file with specific header row
- `readFileAndFilterByKey($path, $key, $connectorColumn, $headerRow)`: Filter file data by key

**Responsibilities**:
- Excel to CSV conversion
- File encoding detection and normalization
- Dynamic header row detection
- Data extraction and formatting

---

#### ValidationService
**Purpose**: Core business logic for document validation

**Key Methods**:
- `validateDocument($filename, $documentType, $documentCategory, $headerRow, $userId)`: Main validation orchestrator

**Validation Process**:
1. Load configuration for document type
2. Fetch validation data from database
3. Read uploaded file data
4. Build comparison maps
5. Compare data with tolerance
6. Categorize records (matched/mismatched)
7. Calculate validation score
8. Save validation results
9. Log activity

**Configuration**:
- Tolerance threshold: `1000.01`
- Matches within tolerance marked as "Pembulatan" (rounding)
- Exact matches marked as "Sum Matched"
- Missing keys handled gracefully

---

#### ValidationDataService
**Purpose**: Retrieve and format validation results

**Key Methods**:
- `getValidationSummary($id)`: Get validation overview
- `getAllInvalidGroups($id)`: Get all invalid groups (for charts)
- `getAllMatchedGroups($id)`: Get all matched groups (for charts)
- `getInvalidGroupsPaginated($id, $filters)`: Paginated invalid groups with filters
- `getMatchedRecordsPaginated($id, $filters)`: Paginated matched records with filters
- `getValidationHistory($filters)`: Validation history with search/filter

**Features**:
- Server-side pagination
- Multi-criteria filtering
- Sorting by any column
- Source label categorization

---

#### DocumentComparisonService
**Purpose**: Compare uploaded documents with validation sources

**Key Methods**:
- `getComparisonData($documentType, $documentCategory, $filename, $key, $type, $headerRow)`: Get comparison data

**Comparison Types**:
1. **Uploaded**: Read data from uploaded file filtered by key
2. **Validation**: Read data from database filtered by key

**Use Case**: Display side-by-side comparison for discrepancy investigation

---

### 2. Controller Layer

Controllers act as **thin adapters** between HTTP requests and services.

#### Responsibilities
- Validate HTTP request input
- Inject required services
- Call service methods
- Format response (JSON/Inertia)
- Handle exceptions

#### Example Pattern
```php
public function validateFile(Request $request, $type)
{
    // 1. Validate request
    $request->validate(['filename' => 'required|string']);
    
    // 2. Call service
    try {
        $result = $this->validationService->validateDocument(
            filename: $request->input('filename'),
            documentType: 'pembelian',
            documentCategory: $type,
            headerRow: (int) $request->input('headerRow', 1),
            userId: auth()->user()?->id
        );
        
        // 3. Return response
        return response()->json($result);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 400);
    }
}
```

---

### 3. Routes Layer

Routes should **only** define endpoints and map to controller methods. No business logic.

#### Page Routes (GET)
```php
// Dashboard
Route::get('/penjualan', [PenjualanController::class, 'index']);

// Upload pages
Route::get('/penjualan/reguler', [PenjualanController::class, 'reguler']);
```

#### API Routes (POST/GET)
```php
// File operations
Route::post('/penjualan/save/{type}', [PenjualanController::class, 'save']);
Route::post('/penjualan/validate-{type}', [PenjualanController::class, 'validateFile']);

// Data retrieval
Route::get('penjualan/{id}', [PenjualanController::class, 'show']);
Route::get('penjualan/{id}/invalid-groups', [PenjualanController::class, 'getInvalidGroups']);
```

---

## Data Flow

### Document Validation Flow

```
┌─────────────────┐
│  User Uploads   │
│   Excel/CSV     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ FileProcessingService       │
│ - Convert to CSV            │
│ - Normalize encoding        │
│ - Store in storage/uploads  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ User Selects Header Row     │
│ (Frontend Preview)          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ ValidationService           │
│ 1. Load config              │
│ 2. Fetch DB validation data │
│ 3. Read uploaded file       │
│ 4. Build comparison maps    │
│ 5. Compare with tolerance   │
│ 6. Categorize records       │
│ 7. Calculate score          │
│ 8. Save to DB               │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Display Results             │
│ - Score                     │
│ - Matched/Mismatched count  │
│ - Invalid groups            │
│ - Charts & tables           │
└─────────────────────────────┘
```

---

## Configuration

### Unified Configuration: `config/document_validation.php`

The system uses a **unified configuration file** that consolidates all validation rules for both Pembelian and Penjualan documents.

#### Structure
```php
return [
    'document_type' => [
        'category' => [
            'doc_val' => 'database_table_name',
            'connector' => ['uploaded_column', 'db_column'],
            'sum' => ['uploaded_sum_column', 'db_sum_column'],
        ],
    ],
];
```

#### Example Configuration
```php
'pembelian' => [
    'reguler' => [
        'doc_val' => 'im_purchases_and_return',
        'connector' => ['NOMOR PENERIMAAN', 'no_transaksi'],
        'sum' => ['JUMLAH NETTO', 'dpp'],
    ],
],
'penjualan' => [
    'reguler' => [
        'doc_val' => 'im_jual',
        'connector' => ['no_transaksi', 'transaction_id'],
        'sum' => ['total_omset', 'total_penjualan'],
    ],
],
```

#### Configuration Fields

| Field | Description |
|-------|-------------|
| `doc_val` | Database table name containing validation source data |
| `connector[0]` | Column name in uploaded file used as unique key |
| `connector[1]` | Column name in database used as unique key |
| `sum[0]` | Column name in uploaded file containing sum value |
| `sum[1]` | Column name in database containing sum value |

---

## Service Layer

### Service Dependencies

Services use **constructor dependency injection**:

```php
class ValidationService
{
    public function __construct(
        private FileProcessingService $fileProcessingService
    ) {}
}
```

### Service Registration

Laravel automatically resolves services via its service container. No manual registration needed for simple cases.

For complex bindings, register in `app/Providers/AppServiceProvider.php`:

```php
public function register()
{
    $this->app->singleton(ValidationService::class, function ($app) {
        return new ValidationService(
            $app->make(FileProcessingService::class)
        );
    });
}
```

---

## Controller Layer

### Controller Responsibilities

✅ **DO**:
- Validate request input
- Call service methods
- Return formatted responses
- Handle exceptions gracefully
- Log errors

❌ **DON'T**:
- Implement business logic
- Direct database queries
- Complex data transformations
- File processing logic
- Validation calculations

### Example: Before vs After Refactoring

#### Before (Bad Practice)
```php
public function validateFile(Request $request, $type)
{
    // ❌ Business logic in controller
    $config = Config::get('pembelian_validation.' . $type);
    $validationRecords = DB::table($config['doc_val'])->get();
    
    // ❌ Complex data processing
    foreach ($data as $row) {
        // ... 100 lines of validation logic
    }
    
    // ❌ Direct model creation
    Validation::create([...]);
}
```

#### After (Good Practice)
```php
public function validateFile(Request $request, $type)
{
    // ✅ Simple delegation to service
    try {
        $result = $this->validationService->validateDocument(
            filename: $request->input('filename'),
            documentType: 'pembelian',
            documentCategory: $type,
            headerRow: (int) $request->input('headerRow', 1)
        );
        
        return response()->json($result);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 400);
    }
}
```

---

## Routes

### Route Organization

Routes are organized by:
1. **Document type** (Penjualan/Pembelian)
2. **Operation type** (Pages/File Operations/Data Retrieval)

### Route Naming Convention

```
{document_type}.{operation}
```

Examples:
- `penjualan.index` - Penjualan dashboard
- `penjualan.reguler` - Penjualan reguler upload page
- `penjualan.save` - Save uploaded file
- `penjualan.validateFile` - Validate document
- `penjualan.show` - Show validation results

### Middleware

```php
// Authentication required
Route::middleware(['auth', 'verified'])->group(function () {
    // Routes here
});

// Super admin only
Route::middleware(['auth', 'verified', 'role:super_admin'])->group(function () {
    // Admin routes
});
```

---

## Maintenance Guide

### Adding a New Document Category

1. **Update Configuration** (`config/document_validation.php`):
```php
'penjualan' => [
    'new_category' => [
        'doc_val' => 'database_table',
        'connector' => ['uploaded_col', 'db_col'],
        'sum' => ['uploaded_sum', 'db_sum'],
    ],
],
```

2. **Add Route** (`routes/web.php`):
```php
Route::get('/penjualan/new-category', [PenjualanController::class, 'newCategory']);
Route::post('/penjualan/validate-new-category', [PenjualanController::class, 'validateFile']);
```

3. **Add Controller Method**:
```php
public function newCategory()
{
    return Inertia::render('penjualan/upload', [
        'document_type' => 'penjualan',
        'document_category' => 'NewCategory',
    ]);
}
```

**No service changes needed!** The system is configuration-driven.

---

### Modifying Validation Logic

All validation logic is in `ValidationService`. Modify:
- `compareData()` for comparison rules
- `categorizeRows()` for record categorization
- `TOLERANCE` constant for tolerance threshold

---

### Adding New Service

1. **Create Service** (`app/Services/NewService.php`):
```php
<?php

namespace App\Services;

class NewService
{
    public function __construct(
        private DependencyService $dependency
    ) {}
    
    public function performAction()
    {
        // Business logic here
    }
}
```

2. **Inject into Controller**:
```php
public function __construct(
    private NewService $newService
) {}
```

3. **Use in Controller Method**:
```php
public function action()
{
    $result = $this->newService->performAction();
    return response()->json($result);
}
```

---

### Testing Strategy

#### Unit Tests (Services)
```php
class ValidationServiceTest extends TestCase
{
    public function test_validates_document_successfully()
    {
        $service = new ValidationService(
            $this->createMock(FileProcessingService::class)
        );
        
        $result = $service->validateDocument(...);
        
        $this->assertEquals('valid', $result['status']);
    }
}
```

#### Feature Tests (Controllers)
```php
class PenjualanControllerTest extends TestCase
{
    public function test_upload_page_renders()
    {
        $response = $this->get('/penjualan/reguler');
        $response->assertStatus(200);
    }
}
```

---

### Debugging Tips

1. **Check Logs**: All services use `Log::info()` and `Log::error()`
   - Location: `storage/logs/laravel.log`

2. **Validation Failures**: Check:
   - Configuration file for correct column names
   - Database table exists and has data
   - Uploaded file has correct headers

3. **File Processing Issues**: Check:
   - File encoding (UTF-8)
   - Header row number
   - Column name matching (case-sensitive)

---

### Performance Optimization

The system is already optimized with:
1. **Lazy loading**: Only fetch required columns from DB
2. **Single-pass processing**: Build maps in one iteration
3. **Early filtering**: Apply filters before processing
4. **Pagination**: Limit data transfer
5. **Chunked reading**: Process large files efficiently

For further optimization:
- Add Redis caching for validation configs
- Queue large file processing
- Add database indexes on connector columns

---

### Security Considerations

1. **File Upload**:
   - Max size: 16MB
   - Allowed types: xlsx, xls, csv
   - Stored in private storage (not web-accessible)

2. **Authentication**:
   - All validation routes require authentication
   - User management requires super_admin role

3. **Input Validation**:
   - All inputs validated via Laravel's validation
   - SQL injection prevented via Eloquent ORM

4. **Activity Logging**:
   - All validations logged with user ID
   - Audit trail maintained

---

## Summary

The refactored system follows **Clean Code principles** with:

✅ **Clear separation of concerns**
✅ **Service-oriented architecture**
✅ **Configuration-driven validation**
✅ **Thin controllers**
✅ **Reusable services**
✅ **Testable code**
✅ **Maintainable structure**

### Key Benefits

1. **Maintainability**: Changes to business logic only affect services
2. **Testability**: Services can be unit tested independently
3. **Reusability**: Services can be used across multiple controllers
4. **Scalability**: Easy to add new document types via configuration
5. **Readability**: Clear flow from routes → controllers → services

---

## Quick Reference

### File Locations

| Component | Location |
|-----------|----------|
| Controllers | `app/Http/Controllers/` |
| Services | `app/Services/` |
| Configuration | `config/document_validation.php` |
| Routes | `routes/web.php` |
| Models | `app/Models/` |

### Key Services

| Service | Purpose |
|---------|---------|
| FileProcessingService | File upload, conversion, reading |
| ValidationService | Document validation logic |
| ValidationDataService | Validation results retrieval |
| DocumentComparisonService | Document comparison |
| ActivityLogger | Activity logging |

### Key Commands

```bash
# Run tests
php artisan test

# Clear cache
php artisan cache:clear
php artisan config:clear

# View routes
php artisan route:list

# View logs
tail -f storage/logs/laravel.log
```

---

**Last Updated**: 2025-11-03
**Version**: 2.0 (Refactored)
**Author**: KFA Development Team
