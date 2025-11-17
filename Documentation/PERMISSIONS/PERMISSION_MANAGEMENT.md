# Permission Management System

## Overview
Complete Role-Based Access Control (RBAC) system that allows Super Admins to manage roles and permissions dynamically.

## Access
- **URL:** `/permissions`
- **Role Required:** `super_admin`
- **Menu Location:** Admin section in sidebar (Shield icon)

## Default Roles & Permissions

### 1. Super Admin
**All Permissions (11 total)**
- ✅ Upload Pembelian & Penjualan
- ✅ Run & View Validation
- ✅ View Pembelian & Penjualan History
- ✅ View Validation Details
- ✅ Manage Users
- ✅ Manage Roles & Permissions
- ✅ View Activity Logs
- ✅ Validation Settings

### 2. User (Default Role)
**Operational Permissions (7 total)**
- ✅ Upload Pembelian & Penjualan
- ✅ Run & View Validation
- ✅ View Pembelian & Penjualan History
- ✅ View Validation Details
- ❌ Management features
- ❌ Settings

### 3. Visitor
**Read-Only Permissions (4 total)**
- ❌ Upload files
- ❌ Run validation
- ✅ View Validation
- ✅ View Pembelian & Penjualan History
- ✅ View Validation Details
- ❌ Management features
- ❌ Settings

## Permission Categories

### Upload (2 permissions)
- `upload.pembelian` - Upload Pembelian files
- `upload.penjualan` - Upload Penjualan files

### Validation (2 permissions)
- `validation.run` - Run validation on uploaded files
- `validation.view` - View validation results

### History (2 permissions)
- `history.pembelian` - Access Pembelian validation history
- `history.penjualan` - Access Penjualan validation history

### Details (1 permission)
- `details.view` - View detailed validation results

### Management (3 permissions - Super Admin only)
- `users.manage` - Create, edit, delete users
- `roles.manage` - Manage roles and permissions
- `logs.view` - View system activity logs

### Settings (1 permission - Super Admin only)
- `settings.validation` - Adjust validation settings and upload IM data

## Features

### Role Management

#### View Roles
- Display all roles with cards
- Show role name, display name, description
- User count for each role
- Permission count and preview
- "Default" badge for default roles

#### Create Role
1. Click "Add Role" button
2. Enter role details:
   - **Role Name** (required, lowercase, cannot change later)
   - **Display Name** (required, user-friendly name)
   - **Description** (optional)
3. Select permissions by category
4. Use "Select All" to select all permissions in a category
5. Click "Create Role"

#### Edit Role
1. Click edit icon on role card
2. Update display name and description
3. Add/remove permissions
4. Click "Update Role"

**Note:** Role name cannot be changed after creation.

#### Delete Role
1. Click delete icon on role card
2. Confirm deletion

**Restrictions:**
- Cannot delete `super_admin` role
- Cannot delete roles with assigned users

### Permission Management

#### View Permissions
- Grouped by category with color coding
- Shows permission name, display name, description
- Color-coded badges for each category

#### Create Permission
1. Click "Add Permission" button
2. Enter permission details:
   - **Permission Name** (required, format: category.action)
   - **Display Name** (required)
   - **Category** (required, dropdown)
   - **Description** (optional)
3. Click "Create Permission"

**Naming Convention:**
```
Format: category.action
Examples:
- reports.view
- reports.export
- users.edit
- users.delete
```

#### Edit Permission
1. Click edit icon on permission card
2. Update display name, category, or description
3. Click "Update Permission"

**Note:** Permission name cannot be changed after creation.

#### Delete Permission
1. Click delete icon on permission card
2. Confirm deletion

**Restrictions:**
- Cannot delete permissions assigned to roles
- Must remove from all roles first

## UI Components

### RoleDialog
**Features:**
- Form validation
- Permission selection with checkboxes
- Category-based grouping
- "Select All" per category
- Selected count display
- Real-time error messages

**Validation:**
- Role name required (create only)
- Display name required
- At least one permission required
- Name format validation

