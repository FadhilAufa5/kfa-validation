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
import { AlertCircle, Shield } from "lucide-react";
import { router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { toast } from "sonner";

interface Permission {
    id: number;
    name: string;
    display_name: string;
    description: string | null;
}

interface GroupedPermissions {
    [category: string]: Permission[];
}

interface RoleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    role: {
        id?: number;
        name?: string;
        display_name?: string;
        description?: string;
        permissions?: number[];
    } | null;
    permissions: GroupedPermissions;
}

const categoryNames: { [key: string]: string } = {
    upload: "Upload",
    validation: "Validation",
    history: "History",
    details: "Details",
    management: "Management",
    settings: "Settings",
};

const categoryColors: { [key: string]: string } = {
    upload: "border-blue-200 bg-blue-50",
    validation: "border-green-200 bg-green-50",
    history: "border-purple-200 bg-purple-50",
    details: "border-orange-200 bg-orange-50",
    management: "border-red-200 bg-red-50",
    settings: "border-gray-200 bg-gray-50",
};

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
        permission_ids: [] as number[],
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (role) {
            setFormData({
                name: role.name || "",
                display_name: role.display_name || "",
                description: role.description || "",
                permission_ids: role.permissions || [],
            });
        } else {
            setFormData({
                name: "",
                display_name: "",
                description: "",
                permission_ids: [],
            });
        }
        setErrors({});
    }, [role, isOpen]);

    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            permission_ids: checked
                ? [...prev.permission_ids, permissionId]
                : prev.permission_ids.filter(id => id !== permissionId),
        }));
    };

    const handleCategoryChange = (category: string, checked: boolean) => {
        const categoryPermissions = permissions[category] || [];
        if (checked) {
            setFormData(prev => ({
                ...prev,
                permission_ids: [
                    ...prev.permission_ids,
                    ...categoryPermissions.map(p => p.id).filter(id => !prev.permission_ids.includes(id))
                ],
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                permission_ids: prev.permission_ids.filter(id => 
                    !categoryPermissions.some(p => p.id === id)
                ),
            }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!role && !formData.name.trim()) {
            newErrors.name = "Role name is required";
        } else if (!role && !/^[a-z0-9_]+$/.test(formData.name)) {
            newErrors.name = "Role name must contain only lowercase letters, numbers, and underscores";
        }

        if (!formData.display_name.trim()) {
            newErrors.display_name = "Display name is required";
        }

        if (formData.permission_ids.length === 0) {
            newErrors.permission_ids = "At least one permission must be selected";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        const url = role 
            ? route('permissions.roles.update', role.id)
            : route('permissions.roles.store');
        
        const method = role ? 'PUT' : 'POST';

        router[method](url, formData, {
            onSuccess: () => {
                toast.success(
                    role 
                        ? "Role updated successfully!" 
                        : "Role created successfully!"
                );
                onClose();
                setIsSubmitting(false);
            },
            onError: (errors) => {
                setErrors(errors);
                const errorMessage = typeof errors === 'string' 
                    ? errors 
                    : errors?.message || "Failed to save role. Please check the form for errors.";
                toast.error(errorMessage);
                setIsSubmitting(false);
            },
        });
    };

    const isCategoryFullySelected = (category: string) => {
        const categoryPermissions = permissions[category] || [];
        return categoryPermissions.length > 0 && 
            categoryPermissions.every(p => formData.permission_ids.includes(p.id));
    };

    const isCategoryPartiallySelected = (category: string) => {
        const categoryPermissions = permissions[category] || [];
        return categoryPermissions.some(p => formData.permission_ids.includes(p.id)) &&
            !isCategoryFullySelected(category);
    };

    const selectedCount = formData.permission_ids.length;
    const totalPermissions = Object.values(permissions).flat().length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {role ? "Edit Role" : "Add New Role"}
                    </DialogTitle>
                    <DialogDescription>
                        {role 
                            ? "Update role details and permissions"
                            : "Create a new role and assign permissions"
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Role Name */}
                    {!role && (
                        <div className="space-y-2">
                            <Label htmlFor="name">Role Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., content_manager"
                                className={errors.name ? "border-red-500" : ""}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.name}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Display Name */}
                    <div className="space-y-2">
                        <Label htmlFor="display_name">Display Name *</Label>
                        <Input
                            id="display_name"
                            value={formData.display_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                            placeholder="e.g., Content Manager"
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
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe the role's purpose and responsibilities..."
                            rows={3}
                        />
                    </div>

                    {/* Permission Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Permissions ({selectedCount}/{totalPermissions} selected)</Label>
                            {errors.permission_ids && (
                                <p className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.permission_ids}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            {Object.entries(permissions).map(([category, categoryPermissions]) => (
                                <div
                                    key={category}
                                    className={`border rounded-lg p-3 ${categoryColors[category]}`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`category-${category}`}
                                                checked={isCategoryFullySelected(category)}
                                                onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                                                className={isCategoryPartiallySelected(category) ? "opacity-50" : ""}
                                            />
                                            <Label
                                                htmlFor={`category-${category}`}
                                                className="font-medium cursor-pointer"
                                            >
                                                {categoryNames[category] || category}
                                            </Label>
                                            <span className="text-sm text-muted-foreground">
                                                ({categoryPermissions.length})
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {categoryPermissions.filter(p => formData.permission_ids.includes(p.id)).length} selected
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 ml-6">
                                        {categoryPermissions.map((permission) => (
                                            <div key={permission.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`permission-${permission.id}`}
                                                    checked={formData.permission_ids.includes(permission.id)}
                                                    onCheckedChange={(checked) => 
                                                        handlePermissionChange(permission.id, checked as boolean)
                                                    }
                                                />
                                                <div className="flex-1">
                                                    <Label
                                                        htmlFor={`permission-${permission.id}`}
                                                        className="text-sm cursor-pointer leading-none"
                                                    >
                                                        {permission.display_name}
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {permission.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <h5 className="font-medium text-sm text-blue-800 mb-1">
                            <Shield className="h-4 w-4 inline mr-1" />
                            Role Guidelines
                        </h5>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Role name can only contain lowercase letters, numbers, and underscores</li>
                            <li>• Role name cannot be changed after creation</li>
                            <li>• Assign only necessary permissions for security</li>
                            <li>• Consider the principle of least privilege</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting 
                            ? (role ? "Updating..." : "Creating...") 
                            : (role ? "Update Role" : "Create Role")
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
