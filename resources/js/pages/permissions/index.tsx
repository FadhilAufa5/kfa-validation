import { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Button } from "@/components/ui/button";
import { Shield, Plus, Edit, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toaster, toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import type { BreadcrumbItem } from "@/types";
import RoleDialog from "@/components/RoleDialog";
import PermissionDialog from "@/components/PermissionDialog";

interface Permission {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
}

interface GroupedPermissions {
  [category: string]: Permission[];
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  is_default: boolean;
  users_count: number;
  permissions: number[];
  created_at: string;
}

interface PermissionsIndexProps {
  roles: Role[];
  permissions: GroupedPermissions;
}

export default function PermissionsIndex({ roles, permissions }: PermissionsIndexProps) {
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'role' | 'permission'; item: Role | Permission } | null>(null);

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Permission Management", href: "/permissions" }
  ];

  const categoryNames: { [key: string]: string } = {
    upload: "Upload",
    validation: "Validation",
    history: "History",
    details: "Details",
    management: "Management",
    settings: "Settings",
  };

  const categoryColors: { [key: string]: string } = {
    upload: "bg-blue-100 text-blue-800",
    validation: "bg-green-100 text-green-800",
    history: "bg-purple-100 text-purple-800",
    details: "bg-orange-100 text-orange-800",
    management: "bg-red-100 text-red-800",
    settings: "bg-gray-100 text-gray-800",
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setIsRoleDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsRoleDialogOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    setItemToDelete({ type: 'role', item: role });
    setIsDeleteDialogOpen(true);
  };

  const handleAddPermission = () => {
    setSelectedPermission(null);
    setIsPermissionDialogOpen(true);
  };

  const handleEditPermission = (permission: Permission) => {
    setSelectedPermission(permission);
    setIsPermissionDialogOpen(true);
  };

  const handleDeletePermission = (permission: Permission) => {
    setItemToDelete({ type: 'permission', item: permission });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'role') {
      router.delete(route('permissions.roles.destroy', (itemToDelete.item as Role).id), {
        onSuccess: () => {
          toast.success('Role deleted successfully');
          setIsDeleteDialogOpen(false);
          setItemToDelete(null);
        },
        onError: (errors) => {
          toast.error(errors.role || 'Failed to delete role');
        },
      });
    } else {
      router.delete(route('permissions.permissions.destroy', (itemToDelete.item as Permission).id), {
        onSuccess: () => {
          toast.success('Permission deleted successfully');
          setIsDeleteDialogOpen(false);
          setItemToDelete(null);
        },
        onError: (errors) => {
          toast.error(errors.permission || 'Failed to delete permission');
        },
      });
    }
  };

  const getPermissionsByIds = (permissionIds: number[]): Permission[] => {
    const allPermissions: Permission[] = [];
    Object.values(permissions).forEach(categoryPerms => {
      allPermissions.push(...categoryPerms);
    });
    return allPermissions.filter(p => permissionIds.includes(p.id));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Permission Management" />
      <Toaster position="top-right" richColors />

      <div className="w-full px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-3">
              <Shield className="text-blue-600" />
              Permission Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage roles and permissions for users
            </p>
          </div>
        </div>

        {/* Roles Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Roles</CardTitle>
                <CardDescription>Manage user roles and their permissions</CardDescription>
              </div>
              <Button onClick={handleAddRole}>
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <Card key={role.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {role.display_name}
                          {role.is_default && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{role.name}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {role.name !== 'super_admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRole(role)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{role.description || 'No description'}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{role.users_count} users</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-2">{role.permissions.length} Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {getPermissionsByIds(role.permissions).slice(0, 3).map((perm) => (
                          <Badge key={perm.id} variant="outline" className="text-xs">
                            {perm.display_name}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Permissions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>Manage system permissions</CardDescription>
              </div>
              <Button onClick={handleAddPermission} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Permission
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(permissions).map(([category, perms]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Badge className={categoryColors[category] || "bg-gray-100 text-gray-800"}>
                    {categoryNames[category] || category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">({perms.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {perms.map((permission) => (
                    <Card key={permission.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{permission.display_name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{permission.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{permission.description || 'No description'}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPermission(permission)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePermission(permission)}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <RoleDialog
        isOpen={isRoleDialogOpen}
        onClose={() => setIsRoleDialogOpen(false)}
        role={selectedRole}
        permissions={permissions}
      />

      <PermissionDialog
        isOpen={isPermissionDialogOpen}
        onClose={() => setIsPermissionDialogOpen(false)}
        permission={selectedPermission}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {itemToDelete?.type}?
              {itemToDelete?.type === 'role' && ' This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
