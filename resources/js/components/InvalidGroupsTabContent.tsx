'use client';

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
import { Loader2, Search } from 'lucide-react';
import React from 'react';

interface ValidationGroupPaginated {
    key: string;
    discrepancy_category: string;
    error: string;
    uploaded_total: number;
    source_total: number;
    discrepancy_value: number;
    sourceLabel: string;
}

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

interface Props {
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
}

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
    }: Props) => (
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
                                        className="cursor-pointer pl-4"
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
                                        Selisih{' '}
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
                                                className="cursor-pointer font-medium text-blue-600 hover:text-blue-800 hover:underline pl-4"
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

InvalidGroupsTabContent.displayName = 'InvalidGroupsTabContent';

export default InvalidGroupsTabContent;
