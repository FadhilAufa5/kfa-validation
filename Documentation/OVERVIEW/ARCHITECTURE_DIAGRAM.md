# System Architecture Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React/Inertia)                   │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐│
│  │  Dashboard  │  │   Upload    │  │  Validation │  │  History   ││
│  │    Page     │  │    Page     │  │   Results   │  │    Page    ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘│
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP/JSON
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ROUTES (routes/web.php)                       │
│                                                                       │
│  Page Routes:                    API Routes:                         │
│  • GET  /penjualan              • POST /penjualan/save/{type}       │
│  • GET  /penjualan/reguler      • POST /penjualan/validate-{type}   │
│  • GET  /pembelian              • GET  /penjualan/{id}              │
│  • GET  /pembelian/retur        • GET  /penjualan/{id}/invalid-     │
│                                         groups                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTROLLERS (Thin Adapters)                       │
│                                                                       │
│  ┌──────────────────────┐        ┌──────────────────────┐          │
│  │ PenjualanController  │        │ PembelianController  │          │
│  │                      │        │                      │          │
│  │ • index()            │        │ • index()            │          │
│  │ • reguler()          │        │ • reguler()          │          │
│  │ • save()             │        │ • retur()            │          │
│  │ • validateFile()     │        │ • save()             │          │
│  │ • show()             │        │ • validateFile()     │          │
│  │ • preview()          │        │ • show()             │          │
│  │                      │        │ • preview()          │          │
│  │ ~250 LOC             │        │ ~270 LOC             │          │
│  └──────────────────────┘        └──────────────────────┘          │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Dependency Injection
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICES (Business Logic)                       │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            FileProcessingService (~400 LOC)                   │  │
│  │                                                                │  │
│  │  • saveAndConvertFile()       → Upload & convert Excel/CSV   │  │
│  │  • readFileData()             → Read with dynamic headers    │  │
│  │  • previewFile()              → Preview first N rows         │  │
│  │  • processFileWithHeader()    → Process with specific header │  │
│  │  • readFileAndFilterByKey()   → Filter data by key           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            ValidationService (~350 LOC)                       │  │
│  │                                                                │  │
│  │  • validateDocument()         → Main validation orchestrator │  │
│  │  • getValidationConfig()      → Load config                  │  │
│  │  • loadValidationData()       → Fetch DB data                │  │
│  │  • buildValidationMap()       → Build comparison maps        │  │
│  │  • compareData()              → Compare with tolerance       │  │
│  │  • categorizeRows()           → Matched/mismatched           │  │
│  │  • saveValidationResult()     → Persist results              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │         ValidationDataService (~300 LOC)                      │  │
│  │                                                                │  │
│  │  • getValidationSummary()     → Get overview                 │  │
│  │  • getAllInvalidGroups()      → All invalid (for charts)     │  │
│  │  • getInvalidGroupsPaginated()→ Paginated invalid            │  │
│  │  • getMatchedRecordsPaginated()→ Paginated matched           │  │
│  │  • getValidationHistory()     → History with filters         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │       DocumentComparisonService (~150 LOC)                    │  │
│  │                                                                │  │
│  │  • getComparisonData()        → Get comparison data          │  │
│  │  • getUploadedData()          → Read uploaded file           │  │
│  │  • getValidationData()        → Read validation DB           │  │
│  │  • readDatabaseAndFilterByKey()→ Filter DB by key            │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                      │
│                                                                       │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │   Database       │    │  File Storage    │    │  Configuration│ │
│  │                  │    │                  │    │               │ │
│  │ • validations    │    │ • storage/app/   │    │ • document_   │ │
│  │ • users          │    │   uploads/       │    │   validation  │ │
│  │ • activity_logs  │    │                  │    │   .php        │ │
│  │ • im_jual        │    │                  │    │               │ │
│  │ • im_purchases_  │    │                  │    │               │ │
│  │   and_return     │    │                  │    │               │ │
│  └──────────────────┘    └──────────────────┘    └───────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Document Validation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. USER UPLOADS FILE                                             │
│    Frontend → POST /penjualan/save/reguler                       │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. CONTROLLER RECEIVES REQUEST                                   │
│    PenjualanController::save($request, $type)                    │
│    • Validates request                                           │
│    • Calls FileProcessingService                                 │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. FILE PROCESSING SERVICE                                       │
│    FileProcessingService::saveAndConvertFile($file, $type)       │
│    • Detects file type (Excel/CSV)                               │
│    • Converts Excel → CSV if needed                              │
│    • Normalizes encoding to UTF-8                                │
│    • Stores in storage/app/uploads/                              │
│    • Returns: filename.csv                                       │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. FRONTEND PREVIEW                                              │
│    User selects header row                                       │
│    GET /penjualan/preview/{filename}                             │
│    Returns: First 10 rows for preview                            │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. VALIDATION REQUEST                                            │
│    Frontend → POST /penjualan/validate-reguler                   │
│    Params: {filename, headerRow}                                 │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 6. CONTROLLER DELEGATES TO SERVICE                               │
│    PenjualanController::validateFile($request, $type)            │
│    • Validates request                                           │
│    • Calls ValidationService                                     │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 7. VALIDATION SERVICE - ORCHESTRATES VALIDATION                  │
│    ValidationService::validateDocument(...)                      │
│                                                                   │
│    Step 1: Load Configuration                                    │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ config('document_validation.penjualan.reguler')         │  │
│    │ Returns: {doc_val, connector, sum}                      │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                   │
│    Step 2: Load Validation Data from DB                          │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ DB::table('im_jual')                                    │  │
│    │   ->select(['transaction_id', 'total_penjualan'])      │  │
│    │   ->get()                                               │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                   │
│    Step 3: Read Uploaded File                                    │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ FileProcessingService::readFileData($filename, $header) │  │
│    │ Returns: {headers, data}                                │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                   │
│    Step 4: Build Comparison Maps                                 │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ validationMap = [key => sum]                            │  │
│    │ uploadedMap   = [key => sum]                            │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                   │
│    Step 5: Compare Data (with tolerance ±1000.01)                │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ For each key in uploadedMap:                            │  │
│    │   if key not in validationMap → invalid                │  │
│    │   if |difference| <= 1000.01  → matched                 │  │
│    │   else                        → invalid                 │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                   │
│    Step 6: Categorize Individual Rows                            │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ matchedRows[]   - rows in matched groups                │  │
│    │ invalidRows[]   - rows in invalid groups                │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                   │
│    Step 7: Calculate Score                                       │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ score = (matchedRecords / totalRecords) * 100          │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                   │
│    Step 8: Save to Database                                      │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ Validation::create([                                    │  │
│    │   'file_name' => ...,                                   │  │
│    │   'score' => ...,                                       │  │
│    │   'validation_details' => [                             │  │
│    │     'invalid_groups' => ...,                            │  │
│    │     'matched_groups' => ...,                            │  │
│    │   ]                                                     │  │
│    │ ])                                                      │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                   │
│    Step 9: Log Activity                                          │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ ActivityLogger::log(...)                                │  │
│    └─────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 8. RETURN RESULTS TO FRONTEND                                    │
│    {                                                             │
│      status: 'valid' or 'invalid',                               │
│      invalid_groups: {...},                                      │
│      invalid_rows: [...],                                        │
│      validation_id: 123                                          │
│    }                                                             │
└────────────────────────────┬─────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ 9. FRONTEND DISPLAYS RESULTS                                     │
│    • Validation score                                            │
│    • Matched vs Mismatched counts                                │
│    • Charts and tables                                           │
│    • Invalid groups details                                      │
│    • Document comparison                                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Service Dependencies

