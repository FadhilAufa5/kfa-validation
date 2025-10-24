'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    FileCheck2,
    FileText,
    FileX2,
    Loader2,
    Percent,
    Scale,
    XCircle,
} from 'lucide-react';

interface ValidationGroup {
    discrepancy_category: string;
    error: string;
    uploaded_total: number;
    source_total: number;
    discrepancy_value: number;
}

interface ValidationData {
    fileName: string;
    role: string;
    category: string;
    score: number;
    matched: number;
    total: number;
    mismatched: number;
    isValid: boolean;
    invalid_groups?: {
        [key: string]: ValidationGroup;
    };
}

type ValidationPageProps = {
    validationData?: ValidationData;
    validationId: string;
};

export default function PembelianShow() {
    const { props } = usePage<ValidationPageProps>();
    const { validationData, validationId } = props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Pembelian', href: '/pembelian' },
        { title: 'History Pembelian', href: '/historypembelian' },
        { title: `Detail Validasi #${validationId}`, href: '#' },
    ];

    // Loading state jika data belum ada
    if (!validationData) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Loading Detail Validasi...`} />
                <div className="flex h-64 items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="ml-4 text-muted-foreground">
                        Memuat data validasi...
                    </p>
                </div>
            </AppLayout>
        );
    }

    // Data untuk kartu statistik
    const stats = [
        {
            title: 'Overall Validation Score',
            value: `${validationData.score.toFixed(2)}%`,
            icon: Percent,
        },
        {
            title: 'Total Records Processed',
            value: validationData.total.toLocaleString('id-ID'),
            icon: Scale,
        },
        {
            title: 'Total Matched Records',
            value: validationData.matched.toLocaleString('id-ID'),
            icon: FileCheck2,
        },
        {
            title: 'Total mismatched Records',
            value: validationData.mismatched,
            icon: FileX2,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Validasi #${validationId}`} />

            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <FileText className="h-6 w-6 text-blue-500" />
                            <h1 className="text-2xl font-bold">
                                File Validation Summary
                            </h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                                {validationData.fileName}
                            </Badge>
                            <Badge variant="outline">
                                {validationData.role}
                            </Badge>
                            <Badge variant="default">
                                {validationData.category}
                            </Badge>
                        </div>
                    </div>
                    <Link href="/pembelian/history">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali ke History
                        </Button>
                    </Link>
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Status Card (Dinamis) */}
                    <Card className="flex items-center justify-center bg-gray-50 lg:col-span-2 dark:bg-gray-900/50">
                        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                            <div
                                className={cn(
                                    'mb-4 flex h-20 w-20 items-center justify-center rounded-full',
                                    validationData.isValid
                                        ? 'bg-green-100 dark:bg-green-900'
                                        : 'bg-red-100 dark:bg-red-900',
                                )}
                            >
                                {validationData.isValid ? (
                                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                                ) : (
                                    <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                                )}
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                {validationData.isValid
                                    ? 'Data Valid'
                                    : 'Data Tidak Valid'}
                            </h2>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">
                                {validationData.isValid
                                    ? 'Tidak ada perbedaan data ditemukan!'
                                    : `${validationData.mismatched.toLocaleString(
                                          'id-ID',
                                      )} perbedaan data ditemukan!`}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
                        {stats.map((stat, index) => (
                            <Card key={index}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {stat.value}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Validation Details Table - Only show if there are invalid records */}
                {validationData.invalid_groups && Object.keys(validationData.invalid_groups).length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Grup Data Tidak Valid:</h3>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kunci</TableHead>
                                        <TableHead>Kategori Diskrepansi</TableHead>
                                        <TableHead>Error</TableHead>
                                        <TableHead>Total Diupload</TableHead>
                                        <TableHead>Total Sumber</TableHead>
                                        <TableHead>Nilai Diskrepansi</TableHead>
                                        <TableHead>Sumber Diskrepansi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(validationData.invalid_groups).map(
                                        ([key, group]) => {
                                            // Determine if discrepancy is from validation or uploaded file
                                            const isFromValidation = group.source_total > group.uploaded_total && group.discrepancy_value < 0;
                                            const isFromUploaded = group.uploaded_total > group.source_total && group.discrepancy_value > 0;
                                            const isKeyNotFound = group.discrepancy_category === 'im_invalid';
                                            
                                            let sourceLabel = '';
                                            if (isKeyNotFound) {
                                                sourceLabel = 'Tidak Ditemukan di Sumber';
                                            } else if (isFromUploaded) {
                                                sourceLabel = 'File Diupload';
                                            } else if (isFromValidation) {
                                                sourceLabel = 'File Sumber';
                                            } else {
                                                sourceLabel = 'Tidak Diketahui';
                                            }
                                            
                                            return (
                                                <TableRow key={key}>
                                                    <TableCell className="font-medium">
                                                        {key}
                                                    </TableCell>
                                                    <TableCell>
                                                        {group.discrepancy_category}
                                                    </TableCell>
                                                    <TableCell>
                                                        {group.error}
                                                    </TableCell>
                                                    <TableCell>
                                                        {group.uploaded_total}
                                                    </TableCell>
                                                    <TableCell>
                                                        {group.source_total}
                                                    </TableCell>
                                                    <TableCell>
                                                        {group.discrepancy_value}
                                                    </TableCell>
                                                    <TableCell>
                                                        {sourceLabel}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* Footer Alert (Dinamis) */}
                {validationData.isValid ? (
                    <Alert className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle className="text-green-800 dark:text-green-300">
                            Semua Sesuai!
                        </AlertTitle>
                        <AlertDescription className="text-green-700 dark:text-green-400">
                            Tidak ada ketidaksesuaian yang ditemukan dalam
                            seluruh dataset.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert
                        variant="destructive"
                        className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20"
                    >
                        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <AlertTitle className="text-red-800 dark:text-red-300">
                            Perhatian Diperlukan
                        </AlertTitle>
                        <AlertDescription className="text-red-700 dark:text-red-400">
                            Ditemukan ketidaksesuaian data. Silakan periksa
                            kembali file yang diunggah.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </AppLayout>
    );
}
