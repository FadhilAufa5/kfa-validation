# Permission Management - Quick Reference

## ✅ System Status
- **Roles:** 3 (Super Admin, User, Visitor)
- **Permissions:** 11 (across 6 categories)
- **Users Updated:** 11 users with role assignments
- **Status:** FULLY OPERATIONAL ✅

## 🚀 Quick Access

### URL
```
/permissions
```

### Role Required
```
super_admin
```

### Menu Location
```
Sidebar → Admin Section → Permission Management (Shield Icon)
```

## 📋 Three Default Roles

| Role | Permissions | Users | Description |
|------|-------------|-------|-------------|
| **Super Admin** | 11/11 (100%) | Admin users | Full system access |
| **User** | 7/11 (64%) | Regular users | Upload + Validate |
| **Visitor** | 4/11 (36%) | Read-only | View only |

## 🔑 Permission Categories

| Category | Count | Examples |
|----------|-------|----------|
| Upload | 2 | upload.pembelian, upload.penjualan |
| Validation | 2 | validation.run, validation.view |
| History | 2 | history.pembelian, history.penjualan |
| Details | 1 | details.view |
| Management | 3 | users.manage, roles.manage, logs.view |
| Settings | 1 | settings.validation |

## 🎨 Category Colors

```
Upload      → Blue   (bg-blue-100 text-blue-800)
Validation  → Green  (bg-green-100 text-green-800)
History     → Purple (bg-purple-100 text-purple-800)
Details     → Orange (bg-orange-100 text-orange-800)
Management  → Red    (bg-red-100 text-red-800)
Settings    → Gray   (bg-gray-100 text-gray-800)
```

## 🔧 Common Tasks

### Create New Role
```
1. Click "Add Role"
2. Name: my_new_role (lowercase_snake_case)
3. Display: My New Role
4. Select permissions
5. Click "Create Role"
```

### Edit Role
```
1. Click edit icon on role card
2. Update display name/description
3. Add/remove permissions
4. Click "Update Role"
```

### Create Permission
```
1. Click "Add Permission"
2. Name: category.action (e.g., reports.view)
3. Display: View Reports
4. Category: Select from dropdown
5. Click "Create Permission"
```

### Delete Role
```
1. Click delete icon
2. Confirm deletion
Note: Cannot delete super_admin or roles with users
```

## 💻 Code Examples

### Check Permission (PHP)
```php
// Single permission
if ($user->hasPermission('upload.pembelian')) {
    // Allow
}

// Any permission
if ($user->hasAnyPermission(['upload.pembelian', 'upload.penjualan'])) {
    // Allow
}

// All permissions
if ($user->hasAllPermissions(['users.manage', 'roles.manage'])) {
    // Allow
}
```

### Protect Controller
```php
public function upload(Request $request)
{
    if (!$request->user()->hasPermission('upload.pembelian')) {
        abort(403, 'No permission to upload');
    }
    
    // Logic here
}
```

### Frontend Check (Future)
```tsx
const { auth } = usePage().props;

{auth.permissions?.includes('upload.pembelian') && (
    <Button>Upload</Button>
)}
```

## 📝 Naming Conventions

### Role Names
```
Format: lowercase_with_underscores
✅ Good: content_editor, sales_manager, regional_admin
❌ Bad: ContentEditor, sales-manager, ADMIN
```

### Permission Names
```
Format: category.action
✅ Good: reports.view, users.edit, data.export
❌ Bad: view_reports, EditUser, DATA_EXPORT
```

## 🚫 Restrictions

### Cannot Delete
- `super_admin` role (system protected)
- Roles with assigned users
- Permissions assigned to roles

### Cannot Change
- Role name (after creation)
- Permission name (after creation)

## 📊 Permission Matrix

| Permission | Super Admin | User | Visitor |
|------------|-------------|------|---------|
| upload.pembelian | ✅ | ✅ | ❌ |
| upload.penjualan | ✅ | ✅ | ❌ |
| validation.run | ✅ | ✅ | ❌ |
| validation.view | ✅ | ✅ | ✅ |
| history.pembelian | ✅ | ✅ | ✅ |
| history.penjualan | ✅ | ✅ | ✅ |
| details.view | ✅ | ✅ | ✅ |
| users.manage | ✅ | ❌ | ❌ |
| roles.manage | ✅ | ❌ | ❌ |
| logs.view | ✅ | ❌ | ❌ |
| settings.validation | ✅ | ❌ | ❌ |

