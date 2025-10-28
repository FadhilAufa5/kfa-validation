'use client';

import DocumentComparisonPopup from '@/components/DocumentComparisonPopup';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
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
    Search,
    XCircle,
} from 'lucide-react';
import React from 'react';

import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

// Helper function to format numbers as IDR currency
const formatIDR = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return '-';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numValue);
};

interface ValidationGroup {
    discrepancy_category: string;
    error: string;
    uploaded_total: number;
    source_total: number;
    discrepancy_value: number;
}

interface MatchedGroup {
    key: string;
    uploaded_total: number;
    source_total: number;
    difference: number;
    note: string;
}

interface ValidationGroupPaginated {
    key: string;
    discrepancy_category: string;
    error: string;
    uploaded_total: number;
    source_total: number;
    discrepancy_value: number;
    sourceLabel: string;
}

interface MatchedGroupPaginated {
    key: string;
    uploaded_total: number;
    source_total: number;
    difference: number;
    note: string;
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
}

interface PaginationData<T> {
    data: T[];
    pagination: {
        current_page: number;
        per_page: number;
        total: number;
        total_pages: number;
    };
    filters: {
        search?: string;
        category?: string;
        source?: string;
        note?: string;
    };
    sort: {
        key: string;
        direction: 'asc' | 'desc';
    };
    uniqueFilters?: {
        categories: string[];
        sources: string[];
        notes: string[];
    };
}

type ValidationPageProps = {
    validationData?: ValidationData;
    validationId: string;
};

