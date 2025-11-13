# KFA Validation - Quick Reference Guide

**Last Updated:** November 13, 2025  
**Status:** Pipeline Pattern Complete - Ready for Integration  

---

## 🚀 What Was Accomplished

### ✅ ValidationService Pipeline Pattern (100% COMPLETE!)

The monolithic 600-line `ValidationService.php` has been refactored into a clean Pipeline pattern with 8 discrete steps.

---

## 📁 New File Structure

```
app/Services/Validation/
├── ValidationContext.php          # Data container (65 lines)
├── ValidationStepInterface.php    # Step contract (20 lines)
├── ValidationPipeline.php         # Orchestrator (95 lines)
└── Steps/
    ├── LoadConfigStep.php         # Load configuration (80 lines)
    ├── LoadValidationDataStep.php # Load source data (90 lines)
    ├── BuildValidationMapStep.php # Build validation map (70 lines)
    ├── LoadUploadedDataStep.php   # Count uploaded records (60 lines)
    ├── BuildUploadedMapStep.php   # Build uploaded map (50 lines)
    ├── CompareDataStep.php        # Compare & find discrepancies (120 lines)
    ├── CategorizeRowsStep.php     # Categorize rows (140 lines)
    └── SaveResultsStep.php        # Save results (180 lines)
```

**Total:** 11 files, ~900 lines of well-organized code

---

## 🎯 How to Use the Pipeline

### Basic Usage

```php
use App\Services\Validation\ValidationPipeline;
use App\Services\Validation\ValidationContext;
use App\Services\Validation\Steps\*;

// 1. Create context with input data
$context = new ValidationContext(
    filename: 'sales_data.xlsx',
    documentType: 'penjualan',
    documentCategory: 'reguler',
    headerRow: 1,
    userId: auth()->id(),
    existingValidationId: null
);

// 2. Setup pipeline with steps
$pipeline = new ValidationPipeline();
$pipeline
    ->addStep(new LoadConfigStep())
    ->addStep(new LoadValidationDataStep($configService))
    ->addStep(new BuildValidationMapStep())
    ->addStep(new LoadUploadedDataStep($mappedFileRepo, $configService))
    ->addStep(new BuildUploadedMapStep($mappedFileRepo))
    ->addStep(new CompareDataStep($configService))
    ->addStep(new CategorizeRowsStep($mappedFileRepo, $configService))
    ->addStep(new SaveResultsStep($validationRepo));

// 3. Execute pipeline
$result = $pipeline->execute($context);

// 4. Get results
return [
    'status' => $result->getStatus(),
    'validation_id' => $result->validationRecord->id,
    'invalid_groups' => $result->invalidGroups,
    'invalid_rows' => $result->invalidRows,
];
```

### Integration with Existing Service

To integrate with existing `ValidationService.php`:

```php
<?php

namespace App\Services;

use App\Services\Validation\ValidationPipeline;
use App\Services\Validation\ValidationContext;
use App\Services\Validation\Steps\*;

class ValidationService
{
    public function __construct(
        protected ValidationPipeline $pipeline,
        protected LoadConfigStep $loadConfigStep,
        protected LoadValidationDataStep $loadValidationDataStep,
        protected BuildValidationMapStep $buildValidationMapStep,
        protected LoadUploadedDataStep $loadUploadedDataStep,
        protected BuildUploadedMapStep $buildUploadedMapStep,
        protected CompareDataStep $compareDataStep,
        protected CategorizeRowsStep $categorizeRowsStep,
        protected SaveResultsStep $saveResultsStep,
    ) {
        $this->setupPipeline();
    }

    protected function setupPipeline(): void
    {
        $this->pipeline
            ->addStep($this->loadConfigStep)
            ->addStep($this->loadValidationDataStep)
            ->addStep($this->buildValidationMapStep)
            ->addStep($this->loadUploadedDataStep)
            ->addStep($this->buildUploadedMapStep)
            ->addStep($this->compareDataStep)
            ->addStep($this->categorizeRowsStep)
            ->addStep($this->saveResultsStep);
    }

    public function validateDocument(
        string $filename,
        string $documentType,
        string $documentCategory,
        int $headerRow = 1,
        ?int $userId = null,
        ?int $existingValidationId = null
    ): array {
        $context = new ValidationContext(
            filename: $filename,
            documentType: $documentType,
            documentCategory: $documentCategory,
            headerRow: $headerRow,
            userId: $userId,
            existingValidationId: $existingValidationId
        );

        $context = $this->pipeline->execute($context);

        return $context->toArray();
    }

    // Keep other public methods unchanged for backward compatibility
}
```

