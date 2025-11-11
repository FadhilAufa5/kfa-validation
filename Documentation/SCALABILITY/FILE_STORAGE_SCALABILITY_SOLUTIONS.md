# File Storage Scalability Solutions

## Problem Statement

**Current Issue**: The system stores uploaded files in local storage (`storage/app/uploads/`), which will cause scalability problems:

### Issues with Current Architecture

1. **Memory Burden**: 
   - Files accumulate on server disk
   - Multiple concurrent uploads consume disk space rapidly
   - Server can run out of disk space

2. **Performance Degradation**:
   - Large files slow down I/O operations
   - File system operations become bottleneck
   - Backup operations take longer

3. **Single Point of Failure**:
   - All files on one server
   - If server fails, files are lost
   - Difficult to scale horizontally

4. **Concurrent Access Issues**:
   - Multiple users accessing same files causes contention
   - Limited by single server I/O capacity

---

## Solution Overview

The system now has a **partial solution** (files deleted after mapping), but we need **comprehensive scalability** for high-traffic scenarios.

### Current State (After Our Refactoring)

✅ Files are deleted after mapping to `mapped_uploaded_files` table  
✅ Data persists in database, not in filesystem  
⚠️ Still stores files temporarily during upload → mapping process  

### Recommended Solutions

We have **4 solution tiers** based on scale and budget:

| Solution | Scale | Cost | Complexity | Implementation Time |
|----------|-------|------|------------|---------------------|
| **Tier 1**: Current + Cleanup | <100 users | Free | Low | ✅ Done |
| **Tier 2**: Queue Processing | 100-500 users | Low | Medium | 2-3 days |
| **Tier 3**: Cloud Storage (S3/MinIO) | 500-5000 users | Medium | Medium | 3-5 days |
| **Tier 4**: Microservices + CDN | 5000+ users | High | High | 2-3 weeks |

---

## Tier 1: Current Solution (✅ Implemented)

### What We Have Now

```
User uploads file (Excel/CSV)
    ↓
Saved to storage/app/uploads/
    ↓
Mapped to database (mapped_uploaded_files)
    ↓
File DELETED from storage ← Prevents accumulation
    ↓
Data persists in database only
```

### Benefits
✅ Files don't accumulate  
✅ Disk space freed immediately  
✅ Data preserved in database  

### Limitations
⚠️ Still uses local disk temporarily  
⚠️ Multiple concurrent uploads can overwhelm I/O  
⚠️ Not horizontally scalable  

### Capacity
- **Users**: < 100 concurrent users
- **Files**: Unlimited (deleted after processing)
- **Storage**: Minimal (temporary only)

---

## Tier 2: Queue-Based Asynchronous Processing

### Architecture

```
User uploads file
    ↓
File saved to temporary storage
    ↓
Job queued (Redis/Database)
    ↓
Background worker processes job:
    - Map file to database
    - Delete file
    ↓
User notified when complete
```

### Implementation

#### 1. Create Job Class

```php
// app/Jobs/ProcessUploadedFile.php
<?php

namespace App\Jobs;

use App\Services\MappedFileService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessUploadedFile implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 3;

    public function __construct(
        private string $filename,
        private string $documentType,
        private string $documentCategory,
        private int $headerRow,
        private ?int $userId = null
    ) {}

    public function handle(MappedFileService $mappedFileService)
    {
        Log::info('Processing uploaded file job started', [
            'filename' => $this->filename,
            'user_id' => $this->userId
        ]);

        try {
            $result = $mappedFileService->mapUploadedFile(
                $this->filename,
                $this->documentType,
                $this->documentCategory,
                $this->headerRow,
                $this->userId
            );

            Log::info('File processing completed', $result);

            // Notify user (optional)
            // event(new FileProcessed($this->userId, $this->filename, $result));
            
        } catch (\Exception $e) {
            Log::error('File processing failed', [
                'filename' => $this->filename,
                'error' => $e->getMessage()
            ]);
            throw $e; // Will retry based on $tries
        }
    }

    public function failed(\Exception $exception)
    {
        Log::error('File processing job failed permanently', [
            'filename' => $this->filename,
            'error' => $exception->getMessage()
        ]);

        // Notify user of failure
        // event(new FileProcessingFailed($this->userId, $this->filename));
    }
}
```

#### 2. Update Controller to Dispatch Job

```php
// In PembelianController.php
public function validateFile(Request $request, $type)
{
    $request->validate([
        'filename' => 'required|string',
        'headerRow' => 'required|integer|min:1',
    ]);

    try {
        // Dispatch job to queue
        ProcessUploadedFile::dispatch(
            $request->input('filename'),
            'pembelian',
            $type,
            (int) $request->input('headerRow', 1),
            auth()->user()?->id
        );

        return response()->json([
            'message' => 'File processing queued',
            'status' => 'processing'
        ]);
        
    } catch (\Exception $e) {
        Log::error('Failed to queue file processing', [
            'error' => $e->getMessage()
        ]);
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
```

