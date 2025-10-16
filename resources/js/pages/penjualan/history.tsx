"use client";

import { Link, Head } from "@inertiajs/react";
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
import { Folder, Plus, Eye, Search } from "lucide-react";
import { type BreadcrumbItem } from "@/types";


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
  const logs = [
    {
      user: "Busdev",
      fileType: "CSV",
      fileName: "data_penjualan.csv",
      role: "Admin",
      uploadTime: "2025-10-14 10:25",
      score: "100%",
      status: "Valid",
    },
    {
      user: "SC",
      fileType: "XLSX",
      fileName: "data_penjualan_08_25.xlsx",
      role: "Admin",
      uploadTime: "2025-10-15 09:42",
      score: "90%",
      status: "Invalid",
    },
  ];

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Valid" | "Invalid">("All");

  const filteredLogs = logs.filter(
    (item) =>
      (filterStatus === "All" || item.status === filterStatus) &&
      (item.user.toLowerCase().includes(search.toLowerCase()) ||
        item.fileName.toLowerCase().includes(search.toLowerCase()) ||
        item.role.toLowerCase().includes(search.toLowerCase()))
  );

  const countByStatus = {
    All: logs.length,
    Valid: logs.filter((i) => i.status === "Valid").length,
    Invalid: logs.filter((i) => i.status === "Invalid").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Valid":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Invalid":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Penjualan", href: "/penjualan" },
    { title: "History Penjualan", href: "/penjualan" },
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
            {(["All", "Valid", "Invalid"] as const).map((status) => {
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
                    "File Type",
                    "File Name",
                    "Role",
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
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((item, i) => (
                    <TableRow
                      key={i}
                      className="even:bg-gray-50 odd:bg-white dark:even:bg-gray-900/30 dark:odd:bg-transparent transition-colors"
                    >
                      <TableCell>{item.user}</TableCell>
                      <TableCell>{item.fileType}</TableCell>
                      <TableCell>{item.fileName}</TableCell>
                      <TableCell>{item.role}</TableCell>
                      <TableCell>{item.uploadTime}</TableCell>
                      <TableCell>
                        <CircularScore score={item.score} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Eye className="w-4 h-4 mr-1" /> Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
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
      </div>
    </AppLayout>
  );
}