---

## 🧪 Testing Examples

### Test Individual Step

```php
use Tests\TestCase;
use App\Services\Validation\ValidationContext;
use App\Services\Validation\Steps\LoadConfigStep;

class LoadConfigStepTest extends TestCase
{
    public function test_it_loads_valid_configuration()
    {
        // Arrange
        $context = new ValidationContext(
            'file.xlsx',
            'pembelian',
            'reguler',
            1
        );
        $step = new LoadConfigStep();

        // Act
        $result = $step->execute($context);

        // Assert
        $this->assertNotEmpty($result->config);
        $this->assertArrayHasKey('doc_val', $result->config);
        $this->assertArrayHasKey('connector', $result->config);
    }

    public function test_it_throws_exception_for_invalid_document_type()
    {
        $this->expectException(InvalidDocumentTypeException::class);

        $context = new ValidationContext('file.xlsx', 'invalid', 'invalid', 1);
        $step = new LoadConfigStep();
        $step->execute($context);
    }
}
```

### Test Full Pipeline

```php
use Tests\TestCase;
use App\Services\Validation\ValidationPipeline;
use App\Services\Validation\ValidationContext;

class ValidationPipelineTest extends TestCase
{
    public function test_full_validation_pipeline()
    {
        // Setup test data
        $this->seedTestData();

        // Create context
        $context = new ValidationContext(
            'test_file.xlsx',
            'penjualan',
            'reguler',
            1,
            1
        );

        // Execute pipeline
        $pipeline = $this->app->make(ValidationPipeline::class);
        $result = $pipeline->execute($context);

        // Assert
        $this->assertNotNull($result->validationRecord);
        $this->assertEquals('valid', $result->getStatus());
        $this->assertGreaterThan(0, $result->totalRecords);
    }
}
```

---

## 🔧 Service Provider Setup

Add to `AppServiceProvider` or create `ValidationServiceProvider`:

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Validation\ValidationPipeline;
use App\Services\Validation\Steps\*;

class ValidationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Singleton for pipeline
        $this->app->singleton(ValidationPipeline::class);

        // Bind all steps (automatically resolved with dependencies)
        $this->app->bind(LoadConfigStep::class);
        $this->app->bind(LoadValidationDataStep::class);
        $this->app->bind(BuildValidationMapStep::class);
        $this->app->bind(LoadUploadedDataStep::class);
        $this->app->bind(BuildUploadedMapStep::class);
        $this->app->bind(CompareDataStep::class);
        $this->app->bind(CategorizeRowsStep::class);
        $this->app->bind(SaveResultsStep::class);
    }
}
```

Then register in `bootstrap/providers.php`:

```php
return [
    App\Providers\AppServiceProvider::class,
    App\Providers\RepositoryServiceProvider::class,
    App\Providers\ValidationServiceProvider::class, // ADD THIS
];
```

---

## 📊 Pipeline Data Flow

```
ValidationContext (Input)
    ↓
LoadConfigStep
    → Loads config from config/document_validation.php
    → Validates configuration exists
    → Sets context->config
    ↓
LoadValidationDataStep
    → Queries source validation table
    → Loads validation records
    → Sets context->validationRecords
    ↓
BuildValidationMapStep
    → Aggregates records by connector
    → Builds validation map
    → Sets context->validationMap
    ↓
