'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

interface RoleType {
    id: number;
    name: string;
    display_name: string;
    description: string | null;
}

interface AddUserDialogProps {
    open: boolean;
    onClose: () => void;
    onUserAdded: () => void;
    roles: RoleType[];
}

export default function AddUserDialog({
    open,
    onClose,
    onUserAdded,
    roles,
}: AddUserDialogProps) {
    // Get default role (user role)
    const defaultRole =
        roles.find((r) => r.is_default) ||
        roles.find((r) => r.name === 'user') ||
        roles[0];

    const [form, setForm] = useState({
        name: '',
        email: '',
        role: defaultRole?.name || 'user',
        role_id: defaultRole?.id || (null as number | null),
        password: '',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [checkingEmail, setCheckingEmail] = useState(false);

    // Check if selected role is super_admin
    const isSuperAdminRole = form.role === 'super_admin';

    useEffect(() => {
        if (!form.email) {
            setErrors((prev) => ({ ...prev, email: '' }));
            setCheckingEmail(false);
            return;
        }

        const delay = setTimeout(async () => {
            setCheckingEmail(true);
            try {
                await axios.post(
                    route('users.check-email'),
                    { email: form.email },
                    {
                        headers: {
                            'X-CSRF-TOKEN':
                                document
                                    .querySelector('meta[name="csrf-token"]')
                                    ?.getAttribute('content') || '',
                        },
                    },
                );
                setErrors((prev) => ({ ...prev, email: '' }));
            } catch (err: any) {
                if (err.response && err.response.status === 422) {
                    setErrors((prev) => ({
                        ...prev,
                        email: 'Email sudah digunakan',
                    }));
                }
            } finally {
                setCheckingEmail(false);
            }
        }, 500);

        return () => clearTimeout(delay);
    }, [form.email]);

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async () => {
        // Only validate password if user is super_admin
        if (isSuperAdminRole && form.password.length < 6) {
            setErrors((prev) => ({
                ...prev,
                password: 'Password minimal 6 karakter',
            }));
            return;
        }
        if (errors.email) return;

        try {
            // Prepare data - only include password for super_admin
            const submitData = isSuperAdminRole
                ? form
                : {
                      name: form.name,
                      email: form.email,
                      role: form.role,
                      role_id: form.role_id,
                  };

            await axios.post(route('users.store'), submitData, {
                headers: {
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });
            toast.success('User berhasil ditambahkan!');
            setForm({
                name: '',
                email: '',
                role: defaultRole?.name || 'user',
                role_id: defaultRole?.id || null,
                password: '',
            });
            onClose();
            onUserAdded();
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.errors) {
                const serverErrors = Object.keys(
                    err.response.data.errors,
                ).reduce((acc: any, key: string) => {
                    acc[key] = err.response.data.errors[key][0];
                    return acc;
                }, {});
                setErrors(serverErrors);
            } else {
                toast.error('Gagal menambahkan user.');
            }
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) onClose();
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Tambah User Baru</DialogTitle>
                    <DialogDescription>
                        Isi data user baru di form berikut.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                    className="grid gap-4 py-4"
                >
                    <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="name">Nama</Label>
                        <Input
                            id="name"
                            value={form.name}
                            onChange={(e) =>
                                handleChange('name', e.target.value)
                            }
                            placeholder="Nama lengkap"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) =>
                                handleChange('email', e.target.value)
                            }
                            placeholder="email@domain.com"
                        />
                        {checkingEmail && (
                            <p className="text-sm text-muted-foreground">
                                Memeriksa email...
                            </p>
                        )}
                        {errors.email && (
                            <p className="text-sm text-red-500">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={form.role_id?.toString() || ''}
                            onValueChange={(value) => {
                                const selectedRole = roles.find(
                                    (r) => r.id === parseInt(value),
                                );
                                if (selectedRole) {
                                    setForm({
                                        ...form,
                                        role: selectedRole.name,
                                        role_id: selectedRole.id,
                                    });
                                }
                            }}
                        >
                            <SelectTrigger id="role" className="w-full">
                                <SelectValue placeholder="Pilih role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem
                                        key={role.id}
                                        value={role.id.toString()}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {role.display_name}
                                            </span>
                                            {role.name === 'super_admin' && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    Admin
                                                </Badge>
                                            )}
                                        </div>
                                        {role.description && (
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {role.description}
                                            </p>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {form.role_id && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                Selected:{' '}
                                {
                                    roles.find((r) => r.id === form.role_id)
                                        ?.display_name
                                }
                            </p>
                        )}
                    </div>

                    {/* Password field - only show for super_admin */}
                    {isSuperAdminRole && (
                        <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={(e) =>
                                    handleChange('password', e.target.value)
                                }
                                placeholder="Minimal 6 karakter"
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">
                                    {errors.password}
                                </p>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => onClose()}
                        >
                            Batal
                        </Button>
                        <Button
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            type="submit"
                        >
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
