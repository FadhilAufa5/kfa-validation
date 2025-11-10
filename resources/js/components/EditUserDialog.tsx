import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface RoleType {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
}

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  roles: RoleType[];
}

export default function EditUserDialog({ open, onClose, user, roles }: EditUserDialogProps) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    role_id: null as number | null,
  });
  const [errors, setErrors] = useState({
    email: "",
  });

  useEffect(() => {
    // Find the role_id based on the current role name
    const currentRole = roles.find(r => r.name === user.role);
    setForm({ 
      name: user.name, 
      email: user.email, 
      role: user.role,
      role_id: currentRole?.id || null,
    });
  }, [user, roles]);

  const handleSave = () => {
    if (!form.name || !form.email) {
      toast.error("Nama dan Email wajib diisi!");
      return;
    }

    router.put(
      route("users.update", user.id),
      form,
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success("User berhasil diperbarui!");
          onClose();
        },
        onError: (errors) => {
          toast.error("Gagal memperbarui user: " + JSON.stringify(errors));
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <p className='text-sm text-gray-500'>Perbarui informasi user</p>
          
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>Nama</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <Label>Role</Label>
            <Select
              value={form.role_id?.toString() || ""}
              onValueChange={(value) => {
                const selectedRole = roles.find(r => r.id === parseInt(value));
                if (selectedRole) {
                  setForm({ 
                    ...form, 
                    role: selectedRole.name,
                    role_id: selectedRole.id,
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{role.display_name}</span>
                      {role.name === 'super_admin' && (
                        <Badge variant="secondary" className="text-xs">Admin</Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {role.description}
                      </p>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.role_id && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {roles.find(r => r.id === form.role_id)?.display_name}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
