# Roles System Architecture Diagram

## System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ROLES SYSTEM FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   Database   │
    │  Migration   │
    └──────┬───────┘
           │ php artisan migrate
           ▼
    ┌──────────────────────────────────────────┐
    │   roles table                            │
    ├──────────────────────────────────────────┤
    │ • id                                     │
    │ • name (unique)                          │
    │ • display_name                           │
    │ • description                            │
    │ • is_default                             │
    │ • timestamps                             │
    └──────────────────┬───────────────────────┘
                       │
                       │ php artisan db:seed --class=RolesTableSeeder
                       ▼
    ┌──────────────────────────────────────────┐
    │   Seeded Data                            │
    ├──────────────────────────────────────────┤
    │ 1. Super Admin (super_admin)             │
    │ 2. User (user) [DEFAULT]                 │
    │ 3. Visitor (visitor)                     │
    └──────────────────┬───────────────────────┘
                       │
                       │ Query in UsersController
                       ▼
    ┌──────────────────────────────────────────┐
    │   Backend (Laravel)                      │
    │   UsersController@index                  │
    ├──────────────────────────────────────────┤
    │   $allRoles = Role::select(...)          │
    │       ->get()                            │
    │       ->map(...)                         │
    └──────────────────┬───────────────────────┘
                       │
                       │ Inertia.js
                       ▼
    ┌──────────────────────────────────────────┐
    │   Frontend (React)                       │
    │   users/index.tsx                        │
    ├──────────────────────────────────────────┤
    │   <AddUserDialog                         │
    │     roles={allRoles}                     │
    │     ...                                  │
    │   />                                     │
    └──────────────────┬───────────────────────┘
                       │
                       │ Props
                       ▼
    ┌──────────────────────────────────────────┐
    │   AddUserDialog Component                │
    ├──────────────────────────────────────────┤
    │   • Receives roles array                 │
    │   • Finds default role                   │
    │   • Displays in Select dropdown          │
    │   • Handles role selection               │
    └──────────────────────────────────────────┘
```

## Component Data Flow

```
┌───────────────────────────────────────────────────────────────────┐
│                    ADDUSERDIALOG DATA FLOW                         │
└───────────────────────────────────────────────────────────────────┘

roles prop (from backend)
     │
     ├─→ [RoleType, RoleType, RoleType]
     │
     ▼
┌─────────────────────────────────────┐
│   Default Role Selection            │
├─────────────────────────────────────┤
│ 1. Find is_default === true         │
│ 2. Find name === 'user'             │
│ 3. Use roles[0]                     │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Form State                        │
├─────────────────────────────────────┤
│   form.role_id = defaultRole.id     │
│   form.role = defaultRole.name      │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│   Select Component                  │
├─────────────────────────────────────┤
│   • Trigger shows display_name      │
│   • Items show all roles            │
│   • Descriptions below names        │
│   • Badge for super_admin           │
└─────────────┬───────────────────────┘
              │
              │ User selects role
              ▼
┌─────────────────────────────────────┐
│   onValueChange                     │
├─────────────────────────────────────┤
│   • Find role by id                 │
│   • Update form.role_id             │
│   • Update form.role                │
└─────────────┬───────────────────────┘
              │
              │ Form submit
              ▼
┌─────────────────────────────────────┐
│   POST to users.store               │
├─────────────────────────────────────┤
│   Data: {                           │
│     name, email,                    │
│     role, role_id,                  │
│     password (if super_admin)       │
│   }                                 │
└─────────────────────────────────────┘
```

## Database Schema Relationships

```
┌────────────────────────────────────────────────────────────────┐
│                     DATABASE STRUCTURE                          │
└────────────────────────────────────────────────────────────────┘

