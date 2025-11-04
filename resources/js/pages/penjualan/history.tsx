"use client";

import { Link, Head, router } from "@inertiajs/react";
import { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Folder, Plus, Eye, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";
import { type BreadcrumbItem } from "@/types";
import axios from "axios";

interface ValidationLog {
    id: number;
    user: string;
    fileName: string;
    documentCategory: string;
    uploadTime: string;
    score: string;
    status: 'Valid' | 'Invalid' | 'Processing' | 'Failed';
    processing_status?: string;
    processing_details?: any;
}


export const CircularScore = ({ score }: { score: string }) => {
  const numericScore = parseInt(score.replace("%", ""), 10);
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setProgress((numericScore / 100) * circumference);
    }, 150);
    return () => clearTimeout(timeout);
  }, [numericScore, circumference]);

  const isComplete = numericScore === 100;

  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <svg className="rotate-[-90deg]" width="50" height="50">
        {/* Background Track - abu abu putus-putus */}
        <circle
          cx="25"
          cy="25"
          r={radius}
          strokeWidth="4"
          fill="none"
          strokeDasharray="3 4"
          className="stroke-gray-300 dark:stroke-gray-700"
        />

        {/* Progress Line - biru */}
        <circle
          cx="25"
          cy="25"
          r={radius}
          strokeWidth="4"
          fill="none"
          className={`transition-all duration-700 ease-out ${
            isComplete
              ? "stroke-blue-500 dark:stroke-blue-400"
              : "stroke-red-400 dark:stroke-red-400"
          }`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>

      {/* Center Text */}
      <span
        className={`absolute text-xs font-semibold ${
          isComplete
            ? "text-blue-600 dark:text-blue-400"
            : "text-gray-600 dark:text-gray-300"
        }`}
      >
        {numericScore}%
      </span>
    </div>
  );
};

export default function ValidationLogPage() {
  const [logs, setLogs] = useState<ValidationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Valid" | "Invalid" | "Processing" | "Failed">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
    from: 0,
    to: 0,
  });
  const [previousProcessingIds, setPreviousProcessingIds] = useState<number[]>([]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);

  useEffect(() => {
    fetchLogs();
  }, [search, filterStatus, currentPage]);

  // Auto-refresh for processing jobs
  useEffect(() => {
    const hasProcessingJobs = logs.some(log => log.status === 'Processing');
    
    if (hasProcessingJobs) {
      const interval = setInterval(() => {
        fetchLogs();
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [logs]);

  // Track completed jobs and show notifications
  useEffect(() => {
    const currentProcessingIds = logs
      .filter(log => log.status === 'Processing')
      .map(log => log.id);
    
    // Find jobs that were processing but are now completed
    const completedIds = previousProcessingIds.filter(
      id => !currentProcessingIds.includes(id)
    );
    
    if (completedIds.length > 0 && previousProcessingIds.length > 0) {
      completedIds.forEach(id => {
        const completedLog = logs.find(log => log.id === id);
        if (completedLog) {
          showNotification(completedLog);
        }
      });
    }
    
    setPreviousProcessingIds(currentProcessingIds);
  }, [logs]);

  const showNotification = (log: ValidationLog) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = 'Validation Complete';
      const body = `${log.fileName} - ${log.status} (Score: ${log.score})`;
      
      const notification = new Notification(title, {
        body: body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `validation-${log.id}`,
      });
      
      notification.onclick = () => {
        window.focus();
        router.visit(`/penjualan/${log.id}`);
        notification.close();
      };
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/penjualan/history/data', {
        params: {
          search,
          status: filterStatus,
          page: currentPage,
        },
      });
      setLogs(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching validation logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const countByStatus = {
    All: pagination.total,
    Valid: logs.filter((i) => i.status === "Valid").length,
    Invalid: logs.filter((i) => i.status === "Invalid").length,
    Processing: logs.filter((i) => i.status === "Processing").length,
    Failed: logs.filter((i) => i.status === "Failed").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Valid":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Invalid":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "Processing":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Failed":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Penjualan", href: "/penjualan" },
    { title: "History Penjualan", href: "/history/penjualan" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Validation Logs" />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Folder className="text-blue-500 dark:text-blue-400" />
              Log Proses Validasi
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Riwayat proses validasi dokumen yang telah diunggah.
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Link href="/penjualan">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" /> Add Process
              </Button>
            </Link>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(["All", "Valid", "Invalid", "Processing", "Failed"] as const).map((status) => {
              const isActive = filterStatus === status;
              const colorClass = (() => {
                if (status === "All")
                  return isActive
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-gray-300 text-gray-700 dark:text-gray-200 dark:border-gray-700";
                if (status === "Valid")
                  return isActive
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-green-300 text-green-700 dark:text-green-400 dark:border-green-700";
                if (status === "Invalid")
                  return isActive
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "border-red-300 text-red-700 dark:text-red-400 dark:border-red-700";
                if (status === "Processing")
                  return isActive
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "border-blue-300 text-blue-700 dark:text-blue-400 dark:border-blue-700";
                if (status === "Failed")
                  return isActive
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "border-orange-300 text-orange-700 dark:text-orange-400 dark:border-orange-700";
                return "";
              })();

              return (
                <Button
                  key={status}
                  variant={isActive ? "default" : "outline"}
                  className={`flex items-center gap-2 text-sm transition-colors duration-200 ${colorClass}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {countByStatus[status]}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <CardContent className="p-0 border border-sidebar-border/70 rounded-xl overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
            <Table className="min-w-[850px]">
              <TableHeader>
                <TableRow className="bg-gray-200/60 dark:bg-gray-900/60">
                  {[
                    "User",
                    "File Name",
                    "Document Category",
                    "Upload Time",
                    "Validation Score",
                    "Validation Status",
                    "Action",
                  ].map((head) => (
                    <TableHead
                      key={head}
                      className="font-semibold text-gray-700 dark:text-gray-200 text-sm px-5 py-3 border-b border-gray-250 dark:border-gray-800"
                    >
                      {head}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : logs.length > 0 ? (
                  logs.map((item) => (
                    <TableRow
                      key={item.id}
                      className="even:bg-gray-50 odd:bg-white dark:even:bg-gray-900/30 dark:odd:bg-transparent transition-colors"
                    >
                      <TableCell>{item.user}</TableCell>
                      <TableCell>{item.fileName}</TableCell>
                      <TableCell>{item.documentCategory}</TableCell>
                      <TableCell>{item.uploadTime}</TableCell>
                      <TableCell>
                        <CircularScore score={item.score} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status === 'Processing' && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center"
                          onClick={() => router.visit(`/penjualan/${item.id}`)}
                          disabled={item.status === 'Processing'}
                        >
                          <Eye className="w-4 h-4 mr-1" /> {item.status === 'Processing' ? 'Processing...' : 'Detail'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm"
                    >
                      Tidak ada hasil untuk pencarian ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan {pagination.from} hingga {pagination.to} dari {pagination.total} entri
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={pagination.current_page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={pagination.current_page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.last_page) },
                  (_, i) => {
                    let pageNum;
                    const totalPages = pagination.last_page;
                    const currentPage = pagination.current_page;

                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 p-0 text-xs ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(pagination.last_page, prev + 1))}
                disabled={pagination.current_page === pagination.last_page}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(pagination.last_page)}
                disabled={pagination.current_page === pagination.last_page}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
