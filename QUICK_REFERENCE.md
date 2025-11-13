# 🚀 Quick Reference Guide

## For Developers New to the Refactored Codebase

---

## 📁 Where is Everything?

### Backend

```
app/
├── Http/Controllers/
│   ├── BaseDocumentController.php     # ⭐ Shared controller logic
│   ├── PembelianController.php        # 37 lines (was 358)
│   └── PenjualanController.php        # 42 lines (was 365)
│
├── Services/                          # Business logic
│   ├── ValidationService.php
│   ├── ValidationConfigService.php    # ⭐ Configuration access
│   └── DashboardStatisticsService.php # ⭐ Optimized queries
│
├── Repositories/                      # ⭐ NEW: Data access layer
│   ├── Contracts/
│   │   ├── ValidationRepositoryInterface.php
│   │   └── MappedFileRepositoryInterface.php
│   ├── ValidationRepository.php
│   └── MappedFileRepository.php
│
└── Exceptions/Validation/             # ⭐ NEW: Custom exceptions
    ├── ValidationException.php
    ├── ValidationDataNotFoundException.php
    └── ...

config/
└── validation_rules.php               # ⭐ NEW: Centralized config

routes/
├── web.php                            # ⭐ Main routes (72 lines)
└── features/                          # ⭐ NEW: Feature routes
    ├── penjualan.php
    ├── pembelian.php
    └── admin.php
```

### Frontend

```
resources/js/
├── types/                             # ⭐ NEW: TypeScript types
│   ├── models.ts                      # Domain models
│   ├── api.ts                         # API responses
│   └── components.ts                  # Component props
│
├── components/
│   ├── ui/                            # Primitive components
│   ├── features/                      # ⭐ NEW: Feature components
│   │   ├── validation/
│   │   ├── dashboard/
│   │   └── user-management/
│   ├── shared/                        # ⭐ NEW: Shared components
│   └── README.md                      # ⭐ Organization guide
│
├── pages/                             # Inertia pages
└── hooks/                             # Custom hooks
```

---

## 🎯 Common Tasks

### Adding a New Route

**1. Determine feature:** Is it penjualan, pembelian, or admin?

**2. Add to feature file:**
```php
// routes/features/penjualan.php
Route::get('/penjualan/new-feature', [PenjualanController::class, 'newFeature'])
    ->name('penjualan.new-feature');
```

**3. No need to touch `web.php`** - it auto-loads feature files!

### Using Repositories

```php
use App\Repositories\Contracts\ValidationRepositoryInterface;

class MyService
{
    public function __construct(
        protected ValidationRepositoryInterface $validationRepo
    ) {}

    public function doSomething()
    {
        $validation = $this->validationRepo->find($id);
        $statistics = $this->validationRepo->getStatistics();
    }
}
```

### Accessing Configuration

```php
use App\Services\ValidationConfigService;

class MyService
{
    public function __construct(
        protected ValidationConfigService $config
    ) {}

    public function validate()
    {
        $tolerance = $this->config->getTolerance();
        $message = $this->config->getErrorMessage('key_not_found');
        $formats = $this->config->getSupportedFormats();
    }
}
```

### Throwing Custom Exceptions

```php
use App\Exceptions\Validation\ValidationDataNotFoundException;

throw new ValidationDataNotFoundException($validationId);
// Automatically returns:
// {
//   "success": false,
//   "error": {
//     "code": "VALIDATION_NOT_FOUND",
//     "message": "Validation data not found",
//     "details": {"validation_id": 123}
//   }
// }
```

### Using TypeScript Types

```typescript
import { Validation, ValidationSummary } from '@/types/models';
import { ApiResponse, PaginatedResponse } from '@/types/api';

interface MyComponentProps {
  validation: Validation;
  summary: ValidationSummary;
}

function MyComponent({ validation, summary }: MyComponentProps) {
  // Full type safety and autocomplete!
}
```

### Creating New Components

**1. Determine category:**
- Primitive UI? → `components/ui/`
- Feature-specific? → `components/features/{feature}/`
- Reusable? → `components/shared/`

**2. Create component:**
```typescript
// components/features/validation/MyComponent.tsx
import { ValidationSummary } from '@/types/api';

interface MyComponentProps {
  data: ValidationSummary;
}

export function MyComponent({ data }: MyComponentProps) {
  return <div>{data.fileName}</div>;
}
```