LoadUploadedDataStep
    → Counts uploaded records via repository
    → Validates data exists
    → Sets context->totalRecords
    ↓
BuildUploadedMapStep
    → Aggregates uploaded data by connector
    → Builds uploaded map
    → Sets context->uploadedMapByGroup
    ↓
CompareDataStep
    → Compares uploaded vs validation maps
    → Applies tolerance threshold
    → Sets context->invalidGroups & matchedGroups
    ↓
CategorizeRowsStep
    → Queries individual rows by connector keys
    → Categorizes as invalid or matched
    → Sets context->invalidRows, matchedRows, mismatchedRecordCount
    ↓
SaveResultsStep
    → Calculates score
    → Saves to database with batching
    → Logs activity
    → Sets context->validationRecord
    ↓
ValidationContext (Output)
    → Contains all results
    → Ready for response
```

---

## 🎯 Key Benefits

### Before (Monolithic Service)
```php
// ValidationService.php (600 lines)
❌ Single huge file
❌ Multiple responsibilities
❌ Hard to test
❌ Hard to debug
❌ Hard to extend
```

### After (Pipeline Pattern)
```php
// 11 focused files (~900 lines total)
✅ Single responsibility per step
✅ Each step independently testable
✅ Easy debugging with step-level logging
✅ Easy to add/remove/reorder steps
✅ Clear data flow through context
```

---

## 📝 Quick Checklist for Integration

- [ ] Backup original `ValidationService.php` as `ValidationServiceLegacy.php`
- [ ] Create `ValidationServiceProvider.php`
- [ ] Register provider in `bootstrap/providers.php`
- [ ] Refactor `ValidationService.php` to use pipeline
- [ ] Write unit tests for each step
- [ ] Write integration test for full pipeline
- [ ] Test with real data
- [ ] Compare results: pipeline vs legacy
- [ ] Deploy to staging
- [ ] Monitor logs and performance
- [ ] Gradual production rollout
- [ ] Remove legacy code after verification

---

## 🐛 Debugging Tips

### View Pipeline Execution

Check logs for step-by-step execution:

```
[INFO] Starting validation pipeline
[DEBUG] Executing validation step: LoadConfigStep (step 1/8)
[DEBUG] Validation step completed: LoadConfigStep (0.05s)
[DEBUG] Executing validation step: LoadValidationDataStep (step 2/8)
[INFO] Validation data loaded from database (1500 records)
[DEBUG] Validation step completed: LoadValidationDataStep (0.12s)
...
```

### Test Individual Step

```php
// Isolate and test specific step
$context = new ValidationContext(...);
$context->config = [...]; // Set required data
$context->validationRecords = [...];

$step = new BuildValidationMapStep();
$result = $step->execute($context);

dd($result->validationMap); // Inspect output
```

### Add Custom Logging

```php
// In any step
Log::debug('Custom debug info', [
    'step' => $this->getName(),
    'data' => $someVariable
]);
```

---

## 📚 Documentation References

- **Full Implementation:** `COMPLETE_REFACTORING_SUMMARY.md`
- **Implementation Guide:** `VALIDATION_SERVICE_REFACTORING_PLAN.md`
- **Status Report:** `VALIDATION_PIPELINE_STATUS.md`
- **Current Progress:** `VALIDATION_PIPELINE_IMPLEMENTATION.md`

---

## ✅ Status

**Pipeline Implementation:** ✅ 100% Complete  
**Syntax Validation:** ✅ All files validated with `php -l`  
**Integration:** ⏳ Ready to integrate  
**Testing:** ⏳ Pending  

---

## 🎉 Summary

The ValidationService pipeline pattern is **fully implemented and ready for integration**. All 8 steps are created, validated, and documented. The architecture is solid, testable, and maintainable. Integration should be straightforward following the examples above.

**Next Step:** Integrate with existing `ValidationService.php` and test thoroughly! 🚀

---

*Generated: November 13, 2025*  
*Version: 1.0*
