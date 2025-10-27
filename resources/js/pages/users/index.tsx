import { useState, useMemo } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Button } from "@/components/ui/button";
import { Search, Plus, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import AddUserDialog from "@/components/AddUserDialog";
import EditUserDialog from "@/components/EditUserDialog";
import UserTable from "@/components/UserTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { BreadcrumbItem } from "@/types";

interface UserType {
  id: number;
  name: string;
  email: string;
  role: string;
  is_online: boolean;
  created_at: string;
}

export default function UsersIndex({ users }: { users: UserType[] }) {
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const breadcrumbs: BreadcrumbItem[] = [{ title: "User Management", href: "/users" }];

  const fetchUsers = () => window.location.reload();

  const handleDeleteClick = (user: UserType) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    router.delete(route("users.destroy", userToDelete.id), {
      onSuccess: () => {
        toast.success("User berhasil dihapus!");
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        fetchUsers();
      },
      onError: () => toast.error("Gagal menghapus user."),
    });
  };

  // Filter dan urutkan: online dulu, offline bawah
  const processedUsers = useMemo(() => {
    return users
      .filter((u) =>
        [u.name, u.email, u.role].some((f) => f.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => Number(b.is_online) - Number(a.is_online));
  }, [users, search]);

  const paginatedUsers = processedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(processedUsers.length / itemsPerPage);

  const totalUsers = users.length;
  const onlineUsers = users.filter((u) => u.is_online).length;
  const offlineUsers = totalUsers - onlineUsers;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="User Management" />
      <Toaster position="top-right" richColors />

      <div className="w-full px-6 py-6 space-y-6">
        {/* Header - Now without search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-3">
              <User className="text-blue-600" />
              User Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola data pengguna sistem — dengan mudah.
            </p>
          </div>

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah User
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border">
            <CardContent className="py-6 text-center">
              <h3 className="text-sm text-muted-foreground">Total Users</h3>
              <p className="text-2xl font-bold text-blue-600">{totalUsers}</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="py-6 text-center">
              <h3 className="text-sm text-muted-foreground">Online</h3>
              <p className="text-2xl font-bold text-green-600">{onlineUsers}</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="py-6 text-center">
              <h3 className="text-sm text-muted-foreground">Offline</h3>
              <p className="text-2xl font-bold text-gray-600">{offlineUsers}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table area with search moved inside */}
        <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b dark:border-gray-800">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Daftar Pengguna</h2>
                <p className="text-sm text-muted-foreground">{processedUsers.length} hasil</p>
              </div>
              
              {/* Search box moved here */}
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, email, atau role..."
                  className="pl-10 pr-10"
                />
                {search && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1.5 h-8 w-8 rounded-md"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4">
            <UserTable 
              users={paginatedUsers} 
              onEdit={(u) => { setSelectedUser(u); setIsEditModalOpen(true); }} 
              onDelete={handleDeleteClick} 
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t dark:border-gray-800 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah & Edit */}
      <AddUserDialog open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onUserAdded={fetchUsers} />
      {selectedUser && <EditUserDialog open={isEditModalOpen} onClose={() => { setSelectedUser(null); setIsEditModalOpen(false); }} user={selectedUser} />}

      {/* Modal Hapus */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
          </DialogHeader>
          <p className="py-2 text-sm text-muted-foreground">
            Apakah Anda yakin ingin menghapus <span className="font-semibold">{userToDelete?.name}</span>? Tindakan ini tidak bisa dibatalkan.
          </p>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
