# Permission System

## Overview
Sistem permission berbasis role yang membedakan akses antara Super Admin dan User biasa.

## User Roles

### 1. Super Admin (`super_admin`)
**Full Access** - Dapat mengakses semua fitur dalam sistem:
- ✅ Dashboard
- ✅ Pembelian & History Pembelian
- ✅ Penjualan & History Penjualan
- ✅ User Management (Create, Read, Update, Delete users)
- ✅ Activity Logs (View all system activities)

### 2. Regular User (`user`)
**Limited Access** - Hanya dapat mengakses fitur operasional:
- ✅ Dashboard
- ✅ Pembelian & History Pembelian
- ✅ Penjualan & History Penjualan
- ❌ User Management (Hidden & Restricted)
- ❌ Activity Logs (Hidden & Restricted)

## Implementation

### Backend Protection

#### Middleware
File: `app/Http/Middleware/CheckRole.php`

Middleware yang memeriksa role user sebelum mengakses route tertentu:
```php
// Super admin always has access
if ($userRole === 'super_admin') {
    return $next($request);
}

// Check if user has one of the allowed roles
if (in_array($userRole, $roles)) {
    return $next($request);
}

// User doesn't have permission
abort(403, 'You do not have permission to access this resource.');
```

#### Route Protection
File: `routes/web.php`

Protected routes dengan middleware `role`:
```php
// user management (super_admin only)
Route::middleware(['auth', 'verified', 'role:super_admin'])->group(function () {
    Route::get('/users', [UsersController::class, 'index'])->name('users.index');
    Route::get('/users/{id}', [UsersController::class, 'show'])->name('users.show');
    Route::put('/users/{user}', [UsersController::class, 'update'])->name('users.update');
    Route::post('/users', [UsersController::class, 'store'])->name('users.store');
    Route::post('/users/check-email', [UsersController::class, 'checkEmail'])->name('users.check-email');
    Route::delete('/users/{user}', [UsersController::class, 'destroy'])->name('users.destroy');
});

// activity logs (super_admin only)
Route::middleware(['auth', 'verified', 'role:super_admin'])->group(function () {
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
    Route::get('/activity-logs/{activityLog}', [ActivityLogController::class, 'show'])->name('activity-logs.show');
});
```

### Frontend Protection

#### Sidebar Menu
File: `resources/js/components/app-sidebar.tsx`

Menu User Management & Activity Logs hanya ditampilkan untuk super_admin:
```tsx
export function AppSidebar() {
    const { auth } = usePage().props as { auth: { user: { role: string } } };
    const isSuperAdmin = auth?.user?.role === 'super_admin';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarContent>
                <NavMain items={mainNavItems} />
                <NavPembelian items={pembelianNavItems} />
                <NavPenjualan items={penjualanNavItems} />
                {/* Only show for super_admin */}
                {isSuperAdmin && <NavUy items={uyNavItems} />}
            </SidebarContent>
        </Sidebar>
    );
}
```

## Test Accounts

### Super Admin
```
Email: super@admin.com
Password: password
Role: super_admin
Access: Full system access
```

### Regular User
```
Email: user@example.com
Password: password
Role: user
Access: Limited to Dashboard, Pembelian, Penjualan only
```

## Security Features

### 1. Multi-Layer Protection
- **Backend**: Route middleware blocks unauthorized access
- **Frontend**: UI elements hidden from unauthorized users
- **Database**: Role stored in users table

### 2. Error Handling
- Unauthorized access returns HTTP 403 Forbidden
- Clear error message: "You do not have permission to access this resource."

### 3. Session Security
- Role checked on every request
- Cannot be manipulated from client-side
- Session-based authentication

## Usage Examples

### Protecting a New Route
Add middleware to route in `routes/web.php`:
```php
// Super admin only
Route::middleware(['auth', 'verified', 'role:super_admin'])->group(function () {
    Route::get('/admin/settings', [AdminController::class, 'settings']);
});

// Multiple roles allowed
Route::middleware(['auth', 'verified', 'role:super_admin,manager'])->group(function () {
    Route::get('/reports', [ReportController::class, 'index']);
});
```

