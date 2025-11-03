import { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import { Button } from "@/components/ui/button";
import { Search, Plus, User, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import AddUserDialog from "@/components/AddUserDialog";
import EditUserDialog from "@/components/EditUserDialog";
import UserTable from "@/components/UserTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BreadcrumbItem } from "@/types";

interface UserType {
  id: number;
  name: string;
  email: string;
  role: string;
  is_online: boolean;
  created_at: string;
}

interface PaginatedUsers {
  data: UserType[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Statistics {
  total: number;
  online: number;
  offline: number;
}

export default function UsersIndex({ 
  users, 
  availableRoles, 
  filters,
  statistics
}: { 
  users: PaginatedUsers; 
  availableRoles: string[];
  filters: { search?: string; role?: string };
  statistics: Statistics;
}) {
  const [search, setSearch] = useState(filters.search || "");
  const [selectedRole, setSelectedRole] = useState<string>(filters.role || "all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFilterChange();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

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
      },
      onError: () => toast.error("Gagal menghapus user."),
    });
  };

  // Handle filter change (both search and role)
  const handleFilterChange = () => {
    const params: { search?: string; role?: string; page?: number } = {};
    
    if (search) params.search = search;
    if (selectedRole && selectedRole !== "all") params.role = selectedRole;
    
    router.get(route("users.index"), params, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  // Handle role filter change
  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    
    const params: { search?: string; role?: string } = {};
    if (search) params.search = search;
    if (value && value !== "all") params.role = value;
    
    router.get(route("users.index"), params, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const params: { search?: string; role?: string; page: number } = { page };
    
    if (search) params.search = search;
    if (selectedRole && selectedRole !== "all") params.role = selectedRole;
    
    router.get(route("users.index"), params, {
      preserveScroll: true,
      preserveState: true,
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearch("");
    setSelectedRole("all");
    router.get(route("users.index"), {}, {
      preserveScroll: true,
    });
  };

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
              <p className="text-2xl font-bold text-blue-600">{statistics.total}</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="py-6 text-center">
              <h3 className="text-sm text-muted-foreground">Online</h3>
              <p className="text-2xl font-bold text-green-600">{statistics.online}</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="py-6 text-center">
              <h3 className="text-sm text-muted-foreground">Offline</h3>
              <p className="text-2xl font-bold text-gray-600">{statistics.offline}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table area with search and filter */}
        <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b dark:border-gray-800">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Daftar Pengguna</h2>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">{users.total} hasil</p>
                  {(search || (selectedRole && selectedRole !== "all")) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClearFilters}
                      className="text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Search box and Role filter */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama atau email..."
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

                {/* Role Filter */}
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <Select value={selectedRole || "all"} onValueChange={handleRoleChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Role</SelectItem>
                      {availableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <UserTable 
              users={users.data} 
              onEdit={(u) => { setSelectedUser(u); setIsEditModalOpen(true); }} 
              onDelete={handleDeleteClick} 
            />
          </div>

          {/* Pagination */}
          {users.last_page > 1 && (
            <div className="p-4 border-t dark:border-gray-800 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Halaman {users.current_page} dari {users.last_page}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(users.current_page - 1)}
                  disabled={users.current_page === 1}
                >
                  Previous
                </Button>
                
                {Array.from({ length: users.last_page }).map((_, i) => {
                  const page = i + 1;
                  // Show first, last, current, and adjacent pages
                  if (
                    page === 1 ||
                    page === users.last_page ||
                    (page >= users.current_page - 1 && page <= users.current_page + 1)
                  ) {
                    return (
                      <Button
                        key={i}
                        variant={users.current_page === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === users.current_page - 2 || page === users.current_page + 2) {
                    return <span key={i} className="px-2">...</span>;
                  }
                  return null;
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(users.current_page + 1)}
                  disabled={users.current_page === users.last_page}
                >
                  Next
                </Button>
              </div>
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