```
ValidationService
    ↓ depends on
FileProcessingService


DocumentComparisonService
    ↓ depends on
FileProcessingService


Controllers (both Penjualan & Pembelian)
    ↓ inject
    ├── FileProcessingService
    ├── ValidationService
    ├── ValidationDataService
    └── DocumentComparisonService
```

---

## Configuration Structure

```
config/document_validation.php
│
├── pembelian
│   ├── reguler
│   │   ├── doc_val: 'im_purchases_and_return'
│   │   ├── connector: ['NOMOR PENERIMAAN', 'no_transaksi']
│   │   └── sum: ['JUMLAH NETTO', 'dpp']
│   │
│   ├── retur
│   │   ├── doc_val: 'im_purchases_and_return'
│   │   ├── connector: ['Nomor Retur', 'no_transaksi']
│   │   └── sum: ['Jumlah Retur', 'dpp']
│   │
│   └── urgent
│       ├── doc_val: 'im_purchases_and_return'
│       ├── connector: ['Nomor Penerimaan', 'no_transaksi']
│       └── sum: ['Jumlah', 'dpp']
│
└── penjualan
    ├── reguler
    │   ├── doc_val: 'im_jual'
    │   ├── connector: ['no_transaksi', 'transaction_id']
    │   └── sum: ['total_omset', 'total_penjualan']
    │
    ├── ecommerce
    │   ├── doc_val: 'im_jual'
    │   ├── connector: ['NO TRANSAKSI', 'transaction_id']
    │   └── sum: ['DISKON ITEM * QTY', 'total']
    │
    ├── debitur
    │   ├── doc_val: 'im_jual'
    │   ├── connector: ['NOMOR TRANSAKSI', 'transaction_id']
    │   └── sum: ['OMSET', 'total_penjualan']
    │
    └── konsi
        ├── doc_val: 'im_jual'
        ├── connector: ['id_transaksi', 'no_transaksi']
        └── sum: ['total_pembayaran', 'cogs']
```

