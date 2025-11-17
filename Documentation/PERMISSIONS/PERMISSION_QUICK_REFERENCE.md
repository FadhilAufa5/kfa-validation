# Permission System - Quick Reference

## Available Permissions

```
upload.pembelian          # Upload pembelian files
upload.penjualan          # Upload penjualan files
validation.run            # Execute validation
validation.view           # View validation results
history.pembelian         # View pembelian history
history.penjualan         # View penjualan history
details.view              # View detailed results
users.manage              # Manage users (Super Admin only)
roles.manage              # Manage roles & permissions (Super Admin only)
logs.view                 # View activity logs (Super Admin only)
settings.validation       # Validation settings (Super Admin only)
```

## Backend Usage

### Protect Routes
```php
// Single permission
Route::middleware(['permission:upload.pembelian'])->group(function () {
    Route::get('/pembelian', [Controller::class, 'index']);
});

// Multiple permissions (any of them)
Route::middleware(['permission.any:role1,role2'])->group(function () {
    Route::get('/page', [Controller::class, 'show']);
});
```

### Check in Controller
```php
// Single permission
if (!$request->user()->hasPermission('upload.pembelian')) {
    abort(403, 'Unauthorized');
}

// Any permission
if (!$request->user()->hasAnyPermission(['perm1', 'perm2'])) {
    abort(403);
}

// All permissions
if (!$request->user()->hasAllPermissions(['perm1', 'perm2'])) {
    abort(403);
}
```

## Frontend Usage

### Import
```tsx
import { hasPermission, hasAnyPermission, Can } from '@/lib/permissions';
```

### Function Checks
```tsx
// Single permission
if (hasPermission('upload.pembelian')) {
    // Show feature
}

// Any permission
if (hasAnyPermission(['upload.pembelian', 'upload.penjualan'])) {
    // Show feature
}

// Get all permissions
const permissions = usePermissions();

// Get user role
const role = useRole();
```

### Component Checks
```tsx
// Single permission
<Can permission="upload.pembelian">
    <UploadButton />
</Can>

// Multiple permissions (any)
<Can permissions={["upload.pembelian", "upload.penjualan"]}>
    <UploadSection />
</Can>

// Multiple permissions (all required)
<Can permissions={["validation.run", "validation.view"]} requireAll>
    <ValidationPanel />
</Can>

// Role check
<Can role="super_admin">
    <AdminPanel />
</Can>

// With fallback
<Can permission="upload.pembelian" fallback={<AccessDenied />}>
    <UploadForm />
</Can>
```

## Default Roles

### Super Admin
```
✅ All permissions (11 total)
```

### User
```
✅ upload.pembelian
✅ upload.penjualan
✅ validation.run
✅ validation.view
✅ history.pembelian
✅ history.penjualan
✅ details.view
```

### Visitor
```
✅ validation.view
✅ history.pembelian
✅ history.penjualan
✅ details.view
```

## Common Patterns

### Upload Page
```tsx
export function PembelianUploadPage() {
    return (
        <Can permission="upload.pembelian">
            <UploadForm />
        </Can>
    );
}
```

### Conditional Button
```tsx
<Can permission="validation.run">
    <Button onClick={runValidation}>Run Validation</Button>
</Can>
```

### Admin Section
```tsx
<Can permission="users.manage">
    <AdminMenu />
</Can>
```

### Multiple Checks
```tsx
function ValidationPage() {
    const canRun = hasPermission('validation.run');
    const canView = hasPermission('validation.view');
    
    return (
        <div>
            {canView && <ResultsPanel />}
            {canRun && <RunButton />}
        </div>
    );
}
```

## Permission Management

### Create Role
```tsx
// Via UI: /permissions
// Click "Add Role"
// Select permissions
// Save
```

### Assign Role to User
```tsx
// Via UI: /users
// Edit user
// Select role from dropdown
// Save
```

### Create Permission
```tsx
// Via UI: /permissions
// Click "Add Permission"
// Name format: category.action
// Select category
// Save
```

## Troubleshooting

### User can't access page
```bash
1. Check user has role assigned
2. Check role has required permission
3. Clear cache: php artisan cache:clear
4. Hard refresh browser (Ctrl+F5)
```

### Permission not working
```bash
1. Verify permission name matches exactly
2. Check middleware is applied to route
3. Check user's role has the permission
4. Review route list: php artisan route:list
```

### Sidebar wrong items
```bash
1. Hard refresh browser (Ctrl+F5)
2. Check console for errors
3. Verify permissions in props: usePage().props.auth.permissions
```

## Quick Commands

```bash
# List all routes
php artisan route:list

# Check specific route
php artisan route:list --path=pembelian

# Clear cache
php artisan cache:clear

# Run migrations
php artisan migrate

# Seed permissions
php artisan db:seed --class=RolePermissionSeeder

# Check user permissions (tinker)
php artisan tinker
> $user = User::find(1);
> $user->roleModel->permissions->pluck('name');
```

## Testing Checklist

### Backend
- [ ] Routes protected by correct middleware
- [ ] 403 errors on unauthorized access
- [ ] Permission checks in controllers work
- [ ] Multiple permission checks work

### Frontend
- [ ] Sidebar shows correct items
- [ ] Buttons hidden without permission
- [ ] Pages show access denied
- [ ] Permission components work

### Integration
- [ ] Login as super_admin - see all features
- [ ] Login as user - see limited features
- [ ] Login as visitor - read-only access
- [ ] Create custom role - works as expected

## Resources

- Main docs: `Documentation/PERMISSION_MANAGEMENT.md`
- Integration guide: `Documentation/SPATIE_PERMISSION_INTEGRATION.md`
- Full summary: `Documentation/PERMISSION_INTEGRATION_SUMMARY.md`
- Spatie docs: https://spatie.be/docs/laravel-permission/

---

*Quick reference for developers*
*Last updated: 2025-11-17*
