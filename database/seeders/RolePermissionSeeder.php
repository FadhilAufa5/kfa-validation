<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Role;
use App\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions
        $permissions = [
            // Upload permissions
            ['name' => 'upload.pembelian', 'display_name' => 'Upload Pembelian', 'category' => 'upload', 'description' => 'Can upload pembelian files'],
            ['name' => 'upload.penjualan', 'display_name' => 'Upload Penjualan', 'category' => 'upload', 'description' => 'Can upload penjualan files'],
            
            // Validation permissions
            ['name' => 'validation.run', 'display_name' => 'Run Validation', 'category' => 'validation', 'description' => 'Can run validation on uploaded files'],
            ['name' => 'validation.view', 'display_name' => 'View Validation', 'category' => 'validation', 'description' => 'Can view validation results'],
            
            // History permissions
            ['name' => 'history.pembelian', 'display_name' => 'View Pembelian History', 'category' => 'history', 'description' => 'Can view pembelian validation history'],
            ['name' => 'history.penjualan', 'display_name' => 'View Penjualan History', 'category' => 'history', 'description' => 'Can view penjualan validation history'],
            
            // Details permissions
            ['name' => 'details.view', 'display_name' => 'View Validation Details', 'category' => 'details', 'description' => 'Can view detailed validation results'],
            
            // Management permissions (Super Admin only)
            ['name' => 'users.manage', 'display_name' => 'Manage Users', 'category' => 'management', 'description' => 'Can create, edit, and delete users'],
            ['name' => 'roles.manage', 'display_name' => 'Manage Roles & Permissions', 'category' => 'management', 'description' => 'Can manage roles and permissions'],
            ['name' => 'logs.view', 'display_name' => 'View Activity Logs', 'category' => 'management', 'description' => 'Can view system activity logs'],
            
            // Settings permissions (Super Admin only)
            ['name' => 'settings.validation', 'display_name' => 'Validation Settings', 'category' => 'settings', 'description' => 'Can adjust validation settings and upload IM data'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }

        // Create roles
        $roles = [
            [
                'name' => 'super_admin',
                'display_name' => 'Super Admin',
                'description' => 'Full system access with all permissions',
                'is_default' => false,
            ],
            [
                'name' => 'user',
                'display_name' => 'User',
                'description' => 'Standard user with upload and validation access',
                'is_default' => true,
            ],
            [
                'name' => 'visitor',
                'display_name' => 'Visitor',
                'description' => 'Read-only access to view validation history and details',
                'is_default' => false,
            ],
        ];

        foreach ($roles as $roleData) {
            $role = Role::firstOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );

            // Assign permissions based on role
            $this->assignPermissions($role);
        }

        // Update existing users to have role_id
        $this->updateExistingUsers();
    }

    private function assignPermissions(Role $role): void
    {
        $permissionNames = [];

        switch ($role->name) {
            case 'super_admin':
                // Super Admin gets ALL permissions
                $permissionNames = Permission::pluck('name')->toArray();
                break;

            case 'user':
                // User: Upload, Validate, History, Details
                $permissionNames = [
                    'upload.pembelian',
                    'upload.penjualan',
                    'validation.run',
                    'validation.view',
                    'history.pembelian',
                    'history.penjualan',
                    'details.view',
                ];
                break;

            case 'visitor':
                // Visitor: History and Details only (read-only)
                $permissionNames = [
                    'validation.view',
                    'history.pembelian',
                    'history.penjualan',
                    'details.view',
                ];
                break;
        }

        $permissions = Permission::whereIn('name', $permissionNames)->get();
        $role->permissions()->sync($permissions->pluck('id')->toArray());
    }

    private function updateExistingUsers(): void
    {
        // Update users who have 'super_admin' role string
        $superAdminRole = Role::where('name', 'super_admin')->first();
        DB::table('users')
            ->where('role', 'super_admin')
            ->update(['role_id' => $superAdminRole->id]);

        // Update users who have 'user' role string
        $userRole = Role::where('name', 'user')->first();
        DB::table('users')
            ->where('role', 'user')
            ->update(['role_id' => $userRole->id]);

        // Update users who don't have role_id yet (default to 'user')
        DB::table('users')
            ->whereNull('role_id')
            ->update(['role_id' => $userRole->id]);
    }
}
