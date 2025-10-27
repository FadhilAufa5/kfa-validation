import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { route } from "ziggy-js";

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export default function EditUserDialog({ open, onClose, user }: EditUserDialogProps) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
  });
  const [errors, setErrors] = useState({
    email: "",
  });

  useEffect(() => {
    setForm({ name: user.name, email: user.email, role: user.role });
  }, [user]);

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
              value={form.role}
              onValueChange={(value) => setForm({ ...form, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super-admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
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
