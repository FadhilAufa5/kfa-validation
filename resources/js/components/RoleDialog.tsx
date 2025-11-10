import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { router } from "@inertiajs/react";
import { route } from "ziggy-js";

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

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  permissions: GroupedPermissions;
}

export default function RoleDialog({
  isOpen,
  onClose,
  role,
  permissions,
}: RoleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    description: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description || "",
      });
      setSelectedPermissions(role.permissions);
    } else {
      setFormData({
        name: "",
        display_name: "",
        description: "",
      });
      setSelectedPermissions([]);
    }
    setErrors({});
  }, [role, isOpen]);

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSelectAllInCategory = (categoryPerms: Permission[]) => {
    const categoryPermIds = categoryPerms.map((p) => p.id);
    const allSelected = categoryPermIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !categoryPermIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...categoryPermIds])]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name && !role) {
      newErrors.name = "Role name is required";
    } else if (formData.name && !/^[a-z0-9_]+$/.test(formData.name)) {
      newErrors.name = "Role name must be lowercase letters, numbers, and underscores only";
    }

    if (!formData.display_name) {
      newErrors.display_name = "Display name is required";
    }

    if (selectedPermissions.length === 0) {
      newErrors.permissions = "At least one permission must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const data = {
      ...formData,
      permission_ids: selectedPermissions,
    };

    if (role) {
      // Update existing role
      router.put(route("permissions.roles.update", role.id), data, {
        onSuccess: () => {
          onClose();
          setIsSubmitting(false);
        },
        onError: (errors) => {
          setErrors(errors as { [key: string]: string });
          setIsSubmitting(false);
        },
      });
    } else {
      // Create new role
      router.post(route("permissions.roles.store"), data, {
        onSuccess: () => {
          onClose();
          setIsSubmitting(false);
        },
        onError: (errors) => {
          setErrors(errors as { [key: string]: string });
          setIsSubmitting(false);
        },
      });
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role" : "Create New Role"}</DialogTitle>
          <DialogDescription>
            {role
              ? "Update the role details and permissions"
              : "Create a new role and assign permissions"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Role Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Role Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., manager"
              disabled={!!role}
              className={errors.name ? "border-red-500" : ""}
            />
            {!role && (
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and underscores only. Cannot be changed later.
              </p>
            )}
            {errors.name && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name">
              Display Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="e.g., Manager"
              className={errors.display_name ? "border-red-500" : ""}
            />
            {errors.display_name && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.display_name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of this role..."
              rows={3}
            />
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <Label>
              Permissions <span className="text-red-500">*</span>
            </Label>
            {errors.permissions && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.permissions}
              </p>
            )}
            <div className="border rounded-lg p-4 space-y-4 max-h-[400px] overflow-y-auto">
              {Object.entries(permissions).map(([category, categoryPerms]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={categoryColors[category] || "bg-gray-100 text-gray-800"}>
                      {categoryNames[category] || category}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAllInCategory(categoryPerms)}
                    >
                      {categoryPerms.every((p) => selectedPermissions.includes(p.id))
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>
                  <div className="space-y-2 pl-2">
                    {categoryPerms.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`permission-${permission.id}`}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => handlePermissionToggle(permission.id)}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`permission-${permission.id}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {permission.display_name}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description || permission.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedPermissions.length} permission(s) selected
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : role ? "Update Role" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