┌─────────────────┐         ┌─────────────────┐
│     users       │         │     roles       │
├─────────────────┤         ├─────────────────┤
│ id              │         │ id              │
│ name            │         │ name            │
│ email           │         │ display_name    │
│ role (string)   │◄────┐   │ description     │
│ role_id (FK)    │─────┼──►│ is_default      │
│ password        │     │   │ created_at      │
│ ...             │     │   │ updated_at      │
└─────────────────┘     │   └────────┬────────┘
                        │            │
                        │            │ Many-to-Many
                        │            ▼
                        │   ┌─────────────────┐
                        │   │ role_permissions│
                        │   ├─────────────────┤
                        │   │ id              │
                        │   │ role_id (FK)    │
                        │   │ permission_id   │
                        │   └────────┬────────┘
                        │            │
                        │            ▼
                        │   ┌─────────────────┐
                        │   │  permissions    │
                        │   ├─────────────────┤
                        └───┤ id              │
                            │ name            │
                            │ display_name    │
                            │ category        │
                            │ description     │
                            └─────────────────┘
```

## AddUserDialog UI Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                      Add User Dialog                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Name:    [_______________________________________________]      │
│                                                                  │
│  Email:   [_______________________________________________]      │
│                                                                  │
│  Role:    ┌─────────────────────────────────────────────┐       │
│           │ User ▼                                       │       │
│           └─────────────────────────────────────────────┘       │
│                                                                  │
│           Dropdown opens ▼                                       │
│           ┌─────────────────────────────────────────────┐       │
│           │ ┌─────────────────────────────────────────┐ │       │
│           │ │ Super Admin [Admin]                     │ │       │
│           │ │ Full system access - Can manage users...│ │       │
│           │ ├─────────────────────────────────────────┤ │       │
│           │ │ User ✓                                  │ │       │
│           │ │ Standard access - Can upload files...   │ │       │
│           │ ├─────────────────────────────────────────┤ │       │
│           │ │ Visitor                                 │ │       │
│           │ │ Read-only access - Can only view...     │ │       │
│           │ └─────────────────────────────────────────┘ │       │
│           └─────────────────────────────────────────────┘       │
│                                                                  │
│  [If super_admin selected]                                       │
│  Password: [_______________________________________________]      │
│                                                                  │
│  [Cancel]                                         [Save]         │
└─────────────────────────────────────────────────────────────────┘
```

## Role Permissions Matrix

```
┌────────────────────────────────────────────────────────────────────┐
│                      ROLE PERMISSIONS                               │
├───────────────┬──────────────┬────────┬─────────┬─────────────────┤
│  Permission   │ Super Admin  │  User  │ Visitor │   Description    │
├───────────────┼──────────────┼────────┼─────────┼─────────────────┤
│ Upload        │      ✓       │   ✓    │    ✗    │ Upload files    │
│ Validate      │      ✓       │   ✓    │    ✗    │ Run validations │
│ View Results  │      ✓       │   ✓    │    ✓    │ View validation │
│ View History  │      ✓       │   ✓    │    ✓    │ View history    │
│ View Details  │      ✓       │   ✓    │    ✓    │ View details    │
│ Manage Users  │      ✓       │   ✗    │    ✗    │ User CRUD       │
│ Manage Roles  │      ✓       │   ✗    │    ✗    │ Role/Permission │
│ View Logs     │      ✓       │   ✗    │    ✗    │ Activity logs   │
│ Settings      │      ✓       │   ✗    │    ✗    │ System settings │
└───────────────┴──────────────┴────────┴─────────┴─────────────────┘
```

## Seeder Execution Order

```
┌────────────────────────────────────────────────────────────────────┐
│                    SEEDER EXECUTION FLOW                            │
└────────────────────────────────────────────────────────────────────┘

Option 1: Quick Roles Update
────────────────────────────
php artisan db:seed --class=RolesTableSeeder
     │
     ▼
┌─────────────────────┐
│  RolesTableSeeder   │
│  • Creates/Updates  │
│    3 roles only     │
│  • Fast execution   │
└─────────────────────┘


Option 2: Complete Setup
────────────────────────────
php artisan db:seed --class=RolePermissionSeeder
     │
     ▼
┌─────────────────────┐
│ RolePermissionSeeder│
│  1. Create          │
│     permissions     │
│  2. Create roles    │
│  3. Assign          │
│     permissions     │
│  4. Update existing │
│     users           │
└─────────────────────┘


Option 3: Full Database Seed
────────────────────────────
php artisan db:seed
     │
     ├─→ Calls RolePermissionSeeder
     │   (includes roles + permissions)
     │
     └─→ Creates super admin user
```

