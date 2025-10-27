"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { route } from "ziggy-js";

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

export default function AddUserDialog({ open, onClose, onUserAdded }: AddUserDialogProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "user",
    password: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    if (!form.email) {
      setErrors(prev => ({ ...prev, email: "" }));
      setCheckingEmail(false);
      return;
    }

    const delay = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        await axios.post(
          route("users.check-email"),
          { email: form.email },
          {
            headers: {
              "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
            },
          }
        );
        setErrors(prev => ({ ...prev, email: "" }));
      } catch (err: any) {
        if (err.response && err.response.status === 422) {
          setErrors(prev => ({ ...prev, email: "Email sudah digunakan" }));
        }
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [form.email]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async () => {
    if (form.password.length < 6) {
      setErrors(prev => ({ ...prev, password: "Password minimal 6 karakter" }));
      return;
    }
    if (errors.email) return;

    try {
      await axios.post(
        route("users.store"),
        form,
        {
          headers: {
            "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "",
          },
        }
      );
      toast.success("User berhasil ditambahkan!");
      setForm({ name: "", email: "", role: "user", password: "" });
      onClose();
      onUserAdded();
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.errors) {
        const serverErrors = Object.keys(err.response.data.errors).reduce((acc: any, key: string) => {
          acc[key] = err.response.data.errors[key][0];
          return acc;
        }, {});
        setErrors(serverErrors);
      } else {
        toast.error("Gagal menambahkan user.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
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
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Nama lengkap"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@domain.com"
            />
            {checkingEmail && <p className="text-sm text-muted-foreground">Memeriksa email...</p>}
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="role">Role</Label>
            <Select value={form.role} onValueChange={(v) => handleChange("role", v)}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super-admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Minimal 6 karakter"
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>

        <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => onClose()}>
              Batal
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" type="submit">
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}