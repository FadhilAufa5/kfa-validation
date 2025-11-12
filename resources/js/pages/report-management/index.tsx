'use client';

import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Eye,
    FileCheck,
    Filter,
    Search,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Report {
    id: number;
    validation_id: number;
    file_name: string;
    document_type: string;
    document_category: string;
    report_type: 'custom' | 'wrong_document_type' | 'dirty_data';
    report_message?: string;
    reported_by: string;
    reported_at: string;
    reviewed_by?: string;
    reviewed_at?: string;
    review_notes?: string;
    status: 'pending' | 'accepted' | 'revoked';
}

export default function ReportManagementPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
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
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    // Review dialog states
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    useEffect(() => {
        fetchReports();
    }, [search, statusFilter, currentPage]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/report-management/all', {
                params: {
                    search,
                    status: statusFilter,
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

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'accepted':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'revoked':
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const handleViewDetail = (report: Report) => {
        setSelectedReport(report);
        setDetailDialogOpen(true);
    };

    const handleOpenReviewDialog = (report: Report) => {
        setSelectedReport(report);
        setReviewDialogOpen(true);
    };

    const handleAccept = async () => {
        if (!selectedReport) return;

        setIsSubmitting(true);
        try {
            await axios.post(
                `/report-management/report/${selectedReport.id}/accept`,
                {
                    review_notes: reviewNotes,
                },
            );

            toast.success('Report accepted', {
                description: `The report for "${selectedReport.file_name}" has been accepted.`,
            });

            setReviewDialogOpen(false);
            setReviewNotes('');
            fetchReports();
        } catch (error: any) {
            console.error('Error accepting report:', error);
            toast.error('Failed to accept report', {
                description:
                    error.response?.data?.error ||
                    'An error occurred while accepting the report.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRevoke = async () => {
        if (!selectedReport) return;

        setIsSubmitting(true);
        try {
            await axios.post(
                `/report-management/report/${selectedReport.id}/revoke`,
                {
                    review_notes: reviewNotes,
                },
            );

            toast.success('Report revoked', {
                description: `The report for "${selectedReport.file_name}" has been declined.`,
            });

            setReviewDialogOpen(false);
            setReviewNotes('');
            fetchReports();
        } catch (error: any) {
            console.error('Error revoking report:', error);
            toast.error('Failed to revoke report', {
                description:
                    error.response?.data?.error ||
                    'An error occurred while revoking the report.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Report Management', href: '/report-management' },
        { title: 'All Reports', href: '/report-management' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Report Management" />

            <div className="flex flex-col gap-4 p-4">
                {/* Header */}
                <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold">
                            <FileCheck className="text-blue-500 dark:text-blue-400" />
                            Report Management
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            View and manage all validation reports.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-blue-100 px-4 py-2 dark:bg-blue-900/30">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                Total Reports: {pagination.total}
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
                                placeholder="Search by file name or reporter..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full border-gray-200 bg-white pl-9 dark:border-gray-800 dark:bg-gray-900"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Status
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="accepted">
                                        Accepted
                                    </SelectItem>
                                    <SelectItem value="revoked">
                                        Revoked
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {(search || statusFilter !== 'all') && (
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
                </div>

                {/* Table */}
                <CardContent className="overflow-hidden rounded-xl border border-sidebar-border/70 p-0">
                    <div className="overflow-x-auto">
                        <Table className="min-w-[1200px]">
                            <TableHeader>
                                <TableRow className="bg-gray-200/60 dark:bg-gray-900/60">
                                    <TableHead className="border-gray-250 w-[300px] border-b px-5 py-3 text-sm font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-200">
                                        File Name
                                    </TableHead>
                                    {[
                                        'Document Type',
                                        'Report Type',
                                        'Status',
                                        'Reported By',
                                        'Reported At',
                                        'Reviewed By',
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
                                            <TableCell
                                                className="max-w-[300px] font-medium"
                                                title={report.file_name}
                                            >
                                                {report.file_name}
                                            </TableCell>
                                            <TableCell>
                                                <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                    {report.document_type} -{' '}
                                                    {report.document_category}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getReportTypeBadgeClass(
                                                        report.report_type,
                                                    )}`}
                                                >
                                                    {getReportTypeLabel(
                                                        report.report_type,
                                                    )}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                                                        report.status,
                                                    )}`}
                                                >
                                                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {report.reported_by}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                {report.reported_at}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                {report.reviewed_by || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="flex items-center text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                                        onClick={() =>
                                                            handleViewDetail(
                                                                report,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="mr-1 h-4 w-4" />
                                                        Detail
                                                    </Button>

                                                    {report.status ===
                                                        'pending' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex items-center text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                                                            onClick={() =>
                                                                handleOpenReviewDialog(
                                                                    report,
                                                                )
                                                            }
                                                        >
                                                            <CheckCircle className="mr-1 h-4 w-4" />
                                                            Review
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            No reports found.
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
                            Showing {pagination.from} to {pagination.to} of{' '}
                            {pagination.total} reports
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

                {/* Detail Dialog */}
                <Dialog
                    open={detailDialogOpen}
                    onOpenChange={setDetailDialogOpen}
                >
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Report Details</DialogTitle>
                            <DialogDescription>
                                Detailed information about the report.
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
                                    {selectedReport &&
                                        getReportTypeLabel(
                                            selectedReport.report_type,
                                        )}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                    {selectedReport?.status.charAt(0).toUpperCase() + selectedReport?.status.slice(1)}
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
                            {selectedReport?.reviewed_by && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Reviewed By</Label>
                                            <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                                {selectedReport.reviewed_by}
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Reviewed At</Label>
                                            <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                                {selectedReport.reviewed_at}
                                            </div>
                                        </div>
                                    </div>
                                    {selectedReport.review_notes && (
                                        <div className="grid gap-2">
                                            <Label>Review Notes</Label>
                                            <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                                {selectedReport.review_notes}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Review Dialog */}
                <Dialog
                    open={reviewDialogOpen}
                    onOpenChange={(open) => {
                        if (!isSubmitting) {
                            setReviewDialogOpen(open);
                            if (!open) {
                                setReviewNotes('');
                            }
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Review Report</DialogTitle>
                            <DialogDescription>
                                Review and take action on this validation
                                report.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Reported File</Label>
                                <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                    {selectedReport?.file_name}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Issue Type</Label>
                                <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                    {selectedReport &&
                                        getReportTypeLabel(
                                            selectedReport.report_type,
                                        )}
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
                            <div className="grid gap-2">
                                <Label htmlFor="review-notes">
                                    Review Notes (Optional)
                                </Label>
                                <Textarea
                                    id="review-notes"
                                    placeholder="Add notes about your decision..."
                                    value={reviewNotes}
                                    onChange={(e) =>
                                        setReviewNotes(e.target.value)
                                    }
                                    rows={4}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setReviewDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleRevoke}
                                disabled={isSubmitting}
                                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                {isSubmitting ? 'Revoking...' : 'Revoke'}
                            </Button>
                            <Button
                                onClick={handleAccept}
                                disabled={isSubmitting}
                                className="bg-green-600 text-white hover:bg-green-700"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {isSubmitting ? 'Accepting...' : 'Accept'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
