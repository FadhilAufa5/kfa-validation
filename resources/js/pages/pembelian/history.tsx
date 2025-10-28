'use client';

import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    Folder,
    Plus,
    Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ValidationLog {
    id: number;
    user: string;
    fileName: string;
    documentCategory: string;
    uploadTime: string;
    score: string;
    status: 'Valid' | 'Invalid';
}

export const CircularScore = ({ score }: { score: string }) => {
    const numericScore = parseInt(score.replace('%', ''), 10);
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
    const isHighScore = numericScore > 75 && numericScore < 100;

    return (
        <div className="relative flex h-12 w-12 items-center justify-center">
            <svg className="rotate-[-90deg]" width="50" height="50">
                {/* Background Track */}
                <circle
                    cx="25"
                    cy="25"
                    r={radius}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray="3 4"
                    className="stroke-gray-300 dark:stroke-gray-700"
                />
                {/* Progress Line */}
                <circle
                    cx="25"
                    cy="25"
                    r={radius}
                    strokeWidth="4"
                    fill="none"
                    className={`transition-all duration-700 ease-out ${
                        isComplete
                            ? 'stroke-blue-500 dark:stroke-blue-400'
                            : isHighScore
                              ? 'stroke-yellow-400 dark:stroke-yellow-300'
                              : 'stroke-red-400 dark:stroke-red-400'
                    }`}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                />
            </svg>
            <span
                className={`absolute text-xs font-semibold ${
                    isComplete
                        ? 'text-blue-600 dark:text-blue-400'
                        : // : isHighScore
                          // ? "text-yellow-600 dark:text-yellow-300"
                          'text-gray-600 dark:text-gray-300'
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
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<
        'All' | 'Valid' | 'Invalid'
    >('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });

    // Fetch data from API
    useEffect(() => {
        setCurrentPage(1); // Reset to first page when search or filter changes
    }, [search, filterStatus]);

    useEffect(() => {
        fetchLogs();
    }, [search, filterStatus, currentPage]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/pembelian/history/data', {
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
        Valid: logs.filter((i) => i.status === 'Valid').length,
        Invalid: logs.filter((i) => i.status === 'Invalid').length,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Valid':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Invalid':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Pembelian', href: '/pembelian' },
        { title: 'History Pembelian', href: '/history/pembelian' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Validation Logs" />

            <div className="flex flex-col gap-4 overflow-x-auto p-4">
                {/* Header */}
                <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold">
                            <Folder className="text-blue-500 dark:text-blue-400" />
                            Log Proses Validasi
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Riwayat proses validasi dokumen yang telah diunggah.
                        </p>
                    </div>

                    <div className="flex w-full gap-3 md:w-auto">
                        <Link href="/pembelian">
                            <Button className="bg-blue-600 text-white shadow-md hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" /> Add Process
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Search & Filter */}
                <div className="mb-4 flex flex-col items-center justify-between gap-3 md:flex-row">
                    <div className="relative w-full md:w-1/3">
                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Cari..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full border-gray-200 bg-white pl-9 dark:border-gray-800 dark:bg-gray-900"
                        />
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                        {(['All', 'Valid', 'Invalid'] as const).map(
                            (status) => {
                                const isActive = filterStatus === status;
                                const colorClass = (() => {
                                    if (status === 'All')
                                        return isActive
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'border-gray-300 text-gray-700 dark:text-gray-200 dark:border-gray-700';
                                    if (status === 'Valid')
                                        return isActive
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : 'border-green-300 text-green-700 dark:text-green-400 dark:border-green-700';
                                    if (status === 'Invalid')
                                        return isActive
                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                            : 'border-red-300 text-red-700 dark:text-red-400 dark:border-red-700';
                                    return '';
                                })();

                                return (
                                    <Button
                                        key={status}
                                        variant={
                                            isActive ? 'default' : 'outline'
                                        }
                                        className={`flex items-center gap-2 text-sm transition-colors duration-200 ${colorClass}`}
                                        onClick={() => setFilterStatus(status)}
                                    >
                                        {status}
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                            }`}
                                        >
                                            {countByStatus[status]}
                                        </span>
                                    </Button>
                                );
                            },
                        )}
                    </div>
                </div>

                {/* Table */}
                <CardContent className="overflow-hidden rounded-xl border border-sidebar-border/70 p-0">
                    <div className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 overflow-x-auto">
                        <Table className="min-w-[850px]">
                            <TableHeader>
                                <TableRow className="bg-gray-200/60 dark:bg-gray-900/60">
                                    {[
                                        'User',
                                        'File Name',
                                        'Document Category',
                                        'Upload Time',
                                        'Validation Score',
                                        'Validation Status',
                                        'Action',
                                    ].map((head) => (
                                        <TableHead
                                            key={head}
                                            className="border-gray-250 border-b px-5 py-3 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
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
                                            className="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length > 0 ? (
                                    logs.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            className="transition-colors odd:bg-white even:bg-gray-50 dark:odd:bg-transparent dark:even:bg-gray-900/30"
                                        >
                                            <TableCell>{item.user}</TableCell>
                                            <TableCell>
                                                {item.fileName}
                                            </TableCell>
                                            <TableCell>
                                                {item.documentCategory}
                                            </TableCell>
                                            <TableCell>
                                                {item.uploadTime}
                                            </TableCell>
                                            <TableCell>
                                                <CircularScore
                                                    score={item.score}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                                                        item.status,
                                                    )}`}
                                                >
                                                    {item.status}
                                                </span>
                                            </TableCell>

                                            {/* ✅ Update the link to use the correct route */}
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex items-center text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                    onClick={() =>
                                                        router.visit(
                                                            `/pembelian/${item.id}`,
                                                        )
                                                    }
                                                >
                                                    <Eye className="mr-1 h-4 w-4" />{' '}
                                                    Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
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
                    <div className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Menampilkan {pagination.from} hingga {pagination.to}{' '}
                            dari {pagination.total} entri
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
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(1, prev - 1),
                                    )
                                }
                                disabled={pagination.current_page === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from(
                                    {
                                        length: Math.min(
                                            5,
                                            pagination.last_page,
                                        ),
                                    },
                                    (_, i) => {
                                        let pageNum;
                                        const totalPages = pagination.last_page;
                                        const currentPage =
                                            pagination.current_page;

                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (
                                            currentPage >=
                                            totalPages - 2
                                        ) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={
                                                    currentPage === pageNum
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setCurrentPage(pageNum)
                                                }
                                                className={`h-8 w-8 p-0 text-xs ${
                                                    currentPage === pageNum
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                        : 'border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200'
                                                }`}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    },
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(
                                            pagination.last_page,
                                            prev + 1,
                                        ),
                                    )
                                }
                                disabled={
                                    pagination.current_page ===
                                    pagination.last_page
                                }
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setCurrentPage(pagination.last_page)
                                }
                                disabled={
                                    pagination.current_page ===
                                    pagination.last_page
                                }
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
