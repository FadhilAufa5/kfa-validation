"use client";

import { Head, Link } from "@inertiajs/react";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type BreadcrumbItem } from "@/types";

export default function ValidationShowPage() {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Penjualan", href: "/penjualan" },
    { title: "History Penjualan", href: "/penjualan" },
    { title: "Detail Validasi", href: "#" },
  ];

  const validationData = {
    fileName: "beli_reg_sap.csv",
    role: "Accountant",
    category: "Reguler",
    score: 100,
    matched: 4020,
    total: 4020,
    discrepancy: 0,
    isValid: true,
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Validation Result" />

      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="text-blue-500 dark:text-blue-400">
                Validation Dashboard
              </span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Detail hasil validasi file data yang telah diunggah.
            </p>
          </div>
          <Link href="/penjualan">
            <Button
              variant="outline"
              className="flex items-center gap-2 border-gray-400 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
          </Link>
        </div>

        {/* File Info */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3 py-1 bg-blue-900/20 text-blue-300 rounded-md text-sm font-medium">
            {validationData.fileName}
          </span>
          <span className="px-3 py-1 bg-red-900/20 text-red-300 rounded-md text-sm font-medium">
            {validationData.role}
          </span>
          <span className="px-3 py-1 bg-green-900/20 text-green-300 rounded-md text-sm font-medium">
            {validationData.category}
          </span>
        </div>

        {/* Section Title */}
        <div className="border-b border-gray-300 dark:border-gray-800 pb-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            File Validation Summary
          </h2>
        </div>

        {/* Summary Section */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Status Card */}
          <Card className="col-span-1 md:col-span-1 shadow-sm border-0 dark:bg-gray-900 bg-green-50 dark:border-gray-800">
            <CardContent className="flex flex-col items-center justify-center text-center py-8 space-y-3">
              {validationData.isValid ? (
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
              )}
              <div>
                <h3 className="font-semibold text-lg text-green-700 dark:text-green-400">
                  {validationData.isValid ? "Data Valid" : "Data Tidak Valid"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {validationData.isValid
                    ? "Tidak ada perbedaan data ditemukan!"
                    : "Terdapat data yang tidak sesuai!"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Score Cards */}
          <div className="col-span-1 md:col-span-2 grid sm:grid-cols-2 gap-4">
            <Card className="shadow-sm dark:bg-gray-900 border-0 dark:border-gray-800">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Overall Validation Score
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {validationData.score.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-gray-900 border-0 dark:border-gray-800">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Matched Records
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {validationData.matched}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-gray-900 border-0 dark:border-gray-800">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Records Processed
                </p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-200 mt-2">
                  {validationData.total}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm dark:bg-gray-900 border-0 dark:border-gray-800">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Discrepancy Records
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {validationData.discrepancy}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="rounded-md bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 p-4 text-sm flex items-center justify-between">
          <span className="text-green-800 dark:text-green-300">
            🎉 No discrepancies found in the entire dataset!
          </span>
        </div>
      </div>
    </AppLayout>
  );
}
