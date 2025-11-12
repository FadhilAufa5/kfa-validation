'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationFirst,
    PaginationItem,
    PaginationLast,
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
import React, { useState } from 'react';

interface MatchedGroupPaginated {
    row_index: number;
    key: string;
    uploaded_total: number;
    source_total: number;
    difference: number;
    note: string;
    is_individual_row: boolean;
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
}

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
    }: Props) => {
        const [jumpToPage, setJumpToPage] = useState('');

        const handleJumpToPage = () => {
            const pageNum = parseInt(jumpToPage, 10);
            if (pageNum >= 1 && pageNum <= totalPages) {
                setCurrentPage(pageNum);
                setJumpToPage('');
            }
        };

        const handleJumpKeyPress = (
            e: React.KeyboardEvent<HTMLInputElement>,
        ) => {
            if (e.key === 'Enter') {
                handleJumpToPage();
            }
        };

        return (
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
                                <SelectItem value="all">
                                    Semua Catatan
                                </SelectItem>
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
                    Baris Data Valid (Matched Records):
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
                                        {filteredAndSortedMatchedGroups.length >
                                            0 &&
                                            filteredAndSortedMatchedGroups[0]
                                                .is_individual_row && (
                                                <TableHead
                                                    className="cursor-pointer"
                                                    onClick={() =>
                                                        requestMatchedSort(
                                                            'row_index',
                                                        )
                                                    }
                                                >
                                                    Baris{' '}
                                                    {getMatchedSortIndicator(
                                                        'row_index',
                                                    )}
                                                </TableHead>
                                            )}
                                        <TableHead
                                            className="cursor-pointer"
                                            onClick={() =>
                                                requestMatchedSort('key')
                                            }
                                        >
                                            Kunci{' '}
                                            {getMatchedSortIndicator('key')}
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer"
                                            onClick={() =>
                                                requestMatchedSort(
                                                    'uploaded_total',
                                                )
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
                                                requestMatchedSort(
                                                    'source_total',
                                                )
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
                                            {getMatchedSortIndicator(
                                                'difference',
                                            )}
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
                                    {filteredAndSortedMatchedGroups.map(
                                        (record) => (
                                            <TableRow
                                                key={`${record.key}-${record.row_index}`}
                                            >
                                                {record.is_individual_row && (
                                                    <TableCell className="text-muted-foreground">
                                                        {record.row_index + 1}
                                                    </TableCell>
                                                )}
                                                <TableCell
                                                    className="cursor-pointer font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                    onClick={() =>
                                                        handleKeyClick(
                                                            record.key,
                                                        )
                                                    }
                                                >
                                                    {record.key}
                                                </TableCell>
                                                <TableCell>
                                                    {formatIDR(
                                                        record.uploaded_total,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatIDR(
                                                        record.source_total,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatIDR(
                                                        record.difference,
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">
                                                        {record.note}
                                                    </Badge>
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
                                -{' '}
                                {Math.min(
                                    currentPage * itemsPerPage,
                                    totalItems,
                                )}{' '}
                                dari {totalItems} data
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm whitespace-nowrap text-muted-foreground">
                                        Jump to:
                                    </span>
                                    <Input
                                        type="number"
                                        min="1"
                                        max={totalPages}
                                        value={jumpToPage}
                                        onChange={(e) =>
                                            setJumpToPage(e.target.value)
                                        }
                                        onKeyPress={handleJumpKeyPress}
                                        placeholder="Page"
                                        className="h-8 w-20 text-sm"
                                    />
                                </div>
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
                                        <PaginationFirst
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                        />
                                    </PaginationItem>
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

                                    {(() => {
                                        const pages = [];
                                        const startPage = Math.max(1, currentPage - 2);
                                        const endPage = Math.min(totalPages, currentPage + 2);

                                        for (let i = startPage; i <= endPage; i++) {
                                            pages.push(
                                                <PaginationItem key={i}>
                                                    <PaginationLink
                                                        onClick={() => setCurrentPage(i)}
                                                        isActive={currentPage === i}
                                                    >
                                                        {i}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        }
                                        return pages;
                                    })()}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() =>
                                                setCurrentPage((prev: number) =>
                                                    Math.min(
                                                        prev + 1,
                                                        totalPages,
                                                    ),
                                                )
                                            }
                                            disabled={
                                                currentPage === totalPages
                                            }
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationLast
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
                    </>
                )}
            </div>
        );
    },
);

MatchedGroupsTabContent.displayName = 'MatchedGroupsTabContent';

export default MatchedGroupsTabContent;
