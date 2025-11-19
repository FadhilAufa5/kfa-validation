'use client';

import DocumentComparisonPopup from '@/components/DocumentComparisonPopup';
import InvalidCategoriesBarChart from '@/components/InvalidCategoriesBarChart';
import InvalidGroupsTabContent from '@/components/InvalidGroupsTabContent';
import InvalidSourcesBarChart from '@/components/InvalidSourcesBarChart';
import MatchedGroupsTabContent from '@/components/MatchedGroupsTabContent';
import TopDiscrepanciesChart from '@/components/TopDiscrepanciesChart';
import ValidNotesDistributionChart from '@/components/ValidNotesDistributionChart';
import ValidationSummaryCard from '@/components/ValidationSummaryCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';

import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Download,
    FileText,
    Loader2,
} from 'lucide-react';

import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
    roundingValue: number;
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

export default function PenjualanShow() {
    const { props } = usePage<ValidationPageProps>();
    const {
        validationData,
        validationId,
    } = props;

    const breadcrumbs = useMemo(
        () => [
            { title: 'Penjualan', href: '/penjualan' },
            { title: 'History Penjualan', href: '/history/penjualan' },
            { title: `Detail Validasi #${validationId}`, href: '#' },
        ],
        [validationId],
    );

    // State for invalid groups table controls
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
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
    const [debouncedMatchedSearchTerm, setDebouncedMatchedSearchTerm] = useState('');
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

    // Ref to track ongoing requests for cancellation
    const invalidGroupsAbortController = useRef<AbortController | null>(null);
    const matchedGroupsAbortController = useRef<AbortController | null>(null);

    // State for document comparison popup
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState('');
    const [uploadedDocData, setUploadedDocData] = useState<
        Record<string, unknown>[] | null
    >(null);
    const [validationDocData, setValidationDocData] = useState<
        Record<string, unknown>[] | null
    >(null);
    const [uploadedTotal, setUploadedTotal] = useState<number | null>(null);
    const [sourceTotal, setSourceTotal] = useState<number | null>(null);
    const [uploadedSumField, setUploadedSumField] = useState<string | null>(
        null,
    );
    const [validationSumField, setValidationSumField] = useState<string | null>(
        null,
    );
    const [popupLoading, setPopupLoading] = useState(false);

    // State for chart data (aggregated, not full records)
    const [chartData, setChartData] = useState<{
        invalid: {
            categories: Record<string, number>;
            sources: Record<string, number>;
            topDiscrepancies: Array<{ key: string; discrepancy_value: number }>;
        };
        matched: {
            notes: Record<string, number>;
        };
    } | null>(null);
    const [activeTab, setActiveTab] = useState<string>(
        validationData && validationData.mismatched > 0 ? 'invalid' : 'valid',
    );
    const [chartDataLoaded, setChartDataLoaded] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Calculate total groups (invalid + matched)
    const totalGroups = useMemo(() => {
        if (!validationData) return 0;
        return validationData.invalidGroups + validationData.matchedGroups;
    }, [validationData]);



    // Debounce search terms to reduce API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedMatchedSearchTerm(matchedSearchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [matchedSearchTerm]);

    // Load chart data only once (lazy loaded, optimized with aggregation)
    useEffect(() => {
        if (chartDataLoaded || !validationData) return;

        const fetchChartData = async () => {
            try {
                const response = await axios.get(`/penjualan/${validationId}/chart-data`);
                setChartData(response.data);
                setChartDataLoaded(true);
            } catch (error) {
                console.error('Error fetching chart data:', error);
            }
        };

        // Delay chart data loading to prioritize tab data
        const timer = setTimeout(fetchChartData, 300);
        return () => clearTimeout(timer);
    }, [validationId, chartDataLoaded, validationData]);

    // Load invalid groups with pagination (only when active tab is invalid)
    useEffect(() => {
        if (!validationData || validationData.mismatched === 0 || activeTab !== 'invalid') return;

        // Cancel previous request if still pending
        if (invalidGroupsAbortController.current) {
            invalidGroupsAbortController.current.abort();
        }

        const controller = new AbortController();
        invalidGroupsAbortController.current = controller;

        const fetchInvalidGroups = async () => {
            setInvalidGroupsLoading(true);
            try {
                const response = await axios.get(
                    `/penjualan/${validationId}/invalid-groups`,
                    {
                        params: {
                            search: debouncedSearchTerm,
                            category: categoryFilter,
                            source: sourceFilter,
                            sort_key: sortConfigInvalid.key,
                            sort_direction: sortConfigInvalid.direction,
                            page: currentPageInvalid,
                            per_page: itemsPerPageInvalid,
                        },
                        signal: controller.signal,
                    },
                );
                setInvalidGroupsData(response.data);
            } catch (error: any) {
                if (error.name !== 'CanceledError') {
                    console.error('Error fetching invalid groups:', error);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setInvalidGroupsLoading(false);
                }
            }
        };

        fetchInvalidGroups();

        return () => {
            controller.abort();
        };
    }, [
        validationId,
        debouncedSearchTerm,
        categoryFilter,
        sourceFilter,
        sortConfigInvalid,
        currentPageInvalid,
        itemsPerPageInvalid,
        activeTab,
        validationData,
    ]);

    // Load matched groups with pagination (only when active tab is valid)
    useEffect(() => {
        if (!validationData || validationData.matched === 0 || activeTab !== 'valid') return;

        // Cancel previous request if still pending
        if (matchedGroupsAbortController.current) {
            matchedGroupsAbortController.current.abort();
        }

        const controller = new AbortController();
        matchedGroupsAbortController.current = controller;

        const fetchMatchedGroups = async () => {
            setMatchedGroupsLoading(true);
            try {
                const response = await axios.get(
                    `/penjualan/${validationId}/matched-records`,
                    {
                        params: {
                            search: debouncedMatchedSearchTerm,
                            note: noteFilter,
                            sort_key: sortConfigMatched.key,
                            sort_direction: sortConfigMatched.direction,
                            page: currentPageMatched,
                            per_page: itemsPerPageMatched,
                        },
                        signal: controller.signal,
                    },
                );
                setMatchedGroupsData(response.data);
            } catch (error: any) {
                if (error.name !== 'CanceledError') {
                    console.error('Error fetching matched groups:', error);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setMatchedGroupsLoading(false);
                }
            }
        };

        fetchMatchedGroups();

        return () => {
            controller.abort();
        };
    }, [
        validationId,
        debouncedMatchedSearchTerm,
        noteFilter,
        sortConfigMatched,
        currentPageMatched,
        itemsPerPageMatched,
        activeTab,
        validationData,
    ]);

    // Get unique categories for filter dropdown (from backend)
    const uniqueCategories = invalidGroupsData?.uniqueFilters?.categories || [];

    // Get unique source labels for filter dropdown (from backend)
    const uniqueSources = invalidGroupsData?.uniqueFilters?.sources || [];

    // Get unique notes for matched groups filter dropdown (from backend)
    const uniqueNotes = matchedGroupsData?.uniqueFilters?.notes || [];

    // Handle sort request for invalid groups (memoized)
    const requestSortInvalid = useCallback((key: string) => {
        setSortConfigInvalid((prev) => {
            const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
            return { key, direction };
        });
        setCurrentPageInvalid(1);
    }, []);

    // Get sort indicator for invalid groups table headers
    const getSortIndicatorInvalid = (key: string) => {
        if (sortConfigInvalid.key !== key) return null;
        return sortConfigInvalid.direction === 'asc' ? '↑' : '↓';
    };

    // Handle sort request for matched records (memoized)
    const requestMatchedSort = useCallback((key: string) => {
        setSortConfigMatched((prev) => {
            const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
            return { key, direction };
        });
        setCurrentPageMatched(1);
    }, []);

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
                axios.get(`/penjualan/${validationId}/document-comparison`, {
                    params: { key, type: 'uploaded' },
                }),
                axios.get(`/penjualan/${validationId}/document-comparison`, {
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

    const handleExportData = async (type: 'invalid' | 'matched') => {
        setIsExporting(true);
        try {
            const url = `/penjualan/${validationId}/export/${type}`;
            const response = await axios.get(url, {
                responseType: 'blob',
            });

            const contentDisposition = response.headers['content-disposition'];
            let filename = `export_${type}_${validationId}.csv`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            const blob = new Blob([response.data], { type: 'text/csv' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Gagal mengekspor data. Silakan coba lagi.');
        } finally {
            setIsExporting(false);
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
                    </div>
                    <Link href="/history/penjualan">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali ke History
                        </Button>
                    </Link>
                </div>

                {/* Top Section: Validation Summary */}
                <ValidationSummaryCard validationData={validationData} />

                {/* Detailed Charts Section */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Horizontal Bar Chart for Invalid Data Categories */}
                    <InvalidCategoriesBarChart
                        categoryCounts={chartData?.invalid?.categories || {}}
                    />

                    {/* Horizontal Bar Chart for Invalid Sumber */}
                    <InvalidSourcesBarChart
                        sourceCounts={chartData?.invalid?.sources || {}}
                    />
                </div>

                {/* Second Row of Charts */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {/* Top 5 Rows with Highest Selisih */}
                    <TopDiscrepanciesChart
                        topDiscrepancies={chartData?.invalid?.topDiscrepancies || []}
                    />

                    {/* Horizontal Bar Chart for Valid Data Notes */}
                    <ValidNotesDistributionChart
                        noteCounts={chartData?.matched?.notes || {}}
                    />
                </div>

                {/* Tabs for Invalid and Valid Groups */}
                {validationData.mismatched > 0 || validationData.matched > 0 ? (
                    <Tabs
                        defaultValue={activeTab}
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                    >
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
                                <div className="mb-4">
                                    <Button
                                        onClick={() => handleExportData('invalid')}
                                        disabled={isExporting}
                                        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                                        size="lg"
                                    >
                                        {isExporting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                <span>Mengekspor...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Download className="mr-2 h-5 w-5" />
                                                <span>Export Data Tidak Valid</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
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
                                <div className="mb-4">
                                    <Button
                                        onClick={() => handleExportData('matched')}
                                        disabled={isExporting}
                                        className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
                                        size="lg"
                                    >
                                        {isExporting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                <span>Mengekspor...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Download className="mr-2 h-5 w-5" />
                                                <span>Export Data Valid</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
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