---

## Data Model

```
Validation Model
├── id (primary key)
├── file_name
├── user_id (foreign key → users)
├── role
├── document_type ('Pembelian' or 'Penjualan')
├── document_category ('Reguler', 'Retur', etc.)
├── score (decimal, 0-100)
├── total_records (integer)
├── matched_records (integer)
├── mismatched_records (integer)
├── validation_details (JSON)
│   ├── invalid_groups: {
│   │     "key123": {
│   │       discrepancy_category: "im_invalid" | "missing" | "discrepancy",
│   │       error: "...",
│   │       uploaded_total: 1000,
│   │       source_total: 900,
│   │       discrepancy_value: 100
│   │     }
│   │   }
│   ├── invalid_rows: [
│   │     {row_index: 5, key_value: "key123", error: "..."}
│   │   ]
│   ├── matched_groups: {
│   │     "key456": {
│   │       uploaded_total: 1000,
│   │       source_total: 1000,
│   │       difference: 0,
│   │       note: "Sum Matched" | "Pembulatan"
│   │     }
│   │   }
│   └── matched_rows: [
│         {row_index: 3, key_value: "key456", ...}
│       ]
├── created_at
└── updated_at
```

---

## Request/Response Flow

### Upload File
```
Request:  POST /penjualan/save/reguler
Body:     multipart/form-data {document: file}

Response: {filename: "document.csv"}
```

### Validate File
```
Request:  POST /penjualan/validate-reguler
Body:     {filename: "document.csv", headerRow: 1}

Response: {
  status: "valid" | "invalid",
  invalid_groups: {...},
  invalid_rows: [...],
  validation_id: 123
}
```

### Get Validation Results
```
Request:  GET /penjualan/123

Response: Inertia page with:
  {
    validationData: {
      fileName, score, matched, total,
      mismatched, invalidGroups, matchedGroups,
      isValid
    }
  }
```

### Get Invalid Groups (Paginated)
```
Request:  GET /penjualan/123/invalid-groups?
            page=1&per_page=10&search=ABC&
            category=discrepancy&sort_key=key&
            sort_direction=asc

Response: {
  data: [...],
  pagination: {current_page, per_page, total, total_pages},
  filters: {search, category, source},
  sort: {key, direction},
  uniqueFilters: {categories: [...], sources: [...]}
}
```

---

## Error Handling Flow

```
Try Block (Controller)
    ↓
Service Method Call
    ↓
Service Logic
    ↓
    ├─→ Success: Return result
    │
    └─→ Exception Thrown
            ↓
        Catch Block (Controller)
            ↓
        Log Error
            ↓
        Return JSON Error Response
            ↓
        Frontend Displays Error
```

---

**For detailed information, see**: `SYSTEM_ARCHITECTURE.md`

**Last Updated**: 2025-11-03
