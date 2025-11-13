# ValidationService.php Pipeline Refactoring Plan

## Current Status: Foundation Created ✅

**Date:** November 13, 2025  
**Priority:** HIGH (Audit Issue #3)  
**Effort:** 1 day  

---

## Problem

`ValidationService.php` is 600+ lines with:
- Multiple responsibilities in one class
- Private methods doing distinct tasks
- Database operations mixed with business logic
- Hard to test individual steps
- Difficult to debug validation failures

---

## Solution: Pipeline Pattern

Break the monolithic service into discrete, testable steps.

### Architecture Created

**Foundation Files:**
- ✅ `app/Services/Validation/ValidationContext.php` - Data container
- ✅ `app/Services/Validation/ValidationStepInterface.php` - Step contract
- ✅ `app/Services/Validation/Steps/` - Directory for step implementations

---

## Implementation Steps

### 1. Create Pipeline Orchestrator

**File:** `app/Services/Validation/ValidationPipeline.php`

```php
<?php

namespace App\Services\Validation;

use Illuminate\Support\Facades\Log;

class ValidationPipeline
{
    protected array $steps = [];

    public function addStep(ValidationStepInterface $step): self
    {
        $this->steps[] = $step;
        return $this;
    }

    public function execute(ValidationContext $context): ValidationContext
    {
        foreach ($this->steps as $step) {
            Log::info('Executing validation step', [
                'step' => $step->getName(),
                'filename' => $context->filename
            ]);

            $context = $step->execute($context);
        }

        $context->executionTime = $context->getExecutionTime();
        return $context;
    }
}
```

### 2. Create Individual Steps

#### Step 1: LoadConfigStep
**File:** `app/Services/Validation/Steps/LoadConfigStep.php`

Loads validation configuration for document type.

```php
public function execute(ValidationContext $context): ValidationContext
{
    $configKey = strtolower($context->documentType) . '.' . 
                 strtolower($context->documentCategory);
    $context->config = Config::get('document_validation.' . $configKey);
    
    if (!$context->config) {
        throw new InvalidDocumentTypeException(...);
    }
    
    return $context;
}
```

#### Step 2: LoadValidationDataStep
**File:** `app/Services/Validation/Steps/LoadValidationDataStep.php`

Loads validation data from source database table.

```php
public function execute(ValidationContext $context): ValidationContext
{
    $validationDoc = $context->config['doc_val'];
    $validationConnector = $context->config['connector'][1];
    $validationSum = $context->config['sum'][1];

    $context->validationRecords = DB::table($validationDoc)
        ->select([$validationConnector, $validationSum])
        ->get()
        ->toArray();
    
    return $context;
}
```

#### Step 3: BuildValidationMapStep
**File:** `app/Services/Validation/Steps/BuildValidationMapStep.php`

Builds aggregated map from validation records.

```php
public function execute(ValidationContext $context): ValidationContext
{
    $validationConnector = $context->config['connector'][1];
    $validationSum = $context->config['sum'][1];
    
    $map = [];
    foreach ($context->validationRecords as $record) {
        $key = trim($record->{$validationConnector});
        if ($key === '') continue;
        
        $value = (float) $record->{$validationSum};
        $map[$key] = ($map[$key] ?? 0) + $value;
    }
    
    $context->validationMap = $map;
    return $context;
}
```

#### Step 4: LoadUploadedDataStep
**File:** `app/Services/Validation/Steps/LoadUploadedDataStep.php`

Loads and counts uploaded data from database.

```php
public function execute(ValidationContext $context): ValidationContext
{
    $context->totalRecords = $this->mappedFileRepo->countByFile(
        $context->filename,
        $context->documentType,
        $context->documentCategory
    );
    
    if ($context->totalRecords === 0) {
        throw new MappingException('No mapped data found');
    }
    
    return $context;
}
```

#### Step 5: BuildUploadedMapStep
**File:** `app/Services/Validation/Steps/BuildUploadedMapStep.php`

Builds aggregated map from uploaded data using DB aggregation.

```php
public function execute(ValidationContext $context): ValidationContext
{
    $context->uploadedMapByGroup = $this->mappedFileRepo->getAggregatedByConnector(
        $context->filename,
        $context->documentType,
        $context->documentCategory
    );
    
    return $context;
}
```

#### Step 6: CompareDataStep
**File:** `app/Services/Validation/Steps/CompareDataStep.php`

Compares uploaded and validation maps, identifies discrepancies.

```php
public function execute(ValidationContext $context): ValidationContext
{
    $tolerance = $this->configService->getTolerance(
        $context->documentType,
        $context->documentCategory
    );
    
    [$invalidGroups, $matchedGroups] = $this->compareData(
        $context->uploadedMapByGroup,
        $context->validationMap,
        $tolerance
    );
    
    $context->invalidGroups = $invalidGroups;
    $context->matchedGroups = $matchedGroups;
    
    return $context;
}
```

#### Step 7: CategorizeRowsStep
**File:** `app/Services/Validation/Steps/CategorizeRowsStep.php`

Categorizes individual rows based on group validation results.

```php
public function execute(ValidationContext $context): ValidationContext
{
    [$invalidRows, $matchedRows, $mismatchedCount] = 
        $this->categorizeRows(
            $context->filename,
            $context->documentType,
            $context->documentCategory,
            $context->invalidGroups,
            $context->validationMap,
            $context->uploadedMapByGroup
        );
    
    $context->invalidRows = $invalidRows;
    $context->matchedRows = $matchedRows;
    $context->mismatchedRecordCount = $mismatchedCount;
    
    return $context;
}
```

#### Step 8: SaveResultsStep
**File:** `app/Services/Validation/Steps/SaveResultsStep.php`

Saves validation results to database.

```php
public function execute(ValidationContext $context): ValidationContext
{
    $matchedRecords = $context->totalRecords - $context->mismatchedRecordCount;
    $score = $context->totalRecords > 0 
        ? round(($matchedRecords / $context->totalRecords) * 100, 2) 
        : 100.00;

    $context->validationRecord = $this->validationRepo->create([
        'file_name' => $context->filename,
        'document_type' => $context->documentType,
        'document_category' => $context->documentCategory,
        'score' => $score,
        'total_records' => $context->totalRecords,
        'matched_records' => $matchedRecords,
        'mismatched_records' => $context->mismatchedRecordCount,
        'status' => 'completed',
        // ... other fields
    ]);
    
    return $context;
}
```

### 3. Refactor ValidationService

**File:** `app/Services/ValidationService.php`

Simplified service that uses the pipeline:

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
        // Inject all step classes
    ) {
        $this->setupPipeline();
    }

    protected function setupPipeline(): void
    {
        $this->pipeline
            ->addStep(new LoadConfigStep())
            ->addStep(new LoadValidationDataStep())
            ->addStep(new BuildValidationMapStep())
            ->addStep(new LoadUploadedDataStep())
            ->addStep(new BuildUploadedMapStep())
            ->addStep(new CompareDataStep())
            ->addStep(new CategorizeRowsStep())
            ->addStep(new SaveResultsStep())
            ->addStep(new LogResultsStep());
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
}
```

---

## Benefits

### Before
- 600+ lines in one file
- Hard to test
- Hard to debug
- Hard to extend

### After
- 8 focused steps (~50-100 lines each)
- Each step testable in isolation
- Easy to debug specific step
- Easy to add/remove/reorder steps
- Follows Single Responsibility Principle
- Follows Open/Closed Principle

---

## Testing Strategy

```php
// Test individual step
public function test_compare_data_step()
{
    $context = new ValidationContext(...);
    $context->uploadedMapByGroup = ['key1' => 100];
    $context->validationMap = ['key1' => 100];
    
    $step = new CompareDataStep($configService);
    $result = $step->execute($context);
    
    $this->assertEmpty($result->invalidGroups);
    $this->assertNotEmpty($result->matchedGroups);
}

