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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    FileCheck,
    Eye,
    Filter,
    Calendar,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface AcceptedReport {
    id: number;
    validation_id: number;
    file_name: string;
    document_type: string;
    document_category: string;
    report_type: 'custom' | 'wrong_document_type' | 'dirty_data';
    report_message?: string;
    reported_by: string;
    reported_at: string;
    reviewed_by: string;
    reviewed_at: string;
    review_notes?: string;
}

export default function ReportManagementPage() {
    const [reports, setReports] = useState<AcceptedReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [reportType, setReportType] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });

    // Detail dialog states
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<AcceptedReport | null>(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, reportType, dateFrom, dateTo]);

    useEffect(() => {
        fetchReports();
    }, [search, reportType, dateFrom, dateTo, currentPage]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/report-management/accepted', {
                params: {
                    search,
                    report_type: reportType,
                    date_from: dateFrom,
                    date_to: dateTo,
                    page: currentPage,
                },
            });
            setReports(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const getReportTypeLabel = (type: string) => {
        switch (type) {
            case 'wrong_document_type':
                return 'Salah Tipe Dokumen';
            case 'dirty_data':
                return 'Data Tidak Bersih';
            case 'custom':
                return 'Custom Message';
            default:
                return type;
        }
    };

    const getReportTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'wrong_document_type':
                return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'dirty_data':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'custom':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const handleViewDetail = (report: AcceptedReport) => {
        setSelectedReport(report);
        setDetailDialogOpen(true);
    };

    const clearFilters = () => {
        setSearch('');
        setReportType('all');
        setDateFrom('');
        setDateTo('');
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Report Management', href: '/report-management' },
        { title: 'Accepted Reports', href: '/report-management' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Accepted Reports History" />

            <div className="flex flex-col gap-4 p-4">
                {/* Header */}
                <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold">
                            <FileCheck className="text-green-500 dark:text-green-400" />
                            Accepted Reports History
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            View all accepted validation reports and deleted validations.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-green-100 px-4 py-2 dark:bg-green-900/30">
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                Total Accepted: {pagination.total}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="mb-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-3 md:flex-row">
                        <div className="relative flex-1">
                            <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by file name, reporter, or reviewer..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full border-gray-200 bg-white pl-9 dark:border-gray-800 dark:bg-gray-900"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Report Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="wrong_document_type">Salah Tipe Dokumen</SelectItem>
                                    <SelectItem value="dirty_data">Data Tidak Bersih</SelectItem>
                                    <SelectItem value="custom">Custom Message</SelectItem>
                                </SelectContent>
                            </Select>

                            {(search || reportType !== 'all' || dateFrom || dateTo) && (
                                <Button
                                    variant="outline"
                                    onClick={clearFilters}
                                    className="whitespace-nowrap"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Date Range Filters */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <Label className="text-sm">Reviewed Date:</Label>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-[150px]"
                                placeholder="From"
                            />
                            <span className="flex items-center text-gray-400">to</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-[150px]"
                                placeholder="To"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <CardContent className="overflow-hidden rounded-xl border border-sidebar-border/70 p-0">
                    <div className="overflow-x-auto">
                        <Table className="min-w-[1000px]">
                            <TableHeader>
                                <TableRow className="bg-gray-200/60 dark:bg-gray-900/60">
                                    {[
                                        'File Name',
                                        'Document Type',
                                        'Report Type',
                                        'Reported By',
                                        'Reported At',
                                        'Reviewed By',
                                        'Reviewed At',
                                        'Action',
                                    ].map((head) => (
                                        <TableHead
                                            key={head}
                                            className="border-b border-gray-250 px-5 py-3 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200"
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
                                            colSpan={8}
                                            className="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : reports.length > 0 ? (
                                    reports.map((report) => (
                                        <TableRow
                                            key={report.id}
                                            className="transition-colors odd:bg-white even:bg-gray-50 dark:odd:bg-transparent dark:even:bg-gray-900/30"
                                        >
                                            <TableCell className="font-medium">
                                                {report.file_name}
                                            </TableCell>
                                            <TableCell>
                                                <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {report.document_type} - {report.document_category}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getReportTypeBadgeClass(
                                                        report.report_type,
                                                    )}`}
                                                >
                                                    {getReportTypeLabel(report.report_type)}
                                                </span>
                                            </TableCell>
                                            <TableCell>{report.reported_by}</TableCell>
                                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                {report.reported_at}
                                            </TableCell>
                                            <TableCell>{report.reviewed_by}</TableCell>
                                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                {report.reviewed_at}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="flex items-center text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                    onClick={() => handleViewDetail(report)}
                                                >
                                                    <Eye className="mr-1 h-4 w-4" />
                                                    Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            No accepted reports found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>

                {/* Pagination */}
                {!loading && reports.length > 0 && (
                    <div className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {pagination.from} to {pagination.to} of {pagination.total} reports
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
                                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
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
                                    setCurrentPage((prev) => Math.min(pagination.last_page, prev + 1))
                                }
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

                {/* Detail Dialog */}
                <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Report Details</DialogTitle>
                            <DialogDescription>
                                Detailed information about the accepted report.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>File Name</Label>
                                <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                    {selectedReport?.file_name}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Document Type</Label>
                                    <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                        {selectedReport?.document_type}
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                        {selectedReport?.document_category}
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Report Type</Label>
                                <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                    {selectedReport && getReportTypeLabel(selectedReport.report_type)}
                                </div>
                            </div>
                            {selectedReport?.report_message && (
                                <div className="grid gap-2">
                                    <Label>Report Message</Label>
                                    <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                        {selectedReport.report_message}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Reported By</Label>
                                    <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                        {selectedReport?.reported_by}
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Reported At</Label>
                                    <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                        {selectedReport?.reported_at}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Reviewed By</Label>
                                    <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                        {selectedReport?.reviewed_by}
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Reviewed At</Label>
                                    <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                        {selectedReport?.reviewed_at}
                                    </div>
                                </div>
                            </div>
                            {selectedReport?.review_notes && (
                                <div className="grid gap-2">
                                    <Label>Review Notes</Label>
                                    <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                        {selectedReport.review_notes}
                                    </div>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
