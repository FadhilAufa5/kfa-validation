# Components Organization

This directory contains all React components organized by purpose and reusability.

## Directory Structure

```
components/
├── ui/               # Primitive reusable UI components (from shadcn/ui)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
│
├── features/         # Feature-specific components
│   ├── validation/   # Validation-related components
│   │   ├── InvalidGroupsTable.tsx
│   │   ├── MatchedGroupsTable.tsx
│   │   ├── ValidationCharts.tsx
│   │   └── ValidationHeader.tsx
│   │
│   ├── dashboard/    # Dashboard-specific components
│   │   ├── StatisticsCards.tsx
│   │   ├── DistributionCharts.tsx
│   │   └── ActivityFeed.tsx
│   │
│   └── user-management/  # User management components
│       ├── UserTable.tsx
│       ├── UserDialog.tsx
│       └── RoleDialog.tsx
│
├── shared/           # Shared business components
│   ├── FileUploader.tsx
│   ├── DataTable.tsx
│   └── StatusBadge.tsx
│
└── [Legacy root components] # To be migrated to feature folders
    ├── DocumentComparisonPopup.tsx
    ├── ValidationStatsCards.tsx
    └── ...
```

## Component Categories

### UI Components (`ui/`)
- **Purpose:** Primitive, highly reusable UI elements
- **Characteristics:**
  - Generic, no business logic
  - Styled with Tailwind CSS
  - Follow Radix UI patterns
  - Can be used anywhere in the app
- **Examples:** Button, Dialog, Input, Select, Tabs

### Feature Components (`features/`)
- **Purpose:** Components specific to a feature domain
- **Characteristics:**
  - Contains feature-specific business logic
  - May use hooks for data fetching
  - Organized by feature area
  - Not intended for cross-feature reuse
- **Examples:** ValidationCharts, DashboardStatistics, UserManagementTable

### Shared Components (`shared/`)
- **Purpose:** Business components used across multiple features
- **Characteristics:**
  - Reusable across features
  - Contains domain-specific logic
  - More complex than UI components
  - Less generic than UI components
- **Examples:** FileUploader, DataTable, StatusBadge

## Migration Plan

Gradually move components from root to appropriate folders:

1. **Validation Components** → `features/validation/`
   - InvalidGroupsTabContent.tsx → InvalidGroupsTable.tsx
   - MatchedGroupsTabContent.tsx → MatchedGroupsTable.tsx
   - ValidationScoreDonutChart.tsx → ValidationCharts.tsx
   - ValidationStatsCards.tsx → ValidationStats.tsx

2. **Dashboard Components** → `features/dashboard/`
   - ValidationDataWarningDialog.tsx
   - (dashboard-specific charts)

3. **User Components** → `features/user-management/`
   - AddUserDialog.tsx
   - EditUserDialog.tsx
   - UserTable.tsx
   - RoleDialog.tsx
   - PermissionDialog.tsx

4. **Shared Components** → `shared/`
   - FileUploader.tsx
   - DocumentComparisonPopup.tsx
   - ToleranceDialog.tsx

## Naming Conventions

- **PascalCase** for component files: `ValidationTable.tsx`
- **Descriptive names** indicating purpose: `UserManagementDialog.tsx` not `Dialog2.tsx`
- **Index files** for clean imports: `index.ts` exports all components in a folder

## Import Best Practices

```typescript
// ✅ Good: Import from feature folder
import { ValidationCharts } from '@/components/features/validation';

// ✅ Good: Import UI components
import { Button, Dialog } from '@/components/ui';

// ✅ Good: Import shared components
import { FileUploader } from '@/components/shared';

// ❌ Avoid: Deep imports
import { ValidationCharts } from '@/components/features/validation/ValidationCharts';
```

## Creating New Components

1. **Determine category:**
   - Is it a primitive UI element? → `ui/`
   - Is it specific to one feature? → `features/{feature-name}/`
   - Is it reused across features? → `shared/`

2. **Create the component file**
3. **Add to index.ts** (if applicable)
4. **Update types** in `types/components.ts`

## Component Props Best Practices

- Use TypeScript interfaces for all props
- Define props in `types/components.ts` for reusable components
- Use inline interfaces for feature-specific components
- Always document complex props with JSDoc comments

## Testing

- Unit tests for `ui/` components (test props, rendering)
- Integration tests for `features/` components (test with data)
- E2E tests for complete workflows

## Questions?

Refer to:
- `/resources/js/types/` for type definitions
- `/docs/COMPONENT_PATTERNS.md` for component patterns
- Phase 3 refactoring docs for architecture decisions