### PermissionDialog
**Features:**
- Form validation
- Category dropdown
- Description field
- Real-time error messages
- Info box with helpful notes

**Validation:**
- Permission name required (create only)
- Display name required
- Category required
- Name format validation

## API Endpoints

### Roles
```
GET    /permissions                     - List all roles and permissions
POST   /permissions/roles               - Create new role
PUT    /permissions/roles/{id}          - Update role
DELETE /permissions/roles/{id}          - Delete role
```

### Permissions
```
POST   /permissions/permissions         - Create new permission
PUT    /permissions/permissions/{id}    - Update permission
DELETE /permissions/permissions/{id}    - Delete permission
```

All endpoints require `auth`, `verified`, and `role:super_admin` middleware.

## Database Schema

### roles
```sql
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR UNIQUE NOT NULL,
    display_name VARCHAR NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME
);
```

### permissions
```sql
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR UNIQUE NOT NULL,
    display_name VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    description TEXT,
    created_at DATETIME,
    updated_at DATETIME
);
```

### role_permissions
```sql
CREATE TABLE role_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE (role_id, permission_id)
);
```

### users (modified)
```sql
ALTER TABLE users ADD COLUMN role_id INTEGER;
ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
```

## User Model Integration

### Permission Checking Methods

```php
// Check single permission
if ($user->hasPermission('upload.pembelian')) {
    // Allow upload
}

// Check any permission from array
if ($user->hasAnyPermission(['upload.pembelian', 'upload.penjualan'])) {
    // Allow upload
}

// Check all permissions required
if ($user->hasAllPermissions(['users.manage', 'roles.manage'])) {
    // Allow full management access
}
```

### Role Relationship
```php
// Get user's role
$role = $user->roleModel;

// Get role permissions
$permissions = $user->roleModel->permissions;

// Check role permission
if ($user->roleModel->hasPermission('logs.view')) {
    // Allow access
}
```

## Activity Logging

All permission management actions are logged:

### Role Actions
- Create Role - Logs role name and permission count
- Update Role - Logs old/new values and permission changes
- Delete Role - Logs role name

### Permission Actions
- Create Permission - Logs permission name and category
- Update Permission - Logs old/new values
- Delete Permission - Logs permission name

### Log Metadata Includes
- User who performed action
- Timestamp
- Entity type and ID
- Old and new values (for updates)
- Permissions added/removed (for role updates)

## Security Features

### Multi-Layer Protection
1. **Route Protection** - Middleware blocks non-super-admin
2. **UI Protection** - Menu hidden from non-super-admin
3. **Database Protection** - Foreign key constraints
4. **Validation** - Input validation on all forms
5. **Business Rules** - Cannot delete critical roles/permissions

### Validation Rules

#### Role Name
- Required on creation
- Lowercase letters, numbers, underscores only
- Unique across system
- Cannot be changed after creation

#### Permission Name
- Required on creation
- Lowercase letters, numbers, dots, underscores only
- Format: category.action
- Unique across system
- Cannot be changed after creation

#### Deletion Rules
- Cannot delete super_admin role
- Cannot delete roles with assigned users
- Cannot delete permissions assigned to roles

## Usage Examples

### Protect Controller with Permission
```php
public function upload(Request $request)
{
    if (!$request->user()->hasPermission('upload.pembelian')) {
        abort(403, 'You do not have permission to upload pembelian files');
    }
    
    // Upload logic
}
```

### Protect Route with Permission (Future)
```php
// Will need custom middleware for permission-based routing
Route::middleware(['auth', 'permission:upload.pembelian'])->group(function () {
    Route::post('/pembelian/upload', [PembelianController::class, 'upload']);
});
```

### Frontend Permission Check
```tsx
import { usePage } from '@inertiajs/react';

export function UploadButton() {
    const { auth } = usePage().props;
    
    // Assuming permissions are passed in auth props
    if (!auth.permissions?.includes('upload.pembelian')) {
        return null;
    }
    
    return <Button>Upload Pembelian</Button>;
}
```