## TypeScript Type Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                    TYPESCRIPT TYPE SYSTEM                           │
└────────────────────────────────────────────────────────────────────┘

Backend (PHP)                    Frontend (TypeScript)
─────────────                    ─────────────────────

Role::all()                      interface RoleType {
   │                                 id: number;
   │ JSON                           name: string;
   │ via Inertia                    display_name: string;
   └────────────────────►           description: string | null;
                                    is_default?: boolean;
                                }
                                     │
                                     ▼
                                interface AddUserDialogProps {
                                    roles: RoleType[];
                                    open: boolean;
                                    onClose: () => void;
                                    onUserAdded: () => void;
                                }
                                     │
                                     ▼
                                const [form, setForm] = useState({
                                    role_id: number | null;
                                    role: string;
                                    ...
                                });
```

## File Dependencies

```
┌────────────────────────────────────────────────────────────────────┐
│                    FILE DEPENDENCY TREE                             │
└────────────────────────────────────────────────────────────────────┘

Migration (Creates schema)
    └─→ 2025_11_07_000003_create_roles_and_permissions_tables.php
              │
              ▼
        roles table created
              │
              ├─→ Model: app/Models/Role.php
              │     │
              │     └─→ Relationships to User, Permission
              │
              ├─→ Seeder: database/seeders/RolesTableSeeder.php
              │     │
              │     └─→ Seeds 3 default roles
              │
              ├─→ Seeder: database/seeders/RolePermissionSeeder.php
              │     │
              │     └─→ Seeds roles + permissions + assignments
              │
              └─→ Controller: app/Http/Controllers/UsersController.php
                    │
                    └─→ Fetches roles for frontend
                          │
                          ├─→ Page: resources/js/pages/users/index.tsx
                          │     │
                          │     └─→ Passes roles to dialog
                          │
                          └─→ Component: resources/js/components/AddUserDialog.tsx
                                │
                                └─→ Displays roles in dropdown
```

## State Management Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                  ADDUSERDIALOG STATE FLOW                           │
└────────────────────────────────────────────────────────────────────┘

Dialog Opens
     │
     ▼
useEffect (open changes)
     │
     ├─→ Reset form state
     ├─→ Clear errors
     └─→ Set default role
           │
           ▼
     form = {
       name: '',
       email: '',
       role: 'user',
       role_id: 2,
       password: ''
     }
           │
           ▼
     Render Select with form.role_id
           │
           ├─→ Display in trigger
           └─→ Show in dropdown
                 │
                 │ User selects different role
                 ▼
           onValueChange(newRoleId)
                 │
                 └─→ Find role in roles array
                       │
                       └─→ Update form state
                             │
                             ├─→ form.role_id = newRole.id
                             ├─→ form.role = newRole.name
                             │
                             └─→ Trigger re-render
                                   │
                                   └─→ Show/hide password field
                                       (if super_admin selected)
```

## Legend

```
┌────────────────────────────────────────────────────────────────────┐
│                           LEGEND                                    │
├────────────────────────────────────────────────────────────────────┤
│  ─→   Data flow / Process flow                                     │
│  ▼    Next step / Continues to                                     │
│  ├─→  Branch / Alternative path                                    │
│  └─→  Final step in branch                                         │
│  │    Continues / Connection                                       │
│  ✓    Enabled / Has permission                                     │
│  ✗    Disabled / No permission                                     │
│  [FK]  Foreign Key                                                 │
│  PK    Primary Key                                                 │
└────────────────────────────────────────────────────────────────────┘
```
