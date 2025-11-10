<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PermissionController extends Controller
{
    public function index()
    {
        $roles = Role::with('permissions')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'display_name' => $role->display_name,
                'description' => $role->description,
                'is_default' => $role->is_default,
                'users_count' => $role->users()->count(),
                'permissions' => $role->permissions->pluck('id')->toArray(),
                'created_at' => $role->created_at->format('Y-m-d H:i:s'),
            ];
        });

        $permissions = Permission::getGroupedPermissions();

        return Inertia::render('permissions/index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function storeRole(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:roles,name|alpha_dash',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'is_default' => false,
        ]);

        $role->syncPermissions($request->permission_ids);

        ActivityLogger::log(
            action: 'Create Role',
            description: "Created new role: {$role->display_name}",
            entityType: 'Role',
            entityId: (string) $role->id,
            metadata: [
                'role_name' => $role->name,
                'permissions_count' => count($request->permission_ids),
            ]
        );

        return back()->with('success', 'Role created successfully');
    }

    public function updateRole(Request $request, Role $role)
    {
        $request->validate([
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $oldData = $role->only(['display_name', 'description']);
        $oldPermissions = $role->permissions->pluck('id')->toArray();

        $role->update([
            'display_name' => $request->display_name,
            'description' => $request->description,
        ]);

        $role->syncPermissions($request->permission_ids);

        ActivityLogger::log(
            action: 'Update Role',
            description: "Updated role: {$role->display_name}",
            entityType: 'Role',
            entityId: (string) $role->id,
            metadata: [
                'role_name' => $role->name,
                'old_data' => $oldData,
                'new_data' => $request->only(['display_name', 'description']),
                'permissions_added' => array_diff($request->permission_ids, $oldPermissions),
                'permissions_removed' => array_diff($oldPermissions, $request->permission_ids),
            ]
        );

        return back()->with('success', 'Role updated successfully');
    }

    public function destroyRole(Role $role)
    {
        if ($role->name === 'super_admin') {
            return back()->withErrors(['role' => 'Cannot delete Super Admin role']);
        }

        if ($role->users()->count() > 0) {
            return back()->withErrors(['role' => 'Cannot delete role with assigned users']);
        }

        $roleName = $role->display_name;
        $role->delete();

        ActivityLogger::log(
            action: 'Delete Role',
            description: "Deleted role: {$roleName}",
            entityType: 'Role',
            entityId: (string) $role->id,
            metadata: [
                'role_name' => $role->name,
            ]
        );

        return back()->with('success', 'Role deleted successfully');
    }

    public function storePermission(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:permissions,name',
            'display_name' => 'required|string|max:255',
            'category' => 'required|string|in:upload,validation,history,details,management,settings',
            'description' => 'nullable|string',
        ]);

        $permission = Permission::create($request->all());

        ActivityLogger::log(
            action: 'Create Permission',
            description: "Created new permission: {$permission->display_name}",
            entityType: 'Permission',
            entityId: (string) $permission->id,
            metadata: [
                'permission_name' => $permission->name,
                'category' => $permission->category,
            ]
        );

        return back()->with('success', 'Permission created successfully');
    }

    public function updatePermission(Request $request, Permission $permission)
    {
        $request->validate([
            'display_name' => 'required|string|max:255',
            'category' => 'required|string|in:upload,validation,history,details,management,settings',
            'description' => 'nullable|string',
        ]);

        $oldData = $permission->only(['display_name', 'category', 'description']);

        $permission->update($request->all());

        ActivityLogger::log(
            action: 'Update Permission',
            description: "Updated permission: {$permission->display_name}",
            entityType: 'Permission',
            entityId: (string) $permission->id,
            metadata: [
                'permission_name' => $permission->name,
                'old_data' => $oldData,
                'new_data' => $request->only(['display_name', 'category', 'description']),
            ]
        );

        return back()->with('success', 'Permission updated successfully');
    }

    public function destroyPermission(Permission $permission)
    {
        if ($permission->roles()->count() > 0) {
            return back()->withErrors(['permission' => 'Cannot delete permission assigned to roles']);
        }

        $permissionName = $permission->display_name;
        $permission->delete();

        ActivityLogger::log(
            action: 'Delete Permission',
            description: "Deleted permission: {$permissionName}",
            entityType: 'Permission',
            entityId: (string) $permission->id,
            metadata: [
                'permission_name' => $permission->name,
            ]
        );

        return back()->with('success', 'Permission deleted successfully');
    }
}