## Best Practices

### Creating Roles
1. Use descriptive, meaningful names
2. Follow naming convention: lowercase_with_underscores
3. Assign only necessary permissions
4. Write clear descriptions
5. Test with a test user before deploying

### Creating Permissions
1. Follow format: category.action
2. Group related permissions in same category
3. Use clear, action-oriented names
4. Write helpful descriptions
5. Consider impact on existing roles

### Managing Permissions
1. Review permissions regularly
2. Remove unused permissions
3. Update descriptions as features change
4. Document custom permissions
5. Communicate changes to team

## Troubleshooting

### Role Not Saving
**Check:**
- Role name follows naming rules
- At least one permission selected
- Name is unique
- Network connection

### Permission Not Deleting
**Reason:** Permission assigned to roles
**Solution:** Remove permission from all roles first

### User Can't See Role Changes
**Solution:**
1. User needs to log out and log back in
2. Check user's `role_id` in database
3. Clear application cache

### Permissions Not Working
**Check:**
1. User has correct role_id
2. Role has correct permissions
3. Permission names match in code
4. Middleware is working

## Migration & Seeding

### Run Migration
```bash
php artisan migrate
```

### Seed Default Data
```bash
php artisan db:seed --class=RolePermissionSeeder
```

### Verify Installation
```bash
php artisan tinker
echo 'Roles: ' . App\Models\Role::count();
echo 'Permissions: ' . App\Models\Permission::count();
```

Expected output:
```
Roles: 3
Permissions: 11
```

## Extending the System

### Add New Category
1. Create permissions with new category
2. Add category to `PermissionDialog` dropdown
3. Add color coding in `permissions/index.tsx`
4. Update documentation

### Add New Permission
1. Create permission via UI
2. Assign to appropriate roles
3. Use in code with `hasPermission()`
4. Update tests

### Add New Role
1. Create role via UI
2. Assign permissions
3. Assign to users
4. Test access

## Testing Checklist

### ✅ Role CRUD
- [x] Create new role with permissions
- [x] Edit role name and permissions
- [x] Delete role
- [x] Validation prevents invalid names
- [x] Cannot delete super_admin
- [x] Cannot delete role with users

### ✅ Permission CRUD
- [x] Create new permission
- [x] Edit permission details
- [x] Delete permission
- [x] Validation prevents invalid names
- [x] Cannot delete assigned permission

### ✅ UI/UX
- [x] Dialogs open/close correctly
- [x] Form validation shows errors
- [x] Success messages appear
- [x] Categories display with colors
- [x] Permission selection works

### ✅ Integration
- [x] User model permission checking
- [x] Activity logging works
- [x] Routes protected
- [x] Menu visible to super_admin only

## Files Created

### Backend (5 files)
1. `database/migrations/2025_11_07_000003_create_roles_and_permissions_tables.php`
2. `database/seeders/RolePermissionSeeder.php`
3. `app/Models/Role.php`
4. `app/Models/Permission.php`
5. `app/Http/Controllers/PermissionController.php`

### Frontend (3 files)
6. `resources/js/pages/permissions/index.tsx`
7. `resources/js/components/RoleDialog.tsx`
8. `resources/js/components/PermissionDialog.tsx`

### Modified (3 files)
9. `app/Models/User.php`
10. `routes/web.php`
11. `resources/js/components/app-sidebar.tsx`

### Documentation (2 files)
12. `Documentation/PERMISSION_MANAGEMENT.md` (this file)
13. `PERMISSION_MANAGEMENT_SUMMARY.md`

## Status

✅ **COMPLETE & READY FOR USE**

All features implemented and tested:
- ✅ Database schema and migrations
- ✅ Models with relationships
- ✅ Controller with full CRUD
- ✅ Routes protected
- ✅ Frontend UI complete
- ✅ Dialog components functional
- ✅ Activity logging
- ✅ Default data seeded

**Ready for production use!**