---

## 🔧 Configuration

### Environment Variables

```env
# .env
VALIDATION_TOLERANCE=1000.01
ENABLE_ASYNC_VALIDATION=true
```

### Changing Validation Rules

Edit `config/validation_rules.php`:

```php
return [
    'default_tolerance' => 1000.01,
    
    'tolerances' => [
        'pembelian' => [
            'reguler' => 500.0,  // Override for this type
        ],
    ],
    
    'error_messages' => [
        'custom_error' => 'Your custom message',
    ],
];
```

Access in code:
```php
$tolerance = $configService->getTolerance('pembelian', 'reguler');
// Returns: 500.0 (override)

$error = $configService->getErrorMessage('custom_error');
// Returns: "Your custom message"
```

---

## 🐛 Debugging

### Check Routes

```bash
php artisan route:list
php artisan route:list --name=penjualan
```

### Check Cache

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### TypeScript Errors

```bash
npm run types
# or
npx tsc --noEmit
```

### View Logs

```bash
tail -f storage/logs/laravel.log
```

---

## 📚 Documentation

**Start Here:**
- `COMPLETE_REFACTORING_SUMMARY.md` - Overview of all changes
- `resources/js/components/README.md` - Component organization

**Phase Details:**
- `PHASE1_PROGRESS.md` - Controller refactoring
- `PHASE2_PROGRESS.md` - Architecture improvements
- `PHASE3_PROGRESS.md` - Code organization

**Deployment:**
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment guide

**Original Audit:**
- `AUDIT.md` - What problems existed before refactoring

---

## 🎓 Architecture Patterns

### Data Flow

```
Request → Controller → Service → Repository → Database
                           ↓
                    ConfigService
                    ExceptionHandler
```

### Component Hierarchy

```
Page (routes/pages/)
  ↓
Feature Component (components/features/)
  ↓
Shared Component (components/shared/)
  ↓
UI Component (components/ui/)
```

### Error Handling

```
Code Error → Custom Exception → Handler → JSON Response
```

---

## ⚡ Performance Tips

### Dashboard

**✅ Uses caching:**
- Statistics: 5 minutes
- Charts: 10 minutes

**Clear cache after data changes:**
```php
$statsService->clearCache($userId, $role);
```

### Queries

**✅ Use repositories:**
```php
// Good
$validations = $this->validationRepo->getPaginated($filters, 10);

// Avoid
$validations = Validation::where(...)->paginate(10);
```

### Types

**✅ Import types:**
```typescript
// Good
import { Validation } from '@/types/models';

// Avoid
const validation: any = ...;
```

---

## 🚨 Common Pitfalls

### ❌ Don't add routes to web.php
**Use feature files instead:**
```php
// ❌ Wrong: routes/web.php
Route::get('/penjualan/new', ...);

// ✅ Right: routes/features/penjualan.php
Route::get('/penjualan/new', ...);
```

### ❌ Don't query database in controllers
**Use services and repositories:**
```php
// ❌ Wrong
public function index() {
    $data = Validation::all();
}

// ✅ Right
public function index() {
    $data = $this->validationRepo->getAll();
}
```

### ❌ Don't use 'any' in TypeScript
**Define proper types:**
```typescript
// ❌ Wrong
const data: any = response.data;

// ✅ Right
import { ValidationSummary } from '@/types/api';
const data: ValidationSummary = response.data;
```

### ❌ Don't hardcode values
**Use configuration:**
```php
// ❌ Wrong
$tolerance = 1000.01;

// ✅ Right
$tolerance = $this->config->getTolerance();
```

---

## 🎯 Quick Commands

### Development
```bash
# Start dev server
composer run dev

# Clear all caches
php artisan optimize:clear

# Check types
npm run types
```

### Testing
```bash
# Run tests
php artisan test

# Lint code
npm run lint
```

### Production
```bash
# Optimize
php artisan optimize

# Cache config
php artisan config:cache

# Cache routes
php artisan route:cache
```

---

## 📞 Need Help?

1. **Check documentation** in docs folder
2. **Read component README** for structure
3. **Review type definitions** for API contracts
4. **Check phase progress docs** for implementation details

---

**Last Updated:** November 13, 2025  
**Version:** Post-Phase 3 Refactoring  
**Status:** ✅ Production Ready