#### 3. Configure Queue Driver

```env
# .env
QUEUE_CONNECTION=redis  # or database, sqs
```

#### 4. Run Queue Workers

```bash
# Development
php artisan queue:work

# Production (with supervisor)
php artisan queue:work --tries=3 --timeout=300
```

### Benefits
✅ Non-blocking uploads  
✅ Better user experience  
✅ Handles concurrent uploads  
✅ Automatic retries on failure  
✅ Progress tracking  

### Capacity
- **Users**: 100-500 concurrent users
- **Processing**: Multiple workers in parallel
- **Scalability**: Add more workers as needed

---

## Tier 3: Cloud Storage (S3/MinIO)

### Architecture

```
User uploads file
    ↓
File uploaded directly to S3/MinIO (not local disk)
    ↓
Pre-signed URL generated
    ↓
Background job:
    - Download from S3
    - Map to database
    - Delete from S3
    ↓
Data in database only
```

### Implementation

#### 1. Install Laravel S3 Support

```bash
composer require league/flysystem-aws-s3-v3 "^3.0"
```

#### 2. Configure S3/MinIO

```env
# .env
FILESYSTEM_DISK=s3

AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=kfa-validation-uploads
AWS_USE_PATH_STYLE_ENDPOINT=false

# For MinIO (self-hosted S3 alternative)
AWS_ENDPOINT=http://your-minio-server:9000
AWS_USE_PATH_STYLE_ENDPOINT=true
```

#### 3. Update FileProcessingService

```php
public function saveAndConvertFile($file, string $type): string
{
    $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
    $extension = strtolower($file->getClientOriginalExtension());

    // Upload to S3 instead of local storage
    $uploadDir = "uploads";
    $filename = "{$originalName}.csv";
    
    if (in_array($extension, ['xls', 'xlsx'])) {
        // Convert to CSV in memory
        $tempCsv = $this->convertExcelToCsvInMemory($file->getRealPath());
        
        // Upload CSV to S3
        Storage::disk('s3')->put("{$uploadDir}/{$filename}", $tempCsv);
    } else {
        // Upload CSV directly to S3
        Storage::disk('s3')->putFileAs($uploadDir, $file, $filename);
    }

    Log::info('File uploaded to S3', [
        'filename' => $filename,
        'bucket' => env('AWS_BUCKET')
    ]);

    return $filename;
}

private function convertExcelToCsvInMemory(string $sourcePath): string
{
    $reader = IOFactory::createReaderForFile($sourcePath);
    $spreadsheet = $reader->load($sourcePath);
    
    $writer = new Csv($spreadsheet);
    $writer->setDelimiter(',');
    
    // Write to memory instead of disk
    ob_start();
    $writer->save('php://output');
    $csvContent = ob_get_clean();
    
    return $csvContent;
}
```

#### 4. Update MappedFileService to Work with S3

```php
public function mapUploadedFile(...)
{
    // Download from S3 to temporary location
    $tempPath = tempnam(sys_get_temp_dir(), 'kfa_');
    $content = Storage::disk('s3')->get("uploads/{$filename}");
    file_put_contents($tempPath, $content);
    
    // Process file
    $processedData = $this->fileProcessingService->processFileWithHeader($tempPath, $headerRow);
    
    // ... mapping logic ...
    
    // Delete from S3 after mapping
    Storage::disk('s3')->delete("uploads/{$filename}");
    
    // Delete temp file
    unlink($tempPath);
    
    return $result;
}
```

### Benefits
✅ No local disk usage  
✅ Unlimited storage capacity  
✅ Highly available and durable  
✅ Geographically distributed  
✅ Automatic backups  
✅ Pay for what you use  

### Capacity
- **Users**: 500-5000 concurrent users
- **Files**: Unlimited
- **Storage**: Scalable to petabytes

### Costs
- **AWS S3**: ~$0.023/GB/month + transfer costs
- **MinIO (Self-hosted)**: Free software + server costs

---

## Tier 4: Microservices Architecture

### Architecture

```
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│ App  │  │  App  │  ← Multiple application servers
│Server│  │Server │
└───┬──┘  └──┬────┘
    │        │
    └────┬───┘
         │
┌────────▼─────────┐
│  File Processing │  ← Dedicated service
│   Microservice   │
└────────┬─────────┘
         │
┌────────▼─────────┐
│   S3/MinIO       │  ← Centralized storage
│   + Redis        │
│   + Database     │
└──────────────────┘
```

### Components

#### 1. **File Processing Microservice**
- Dedicated service for file uploads and processing
- Horizontal scaling
- Independent deployment

#### 2. **Message Queue (RabbitMQ/Kafka)**
- Reliable message delivery
- Event streaming
- Distributed processing

#### 3. **CDN (CloudFlare/CloudFront)**
- Cache frequently accessed data
- Reduce server load
- Global distribution

#### 4. **Caching Layer (Redis)**
- Cache validation configs
- Session management
- Rate limiting

