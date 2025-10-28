'use client';

import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FileCheck2, FileText, Loader2 } from 'lucide-react';
import React from 'react';

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

// Helper function to render document data, robustly handling different formats.
const renderDocumentData = (data: any[] | null) => {
    if (!data || data.length === 0) {
        return (
            <div className="py-4 text-center text-sm text-muted-foreground">
                Tidak ada data ditemukan
            </div>
        );
    }

    let headers: string[] = [];
    let dataRows: any[] = [];
    const isArrayOfObjects =
        data.length > 0 &&
        typeof data[0] === 'object' &&
        data[0] !== null &&
        !Array.isArray(data[0]);

    if (isArrayOfObjects) {
        headers = Object.keys(data[0]);
        dataRows = data;
    } else if (data.length > 0 && Array.isArray(data[0])) {
        headers = data[0].map(String);
        dataRows = data.slice(1);
    } else {
        return (
            <div className="py-4 text-center text-sm text-muted-foreground">
                Format data tidak dapat ditampilkan.
            </div>
        );
    }

    if (dataRows.length === 0) {
        return (
            <div className="py-4 text-center text-sm text-muted-foreground">
                Tidak ada baris data yang cocok ditemukan.
            </div>
        );
    }

    const formatCellData = (value: any, header: string): { value: string } => {
        if (value === null || value === undefined || value === '') {
            return { value: '-' };
        }

        const stringValue = String(value).trim();
        if (stringValue.startsWith('Rp') || stringValue.includes('IDR')) {
            return { value: stringValue };
        }

        const parsedValue = parseFloat(stringValue.replace(/[^\d\.-]/g, ''));
        let isFinancialField = false;
        const lowerHeader = header.toLowerCase().trim();

        if (
            !isNaN(parsedValue) &&
            (lowerHeader.includes('total') ||
                lowerHeader.includes('harga') ||
                lowerHeader.includes('jumlah') ||
                lowerHeader.includes('nilai') ||
                lowerHeader.includes('dpp') ||
                lowerHeader.includes('ppn') ||
                lowerHeader.includes('diskon') ||
                lowerHeader.includes('bayar') ||
                lowerHeader.includes('tagihan'))
        ) {
            isFinancialField = true;
        }

        const formattedValue = isFinancialField
            ? formatIDR(parsedValue)
            : stringValue;
        return { value: formattedValue };
    };

    return (
        <>
            <div className="overflow-auto">
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                    Total: {dataRows.length} baris data ditemukan
                </div>
                <table className="w-full min-w-max divide-y divide-gray-200 text-xs dark:divide-gray-700">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {headers.map((header, index) => (
                                <th
                                    key={index}
                                    className="px-2 py-1.5 text-left font-medium tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-300"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {dataRows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={
                                    rowIndex % 2 === 0
                                        ? 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'
                                        : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600'
                                }
                            >
                                {headers.map((header, colIndex) => {
                                    const value = Array.isArray(row)
                                        ? row[colIndex]
                                        : row[header];
                                    const formattedValue = formatCellData(
                                        value,
                                        header,
                                    );
                                    return (
                                        <td
                                            key={colIndex}
                                            className="max-w-[150px] truncate px-2 py-1 whitespace-nowrap text-gray-900 dark:text-gray-100"
                                            title={String(value)}
                                        >
                                            {formattedValue.value}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

interface DocumentComparisonPopupProps {
    isOpen: boolean;
    onClose: () => void;
    uploadedDocData: any[] | null;
    validationDocData: any[] | null;
    connectorKey: string;
    uploadedTotal: number | null;
    sourceTotal: number | null;
    isLoading: boolean;
    uploadedSumField?: string | null;
    validationSumField?: string | null;
}

// Document Comparison Popup Component
const DocumentComparisonPopup = React.memo(
    ({
        isOpen,
        onClose,
        uploadedDocData,
        validationDocData,
        connectorKey,
        uploadedTotal,
        sourceTotal,
        isLoading,
        uploadedSumField,
        validationSumField,
    }: DocumentComparisonPopupProps) => {
        // Calculate counts if data is available
        const uploadedCount = uploadedDocData
            ? Array.isArray(uploadedDocData[0])
                ? uploadedDocData.length - 1
                : uploadedDocData.length
            : 0;
        const validationCount = validationDocData
            ? Array.isArray(validationDocData[0])
                ? validationDocData.length - 1
                : validationDocData.length
            : 0;

        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-h-[90vh] w-full max-w-full overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            Perbandingan Dokumen
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            Menampilkan semua data untuk kunci:{' '}
                            <span className="font-semibold text-blue-600">
                                {connectorKey}
                            </span>
                        </DialogDescription>
                        {!isLoading &&
                            (uploadedTotal !== null ||
                                sourceTotal !== null) && (
                                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                                    {uploadedTotal !== null && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-blue-600">
                                                Total Diupload:
                                                {uploadedSumField && ` (${uploadedSumField})`}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="px-2 py-1"
                                            >
                                                {formatIDR(uploadedTotal)}
                                            </Badge>
                                        </div>
                                    )}
                                    {sourceTotal !== null && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-green-600">
                                                Total Sumber:
                                                {validationSumField && ` (${validationSumField})`}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="px-2 py-1"
                                            >
                                                {formatIDR(sourceTotal)}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            )}
                        {!isLoading &&
                            (uploadedCount > 0 || validationCount > 0) && (
                                <div className="mt-2 flex gap-4 text-sm">
                                    <Badge variant="secondary">
                                        Uploaded: {uploadedCount} baris
                                    </Badge>
                                    <Badge variant="outline">
                                        Validasi: {validationCount} baris
                                    </Badge>
                                </div>
                            )}
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-muted-foreground">
                                Memuat data perbandingan...
                            </span>
                        </div>
                    ) : (
                        <div className="flex h-[65vh] flex-col gap-4 overflow-hidden">
                            <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                                <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/20">
                                    <div className="sticky top-0 z-10 bg-blue-50 px-6 py-4 dark:bg-blue-900/20">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                            Dokumen Diupload
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-6 py-2">
                                        {renderDocumentData(uploadedDocData)}
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/20">
                                    <div className="sticky top-0 z-10 bg-green-50 px-6 py-4 dark:bg-green-900/20">
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <FileCheck2 className="h-4 w-4 text-green-600" />
                                            Dokumen Validasi
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto px-6 py-2">
                                        {renderDocumentData(validationDocData)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        );
    },
);

export default DocumentComparisonPopup;
