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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { router } from "@inertiajs/react";
import { route } from "ziggy-js";

interface Permission {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  category?: string;
}

interface PermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  permission: Permission | null;
}

export default function PermissionDialog({
  isOpen,
  onClose,
  permission,
}: PermissionDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    category: "",
    description: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: "upload", label: "Upload" },
    { value: "validation", label: "Validation" },
    { value: "history", label: "History" },
    { value: "details", label: "Details" },
    { value: "management", label: "Management" },
    { value: "settings", label: "Settings" },
  ];

  useEffect(() => {
    if (permission) {
      setFormData({
        name: permission.name,
        display_name: permission.display_name,
        category: permission.category || "",
        description: permission.description || "",
      });
    } else {
      setFormData({
        name: "",
        display_name: "",
        category: "",
        description: "",
      });
    }
    setErrors({});
  }, [permission, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name && !permission) {
      newErrors.name = "Permission name is required";
    } else if (formData.name && !/^[a-z0-9_.]+$/.test(formData.name)) {
      newErrors.name = "Permission name must be lowercase letters, numbers, dots, and underscores only";
    }

    if (!formData.display_name) {
      newErrors.display_name = "Display name is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    if (permission) {
      // Update existing permission
      router.put(route("permissions.permissions.update", permission.id), formData, {
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
      // Create new permission
      router.post(route("permissions.permissions.store"), formData, {
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {permission ? "Edit Permission" : "Create New Permission"}
          </DialogTitle>
          <DialogDescription>
            {permission
              ? "Update the permission details"
              : "Create a new permission for the system"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Permission Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Permission Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., reports.view"
              disabled={!!permission}
              className={errors.name ? "border-red-500" : ""}
            />
            {!permission && (
              <p className="text-xs text-muted-foreground">
                Format: category.action (e.g., reports.view, users.edit). Cannot be changed later.
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
              placeholder="e.g., View Reports"
              className={errors.display_name ? "border-red-500" : ""}
            />
            <p className="text-xs text-muted-foreground">
              Human-readable name shown in the UI
            </p>
            {errors.display_name && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.display_name}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Group related permissions together
            </p>
            {errors.category && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.category}
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
              placeholder="Brief description of what this permission allows..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Optional: Explain what this permission controls
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-xs text-blue-900">
              <strong>Note:</strong> After creating a permission, you'll need to assign it to roles in the Roles section.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : permission
              ? "Update Permission"
              : "Create Permission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
