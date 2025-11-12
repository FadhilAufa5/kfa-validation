<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RolesTableSeeder extends Seeder
{
    /**
     * Seed the roles table with default roles for the AddUserDialog.
     * This seeder can be run independently to refresh role data.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'super_admin',
                'display_name' => 'Super Admin',
                'description' => 'Full system access - Can manage users, roles, settings, and view all data',
                'is_default' => false,
            ],
            [
                'name' => 'user',
                'display_name' => 'User',
                'description' => 'Standard access - Can upload files, run validations, and view own history',
                'is_default' => true,
            ],
            [
                'name' => 'visitor',
                'display_name' => 'Visitor',
                'description' => 'Read-only access - Can only view assigned user\'s validation history and details',
                'is_default' => false,
            ],
        ];

        foreach ($roles as $roleData) {
            Role::updateOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );
        }

        $this->command->info('Roles seeded successfully!');
        $this->command->info('Available roles:');
        
        Role::all()->each(function ($role) {
            $this->command->info(sprintf(
                '  - %s (%s)%s',
                $role->display_name,
                $role->name,
                $role->is_default ? ' [DEFAULT]' : ''
            ));
        });
    }
}