### Hiding UI Elements
In React components:
```tsx
import { usePage } from '@inertiajs/react';

export function MyComponent() {
    const { auth } = usePage().props as { auth: { user: { role: string } } };
    const isSuperAdmin = auth?.user?.role === 'super_admin';

    return (
        <div>
            {/* Visible to all */}
            <PublicContent />

            {/* Only for super admin */}
            {isSuperAdmin && <AdminOnlyContent />}
        </div>
    );
}
```

### Checking Permissions in Controller
```php
public function store(Request $request)
{
    // Check if user is super admin
    if ($request->user()->role !== 'super_admin') {
        abort(403, 'Only super admin can perform this action.');
    }

    // Your logic here
}
```

## Adding New Roles

### 1. Create Migration (if needed)
```php
// If role column doesn't exist
Schema::table('users', function (Blueprint $table) {
    $table->string('role')->default('user');
});
```

### 2. Update Seeder
File: `database/seeders/DatabaseSeeder.php`
```php
User::firstOrCreate(
    ['email' => 'manager@example.com'],
    [
        'name' => 'Manager',
        'password' => bcrypt('password'),
        'role' => 'manager',
        'email_verified_at' => now(),
    ]
);
```

### 3. Update Middleware (if needed)
The middleware already supports multiple roles:
```php
Route::middleware(['role:super_admin,manager,user'])->group(function () {
    // Routes accessible by super_admin, manager, or user
});
```

### 4. Update Frontend Logic
```tsx
const { auth } = usePage().props as { auth: { user: { role: string } } };
const isManager = auth?.user?.role === 'manager';
const isSuperAdmin = auth?.user?.role === 'super_admin';
const canManageUsers = isSuperAdmin || isManager;
```

## Testing

### 1. Test Super Admin Access
```bash
# Login as super admin
Email: super@admin.com
Password: password

# Should see:
- Dashboard ✓
- Pembelian ✓
- Penjualan ✓
- User Management ✓
- Activity Logs ✓
```

### 2. Test Regular User Access
```bash
# Login as regular user
Email: user@example.com
Password: password

# Should see:
- Dashboard ✓
- Pembelian ✓
- Penjualan ✓
- User Management ✗ (Hidden)
- Activity Logs ✗ (Hidden)

# Try accessing /users directly:
# Should get 403 Forbidden error
```

### 3. Test Route Protection
```bash
# As regular user, try to access:
curl -X GET http://localhost/users
# Expected: 403 Forbidden

# As super admin:
curl -X GET http://localhost/users
# Expected: 200 OK with user list
```

## Troubleshooting

### Issue: Regular user can still see admin menu
**Solution**: 
1. Clear browser cache
2. Rebuild frontend: `npm run build`
3. Check user role in database: `SELECT role FROM users WHERE email = 'user@example.com'`

### Issue: Super admin getting 403 error
**Solution**:
1. Verify role in database is exactly `super_admin` (case-sensitive)
2. Check middleware is registered in `bootstrap/app.php`
3. Clear application cache: `php artisan optimize:clear`

### Issue: Menu still visible but route blocked
**Solution**: This is by design for security. Frontend hiding is convenience, backend protection is security.

## Best Practices

1. **Always protect routes at backend level** - Frontend hiding is not security
2. **Use consistent role names** - Case-sensitive, use snake_case
3. **Test with both user types** - Ensure permissions work as expected
4. **Log permission denials** - Track unauthorized access attempts
5. **Document role permissions** - Keep this file updated with new roles/permissions

## Permission Matrix

| Feature | Super Admin | User |
|---------|-------------|------|
| Dashboard | ✅ | ✅ |
| Pembelian | ✅ | ✅ |
| Penjualan | ✅ | ✅ |
| User Management | ✅ | ❌ |
| Activity Logs | ✅ | ❌ |
| System Settings | ✅ | ❌ |
| View Own Profile | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ |
| Delete Users | ✅ | ❌ |
| Create Users | ✅ | ❌ |