### Benefits
✅ Highly scalable  
✅ Fault tolerant  
✅ Independent scaling  
✅ Technology flexibility  
✅ Global distribution  

### Capacity
- **Users**: 5000+ concurrent users
- **Throughput**: Unlimited with proper scaling
- **Availability**: 99.99% uptime

---

## Recommendation by Scale

### Small Scale (Current)
**Users**: < 100  
**Solution**: **Tier 1** (Current implementation)  
**Action**: ✅ Already implemented - no changes needed

### Medium Scale
**Users**: 100-500  
**Solution**: **Tier 2** (Queue Processing)  
**Timeline**: 2-3 days  
**Cost**: Minimal (Redis hosting ~$10-20/month)

**Implementation Priority**:
1. Set up Redis
2. Create ProcessUploadedFile job
3. Update controllers to dispatch jobs
4. Configure queue workers
5. Add progress notifications

### Large Scale
**Users**: 500-5000  
**Solution**: **Tier 3** (Cloud Storage)  
**Timeline**: 3-5 days  
**Cost**: $50-200/month depending on usage

**Implementation Priority**:
1. Set up S3 or MinIO
2. Update FileProcessingService for S3
3. Implement queue processing (Tier 2)
4. Add monitoring and alerts
5. Implement rate limiting

### Enterprise Scale
**Users**: 5000+  
**Solution**: **Tier 4** (Microservices)  
**Timeline**: 2-3 weeks  
**Cost**: $500+/month

**Implementation Priority**:
1. Design microservices architecture
2. Set up load balancers
3. Implement file processing service
4. Set up CDN
5. Implement monitoring and auto-scaling

---

## Immediate Next Steps

### Option A: Stay with Current (Recommended for Now)
If you have < 100 concurrent users:
- ✅ Current implementation is sufficient
- ✅ Files are already deleted after mapping
- ✅ No immediate changes needed

**Monitor**:
- Disk usage
- Upload response times
- Concurrent user count

### Option B: Implement Queue Processing (Next Step)
If you're approaching 100 users or want better UX:
- Implement Tier 2 (2-3 days)
- Better user experience
- Handles peak loads

### Option C: Plan for Cloud Storage
If you're planning for 500+ users:
- Start planning Tier 3 migration
- Evaluate S3 vs MinIO
- Budget for cloud costs

---

## Migration Path

### Phase 1: Current → Queued (Recommended Next)
```bash
# 1. Install Redis
sudo apt install redis-server

# 2. Update .env
QUEUE_CONNECTION=redis

# 3. Create job
php artisan make:job ProcessUploadedFile

# 4. Run workers
php artisan queue:work
```

### Phase 2: Queued → Cloud Storage
```bash
# 1. Set up S3/MinIO
# 2. Install dependencies
composer require league/flysystem-aws-s3-v3

# 3. Update .env with S3 credentials
# 4. Update services to use S3
# 5. Test thoroughly
```

### Phase 3: Cloud → Microservices
- Requires architectural redesign
- Consult with DevOps team
- Gradual migration recommended

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Disk Usage**:
   ```bash
   # Check storage usage
   df -h | grep storage
   ```

2. **Queue Length**:
   ```bash
   # Check pending jobs
   php artisan queue:work --once
   ```

3. **Processing Time**:
   - Log processing duration
   - Alert if > 2 minutes

4. **Error Rate**:
   - Monitor failed jobs
   - Alert if failure rate > 5%

### Set Up Alerts

```php
// In AppServiceProvider
if (disk_free_space(storage_path()) < 1024 * 1024 * 1024) {
    Log::critical('Low disk space', [
        'free_space' => disk_free_space(storage_path())
    ]);
    // Send alert email/Slack notification
}
```

---

## Cost Comparison

| Solution | Monthly Cost | Users Supported | Disk Usage |
|----------|-------------|-----------------|------------|
| **Current** | $0 | < 100 | Minimal |
| **+ Queues** | $10-20 | 100-500 | Minimal |
| **+ S3** | $50-100 | 500-2000 | 0 (cloud) |
| **+ MinIO** | $50-150 | 500-2000 | 0 (cloud) |
| **Microservices** | $500+ | 5000+ | 0 (cloud) |

---

## Summary

### Current Status ✅
Your system **already has a good foundation**:
- Files are deleted after processing
- Data persists in database
- Minimal disk usage

### For 100-500 Users
**Implement Tier 2** (Queue Processing):
- 2-3 days implementation
- Minimal cost
- Significant scalability improvement

### For 500+ Users
**Implement Tier 3** (Cloud Storage):
- 3-5 days implementation
- Moderate cost
- Enterprise-grade scalability

### My Recommendation
**Start with monitoring**:
1. Monitor current disk usage
2. Track concurrent users
3. When you hit 50-100 users → Implement Tier 2
4. When you hit 300-500 users → Plan Tier 3

**Don't over-engineer early** - your current solution is good for initial scale!

---

**Last Updated**: 2025-11-03  
**Author**: KFA Development Team  
**Status**: ✅ Analysis Complete

