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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Shield } from "lucide-react";
import { router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { toast } from "sonner";

interface PermissionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    permission: {
        id?: number;
        name?: string;
        display_name?: string;
        category?: string;
        description?: string;
    } | null;
}

const categories = [
    { value: 'upload', label: 'Upload' },
    { value: 'validation', label: 'Validation' },
    { value: 'history', label: 'History' },
    { value: 'details', label: 'Details' },
    { value: 'management', label: 'Management' },
    { value: 'settings', label: 'Settings' },
];

const categoryColors: { [key: string]: string } = {
    upload: "text-blue-700 bg-blue-100",
    validation: "text-green-700 bg-green-100",
    history: "text-purple-700 bg-purple-100",
    details: "text-orange-700 bg-orange-100",
    management: "text-red-700 bg-red-100",
    settings: "text-gray-700 bg-gray-100",
};

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
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (permission) {
            setFormData({
                name: permission.name || "",
                display_name: permission.display_name || "",
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

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!permission && !formData.name.trim()) {
            newErrors.name = "Permission name is required";
        } else if (!permission && !/^[a-z0-9_.]+$/.test(formData.name)) {
            newErrors.name = "Permission name must contain only lowercase letters, numbers, dots, and underscores";
        } else if (!permission && !formData.name.includes('.')) {
            newErrors.name = "Permission name must follow format: category.action (e.g., upload.files)";
        }

        if (!formData.display_name.trim()) {
            newErrors.display_name = "Display name is required";
        }

        if (!formData.category.trim()) {
            newErrors.category = "Category is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        const url = permission 
            ? route('permissions.permissions.update', permission.id)
            : route('permissions.permissions.store');
        
        const method = permission ? 'PUT' : 'POST';

        router[method](url, formData, {
            onSuccess: () => {
                toast.success(
                    permission 
                        ? "Permission updated successfully!" 
                        : "Permission created successfully!"
                );
                onClose();
                setIsSubmitting(false);
            },
            onError: (errors) => {
                setErrors(errors);
                toast.error("Failed to save permission. Please check the form for errors.");
                setIsSubmitting(false);
            },
        });
    };

    const getCategoryName = (category: string) => {
        const cat = categories.find(c => c.value === category);
        return cat ? cat.label : category;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {permission ? "Edit Permission" : "Add New Permission"}
                    </DialogTitle>
                    <DialogDescription>
                        {permission 
                            ? "Update permission details"
                            : "Create a new system permission"
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Permission Name */}
                    {!permission && (
                        <div className="space-y-2">
                            <Label htmlFor="name">Permission Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., upload.files"
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
                            placeholder="e.g., Upload Files"
                            className={errors.display_name ? "border-red-500" : ""}
                        />
                        {errors.display_name && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.display_name}
                            </p>
                        )}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        >
                            <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.value} value={category.value}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${categoryColors[category.value]}`}
                                            >
                                                {category.label}
                                            </span>
                                            {category.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe what this permission allows users to do..."
                            rows={3}
                        />
                    </div>

                    {/* Current Permission Info (when editing) */}
                    {permission && (
                        <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium">Permission Details</p>
                            <div className="mt-2 space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    <strong>Name:</strong> {permission.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    <strong>Category:</strong> {getCategoryName(permission.category || "")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    <strong>Display Name:</strong> {permission.display_name}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <h5 className="font-medium text-sm text-blue-800 mb-1">
                            <Shield className="h-4 w-4 inline mr-1" />
                            Permission Guidelines
                        </h5>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Use format: category.action (e.g., upload.files)</li>
                            <li>• Use lowercase letters, numbers, dots, and underscores only</li>
                            <li>• Permission name cannot be changed after creation</li>
                            <li>• Categories help organize permissions in the UI</li>
                            <li>• Clear descriptions help users understand permissions</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting 
                            ? (permission ? "Updating..." : "Creating...") 
                            : (permission ? "Update Permission" : "Create Permission")
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
