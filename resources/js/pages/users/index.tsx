"use client";

import { Head, Link } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, Eye, Search, Plus, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { type BreadcrumbItem } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface UserType {
  id: number;
  name: string;
  email: string;
  role: string;
  is_online: boolean;
  created_at: string;
}

const RoleBadge = ({ role }: { role: string }) => {
  const roleClasses = cn(
    "px-2 py-1 text-xs font-semibold rounded-full capitalize",
    {
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200":
        role === "super-admin",
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200":
        role === "admin",
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200":
        role === "user",
    }
  );

  return <span className={roleClasses}>{role.replace("-", " ")}</span>;
};

export default function UsersIndex({ users }: { users: UserType[] }) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "User Management", href: "/users" },
  ];

  // Filter dan urutkan data
  const processedUsers = useMemo(() => {
    return users
      .filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.role.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => Number(b.is_online) - Number(a.is_online));
  }, [users, search]);

  // Pagination logic
  const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
  const paginatedUsers = processedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistik user
  const totalUsers = users.length;
  const onlineUsers = users.filter((u) => u.is_online).length;
  const offlineUsers = totalUsers - onlineUsers;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="User Management" />

      <div className="flex flex-col gap-6 p-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="text-blue-500 dark:text-blue-400" />
              User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Kelola data pengguna sistem di sini.
            </p>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Tambah User
          </Button>
        </div>

        {/* Statistik Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardContent className="py-5 text-center">
              <h3 className="text-sm text-gray-500 dark:text-gray-400">
                Total Users
              </h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalUsers}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="py-5 text-center">
              <h3 className="text-sm text-gray-500 dark:text-gray-400">
                Online
              </h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {onlineUsers}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="py-5 text-center">
              <h3 className="text-sm text-gray-500 dark:text-gray-400">
                Offline
              </h3>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                {offlineUsers}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari berdasarkan nama, email, atau role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
          />
        </div>

        {/* Table */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200/60 dark:bg-gray-900/60">
                {[
                  "Name",
                  "Status",
                  "Email",
                  "Role",
                  "Created At",
                  "Action",
                ].map((head) => (
                  <TableHead
                    key={head}
                    className="px-4 py-3 text-gray-700 dark:text-gray-200"
                  >
                    {head}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="even:bg-gray-50 dark:even:bg-gray-900/30"
                  >
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn("h-2 w-2 rounded-full", {
                            "bg-green-500 animate-pulse": user.is_online,
                            "bg-gray-400": !user.is_online,
                          })}
                        ></span>
                        <span className="text-sm">
                          {user.is_online ? "Online" : "Offline"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/users/${user.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Eye className="w-4 h-4 mr-1" /> Detail
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-6 text-gray-500"
                  >
                    Tidak ada user ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