// Test full pipeline
public function test_validation_pipeline()
{
    $context = new ValidationContext(...);
    $result = $this->pipeline->execute($context);
    
    $this->assertEquals('valid', $result->getStatus());
}
```

---

## Migration Strategy

### Phase 1: Create Infrastructure (✅ Done)
- ValidationContext
- ValidationStepInterface
- Pipeline orchestrator

### Phase 2: Extract Steps (To Do)
- Create 8 step classes
- Move logic from ValidationService
- Add dependency injection

### Phase 3: Refactor Service (To Do)
- Simplify ValidationService
- Use pipeline
- Remove old methods

### Phase 4: Testing (To Do)
- Unit tests for each step
- Integration tests for pipeline
- Verify all scenarios work

---

## Estimated Timeline

- **Step Creation:** 4-5 hours
- **Service Refactoring:** 2 hours
- **Testing:** 2-3 hours
- **Total:** 1 day

---

## Dependencies

Each step may need:
- `ValidationConfigService` - For configuration
- `ValidationRepositoryInterface` - For data access
- `MappedFileRepositoryInterface` - For uploaded data
- Logger - For debugging

---

## Rollback Plan

If issues arise:
1. Keep old ValidationService.php as ValidationServiceLegacy.php
2. Switch back by changing service binding
3. No database changes needed

---

## Status

- [x] Directory structure created
- [x] ValidationContext created
- [x] ValidationStepInterface created
- [ ] ValidationPipeline created
- [ ] Individual steps created (8 steps)
- [ ] ValidationService refactored
- [ ] Tests added
- [ ] Documentation updated

---

## Next Steps

1. Create `ValidationPipeline.php`
2. Create all 8 step classes in `app/Services/Validation/Steps/`
3. Refactor `ValidationService.php` to use pipeline
4. Add unit tests for each step
5. Verify all validation scenarios work
6. Update documentation

---

**Ready to Implement:** Foundation is complete. Next developer can follow this plan to complete the refactoring.