## 🔍 Troubleshooting

### User Can't Access Feature
```
Check:
1. User has correct role_id in database
2. Role has required permission
3. Permission name matches in code
4. User logged out and back in
```

### Can't Delete Role
```
Reason: Role has assigned users
Solution: 
1. Go to User Management
2. Change users to different role
3. Then delete role
```

### Can't Delete Permission
```
Reason: Permission assigned to roles
Solution:
1. Edit each role that has it
2. Remove the permission
3. Then delete permission
```

### Changes Not Reflecting
```
Solution:
1. Clear browser cache
2. User logout and login
3. Check database directly
4. Clear application cache: php artisan optimize:clear
```

## 📚 Documentation Files

### Read These First
1. `PERMISSION_SYSTEM_COMPLETE.md` - Overview and summary
2. `PERMISSION_QUICK_REFERENCE.md` - This file
3. `Documentation/PERMISSION_MANAGEMENT.md` - Comprehensive guide

### Technical Details
4. `PERMISSION_MANAGEMENT_SUMMARY.md` - Implementation details
5. `Documentation/OTP/PERMISSION_SYSTEM.md` - Original system docs

## 🎯 CLI Commands

### Check System Status
```bash
php artisan tinker --execute="
echo 'Roles: ' . App\Models\Role::count() . PHP_EOL;
echo 'Permissions: ' . App\Models\Permission::count() . PHP_EOL;
echo 'Users: ' . App\Models\User::whereNotNull('role_id')->count();
"
```

### List All Routes
```bash
php artisan route:list --path=permissions
```

### Reseed Permissions (if needed)
```bash
php artisan db:seed --class=RolePermissionSeeder
```

### Show Database Tables
```bash
php artisan db:table roles
php artisan db:table permissions
php artisan db:table role_permissions
```

## 🎨 UI Components

### Main Page
- **Location:** `resources/js/pages/permissions/index.tsx`
- **Shows:** All roles and permissions
- **Actions:** Create, Edit, Delete

### RoleDialog
- **Location:** `resources/js/components/RoleDialog.tsx`
- **Purpose:** Create/Edit roles
- **Features:** Permission selection, validation

### PermissionDialog
- **Location:** `resources/js/components/PermissionDialog.tsx`
- **Purpose:** Create/Edit permissions
- **Features:** Category selection, validation

## 🔐 Security Notes

### All Routes Protected
```php
Route::middleware(['auth', 'verified', 'role:super_admin'])
```

### Frontend Hidden
```tsx
{isSuperAdmin && <PermissionManagementLink />}
```

### Database Constraints
```sql
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
UNIQUE (role_id, permission_id)
```

## ⚡ Performance Tips

1. **Caching** - Permission checks can be cached
2. **Eager Loading** - Load permissions with roles
3. **Indexing** - Foreign keys are indexed
4. **Batch Operations** - Use sync() for multiple permissions

## 🎓 Best Practices

### Do's ✅
- Use descriptive role names
- Group related permissions
- Test with real users first
- Document custom permissions
- Review permissions regularly

### Don'ts ❌
- Don't grant unnecessary permissions
- Don't delete system roles
- Don't use spaces in names
- Don't skip validation
- Don't forget to test

## 📞 Support

### Need Help?
1. Check documentation
2. Review code comments
3. Check activity logs
4. Verify database state
5. Test with different users

### Common Questions

**Q: Can I rename a role?**
A: No, but you can change display name

**Q: How to add custom permission?**
A: Use Permission Management UI

**Q: User can't see changes?**
A: Have them logout and login again

**Q: How to bulk assign permissions?**
A: Use "Select All" in category

**Q: Can roles inherit from others?**
A: Not yet, but can be implemented

## 🎉 Quick Wins

### Start Using Today
1. ✅ View all roles and permissions
2. ✅ Create custom roles
3. ✅ Assign roles to users
4. ✅ Control feature access
5. ✅ Monitor all changes

### 5-Minute Setup
```
1. Login as super_admin
2. Navigate to /permissions
3. Click "Add Role"
4. Create "Manager" role
5. Select permissions
6. Assign to users
7. Done! 🎉
```

---

**Quick Reference Version:** 1.0.0
**Last Updated:** 2025-11-07
**Status:** ✅ READY TO USE
