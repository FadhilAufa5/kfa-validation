import ImDataUploadDialog from '@/components/ImDataUploadDialog';
import ToleranceDialog from '@/components/ToleranceDialog';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Clock, Database, Settings, Upload, User, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { route } from 'ziggy-js';

interface ImDataDetails {
    row_count: number;
    last_updated_at: string | null;
    last_updated_by: string | null;
    last_updated_human: string | null;
}

interface ImDataInfo {
    pembelian: ImDataDetails | null;
    penjualan: ImDataDetails | null;
}

interface ToleranceUpdateInfo {
    last_updated_at: string | null;
    last_updated_by: string | null;
    last_updated_human: string | null;
}

interface ValidationSettingProps {
    currentTolerance: number;
    toleranceUpdateInfo: ToleranceUpdateInfo | null;
    imDataInfo: ImDataInfo;
}

export default function ValidationSettingIndex({
    currentTolerance,
    toleranceUpdateInfo,
    imDataInfo,
}: ValidationSettingProps) {
    const [isToleranceDialogOpen, setIsToleranceDialogOpen] = useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [uploadDataType, setUploadDataType] = useState<string>('pembelian');
    const [refreshingTable, setRefreshingTable] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Validation Setting', href: '/validation-setting' },
    ];

    // Cleanup polling interval on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat('id-ID').format(num);
    };

    const handleToleranceUpdate = (tolerance: number) => {
        router.post(
            route('validation-setting.tolerance'),
            { tolerance },
            {
                onSuccess: () => {
                    toast.success('Rounding tolerance updated successfully!');
                    setIsToleranceDialogOpen(false);
                },
                onError: (errors) => {
                    toast.error(
                        errors.tolerance || 'Failed to update tolerance',
                    );
                },
            },
        );
    };

    const handleImDataUpload = (file: File, dataType: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('data_type', dataType);

        router.post(route('validation-setting.upload-im-data'), formData, {
            onSuccess: () => {
                toast.success(
                    'File uploaded successfully and is being processed in the background. Data will refresh automatically when processing is complete.',
                    { duration: 5000 }
                );
                setIsUploadDialogOpen(false);
                setIsProcessing(true);
                startPollingForUpdates(dataType);
            },
            onError: (errors: Record<string, string>) => {
                toast.error(errors.file || 'Failed to upload file');
            },
            forceFormData: true,
        });
    };

    const startPollingForUpdates = (dataType: string) => {
        let pollCount = 0;
        const maxPolls = 120; // Poll for up to 10 minutes (120 * 5 seconds)

        // Clear any existing interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        // Store the previous timestamp to detect changes
        const previousTimestamp = dataType === 'pembelian'
            ? imDataInfo.pembelian?.last_updated_at
            : imDataInfo.penjualan?.last_updated_at;

        pollingIntervalRef.current = setInterval(() => {
            pollCount++;

            // Reload the page data using visit to get fresh data
            router.visit(route('validation-setting.index'), {
                only: ['imDataInfo'],
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const newImDataInfo = page.props.imDataInfo as ImDataInfo;
                    const currentData = dataType === 'pembelian' 
                        ? newImDataInfo.pembelian 
                        : newImDataInfo.penjualan;

                    // Check if the timestamp has changed (indicating processing is complete)
                    if (currentData && currentData.last_updated_at !== previousTimestamp) {
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                        setIsProcessing(false);
                        toast.success(
                            `${dataType === 'pembelian' ? 'Pembelian' : 'Penjualan'} data processing completed! Row count: ${formatNumber(currentData.row_count)}`,
                            { duration: 5000 }
                        );
                    }

                    // Stop polling after max attempts
                    if (pollCount >= maxPolls) {
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                        setIsProcessing(false);
                        toast.info('Processing is taking longer than expected. Please refresh manually to see the updated count.');
                    }
                }
            });
        }, 5000); // Poll every 5 seconds
    };

    const handleOpenUploadDialog = (dataType: string) => {
        setUploadDataType(dataType);
        setIsUploadDialogOpen(true);
    };

    const handleRefreshCount = (tableName: string) => {
        setRefreshingTable(tableName);
        
        router.post(
            route('validation-setting.refresh-count'),
            { table_name: tableName },
            {
                onSuccess: () => {
                    const displayName = tableName === 'im_purchases_and_return' 
                        ? 'Pembelian' 
                        : tableName === 'im_jual' 
                        ? 'Penjualan' 
                        : 'All tables';
                    toast.success(`${displayName} data count refreshed successfully!`);
                    setRefreshingTable(null);
                },
                onError: (errors: Record<string, string>) => {
                    toast.error(errors.refresh || 'Failed to refresh data count');
                    setRefreshingTable(null);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Validation Setting" />
            <Toaster position="top-right" richColors />

            <div className="w-full space-y-6 px-6 py-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-2xl font-semibold">
                            <Settings className="text-blue-600" />
                            Validation Setting
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Configure validation parameters and update IM data
                        </p>
                        {isProcessing && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>Processing uploaded data in background...</span>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => handleRefreshCount('all')}
                        disabled={refreshingTable === 'all'}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshingTable === 'all' ? 'animate-spin' : ''}`} />
                        {refreshingTable === 'all' ? 'Refreshing All...' : 'Refresh All Counts'}
                    </Button>
                </div>

                {/* IM Data Information Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Pembelian IM Data Info */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="h-5 w-5 text-blue-600" />
                                        IM Pembelian Data
                                    </CardTitle>
                                    <CardDescription>
                                        im_purchases_and_return table information
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRefreshCount('im_purchases_and_return')}
                                    disabled={refreshingTable === 'im_purchases_and_return'}
                                    className="gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${refreshingTable === 'im_purchases_and_return' ? 'animate-spin' : ''}`} />
                                    {refreshingTable === 'im_purchases_and_return' ? 'Refreshing...' : 'Refresh'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {imDataInfo.pembelian ? (
                                <>
                                    <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                                        <span className="text-sm text-muted-foreground">
                                            Total Rows
                                        </span>
                                        <span className="text-lg font-bold">
                                            {formatNumber(
                                                imDataInfo.pembelian.row_count,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="flex flex-1 items-center gap-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Last Updated
                                                    </p>
                                                    <p className="font-medium text-sm">
                                                        {
                                                            imDataInfo.pembelian
                                                                .last_updated_human
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Updated By
                                                    </p>
                                                    <p className="font-medium text-sm">
                                                        {
                                                            imDataInfo.pembelian
                                                                .last_updated_by
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleOpenUploadDialog('pembelian')}
                                            className="gap-2 md:ml-4 flex-shrink-0"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Update IM Data
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No data available
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Penjualan IM Data Info */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="h-5 w-5 text-green-600" />
                                        IM Penjualan Data
                                    </CardTitle>
                                    <CardDescription>
                                        im_jual table information
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRefreshCount('im_jual')}
                                    disabled={refreshingTable === 'im_jual'}
                                    className="gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${refreshingTable === 'im_jual' ? 'animate-spin' : ''}`} />
                                    {refreshingTable === 'im_jual' ? 'Refreshing...' : 'Refresh'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {imDataInfo.penjualan ? (
                                <>
                                    <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                                        <span className="text-sm text-muted-foreground">
                                            Total Rows
                                        </span>
                                        <span className="text-lg font-bold">
                                            {formatNumber(
                                                imDataInfo.penjualan.row_count,
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="flex flex-1 items-center gap-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Last Updated
                                                    </p>
                                                    <p className="font-medium text-sm">
                                                        {
                                                            imDataInfo.penjualan
                                                                .last_updated_human
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Updated By
                                                    </p>
                                                    <p className="font-medium text-sm">
                                                        {
                                                            imDataInfo.penjualan
                                                                .last_updated_by
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleOpenUploadDialog('penjualan')}
                                            className="gap-2 md:ml-4 flex-shrink-0"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Update IM Data
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No data available
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Settings Card */}
                <div className="max-w-2xl">
                    {/* Rounding Tolerance Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Rounding Tolerance</CardTitle>
                            <CardDescription>
                                Adjust the tolerance value for validation
                                rounding calculations
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-muted-foreground">
                                    Current Tolerance
                                </p>
                                <p className="text-2xl font-bold">
                                    {currentTolerance}
                                </p>
                            </div>
                            {toleranceUpdateInfo && (
                                <div className="flex flex-col gap-2 border-t pt-2 md:flex-row md:gap-4">
                                    <div className="flex flex-1 items-start gap-2 text-sm">
                                        <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-muted-foreground">
                                                Last Updated
                                            </p>
                                            <p className="font-medium">
                                                {
                                                    toleranceUpdateInfo.last_updated_human
                                                }
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {
                                                    toleranceUpdateInfo.last_updated_at
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 items-center gap-2 text-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-muted-foreground">
                                                Updated By
                                            </p>
                                            <p className="font-medium">
                                                {
                                                    toleranceUpdateInfo.last_updated_by
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <Button
                                onClick={() => setIsToleranceDialogOpen(true)}
                                className="w-full"
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Adjust Tolerance
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialogs */}
            <ToleranceDialog
                isOpen={isToleranceDialogOpen}
                onClose={() => setIsToleranceDialogOpen(false)}
                currentTolerance={currentTolerance}
                onConfirm={handleToleranceUpdate}
            />

            <ImDataUploadDialog
                isOpen={isUploadDialogOpen}
                onClose={() => setIsUploadDialogOpen(false)}
                onConfirm={handleImDataUpload}
                initialDataType={uploadDataType}
            />
        </AppLayout>
    );
}
