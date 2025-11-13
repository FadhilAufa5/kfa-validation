# KFA Validation System - Comprehensive Documentation

**Version:** 2.0
**Last Updated:** 2025-11-13
**System Type:** Document Validation & Management System
**Tech Stack:** Laravel 11 + React (Inertia.js) + TypeScript + Tailwind CSS

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Authentication System](#authentication-system)
6. [Document Validation Flow](#document-validation-flow)
7. [Validation Settings](#validation-settings)
8. [Background Job Processing](#background-job-processing)
9. [API Documentation](#api-documentation)
10. [Database Schema](#database-schema)
11. [Deployment Guide](#deployment-guide)
12. [Troubleshooting](#troubleshooting)

---

## System Overview

### Purpose
KFA Validation System is a document validation platform that compares uploaded financial documents (Pembelian/Purchases and Penjualan/Sales) against internal master data to identify discrepancies and ensure data accuracy.

### Key Capabilities
- **Document Upload & Processing**: Excel/CSV file upload with automatic conversion
- **Intelligent Validation**: Compare documents against IM (Internal Master) data with configurable tolerance
- **Real-time Results**: View validation scores, matched/mismatched records with detailed breakdowns
- **Role-Based Access Control**: Dynamic permission system for different user types
- **Async Processing**: Background job processing for large files (up to 7GB)
- **Audit Trail**: Complete activity logging for all system actions
- **OTP Authentication**: Passwordless login with email OTP
- **Validation Settings**: Dynamic configuration management for super admins

---

## Architecture

### High-Level Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                         │
│  React/TypeScript + Inertia.js + Tailwind CSS          │
│  • Upload Pages    • Validation Results                │
│  • Dashboard       • History                           │
│  • User Management • Permission Management             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/JSON
                     ▼
┌─────────────────────────────────────────────────────────┐
│              ROUTES LAYER (web.php)                     │
│  • Page Routes (GET)                                    │
│  • API Routes (POST/PUT/DELETE)                         │
│  • Middleware (auth, role, permission)                  │
└────────────────────┬────────────────────────────────────┘
                     │ Dependency Injection
                     ▼
┌─────────────────────────────────────────────────────────┐
│              CONTROLLER LAYER                           │
│  Thin Adapters - Delegate to Services                   │
│  • PenjualanController   • PembelianController          │
│  • UserController        • PermissionController         │
│  • ValidationSettingController                          │
└────────────────────┬────────────────────────────────────┘
                     │ Service Injection
                     ▼
┌─────────────────────────────────────────────────────────┐
│              SERVICE LAYER (Business Logic)             │
│  • FileProcessingService     (File operations)          │
│  • ValidationService         (Core validation)          │
│  • ValidationDataService     (Data retrieval)           │
│  • DocumentComparisonService (Comparison logic)         │
│  • OtpService               (OTP generation/verify)     │
│  • ActivityLogger           (Audit logging)             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              DATA LAYER                                 │
│  • Database (SQLite/MySQL)  • File Storage              │
│  • Queue System (Jobs)      • Cache System              │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- Laravel 11 (PHP 8.2+)
- Inertia.js (Server-side rendering)
- SQLite/MySQL Database
- Queue System (Database driver)
- PhpSpreadsheet (Excel processing)
- League CSV (CSV processing)

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS 3
- shadcn/ui Components
- Recharts (Data visualization)
- Lucide Icons

**Infrastructure:**
- Laravel Herd (Development)
- Composer (PHP dependencies)
- NPM (Frontend dependencies)
- Queue Worker (Background jobs)

---

## Core Features

### 1. Document Upload & Validation

#### Supported Document Types

**Pembelian (Purchases):**
- Reguler - Regular purchases
- Retur - Return documents
- Urgent - Urgent purchases

**Penjualan (Sales):**
- Reguler - Regular sales
- Ecommerce - E-commerce sales
- Debitur - Debtor sales
- Konsi - Consignment sales

#### Upload Process Flow

```
User Upload File (Excel/CSV)
         ↓
File Saved & Converted to CSV
         ↓
Preview with Header Row Selection
         ↓
User Confirms Header Row
         ↓
Async Validation Job Queued
         ↓
Background Processing:
  1. File mapping
  2. Data validation
  3. Discrepancy detection
  4. Score calculation
         ↓
Results Displayed:
  • Validation Score (%)
  • Matched Records
  • Mismatched Records (with details)
  • Charts & Visualizations
```

#### Validation Logic

**Tolerance-Based Comparison:**
```
Default Tolerance: ±1000.01

For each record:
1. Match by Connector Key (e.g., transaction_id)
2. Compare Sum Values (e.g., total_amount)
3. Calculate Difference

Classification:
• |difference| = 0        → "Sum Matched" (Exact)
• |difference| ≤ tolerance → "Pembulatan" (Rounding)
• |difference| > tolerance → "Discrepancy" (Invalid)
• Key not in IM data       → "Missing in IM"
• Key not in upload        → "Extra in IM"
```

#### Configuration (Unified System)

Located in: `config/document_validation.php`

```php
'pembelian' => [
    'reguler' => [
        'doc_val' => 'im_purchases_and_return',  // IM table
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

### 2. Validation Results

#### Score Calculation
```
Score = (Matched Records / Total Records) × 100

Example:
Total Records: 1000
Matched: 985
Mismatched: 15
Score = (985/1000) × 100 = 98.5%
```

#### Results Display

**Summary Card:**
- Validation Score (percentage)
- Total Records
- Matched Records
- Mismatched Records
- Document Info (name, type, date)
- User Info (uploaded by)

**Invalid Groups Table:**
- Discrepancy Category (Missing, Discrepancy, IM Invalid)
- Key Value
- Uploaded Total
- Source Total
- Discrepancy Value
- Affected Rows Count
- Source Label

**Matched Groups Table:**
- Key Value
- Uploaded Total
- Source Total
- Difference
- Match Type (Sum Matched / Pembulatan)
- Affected Rows Count

**Pagination & Filtering:**
- Server-side pagination (10/25/50/100 rows)
- Search by key value
- Filter by category
- Filter by source
- Sort by any column

### 3. Document Comparison

**Side-by-Side View:**
- View uploaded document data
- View IM validation data
- Filter by specific key
- Compare column by column
- Identify exact discrepancies

**Access:**
- Click row in Invalid Groups table
- Opens comparison dialog
- Toggle between Uploaded/Validation data

---

## User Roles & Permissions

### Role-Based Access Control (RBAC) System

#### Default Roles

**1. Super Admin**
- **Full System Access** - All 11 permissions
- Can manage users, roles, and permissions
- Access to validation settings
- View activity logs
- All operational features

**2. User (Default)**
- **Operational Access** - 7 permissions
- Upload documents (Pembelian & Penjualan)
- Run validation
- View validation results
- View history
- No management access

**3. Visitor**
- **Read-Only Access** - 4 permissions
- View validation results
- View history
- Cannot upload or validate
- No management access

#### Permission Categories

**Upload (2 permissions):**
- `upload.pembelian` - Upload Pembelian files
- `upload.penjualan` - Upload Penjualan files

**Validation (2 permissions):**
- `validation.run` - Execute validation
- `validation.view` - View validation results

**History (2 permissions):**
- `history.pembelian` - View Pembelian history
- `history.penjualan` - View Penjualan history

**Details (1 permission):**
- `details.view` - View detailed results

**Management (3 permissions):**
- `users.manage` - User CRUD operations
- `roles.manage` - Role & permission management
- `logs.view` - Activity log access

**Settings (1 permission):**
- `settings.validation` - Validation configuration

#### Using Permissions in Code

```php
// Check single permission
if ($user->hasPermission('upload.pembelian')) {
    // Allow upload
}

// Check any permission
if ($user->hasAnyPermission(['upload.pembelian', 'upload.penjualan'])) {
    // Allow upload
}

// Check all permissions
if ($user->hasAllPermissions(['users.manage', 'roles.manage'])) {
    // Allow full management
}
```

#### Managing Roles & Permissions

**Access:** `/permissions` (Super Admin only)

**Create Role:**
1. Click "Add Role"
2. Enter name (lowercase, e.g., `auditor`)
3. Enter display name (e.g., `Auditor`)
4. Add description
5. Select permissions
6. Save

**Create Permission:**
1. Click "Add Permission"
2. Enter name (format: `category.action`)
3. Enter display name
4. Select category
5. Add description
6. Save

**Delete Rules:**
- Cannot delete `super_admin` role
- Cannot delete roles with users
- Cannot delete permissions assigned to roles

---

## Authentication System

### Multi-Method Authentication

#### 1. Traditional Login (Email + Password)

**Flow:**
```
User enters email & password
         ↓
Laravel Authentication
         ↓
Login successful → Dashboard
```

**Features:**
- Remember me checkbox
- Password validation
- Rate limiting (5 attempts/min)
- Session management

#### 2. OTP Login (Passwordless)

**Flow:**
```
User enters email only
         ↓
System sends 6-digit OTP to email
         ↓
User redirected to /verify-otp
         ↓
User enters OTP code
         ↓
Auto-submit & validation
         ↓
Login successful → Dashboard
```

**Features:**
- 6-digit random OTP
- 5-minute expiration
- Auto-cleanup expired OTPs
- IP tracking
- Rate limiting:
  - Send OTP: 5/minute
  - Verify: 10/minute
  - Resend: 3/minute
  - Max generation: 3/hour

**Use Cases:**
- Forgot password
- Login from new device
- Security-conscious users
- Temporary access

#### 3. Email Verification (Registration)

**Flow:**
```
User registers account
         ↓
Sends 6-digit OTP to email
         ↓
User verifies OTP
         ↓
Email verified → Dashboard
```

### OTP System Architecture

**OTP Service** (`app/Services/OtpService.php`):
- `sendOtp($email, $type)` - Generate & send OTP
- `verifyOtp($email, $otp, $type)` - Validate OTP
- `canRequestOtp($email, $type)` - Check rate limits
- `cleanupExpiredOtps()` - Scheduled cleanup

**Database Table:** `email_otps`
```sql
CREATE TABLE email_otps (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255),
    otp VARCHAR(6),
    type ENUM('registration', 'login', 'email_change'),
    expires_at TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    failed_attempts INT DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Security Features

**Protection Layers:**
1. CSRF Protection (Laravel)
2. SQL Injection Prevention (Eloquent ORM)
3. XSS Protection (React escaping)
4. Rate Limiting (Throttle middleware)
5. Session Management (Secure cookies)
6. Password Hashing (Bcrypt)
7. IP Tracking (Activity logs)

**Failed Login Handling:**
- 3 max attempts before blocking
- 1-hour cooldown period
- Logged in activity logs

---

## Document Validation Flow

### Detailed Validation Process

#### Step 1: File Upload

```php
// FileProcessingService::saveAndConvertFile()

1. Receive file from request
2. Detect file type (Excel/CSV)
3. If Excel:
   - Load with PhpSpreadsheet
   - Convert to CSV
   - Handle merged cells
4. If CSV:
   - Detect encoding (UTF-8, ISO-8859-1, Windows-1252)
   - Convert to UTF-8
5. Save to storage/uploads/
6. Return filename
```

#### Step 2: Header Row Selection

```php
// FileProcessingService::previewFile()

1. Read first 10 rows
2. Display in preview table
3. User selects header row number
4. Store selection for validation
```

#### Step 3: Async Validation Job

```php
// ProcessFileValidation Job

1. Create placeholder validation record (status: 'processing')
2. Dispatch job to queue
3. Return validation_id to frontend
4. Frontend polls status every 5 seconds

Background Job Execution:
1. Map uploaded file → mapped_uploaded_files table
2. Read header row dynamically
3. Load IM validation data from config
4. Build comparison maps
5. Compare data with tolerance
6. Categorize records:
   - Matched (exact or within tolerance)
   - Invalid (discrepancy, missing, IM invalid)
7. Calculate score
8. Update validation record (status: 'completed')
9. Log activity
```

#### Step 4: Results Display

```php
// ValidationDataService::getValidationSummary()

1. Retrieve validation record
2. Parse validation_details JSON
3. Format data for display:
   - Score
   - Matched/Mismatched counts
   - Invalid groups with categories
   - Matched groups with notes
4. Return to frontend
```

### Validation Categories

**Matched Records:**
- **Sum Matched**: Exact match (difference = 0)
- **Pembulatan**: Within tolerance (|difference| ≤ 1000.01)

**Invalid Records:**
- **Discrepancy**: Outside tolerance (|difference| > 1000.01)
- **Missing in IM**: Key exists in upload but not in IM data
- **IM Invalid**: Key exists in IM but not in upload

### File Mapping System

**Purpose:** Track relationship between uploaded files and validation records

**Table:** `mapped_uploaded_files`

```sql
CREATE TABLE mapped_uploaded_files (
    id BIGINT PRIMARY KEY,
    filename VARCHAR(255),
    document_type VARCHAR(50),
    document_category VARCHAR(50),
    header_row INT,
    connector_column VARCHAR(255),
    sum_column VARCHAR(255),
    validation_id BIGINT,
    headers JSON,
    mapping_info JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Stored Information:**
- Original filename
- Document type/category
- Header row number
- Column mappings
- Validation ID reference
- Header structure
- Mapping metadata

---

## Validation Settings

### Super Admin Configuration Panel

**Access:** `/validation-setting` (Super Admin only)

### Features

#### 1. Adjust Rounding Tolerance

**Default:** 1000.01

**Purpose:** Define acceptable difference range for validation

**How to Update:**
1. Navigate to Validation Setting
2. Click "Adjust Tolerance"
3. Enter new value (positive number)
4. Confirm update

**Technical Storage:**
```php
// validation_settings table
[
    'key' => 'rounding_tolerance',
    'value' => '1000.01',
    'type' => 'float',
    'description' => 'Tolerance for validation calculations'
]
```

**Caching:** 1 hour cache for performance

**Used In:** All validation comparisons via `ValidationService`

#### 2. Update IM Data

**Purpose:** Upload/update Internal Master data for validation

**Supported Data Types:**
- **Pembelian**: `im_purchases_and_return` table
- **Penjualan**: `im_jual` table

**File Requirements:**
- **Formats**: .xlsx, .xls, .csv
- **Max Size**: 7GB (7,168,000 KB)
- **Filename**: Must contain table name
  - Pembelian: Must include "im_purchases_and_return"
  - Penjualan: Must include "im_jual"

**Upload Process:**
```
1. Select data type (Pembelian/Penjualan)
2. Upload file (drag-and-drop or browse)
3. File validation (type, size, filename)
4. Job queued (ProcessImDataUpload)
5. Background processing:
   - TRUNCATE target table
   - Handle merged cells (Excel)
   - Detect & convert encoding
   - Batch insert (500 rows/batch)
   - Progress logging (every 5000 rows)
   - Dynamic column creation
6. Completion:
   - Update im_data_info table
   - Log activity
   - Cleanup temp files
```

**Processing Features:**
- **Timeout**: 2 hours (7200 seconds)
- **Auto-retry**: 1 attempt
- **Batch Size**: 500 rows to prevent memory issues
- **Progress Logging**: Every 5000 rows
- **Error Handling**: Comprehensive error logging
- **Cleanup**: Automatic temp file deletion

#### 3. IM Data Information Display

**Pembelian Data Card:**
- Total rows count
- Last updated timestamp
- Last updated by user
- Refresh button (manual count refresh)
- Update IM Data button

**Penjualan Data Card:**
- Total rows count
- Last updated timestamp
- Last updated by user
- Refresh button (manual count refresh)
- Update IM Data button

**Auto-Refresh Feature:**
After IM data upload, the system automatically:
1. Polls every 10 seconds
2. Checks if `last_updated_at` timestamp changed
3. Auto-updates display when processing complete
4. Shows success notification with new row count
5. Stops polling after completion or timeout (10 minutes)

### IM Data Info Tracking

**Table:** `im_data_info`

```sql
CREATE TABLE im_data_info (
    id BIGINT PRIMARY KEY,
    table_name VARCHAR(255) UNIQUE,
    row_count BIGINT DEFAULT 0,
    last_updated_at TIMESTAMP,
    last_updated_by VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Tracks:**
- Table name (im_purchases_and_return / im_jual)
- Current row count
- Last update timestamp
- User who updated

**Used For:**
- Display in Validation Setting page
- Maintenance page checks (redirect if empty)
- System health monitoring

---

## Background Job Processing

### Queue System Architecture

**Configuration** (`.env`):
```env
QUEUE_CONNECTION=database
DB_QUEUE_TABLE=jobs
DB_QUEUE=default
```

### Jobs Overview

#### 1. ProcessFileValidation

**Purpose:** Async file validation for large documents

**File:** `app/Jobs/ProcessFileValidation.php`

**Configuration:**
- Timeout: 600 seconds (10 minutes)
- Retries: 3 attempts
- Queue: default

**Process:**
```
1. Create validation record (status: 'processing')
2. Map uploaded file
3. Load IM data from config
4. Read uploaded file data
5. Build comparison maps
6. Compare & categorize
7. Calculate score
8. Update validation record (status: 'completed'/'failed')
9. Log activity
```

**Status Tracking:**
```sql
SELECT id, file_name, status, score, processing_details
FROM validations
WHERE status = 'processing'
ORDER BY created_at DESC;
```

#### 2. ProcessImDataUpload

**Purpose:** Background IM data upload & processing

**File:** `app/Jobs/ProcessImDataUpload.php`

**Configuration:**
- Timeout: 7200 seconds (2 hours)
- Retries: 1 attempt
- Queue: default

**Process:**
```
1. Truncate target table (clear old data)
2. Handle merged cells (Excel files)
3. Detect encoding & convert to UTF-8
4. Batch insert (500 rows per batch)
5. Progress logging (every 5000 rows)
6. Dynamic column creation (if new columns)
7. Update im_data_info table
8. Log activity
9. Cleanup temp files
```

### Queue Worker Management

#### Start Worker (Development)

```bash
cd C:\Users\ZBOOK\herd\kfa-validation
php artisan queue:work
```

**Or use provided batch file:**
```batch
check_queue.bat
```

#### Start Worker (Production)

```bash
php artisan queue:work --tries=3 --timeout=600 --daemon
```

#### Worker Options

| Option | Description |
|--------|-------------|
| `--tries=3` | Max retry attempts |
| `--timeout=600` | Max execution time (seconds) |
| `--daemon` | Run as background process |
| `--sleep=3` | Sleep seconds when idle |
| `--queue=high,default` | Process specific queues |
| `--once` | Process one job and exit |

#### Monitor Jobs

**View Pending:**
```bash
php artisan queue:monitor database:default
```

**View Failed:**
```bash
php artisan queue:failed
```

**Retry Failed:**
```bash
php artisan queue:retry {id}
# or all
php artisan queue:retry all
```

**Clear Failed:**
```bash
php artisan queue:flush
```

### Database Tables

**jobs** (pending jobs):
```sql
SELECT id, queue, payload, attempts, created_at
FROM jobs
ORDER BY id DESC;
```

**failed_jobs** (failed jobs):
```sql
SELECT id, queue, exception, failed_at
FROM failed_jobs
ORDER BY failed_at DESC;
```

### Production Setup (Windows)

**Option 1: Windows Task Scheduler**
```batch
# Create start_queue_worker.bat
@echo off
cd C:\Users\ZBOOK\Herd\kfa-validation
php artisan queue:work --tries=3 --timeout=600 --daemon

# Setup in Task Scheduler:
# - Trigger: At startup
# - Action: Run start_queue_worker.bat
# - Run whether user logged on or not
```

**Option 2: NSSM (Recommended)**
```bash
# Install NSSM from https://nssm.cc/download

nssm install KFAQueueWorker "C:\path\to\php.exe" "artisan queue:work --tries=3 --timeout=600"
nssm set KFAQueueWorker AppDirectory "C:\Users\ZBOOK\Herd\kfa-validation"
nssm start KFAQueueWorker
```

---

## API Documentation

### Authentication Endpoints

**Login with Password:**
```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "remember": true
}

Response: 302 Redirect to /dashboard
```

**Login with OTP:**
```http
POST /login/otp
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 302 Redirect to /verify-otp
Session: otp_email, otp_type stored
```

**Verify OTP:**
```http
POST /verify-otp
Content-Type: application/json

{
  "otp": "123456",
  "email": "user@example.com",
  "type": "login"
}

Response: 200 OK
{
  "message": "Login successful!",
  "verified": true,
  "redirect": "/dashboard"
}
```

### Document Upload Endpoints

**Upload File:**
```http
POST /penjualan/save/reguler
Content-Type: multipart/form-data

document: [file]

Response: 200 OK
{
  "filename": "document_20251113.csv"
}
```

**Preview File:**
```http
GET /penjualan/preview/document_20251113.csv

Response: 200 OK (Inertia page with preview data)
```

**Validate File (Async):**
```http
POST /penjualan/validate-reguler
Content-Type: application/json

{
  "filename": "document_20251113.csv",
  "headerRow": 1,
  "async": true
}

Response: 202 Accepted
{
  "status": "processing",
  "message": "File validation queued",
  "validation_id": 123,
  "check_status_url": "/penjualan/validation/123/status"
}
```

**Check Validation Status:**
```http
GET /penjualan/validation/123/status

Response (Processing): 200 OK
{
  "validation_id": 123,
  "status": "processing",
  "file_name": "document.csv",
  "document_type": "penjualan",
  "document_category": "Reguler"
}

Response (Completed): 200 OK
{
  "validation_id": 123,
  "status": "completed",
  "score": 98.5,
  "total_records": 1000,
  "matched_records": 985,
  "mismatched_records": 15,
  "view_url": "/penjualan/123"
}
```

### Validation Data Endpoints

**Get Validation Summary:**
```http
GET /penjualan/123

Response: 200 OK (Inertia page)
```

**Get Invalid Groups (Paginated):**
```http
GET /penjualan/123/invalid-groups?
    page=1&per_page=10&
    search=ABC&category=discrepancy&
    sort_key=key&sort_direction=asc

Response: 200 OK
{
  "data": [...],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total": 15,
    "total_pages": 2
  },
  "filters": {
    "search": "ABC",
    "category": "discrepancy"
  }
}
```

**Get Matched Records (Paginated):**
```http
GET /penjualan/123/matched-records?
    page=1&per_page=10

Response: 200 OK (similar to invalid groups)
```

**Get Document Comparison:**
```http
GET /penjualan/123/comparison?
    key=TRX123&type=uploaded

Response: 200 OK
{
  "data": [row data with all columns],
  "headers": ["column1", "column2", ...],
  "key": "TRX123",
  "type": "uploaded"
}
```

### Validation Setting Endpoints (Super Admin)

**Update Tolerance:**
```http
POST /validation-setting/tolerance
Content-Type: application/json

{
  "tolerance": 2000.50
}

Response: 302 Redirect with success message
```

**Upload IM Data:**
```http
POST /validation-setting/upload-im-data
Content-Type: multipart/form-data

file: [file]
data_type: "pembelian"

Response: 302 Redirect with success message
```

**Refresh IM Data Count:**
```http
POST /validation-setting/refresh-count
Content-Type: application/json

{
  "table_name": "im_purchases_and_return"
}

Response: 302 Redirect with success message
```

### Permission Management Endpoints (Super Admin)

**Create Role:**
```http
POST /permissions/roles
Content-Type: application/json

{
  "name": "auditor",
  "display_name": "Auditor",
  "description": "Can view but not modify",
  "permissions": [1, 2, 3]
}

Response: 302 Redirect with success message
```

**Update Role:**
```http
PUT /permissions/roles/4
Content-Type: application/json

{
  "display_name": "Senior Auditor",
  "description": "Updated description",
  "permissions": [1, 2, 3, 4]
}

Response: 302 Redirect with success message
```

**Delete Role:**
```http
DELETE /permissions/roles/4

Response: 302 Redirect with success message
```

### User Management Endpoints (Super Admin)

**Create User:**
```http
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "role_id": 2,
  "password": "SecurePass123"
}

Response: 302 Redirect with success message
```

**Update User:**
```http
PUT /users/5
Content-Type: application/json

{
  "name": "John Smith",
  "role_id": 3
}

Response: 302 Redirect with success message
```

---

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    role_id BIGINT NULL,
    two_factor_secret TEXT NULL,
    two_factor_recovery_codes TEXT NULL,
    two_factor_confirmed_at TIMESTAMP NULL,
    created_by_admin BOOLEAN DEFAULT FALSE,
    assigned_user_id BIGINT NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_role_id (role_id)
);
```

#### validations
```sql
CREATE TABLE validations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    file_name VARCHAR(255) NOT NULL,
    user_id BIGINT NULL,
    role VARCHAR(50) NULL,
    document_type VARCHAR(50) NOT NULL,
    document_category VARCHAR(50) NOT NULL,
    score DECIMAL(5,2) DEFAULT 0,
    total_records INT DEFAULT 0,
    matched_records INT DEFAULT 0,
    mismatched_records INT DEFAULT 0,
    validation_details JSON NULL,
    status VARCHAR(20) DEFAULT 'processing',
    processing_details JSON NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_document_type (document_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

#### roles
```sql
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_name (name)
);
```

#### permissions
```sql
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_name (name),
    INDEX idx_category (category)
);
```

#### role_permissions
```sql
CREATE TABLE role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE KEY unique_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

#### email_otps
```sql
CREATE TABLE email_otps (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    type ENUM('registration', 'login', 'email_change') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45) NULL,
    failed_attempts INT DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_email_type (email, type),
    INDEX idx_expires_at (expires_at)
);
```

#### activity_logs
```sql
CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    category VARCHAR(50) NULL,
    description TEXT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id VARCHAR(255) NULL,
    metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
);
```

#### validation_settings
```sql
CREATE TABLE validation_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'string',
    description TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_key (key)
);
```

#### im_data_info
```sql
CREATE TABLE im_data_info (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(255) UNIQUE NOT NULL,
    row_count BIGINT DEFAULT 0,
    last_updated_at TIMESTAMP NULL,
    last_updated_by VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_table_name (table_name)
);
```

#### mapped_uploaded_files
```sql
CREATE TABLE mapped_uploaded_files (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_category VARCHAR(50) NOT NULL,
    header_row INT NOT NULL,
    connector_column VARCHAR(255) NULL,
    sum_column VARCHAR(255) NULL,
    validation_id BIGINT NULL,
    headers JSON NULL,
    mapping_info JSON NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (validation_id) REFERENCES validations(id) ON DELETE CASCADE,
    INDEX idx_filename (filename),
    INDEX idx_validation_id (validation_id)
);
```

### IM Data Tables

#### im_purchases_and_return
```sql
CREATE TABLE im_purchases_and_return (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    -- Dynamic columns created based on uploaded file
    -- Common columns:
    no_transaksi VARCHAR(255),
    dpp DECIMAL(15,2),
    -- Additional columns added dynamically
    INDEX idx_no_transaksi (no_transaksi)
);
```

#### im_jual
```sql
CREATE TABLE im_jual (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    -- Dynamic columns created based on uploaded file
    -- Common columns:
    transaction_id VARCHAR(255),
    total_penjualan DECIMAL(15,2),
    -- Additional columns added dynamically
    INDEX idx_transaction_id (transaction_id)
);
```

### Queue Tables

#### jobs
```sql
CREATE TABLE jobs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    queue VARCHAR(255) NOT NULL,
    payload LONGTEXT NOT NULL,
    attempts TINYINT UNSIGNED NOT NULL,
    reserved_at INT UNSIGNED NULL,
    available_at INT UNSIGNED NOT NULL,
    created_at INT UNSIGNED NOT NULL,
    INDEX jobs_queue_index (queue)
);
```

#### failed_jobs
```sql
CREATE TABLE failed_jobs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    connection TEXT NOT NULL,
    queue TEXT NOT NULL,
    payload LONGTEXT NOT NULL,
    exception LONGTEXT NOT NULL,
    failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Deployment Guide

### Requirements

**Server:**
- PHP 8.2 or higher
- Composer 2.x
- Node.js 18+ & NPM
- MySQL 8.0+ or SQLite 3
- Queue Worker (persistent process)

**PHP Extensions:**
- OpenSSL
- PDO
- Mbstring
- Tokenizer
- XML
- Ctype
- JSON
- BCMath
- Zip
- GD (for image processing)

### Installation Steps

#### 1. Clone Repository
```bash
git clone https://github.com/your-org/kfa-validation.git
cd kfa-validation
```

#### 2. Install Dependencies
```bash
# PHP dependencies
composer install --optimize-autoloader --no-dev

# Frontend dependencies
npm install
```

#### 3. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database
# Edit .env file:
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kfa_validation
DB_USERNAME=root
DB_PASSWORD=

# Configure mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@kfa-validation.com
MAIL_FROM_NAME="KFA Validation"

# Queue configuration
QUEUE_CONNECTION=database
```

#### 4. Database Setup
```bash
# Run migrations
php artisan migrate

# Seed default data (roles & permissions)
php artisan db:seed --class=RolePermissionSeeder

# Create super admin user
php artisan tinker
>>> User::create([
    'name' => 'Super Admin',
    'email' => 'admin@example.com',
    'password' => bcrypt('password'),
    'role' => 'super_admin',
    'role_id' => 1,
    'email_verified_at' => now()
]);
```

#### 5. Build Frontend Assets
```bash
# Development
npm run dev

# Production
npm run build
```

#### 6. Storage Permissions
```bash
# Linux/Mac
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Windows (run as Administrator)
icacls storage /grant IIS_IUSRS:(OI)(CI)F /T
icacls bootstrap\cache /grant IIS_IUSRS:(OI)(CI)F /T
```

#### 7. Start Queue Worker
```bash
# Development
php artisan queue:work

# Production (with supervisor)
# See supervisor configuration below
```

#### 8. Cache Configuration
```bash
# Production only
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Production Configuration

#### Supervisor (Linux)
```ini
; /etc/supervisor/conf.d/kfa-queue-worker.conf

[program:kfa-queue-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/kfa-validation/artisan queue:work --sleep=3 --tries=3 --timeout=600 --daemon
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/kfa-validation/storage/logs/worker.log
stopwaitsecs=3600
```

Start supervisor:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start kfa-queue-worker:*
```

#### NSSM (Windows)
```bash
# Install NSSM from https://nssm.cc/download

# Create service
nssm install KFAQueueWorker "C:\PHP\php.exe" "C:\inetpub\wwwroot\kfa-validation\artisan queue:work --sleep=3 --tries=3 --timeout=600"
nssm set KFAQueueWorker AppDirectory "C:\inetpub\wwwroot\kfa-validation"
nssm set KFAQueueWorker AppStdout "C:\inetpub\wwwroot\kfa-validation\storage\logs\worker.log"
nssm set KFAQueueWorker AppStderr "C:\inetpub\wwwroot\kfa-validation\storage\logs\worker-error.log"

# Start service
nssm start KFAQueueWorker
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name kfa-validation.com;
    root /var/www/kfa-validation/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # File upload limit
    client_max_body_size 7200M;
}
```

#### Apache Configuration
```apache
<VirtualHost *:80>
    ServerName kfa-validation.com
    DocumentRoot /var/www/kfa-validation/public

    <Directory /var/www/kfa-validation/public>
        AllowOverride All
        Require all granted
    </Directory>

    # File upload limit
    LimitRequestBody 7547200000
    
    ErrorLog ${APACHE_LOG_DIR}/kfa-validation-error.log
    CustomLog ${APACHE_LOG_DIR}/kfa-validation-access.log combined
</VirtualHost>
```

### Maintenance Mode

**Enable:**
```bash
php artisan down --refresh=15 --secret="1630542a-246b-4b66-afa1-dd72a4c43515"

# Access via:
# https://kfa-validation.com/1630542a-246b-4b66-afa1-dd72a4c43515
```

**Disable:**
```bash
php artisan up
```

### Backup Strategy

**Database Backup:**
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p kfa_validation > /backups/db_$DATE.sql
# Keep only last 7 days
find /backups -name "db_*.sql" -mtime +7 -delete
```

**File Backup:**
```bash
# Weekly file backup
tar -czf /backups/files_$(date +%Y%m%d).tar.gz \
    /var/www/kfa-validation/storage/app/uploads \
    /var/www/kfa-validation/.env
```

---

## Troubleshooting

### Common Issues

#### 1. Queue Jobs Not Processing

**Symptoms:**
- Jobs stuck in `jobs` table
- Validation status remains 'processing'

**Solutions:**
```bash
# Check if worker is running
ps aux | grep queue:work

# Start worker if not running
php artisan queue:work

# Clear failed jobs
php artisan queue:flush

# Restart worker
php artisan queue:restart
```

#### 2. File Upload Fails

**Symptoms:**
- "File too large" error
- Upload times out

**Solutions:**
```ini
# php.ini
upload_max_filesize = 7200M
post_max_size = 7200M
max_execution_time = 300
memory_limit = 512M

# Restart PHP after changes
sudo systemctl restart php8.2-fpm
```

#### 3. Permission Errors

**Symptoms:**
- Cannot write to storage
- 500 errors

**Solutions:**
```bash
# Linux
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap/cache

# Windows (as Administrator)
icacls storage /grant IIS_IUSRS:(OI)(CI)F /T
```

#### 4. Email OTP Not Sending

**Symptoms:**
- OTP not received
- Mail errors in logs

**Solutions:**
```bash
# Test mail configuration
php artisan tinker
>>> Mail::raw('Test', function($msg) {
    $msg->to('test@example.com')->subject('Test');
});

# Check logs
tail -f storage/logs/laravel.log

# Verify .env mail settings
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
# ... etc
```

#### 5. Validation Errors

**Symptoms:**
- All records showing as invalid
- Incorrect scores

**Solutions:**
```bash
# Check configuration
php artisan tinker
>>> config('document_validation.pembelian.reguler');

# Verify IM data exists
>>> DB::table('im_purchases_and_return')->count();

# Check column names match
>>> DB::table('im_purchases_and_return')->limit(1)->get();

# Verify tolerance setting
>>> App\Models\ValidationSetting::get('rounding_tolerance', 1000.01);
```

#### 6. Memory Exhaustion

**Symptoms:**
- PHP Fatal error: Allowed memory size exhausted

**Solutions:**
```ini
# Increase memory limit in php.ini
memory_limit = 1024M

# Or in code (ValidationService)
ini_set('memory_limit', '1024M');

# Use batch processing for large files
# (already implemented in ProcessImDataUpload)
```

#### 7. Login Issues

**Symptoms:**
- Cannot login
- Session expires immediately

**Solutions:**
```bash
# Clear sessions
php artisan session:flush

# Clear cache
php artisan cache:clear
php artisan config:clear

# Check .env session settings
SESSION_DRIVER=file
SESSION_LIFETIME=120
```

### Logging & Debugging

**View Logs:**
```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Worker logs (if using supervisor)
tail -f storage/logs/worker.log

# Web server logs
tail -f /var/log/nginx/error.log
```

**Enable Debug Mode:**
```env
# .env (ONLY in development!)
APP_DEBUG=true
APP_ENV=local
```

**Database Query Logging:**
```php
// Add to AppServiceProvider::boot()
DB::listen(function($query) {
    Log::info($query->sql, $query->bindings);
});
```

### Performance Optimization

**1. Enable Caching:**
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**2. Optimize Autoloader:**
```bash
composer install --optimize-autoloader --no-dev
```

**3. Use Redis for Cache/Sessions:**
```env
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

**4. Database Indexing:**
```sql
-- Add indexes on frequently queried columns
CREATE INDEX idx_validations_user_created 
ON validations(user_id, created_at);

CREATE INDEX idx_validations_status 
ON validations(status);
```

**5. Asset Optimization:**
```bash
# Minify & optimize frontend
npm run build

# Use CDN for assets
# Configure in vite.config.ts
```

### Health Check Script

**Create:** `health_check.php`
```php
<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "System Health Check\n";
echo "===================\n\n";

// Database
try {
    DB::connection()->getPdo();
    echo "✓ Database: Connected\n";
} catch (Exception $e) {
    echo "✗ Database: Failed - " . $e->getMessage() . "\n";
}

// Queue
$pending = DB::table('jobs')->count();
$failed = DB::table('failed_jobs')->count();
echo "✓ Queue: {$pending} pending, {$failed} failed\n";

// Storage
$writable = is_writable(storage_path());
echo ($writable ? "✓" : "✗") . " Storage: " . 
     ($writable ? "Writable" : "Not writable") . "\n";

// Cache
try {
    Cache::put('health_check', true, 60);
    echo Cache::get('health_check') ? "✓" : "✗";
    echo " Cache: Working\n";
} catch (Exception $e) {
    echo "✗ Cache: Failed\n";
}

// IM Data
$pembelian = DB::table('im_purchases_and_return')->count();
$penjualan = DB::table('im_jual')->count();
echo "✓ IM Data: Pembelian={$pembelian}, Penjualan={$penjualan}\n";

echo "\nSystem Status: OK\n";
```

**Run:**
```bash
php health_check.php
```

---

## Appendix

### File Structure

```
kfa-validation/
├── app/
│   ├── Http/
│   │   ├── Controllers/      # Controller classes
│   │   └── Middleware/       # Custom middleware
│   ├── Models/               # Eloquent models
│   ├── Services/             # Business logic services
│   ├── Jobs/                 # Queue jobs
│   └── Providers/            # Service providers
├── config/
│   ├── document_validation.php    # Validation rules
│   └── [other configs]
├── database/
│   ├── migrations/           # Database migrations
│   └── seeders/             # Database seeders
├── resources/
│   ├── js/
│   │   ├── components/      # React components
│   │   ├── pages/           # Inertia pages
│   │   ├── layouts/         # Layout components
│   │   └── types/           # TypeScript types
│   └── css/                 # Stylesheets
├── routes/
│   ├── web.php              # Web routes
│   └── auth.php             # Authentication routes
├── storage/
│   ├── app/
│   │   └── uploads/         # Uploaded files
│   └── logs/                # Application logs
├── public/                  # Public assets
├── tests/                   # Tests
└── vendor/                  # PHP dependencies
```

### Key Files Reference

| File | Purpose |
|------|---------|
| `app/Services/ValidationService.php` | Core validation logic |
| `app/Services/FileProcessingService.php` | File operations |
| `app/Jobs/ProcessFileValidation.php` | Async validation job |
| `app/Jobs/ProcessImDataUpload.php` | IM data upload job |
| `config/document_validation.php` | Validation configuration |
| `resources/js/pages/validation-setting/index.tsx` | Settings page |
| `resources/js/pages/penjualan/upload.tsx` | Upload page |
| `routes/web.php` | Route definitions |

### Environment Variables Reference

```env
# Application
APP_NAME="KFA Validation"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://kfa-validation.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kfa_validation
DB_USERNAME=root
DB_PASSWORD=

# Queue
QUEUE_CONNECTION=database

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@kfa-validation.com
MAIL_FROM_NAME="KFA Validation"

# Cache & Sessions
CACHE_DRIVER=file
SESSION_DRIVER=file
SESSION_LIFETIME=120
```

---

**Document Version:** 2.0
**Last Updated:** 2025-11-13
**Maintained By:** KFA Development Team
**For Support:** Refer to logs and troubleshooting section
