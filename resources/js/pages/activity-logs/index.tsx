import { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head, router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Search, Activity, Filter, X, Calendar, User as UserIcon, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { BreadcrumbItem } from "@/types";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ActivityLogType {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_role: string | null;
  action: string;
  category: string | null;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: User | null;
}

interface PaginatedLogs {
  data: ActivityLogType[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Filters {
  search?: string;
  action?: string;
  category?: string;
  user_role?: string;
  date_from?: string;
  date_to?: string;
}

export default function ActivityLogsIndex({ 
  logs, 
  actions,
  categories,
  roles,
  filters 
}: { 
  logs: PaginatedLogs;
  actions: string[];
  categories: string[];
  roles: string[];
  filters: Filters;
}) {
  const [search, setSearch] = useState(filters.search || "");
  const [selectedAction, setSelectedAction] = useState(filters.action || "");
  const [selectedCategory, setSelectedCategory] = useState(filters.category || "");
  const [selectedRole, setSelectedRole] = useState(filters.user_role || "");
  const [dateFrom, setDateFrom] = useState(filters.date_from || "");
  const [dateTo, setDateTo] = useState(filters.date_to || "");
  const [showFilters, setShowFilters] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [{ title: "Log Aktivitas", href: "/activity-logs" }];

  const applyFilters = () => {
    router.get("/activity-logs", {
      search,
      action: selectedAction,
      category: selectedCategory,
      user_role: selectedRole,
      date_from: dateFrom,
      date_to: dateTo,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedAction("");
    setSelectedCategory("");
    setSelectedRole("");
    setDateFrom("");
    setDateTo("");
    router.get("/activity-logs");
  };

  const handlePageChange = (page: number) => {
    router.get("/activity-logs", {
      page,
      search,
      action: selectedAction,
      category: selectedCategory,
      user_role: selectedRole,
      date_from: dateFrom,
      date_to: dateTo,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const getActionBadgeColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes("create") || lowerAction.includes("tambah")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (lowerAction.includes("update") || lowerAction.includes("edit")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (lowerAction.includes("delete") || lowerAction.includes("hapus")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (lowerAction.includes("login") || lowerAction.includes("masuk")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    if (lowerAction.includes("logout") || lowerAction.includes("keluar")) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  };

  const getRoleBadgeColor = (role: string | null) => {
    if (!role) return "bg-gray-100 text-gray-800";
    if (role.toLowerCase() === "admin") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  };

  const getCategoryBadgeColor = (category: string | null) => {
    if (!category) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    switch (category) {
      case "Validation":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Login":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "User":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Setting":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Report":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Log Aktivitas" />

      <div className="w-full px-6 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-3">
              <Activity className="text-blue-600" />
              Log Aktivitas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pantau semua aktivitas pengguna dalam sistem
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
          </Button>
        </div>

        <Card className="border">
          <CardContent className="py-4 text-center">
            <h3 className="text-sm text-muted-foreground">Total Log Aktivitas</h3>
            <p className="text-xl font-bold text-blue-600">{logs.total}</p>
          </CardContent>
        </Card>

        {showFilters && (
          <Card className="border">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Pencarian</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari nama, aksi, atau deskripsi..."
                      className="pl-9 py-2 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Kategori</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua kategori</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Aksi</label>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua aksi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua aksi</SelectItem>
                      {actions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semua role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Semua role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Dari Tanggal</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Sampai Tanggal</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" onClick={clearFilters} size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={applyFilters} size="sm">
                  <Search className="w-4 h-4 mr-2" />
                  Terapkan Filter
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium">Waktu</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">User</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Role</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Kategori</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Aksi</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Deskripsi</th>
                  <th className="py-2 text-left text-xs font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-xs text-muted-foreground">
                      Tidak ada log aktivitas
                    </td>
                  </tr>
                ) : (
                  logs.data.map((log) => (
                    <tr 
                      key={log.id}
                      className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.visit(`/activity-logs/${log.id}`)}
                    >
                      <td className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          {log.user_name || "System"}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {log.user_role ? (
                          <Badge className={getRoleBadgeColor(log.user_role)}>
                            {log.user_role}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {log.category ? (
                          <Badge className={getCategoryBadgeColor(log.category)}>
                            {log.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs max-w-md truncate">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{log.description || "-"}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {log.ip_address || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {logs.last_page > 1 && (
            <div className="p-3 border-t dark:border-gray-800 flex items-center justify-between text-sm">
              <div className="text-xs text-muted-foreground">
                Menampilkan {logs.data.length} dari {logs.total} log
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(logs.current_page - 1)}
                  disabled={logs.current_page === 1}
                >
                  Sebelumnya
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, logs.last_page) }).map((_, i) => {
                    let pageNum;
                    if (logs.last_page <= 5) {
                      pageNum = i + 1;
                    } else if (logs.current_page <= 3) {
                      pageNum = i + 1;
                    } else if (logs.current_page >= logs.last_page - 2) {
                      pageNum = logs.last_page - 4 + i;
                    } else {
                      pageNum = logs.current_page - 2 + i;
                    }

                    return (
                      <Button
                        key={i}
                        variant={logs.current_page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(logs.current_page + 1)}
                  disabled={logs.current_page === logs.last_page}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