export default function PembelianShow() {
    const { props } = usePage<ValidationPageProps>();
    const { validationData, validationId } = props;

    const breadcrumbs = useMemo(
        () => [
            { title: 'Pembelian', href: '/pembelian' },
            { title: 'History Pembelian', href: '/history/pembelian' },
            { title: `Detail Validasi #${validationId}`, href: '#' },
        ],
        [validationId],
    );

    // State for invalid groups table controls
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [sortConfigInvalid, setSortConfigInvalid] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    }>({ key: 'key', direction: 'asc' });
    const [currentPageInvalid, setCurrentPageInvalid] = useState(1);
    const [itemsPerPageInvalid, setItemsPerPageInvalid] = useState(10);
    const [invalidGroupsData, setInvalidGroupsData] =
        useState<PaginationData<ValidationGroupPaginated> | null>(null);
    const [invalidGroupsLoading, setInvalidGroupsLoading] = useState(false);

    // State for matched groups table controls
    const [matchedSearchTerm, setMatchedSearchTerm] = useState('');
    const [noteFilter, setNoteFilter] = useState('');
    const [sortConfigMatched, setSortConfigMatched] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    }>({ key: 'key', direction: 'asc' });
    const [currentPageMatched, setCurrentPageMatched] = useState(1);
    const [itemsPerPageMatched, setItemsPerPageMatched] = useState(10);
    const [matchedGroupsData, setMatchedGroupsData] =
        useState<PaginationData<MatchedGroupPaginated> | null>(null);
    const [matchedGroupsLoading, setMatchedGroupsLoading] = useState(false);

    // State for document comparison popup
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState('');
    const [uploadedDocData, setUploadedDocData] = useState<any[] | null>(null);
    const [validationDocData, setValidationDocData] = useState<any[] | null>(
        null,
    );
    const [uploadedTotal, setUploadedTotal] = useState<number | null>(null);
    const [sourceTotal, setSourceTotal] = useState<number | null>(null);
    const [uploadedSumField, setUploadedSumField] = useState<string | null>(null);
    const [validationSumField, setValidationSumField] = useState<string | null>(null);
    const [popupLoading, setPopupLoading] = useState(false);

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
    const stats = useMemo(
        () => [
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
                color:
                    validationData.matched > 0
                        ? 'text-green-600'
                        : 'text-muted-foreground',
            },
            {
                title: 'Total Mismatched Records',
                value: validationData.mismatched.toLocaleString('id-ID'),
                icon: FileX2,
                color:
                    validationData.mismatched > 0
                        ? 'text-red-600'
                        : 'text-muted-foreground',
            },
        ],
        [
            validationData.score,
            validationData.total,
            validationData.matched,
            validationData.mismatched,
        ],
    );

    // Load invalid groups with pagination
    useEffect(() => {
        const fetchInvalidGroups = async () => {
            setInvalidGroupsLoading(true);
            try {
                const response = await axios.get(
                    `/pembelian/${validationId}/invalid-groups`,
                    {
                        params: {
                            search: searchTerm,
                            category: categoryFilter,
                            source: sourceFilter,
                            sort_key: sortConfigInvalid.key,
                            sort_direction: sortConfigInvalid.direction,
                            page: currentPageInvalid,
                            per_page: itemsPerPageInvalid,
                        },
                    },
                );
                setInvalidGroupsData(response.data);
            } catch (error) {
                console.error('Error fetching invalid groups:', error);
            } finally {
                setInvalidGroupsLoading(false);
            }
        };

        fetchInvalidGroups();
    }, [
        validationId,
        searchTerm,
        categoryFilter,
        sourceFilter,
        sortConfigInvalid,
        currentPageInvalid,
        itemsPerPageInvalid,
    ]);

    // Load matched groups with pagination
    useEffect(() => {
        const fetchMatchedGroups = async () => {
            setMatchedGroupsLoading(true);
            try {
                const response = await axios.get(
                    `/pembelian/${validationId}/matched-records`,
                    {
                        params: {
                            search: matchedSearchTerm,
                            note: noteFilter,
                            sort_key: sortConfigMatched.key,
                            sort_direction: sortConfigMatched.direction,
                            page: currentPageMatched,
                            per_page: itemsPerPageMatched,
                        },
                    },
                );
                setMatchedGroupsData(response.data);
            } catch (error) {
                console.error('Error fetching matched groups:', error);
            } finally {
                setMatchedGroupsLoading(false);
            }
        };

        fetchMatchedGroups();
    }, [
        validationId,
        matchedSearchTerm,
        noteFilter,
        sortConfigMatched,
        currentPageMatched,
        itemsPerPageMatched,
    ]);

    // Get unique categories for filter dropdown (from backend)
    const uniqueCategories = invalidGroupsData?.uniqueFilters?.categories || [];

    // Get unique source labels for filter dropdown (from backend)
    const uniqueSources = invalidGroupsData?.uniqueFilters?.sources || [];

    // Get unique notes for matched groups filter dropdown (from backend)
    const uniqueNotes = matchedGroupsData?.uniqueFilters?.notes || [];

    // Handle sort request for invalid groups
    const requestSortInvalid = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (
            sortConfigInvalid.key === key &&
            sortConfigInvalid.direction === 'asc'
        ) {
            direction = 'desc';
        }
        setSortConfigInvalid({ key, direction });
        setCurrentPageInvalid(1); // Reset to first page when sorting
    };

    // Get sort indicator for invalid groups table headers
    const getSortIndicatorInvalid = (key: string) => {
        if (sortConfigInvalid.key !== key) return null;
        return sortConfigInvalid.direction === 'asc' ? '↑' : '↓';
    };

    // Handle sort request for matched records
    const requestMatchedSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (
            sortConfigMatched.key === key &&
            sortConfigMatched.direction === 'asc'
        ) {
            direction = 'desc';
        }
        setSortConfigMatched({ key, direction });
        setCurrentPageMatched(1); // Reset to first page when sorting
    };

    // Get sort indicator for matched records table headers
    const getMatchedSortIndicator = (key: string) => {
        if (sortConfigMatched.key !== key) return null;
        return sortConfigMatched.direction === 'asc' ? '↑' : '↓';
    };

    // Handler for clicking on key column
    const handleKeyClick = async (key: string) => {
        setSelectedKey(key);
        setIsPopupOpen(true);
        setPopupLoading(true);
        setUploadedDocData(null);
        setValidationDocData(null);
        setUploadedTotal(null);
        setSourceTotal(null);
        setUploadedSumField(null);
        setValidationSumField(null);

        try {
            // Fetch both documents in parallel
            const [uploadedResponse, validationResponse] = await Promise.all([
                axios.get(`/pembelian/${validationId}/document-comparison`, {
                    params: { key, type: 'uploaded' },
                }),
                axios.get(`/pembelian/${validationId}/document-comparison`, {
                    params: { key, type: 'validation' },
                }),
            ]);

            // Find the corresponding group to get the totals from either dataset
            const groupData =
                invalidGroupsData?.data?.find((group) => group.key === key) ||
                matchedGroupsData?.data?.find((group) => group.key === key);

            if (groupData) {
                setUploadedTotal(groupData.uploaded_total);
                setSourceTotal(groupData.source_total);
            }

            // Extract sum field information from API responses
            if (uploadedResponse.data?.sum_field) {
                setUploadedSumField(uploadedResponse.data.sum_field);
            }
            if (validationResponse.data?.sum_field) {
                setValidationSumField(validationResponse.data.sum_field);
            }

            // Defensively extract the data array from the server's response body.
            const extractedUploadedData =
                uploadedResponse.data?.data || uploadedResponse.data;
            const extractedValidationData =
                validationResponse.data?.data || validationResponse.data;

            // Ensure we are setting an array to the state to prevent render errors.
            if (Array.isArray(extractedUploadedData)) {
                setUploadedDocData(extractedUploadedData);
            } else {
                console.error(
                    'Extracted uploaded data is not an array:',
                    extractedUploadedData,
                );
                setUploadedDocData([]); // Set empty array on failure
            }

            if (Array.isArray(extractedValidationData)) {
                setValidationDocData(extractedValidationData);
            } else {
                console.error(
                    'Extracted validation data is not an array:',
                    extractedValidationData,
                );
                setValidationDocData([]); // Set empty array on failure
            }
        } catch (error) {
            console.error('Error fetching document data:', error);
        } finally {
            setPopupLoading(false);
        }
    };

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
                    <Link href="/history/pembelian">
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
                                    <stat.icon
                                        className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`}
                                    />
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className={`text-2xl font-bold ${stat.color || ''}`}
                                    >
                                        {stat.value}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Tabs for Invalid and Valid Groups */}
                {validationData.mismatched > 0 || validationData.matched > 0 ? (
                    <Tabs defaultValue="invalid" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            {validationData.mismatched > 0 && (
                                <TabsTrigger value="invalid">
                                    Data Tidak Valid
                                </TabsTrigger>
                            )}
                            {validationData.matched > 0 && (
                                <TabsTrigger value="valid">
                                    Data Valid (Matched)
                                </TabsTrigger>
                            )}
                        </TabsList>

                        {/* Invalid Groups Tab */}
                        {validationData.mismatched > 0 && (
                            <TabsContent value="invalid" className="space-y-4">
                                <InvalidGroupsTabContent
                                    uniqueCategories={uniqueCategories}
                                    uniqueSources={uniqueSources}
                                    categoryFilter={categoryFilter}
                                    sourceFilter={sourceFilter}
                                    setCategoryFilter={setCategoryFilter}
                                    setSourceFilter={setSourceFilter}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    filteredAndSortedInvalidGroups={
                                        invalidGroupsData?.data || []
                                    }
                                    requestSort={requestSortInvalid}
                                    getSortIndicator={getSortIndicatorInvalid}
                                    currentPage={currentPageInvalid}
                                    setCurrentPage={setCurrentPageInvalid}
                                    itemsPerPage={itemsPerPageInvalid}
                                    setItemsPerPage={setItemsPerPageInvalid}
                                    totalPages={
                                        invalidGroupsData?.pagination
                                            .total_pages || 1
                                    }
                                    totalItems={
                                        invalidGroupsData?.pagination.total || 0
                                    }
                                    loading={invalidGroupsLoading}
                                    handleKeyClick={handleKeyClick}
                                />
                            </TabsContent>
                        )}

                        {/* Matched Groups Tab */}
                        {validationData.matched > 0 && (
                            <TabsContent value="valid" className="space-y-4">
                                <MatchedGroupsTabContent
                                    uniqueNotes={uniqueNotes}
                                    noteFilter={noteFilter}
                                    setNoteFilter={setNoteFilter}
                                    filteredAndSortedMatchedGroups={
                                        matchedGroupsData?.data || []
                                    }
                                    matchedSearchTerm={matchedSearchTerm}
                                    setMatchedSearchTerm={setMatchedSearchTerm}
                                    requestMatchedSort={requestMatchedSort}
                                    getMatchedSortIndicator={
                                        getMatchedSortIndicator
                                    }
                                    currentPage={currentPageMatched}
                                    setCurrentPage={setCurrentPageMatched}
                                    itemsPerPage={itemsPerPageMatched}
                                    setItemsPerPage={setItemsPerPageMatched}
                                    totalPages={
                                        matchedGroupsData?.pagination
                                            .total_pages || 1
                                    }
                                    totalItems={
                                        matchedGroupsData?.pagination.total || 0
                                    }
                                    loading={matchedGroupsLoading}
                                    handleKeyClick={handleKeyClick}
                                />
                            </TabsContent>
                        )}
                    </Tabs>
                ) : (
                    <div className="py-4 text-center text-muted-foreground">
                        Tidak ada data untuk ditampilkan
                    </div>
                )}

                {/* Document Comparison Popup */}
                <DocumentComparisonPopup
                    isOpen={isPopupOpen}
                    onClose={() => setIsPopupOpen(false)}
                    uploadedDocData={uploadedDocData}
                    validationDocData={validationDocData}
                    connectorKey={selectedKey}
                    uploadedTotal={uploadedTotal}
                    sourceTotal={sourceTotal}
                    isLoading={popupLoading}
                    uploadedSumField={uploadedSumField}
                    validationSumField={validationSumField}
                />
            </div>
        </AppLayout>
    );
}

// Invalid Groups Tab Content Component
const InvalidGroupsTabContent = React.memo(
    ({
        uniqueCategories,
        uniqueSources,
        categoryFilter,
        sourceFilter,
        setCategoryFilter,
        setSourceFilter,
        searchTerm,
        setSearchTerm,
        filteredAndSortedInvalidGroups,
        requestSort,
        getSortIndicator,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        totalPages,
        totalItems,
        loading,
        handleKeyClick,
    }: {
        uniqueCategories: string[];
        uniqueSources: string[];
        categoryFilter: string;
        sourceFilter: string;
        setCategoryFilter: (value: string) => void;
        setSourceFilter: (value: string) => void;
        searchTerm: string;
        setSearchTerm: (value: string) => void;
        filteredAndSortedInvalidGroups: ValidationGroupPaginated[];
        requestSort: (key: string) => void;
        getSortIndicator: (key: string) => string | null;
        currentPage: number;
        setCurrentPage: (page: number) => void;
        itemsPerPage: number;
        setItemsPerPage: (perPage: number) => void;
        totalPages: number;
        totalItems: number;
        loading: boolean;
        handleKeyClick: (key: string) => void;
    }) => (
        <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                    <div className="relative">
                        <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari berdasarkan Kunci..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page when searching
                            }}
                        />
                    </div>
                </div>
                <div>
                    <Select
                        value={categoryFilter || 'all'}
                        onValueChange={(value) => {
                            setCategoryFilter(value === 'all' ? '' : value);
                            setCurrentPage(1); // Reset to first page when filtering
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Kategori</SelectItem>
                            {uniqueCategories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Select
                        value={sourceFilter || 'all'}
                        onValueChange={(value) => {
                            setSourceFilter(value === 'all' ? '' : value);
                            setCurrentPage(1); // Reset to first page when filtering
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter Sumber" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Sumber</SelectItem>
                            {uniqueSources.map((source) => (
                                <SelectItem key={source} value={source}>
                                    {source}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <h3 className="text-lg font-semibold">Grup Data Tidak Valid:</h3>
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">
                        Memuat data...
                    </span>
                </div>
            ) : (
                <>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead
                                        className="cursor-pointer"
                                        onClick={() => requestSort('key')}
                                    >
                                        Kunci {getSortIndicator('key')}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer"
                                        onClick={() =>
                                            requestSort('discrepancy_category')
                                        }
                                    >
                                        Kategori Diskrepansi{' '}
                                        {getSortIndicator(
                                            'discrepancy_category',
                                        )}
                                    </TableHead>
                                    <TableHead>Error</TableHead>
                                    <TableHead
                                        className="cursor-pointer"
                                        onClick={() =>
                                            requestSort('uploaded_total')
                                        }
                                    >
                                        Total Diupload{' '}
                                        {getSortIndicator('uploaded_total')}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer"
                                        onClick={() =>
                                            requestSort('source_total')
                                        }
                                    >
                                        Total Sumber{' '}
                                        {getSortIndicator('source_total')}
                                    </TableHead>
                                    <TableHead
                                        className="w-[120px] cursor-pointer"
                                        onClick={() =>
                                            requestSort('discrepancy_value')
                                        }
                                    >
                                        Nilai Diskrepansi{' '}
                                        {getSortIndicator('discrepancy_value')}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer"
                                        onClick={() =>
                                            requestSort('sourceLabel')
                                        }
                                    >
                                        Sumber Diskrepansi{' '}
                                        {getSortIndicator('sourceLabel')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedInvalidGroups.map(
                                    ({ key, ...group }) => (
                                        <TableRow key={key}>
                                            <TableCell
                                                className="cursor-pointer font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                onClick={() =>
                                                    handleKeyClick(key)
                                                }
                                            >
                                                {key}
                                            </TableCell>
                                            <TableCell>
                                                {group.discrepancy_category}
                                            </TableCell>
                                            <TableCell>{group.error}</TableCell>
                                            <TableCell>
                                                {formatIDR(
                                                    group.uploaded_total,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatIDR(group.source_total)}
                                            </TableCell>
                                            <TableCell className="w-[120px]">
                                                {formatIDR(
                                                    group.discrepancy_value,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {group.sourceLabel}
                                            </TableCell>
                                        </TableRow>
                                    ),
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <div className="text-sm text-muted-foreground">
                            Menampilkan{' '}
                            {Math.min(
                                (currentPage - 1) * itemsPerPage + 1,
                                totalItems,
                            )}{' '}
                            - {Math.min(currentPage * itemsPerPage, totalItems)}{' '}
                            dari {totalItems} data
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1); // Reset to first page when changing items per page
                                }}
                            >
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 20, 50].map((size) => (
                                        <SelectItem
                                            key={size}
                                            value={size.toString()}
                                        >
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() =>
                                            setCurrentPage((prev: number) =>
                                                Math.max(prev - 1, 1),
                                            )
                                        }
                                        disabled={currentPage === 1}
                                    />
                                </PaginationItem>

                                <PaginationItem>
                                    <PaginationLink
                                        onClick={() => setCurrentPage(1)}
                                        isActive={currentPage === 1}
                                    >
                                        1
                                    </PaginationLink>
                                </PaginationItem>

                                {totalPages > 1 &&
                                    (() => {
                                        if (totalPages <= 5) {
                                            return Array.from(
                                                { length: totalPages - 2 },
                                                (_, i) => {
                                                    const pageNum = i + 2;
                                                    return (
                                                        <PaginationItem
                                                            key={pageNum}
                                                        >
                                                            <PaginationLink
                                                                onClick={() =>
                                                                    setCurrentPage(
                                                                        pageNum,
                                                                    )
                                                                }
                                                                isActive={
                                                                    currentPage ===
                                                                    pageNum
                                                                }
                                                            >
                                                                {pageNum}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                },
                                            );
                                        } else {
                                            const pages = [];
                                            let startPage = Math.max(
                                                2,
                                                currentPage - 1,
                                            );
                                            let endPage = Math.min(
                                                totalPages - 1,
                                                currentPage + 1,
                                            );
                                            if (currentPage <= 2) {
                                                startPage = 2;
                                                endPage = 4;
                                            } else if (
                                                currentPage >=
                                                totalPages - 1
                                            ) {
                                                startPage = totalPages - 3;
                                                endPage = totalPages - 1;
                                            }
                                            if (startPage > 2) {
                                                pages.push(
                                                    <PaginationItem key="ellipsis-start">
                                                        <PaginationEllipsis />
                                                    </PaginationItem>,
                                                );
                                            }
                                            for (
                                                let i = startPage;
                                                i <= endPage;
                                                i++
                                            ) {
                                                if (
                                                    i !== 1 &&
                                                    i !== totalPages
                                                ) {
                                                    pages.push(
                                                        <PaginationItem key={i}>
                                                            <PaginationLink
                                                                onClick={() =>
                                                                    setCurrentPage(
                                                                        i,
                                                                    )
                                                                }
                                                                isActive={
                                                                    currentPage ===
                                                                    i
                                                                }
                                                            >
                                                                {i}
                                                            </PaginationLink>
                                                        </PaginationItem>,
                                                    );
                                                }
                                            }
                                            if (endPage < totalPages - 1) {
                                                pages.push(
                                                    <PaginationItem key="ellipsis-end">
                                                        <PaginationEllipsis />
                                                    </PaginationItem>,
                                                );
                                            }
                                            return pages;
                                        }
                                    })()}
                                {totalPages > 1 && (
                                    <PaginationItem>
                                        <PaginationLink
                                            onClick={() =>
                                                setCurrentPage(totalPages)
                                            }
                                            isActive={
                                                currentPage === totalPages
                                            }
                                        >
                                            {totalPages}
                                        </PaginationLink>
                                    </PaginationItem>
                                )}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() =>
                                            setCurrentPage((prev: number) =>
                                                Math.min(prev + 1, totalPages),
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            )}
        </div>
    ),
);

// Matched Groups Tab Content Component
const MatchedGroupsTabContent = React.memo(
    ({
        uniqueNotes,
        noteFilter,
        setNoteFilter,
        filteredAndSortedMatchedGroups,
        matchedSearchTerm,
        setMatchedSearchTerm,
        requestMatchedSort,
        getMatchedSortIndicator,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        totalPages,
        totalItems,
        loading,
        handleKeyClick,
    }: {
        uniqueNotes: string[];
        noteFilter: string;
        setNoteFilter: (value: string) => void;
        filteredAndSortedMatchedGroups: MatchedGroupPaginated[];
        matchedSearchTerm: string;
        setMatchedSearchTerm: (value: string) => void;
        requestMatchedSort: (key: string) => void;
        getMatchedSortIndicator: (key: string) => string | null;
        currentPage: number;
        setCurrentPage: (page: number) => void;
        itemsPerPage: number;
        setItemsPerPage: (perPage: number) => void;
        totalPages: number;
        totalItems: number;
        loading: boolean;
        handleKeyClick: (key: string) => void;
    }) => (
        <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <div className="relative">
                        <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari berdasarkan Kunci..."
                            className="pl-8"
                            value={matchedSearchTerm}
                            onChange={(e) => {
                                setMatchedSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to first page when searching
                            }}
                        />
                    </div>
                </div>
                <div>
                    <Select
                        value={noteFilter || 'all'}
                        onValueChange={(value) => {
                            setNoteFilter(value === 'all' ? '' : value);
                            setCurrentPage(1); // Reset to first page when filtering
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter Catatan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Catatan</SelectItem>
                            {uniqueNotes.map((note) => (
                                <SelectItem key={note} value={note}>
                                    {note}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <h3 className="text-lg font-semibold">
                Grup Data Valid (Matched Groups):
            </h3>
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">
                        Memuat data...
                    </span>
                </div>
            ) : (
                <>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead
                                        className="cursor-pointer"
                                        onClick={() =>
                                            requestMatchedSort('key')
                                        }
                                    >
                                        Kunci {getMatchedSortIndicator('key')}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer"
                                        onClick={() =>
                                            requestMatchedSort('uploaded_total')
                                        }
                                    >
                                        Total Diupload{' '}
                                        {getMatchedSortIndicator(
                                            'uploaded_total',
                                        )}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer"
                                        onClick={() =>
                                            requestMatchedSort('source_total')
                                        }
                                    >
                                        Total Sumber{' '}
                                        {getMatchedSortIndicator(
                                            'source_total',
                                        )}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer"
                                        onClick={() =>
                                            requestMatchedSort('difference')
                                        }
                                    >
                                        Selisih{' '}
                                        {getMatchedSortIndicator('difference')}
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer"
                                        onClick={() =>
                                            requestMatchedSort('note')
                                        }
                                    >
                                        Catatan{' '}
                                        {getMatchedSortIndicator('note')}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedMatchedGroups.map((group) => (
                                    <TableRow key={group.key}>
                                        <TableCell
                                            className="cursor-pointer font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                            onClick={() =>
                                                handleKeyClick(group.key)
                                            }
                                        >
                                            {group.key}
                                        </TableCell>
                                        <TableCell>
                                            {formatIDR(group.uploaded_total)}
                                        </TableCell>
                                        <TableCell>
                                            {formatIDR(group.source_total)}
                                        </TableCell>
                                        <TableCell>
                                            {formatIDR(group.difference)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {group.note}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <div className="text-sm text-muted-foreground">
                            Menampilkan{' '}
                            {Math.min(
                                (currentPage - 1) * itemsPerPage + 1,
                                totalItems,
                            )}{' '}
                            - {Math.min(currentPage * itemsPerPage, totalItems)}{' '}
                            dari {totalItems} data
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1); // Reset to first page when changing items per page
                                }}
                            >
                                <SelectTrigger className="w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[5, 10, 20, 50].map((size) => (
                                        <SelectItem
                                            key={size}
                                            value={size.toString()}
                                        >
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() =>
                                            setCurrentPage((prev: number) =>
                                                Math.max(prev - 1, 1),
                                            )
                                        }
                                        disabled={currentPage === 1}
                                    />
                                </PaginationItem>

                                <PaginationItem>
                                    <PaginationLink
                                        onClick={() => setCurrentPage(1)}
                                        isActive={currentPage === 1}
                                    >
                                        1
                                    </PaginationLink>
                                </PaginationItem>

                                {totalPages > 1 &&
                                    (() => {
                                        if (totalPages <= 5) {
                                            return Array.from(
                                                { length: totalPages - 2 },
                                                (_, i) => {
                                                    const pageNum = i + 2;
                                                    return (
                                                        <PaginationItem
                                                            key={pageNum}
                                                        >
                                                            <PaginationLink
                                                                onClick={() =>
                                                                    setCurrentPage(
                                                                        pageNum,
                                                                    )
                                                                }
                                                                isActive={
                                                                    currentPage ===
                                                                    pageNum
                                                                }
                                                            >
                                                                {pageNum}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    );
                                                },
                                            );
                                        } else {
                                            const pages = [];
                                            let startPage = Math.max(
                                                2,
                                                currentPage - 1,
                                            );
                                            let endPage = Math.min(
                                                totalPages - 1,
                                                currentPage + 1,
                                            );
                                            if (currentPage <= 2) {
                                                startPage = 2;
                                                endPage = 4;
                                            } else if (
                                                currentPage >=
                                                totalPages - 1
                                            ) {
                                                startPage = totalPages - 3;
                                                endPage = totalPages - 1;
                                            }
                                            if (startPage > 2) {
                                                pages.push(
                                                    <PaginationItem key="ellipsis-start">
                                                        <PaginationEllipsis />
                                                    </PaginationItem>,
                                                );
                                            }
                                            for (
                                                let i = startPage;
                                                i <= endPage;
                                                i++
                                            ) {
                                                if (
                                                    i !== 1 &&
                                                    i !== totalPages
                                                ) {
                                                    pages.push(
                                                        <PaginationItem key={i}>
                                                            <PaginationLink
                                                                onClick={() =>
                                                                    setCurrentPage(
                                                                        i,
                                                                    )
                                                                }
                                                                isActive={
                                                                    currentPage ===
                                                                    i
                                                                }
                                                            >
                                                                {i}
                                                            </PaginationLink>
                                                        </PaginationItem>,
                                                    );
                                                }
                                            }
                                            if (endPage < totalPages - 1) {
                                                pages.push(
                                                    <PaginationItem key="ellipsis-end">
                                                        <PaginationEllipsis />
                                                    </PaginationItem>,
                                                );
                                            }
                                            return pages;
                                        }
                                    })()}
                                {totalPages > 1 && (
                                    <PaginationItem>
                                        <PaginationLink
                                            onClick={() =>
                                                setCurrentPage(totalPages)
                                            }
                                            isActive={
                                                currentPage === totalPages
                                            }
                                        >
                                            {totalPages}
                                        </PaginationLink>
                                    </PaginationItem>
                                )}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() =>
                                            setCurrentPage((prev: number) =>
                                                Math.min(prev + 1, totalPages),
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </>
            )}
        </div>
    ),
);
