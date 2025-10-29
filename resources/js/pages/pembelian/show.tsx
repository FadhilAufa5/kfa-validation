'use client';

import DocumentComparisonPopup from '@/components/DocumentComparisonPopup';
import InvalidGroupsTabContent from '@/components/InvalidGroupsTabContent';
import MatchedGroupsTabContent from '@/components/MatchedGroupsTabContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';

import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    FileCheck2,
    FileText,
    FileX2,
    Loader2,
    Scale,
    XCircle,
} from 'lucide-react';

import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

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
    row_index: number;
    key: string;
    uploaded_total: number;
    source_total: number;
    difference: number;
    note: string;
    is_individual_row: boolean;
}

interface ValidationData {
    fileName: string;
    role: string;
    category: string;
    score: number;
    matched: number;
    total: number;
    mismatched: number;
    invalidGroups: number;
    matchedGroups: number;
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
    const [uploadedSumField, setUploadedSumField] = useState<string | null>(
        null,
    );
    const [validationSumField, setValidationSumField] = useState<string | null>(
        null,
    );
    const [popupLoading, setPopupLoading] = useState(false);

    // State for all chart data (not paginated)
    const [allInvalidGroups, setAllInvalidGroups] = useState<
        ValidationGroupPaginated[]
    >([]);
    const [allMatchedGroups, setAllMatchedGroups] = useState<
        MatchedGroupPaginated[]
    >([]);

    // Calculate total groups (invalid + matched)
    const totalGroups = useMemo(() => {
        return validationData.invalidGroups + validationData.matchedGroups;
    }, [validationData.invalidGroups, validationData.matchedGroups]);

