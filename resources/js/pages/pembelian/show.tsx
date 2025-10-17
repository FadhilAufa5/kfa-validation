"use client";

import { Head, Link, usePage } from "@inertiajs/react";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  FileText,
  Percent,
  FileCheck2,
  FileX2,
  Scale,
  Loader2,
} from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type BreadcrumbItem } from "@/types";
import { cn } from "@/lib/utils";


interface ValidationData {
  fileName: string;
  role: string;
  category: string;
  score: number;
  matched: number;
  total: number;
  discrepancy: number;
  isValid: boolean;
}

type ValidationPageProps = {
  validationData?: ValidationData;
  validationId: string;
};

export default function PembelianShow() {
  const { props } = usePage<ValidationPageProps>();
  const { validationData, validationId } = props;

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Pembelian", href: "/pembelian" },
    { title: "History Pembelian", href: "/historypembelian" },
    { title: `Detail Validasi #${validationId}`, href: "#" },
  ];

  // Loading state jika data belum ada
  if (!validationData) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title={`Loading Detail Validasi...`} />
        <div className="flex items-center justify-center p-8 h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="ml-4 text-muted-foreground">Memuat data validasi...</p>
        </div>
      </AppLayout>
    );
  }

  // Data untuk kartu statistik
  const stats = [
    {
      title: "Overall Validation Score",
      value: `${validationData.score.toFixed(2)}%`,
      icon: Percent,
    },
    {
      title: "Total Records Processed",
      value: validationData.total.toLocaleString("id-ID"),
      icon: Scale,
    },
    {
      title: "Total Matched Records",
      value: validationData.matched.toLocaleString("id-ID"),
      icon: FileCheck2,
    },
    {
      title: "Total Discrepancy Records",
      value: validationData.discrepancy.toLocaleString("id-ID"),
      icon: FileX2,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Detail Validasi #${validationId}`} />

      <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-6 h-6 text-blue-500" />
              <h1 className="text-2xl font-bold">File Validation Summary</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{validationData.fileName}</Badge>
              <Badge variant="outline">{validationData.role}</Badge>
              <Badge variant="default">{validationData.category}</Badge>
            </div>
          </div>
          <Link href="/pembelian/history">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke History
            </Button>
          </Link>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Status Card (Dinamis) */}
          <Card className="lg:col-span-2 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <div
                className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mb-4",
                  validationData.isValid
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-red-100 dark:bg-red-900"
                )}
              >
                {validationData.isValid ? (
                  <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                )}
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {validationData.isValid ? "Data Valid" : "Data Tidak Valid"}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {validationData.isValid
                  ? "Tidak ada perbedaan data ditemukan!"
                  : `${validationData.discrepancy.toLocaleString(
                      "id-ID"
                    )} perbedaan data ditemukan!`}
              </p>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer Alert (Dinamis) */}
        {validationData.isValid ? (
          <Alert className="bg-green-50/50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300">
              Semua Sesuai!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              Tidak ada ketidaksesuaian yang ditemukan dalam seluruh dataset.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert
            variant="destructive"
            className="bg-red-50/50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
          >
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertTitle className="text-red-800 dark:text-red-300">
              Perhatian Diperlukan
            </AlertTitle>
            <AlertDescription className="text-red-700 dark:text-red-400">
              Ditemukan ketidaksesuaian data. Silakan periksa kembali file yang
              diunggah.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AppLayout>
  );
}