    // Data untuk kartu statistik
    const stats = useMemo(
        () => [
            {
                title: 'Validation Status',
                value: validationData.isValid ? 'Valid' : 'Invalid',
                icon: validationData.isValid ? CheckCircle2 : XCircle,
                color: validationData.isValid
                    ? 'text-green-600'
                    : 'text-red-600',
            },
            {
                title: 'Total Records Processed',
                value: validationData.total.toLocaleString('id-ID'),
                icon: Scale,
                groups: totalGroups,
            },

            {
                title: 'Total Matched Records',
                value: validationData.matched.toLocaleString('id-ID'),
                icon: FileCheck2,
                groups: validationData.matchedGroups,
                color:
                    validationData.matched > 0
                        ? 'text-green-600'
                        : 'text-muted-foreground',
            },
            {
                title: 'Total Mismatched Records',
                value: validationData.mismatched.toLocaleString('id-ID'),
                icon: FileX2,
                groups: validationData.invalidGroups,
                color:
                    validationData.mismatched > 0
                        ? 'text-red-600'
                        : 'text-muted-foreground',
            },
        ],
        [
            validationData.isValid,
            validationData.total,
            validationData.matched,
            validationData.mismatched,
            validationData.invalidGroups,
            validationData.matchedGroups,
            totalGroups,
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

    // Load all invalid groups data for charts
    useEffect(() => {
        const fetchAllInvalidGroups = async () => {
            try {
                const response = await axios.get(
                    `/pembelian/${validationId}/invalid-groups/all`,
                );
                setAllInvalidGroups(response.data);
            } catch (error) {
                console.error('Error fetching all invalid groups:', error);
            }
        };

        fetchAllInvalidGroups();
    }, [validationId]);

    // Load all matched groups data for charts
    useEffect(() => {
        const fetchAllMatchedGroups = async () => {
            try {
                const response = await axios.get(
                    `/pembelian/${validationId}/matched-records/all`,
                );
                setAllMatchedGroups(response.data);
            } catch (error) {
                console.error('Error fetching all matched groups:', error);
            }
        };

        fetchAllMatchedGroups();
    }, [validationId]);

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

                {/* Horizontal Metrics Layout */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="rounded-lg border bg-card text-card-foreground shadow-sm"
                        >
                            <div className="flex flex-row items-center justify-between p-3">
                                <div>
                                    <CardTitle className="text-xs font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                </div>
                                <stat.icon
                                    className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`}
                                />
                            </div>
                            <div className="p-3 pt-0">
                                <div
                                    className={`text-lg font-bold ${stat.color || ''}`}
                                >
                                    {stat.value}
                                </div>
                                {stat.groups !== undefined && (
                                    <div className="mt-1 flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">
                                            {stat.groups.toLocaleString(
                                                'id-ID',
                                            )}{' '}
                                            Groups
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Donut Chart for Validation Score */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribusi Skor Validasi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center">
                                <div className="relative h-40 w-40">
                                    {/* Simple CSS donut chart */}
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full">
                                        <svg className="h-full w-full -rotate-90 transform">
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke="currentColor"
                                                strokeWidth="14"
                                                fill="none"
                                                className="text-gray-200"
                                            />
                                            <circle
                                                cx="80"
                                                cy="80"
                                                r="70"
                                                stroke="currentColor"
                                                strokeWidth="14"
                                                fill="none"
                                                strokeDasharray={`${2 * Math.PI * 70}`}
                                                strokeDashoffset={`${2 * Math.PI * 70 * (1 - validationData.score / 100)}`}
                                                className={
                                                    validationData.score >= 80
                                                        ? 'text-green-500'
                                                        : validationData.score >=
                                                            50
                                                          ? 'text-yellow-500'
                                                          : 'text-red-500'
                                                }
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-xl font-bold">
                                                {validationData.score.toFixed(
                                                    1,
                                                )}
                                                %
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                Skor Validasi
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                    <span className="text-sm">
                                        Matched: {validationData.matched}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                    <span className="text-sm">
                                        Invalid: {validationData.mismatched}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                                    <span className="text-sm">
                                        Groups: {totalGroups}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        {/* Horizontal Bar Chart for Invalid Data Categories */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Kategori Data Tidak Valid</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Array.from(
                                        new Set(
                                            allInvalidGroups.map(
                                                (g) => g.discrepancy_category,
                                            ),
                                        ),
                                    )
                                        .slice(0, 5) // Display up to 5 categories
                                        .map((category) => {
                                            const count =
                                                allInvalidGroups.filter(
                                                    (g) =>
                                                        g.discrepancy_category ===
                                                        category,
                                                ).length;
                                            const maxCount = Math.max(
                                                ...Array.from(
                                                    new Set(
                                                        allInvalidGroups.map(
                                                            (g) =>
                                                                g.discrepancy_category,
                                                        ),
                                                    ),
                                                ).map(
                                                    (cat) =>
                                                        allInvalidGroups.filter(
                                                            (g) =>
                                                                g.discrepancy_category ===
                                                                cat,
                                                        ).length,
                                                ),
                                                1, // Ensure maxCount is at least 1 to avoid division by zero
                                            );
                                            return (
                                                <div
                                                    key={category}
                                                    className="flex items-center gap-2"
                                                >
                                                    <span className="w-24 truncate text-xs">
                                                        {category}
                                                    </span>
                                                    <div className="relative h-6 flex-1 rounded-full bg-gray-200">
                                                        <div
                                                            className="flex h-6 items-center justify-end rounded-full bg-blue-500 pr-2"
                                                            style={{
                                                                width: `${(count / maxCount) * 100}%`,
                                                            }}
                                                        >
                                                            <span className="text-xs font-medium text-white">
                                                                {count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Horizontal Bar Chart for Invalid Sumber */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Persentase Sumber Data Tidak Valid
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Array.from(
                                        new Set(
                                            allInvalidGroups.map(
                                                (g) => g.sourceLabel,
                                            ),
                                        ),
                                    )
                                        .slice(0, 5)
                                        .map((sourceLabel) => {
                                            const count =
                                                allInvalidGroups.filter(
                                                    (g) =>
                                                        g.sourceLabel ===
                                                        sourceLabel,
                                                ).length;
                                            const maxCount = Math.max(
                                                ...Array.from(
                                                    new Set(
                                                        allInvalidGroups.map(
                                                            (g) =>
                                                                g.sourceLabel,
                                                        ),
                                                    ),
                                                ).map(
                                                    (label) =>
                                                        allInvalidGroups.filter(
                                                            (g) =>
                                                                g.sourceLabel ===
                                                                label,
                                                        ).length,
                                                ),
                                                1, // Ensure maxCount is at least 1 to avoid division by zero
                                            );
                                            return (
                                                <div
                                                    key={sourceLabel}
                                                    className="flex items-center gap-2"
                                                >
                                                    <span className="w-24 truncate text-xs">
                                                        {sourceLabel}
                                                    </span>
                                                    <div className="relative h-6 flex-1 rounded-full bg-gray-200">
                                                        <div
                                                            className="flex h-6 items-center justify-end rounded-full bg-purple-500 pr-2"
                                                            style={{
                                                                width: `${(count / maxCount) * 100}%`,
                                                            }}
                                                        >
                                                            <span className="text-xs font-medium text-white">
                                                                {count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Second Row of Charts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Top 5 Rows with Highest Selisih */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top 5 Baris dengan Selisih Tertinggi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {allInvalidGroups
                                    .sort(
                                        (a, b) =>
                                            Math.abs(b.discrepancy_value) -
                                            Math.abs(a.discrepancy_value),
                                    )
                                    .slice(0, 5)
                                    .map((item, index) => {
                                        const absValue = Math.abs(item.discrepancy_value);
                                        const maxValue = Math.max(
                                            ...allInvalidGroups.map(g => Math.abs(g.discrepancy_value))
                                        );
                                        const barWidth = maxValue > 0 ? (absValue / maxValue) * 100 : 0;
                                        
                                        return (
                                            <div
                                                key={item.key}
                                                className="flex items-center gap-2"
                                            >
                                                <div className="flex items-center gap-2 w-8">
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                                <span className="w-32 truncate text-xs">
                                                    {item.key}
                                                </span>
                                                <div className="relative h-6 flex-1 rounded-full bg-gray-200">
                                                    <div
                                                        className="flex h-6 items-center justify-end rounded-full bg-red-500 pr-2"
                                                        style={{
                                                            width: `${barWidth}%`,
                                                        }}
                                                    >
                                                        <span className="text-xs font-medium text-white">
                                                            {absValue.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {allInvalidGroups.length === 0 && (
                                    <div className="text-center text-muted-foreground py-4">
                                        Tidak ada data selisih untuk ditampilkan
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Horizontal Bar Chart for Valid Data Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribusi Catatan Data Valid</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Array.from(
                                    new Set(
                                        allMatchedGroups.map((g) => g.note),
                                    ),
                                )
                                    .slice(0, 5)
                                    .map((note) => {
                                        const count = allMatchedGroups.filter(
                                            (g) => g.note === note,
                                        ).length;
                                        const maxCount = Math.max(
                                            ...Array.from(
                                                new Set(
                                                    allMatchedGroups.map(
                                                        (g) => g.note,
                                                    ),
                                                ),
                                            ).map(
                                                (cat) =>
                                                    allMatchedGroups.filter(
                                                        (g) => g.note === cat,
                                                    ).length,
                                            ),
                                            1, // Ensure maxCount is at least 1 to avoid division by zero
                                        );
                                        return (
                                            <div
                                                key={note}
                                                className="flex items-center gap-2"
                                            >
                                                <span className="w-24 truncate text-xs">
                                                    {note}
                                                </span>
                                                <div className="relative h-6 flex-1 rounded-full bg-gray-200">
                                                    <div
                                                        className="flex h-6 items-center justify-end rounded-full bg-green-500 pr-2"
                                                        style={{
                                                            width: `${(count / maxCount) * 100}%`,
                                                        }}
                                                    >
                                                        <span className="text-xs font-medium text-white">
                                                            {count}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </CardContent>
                    </Card>
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
