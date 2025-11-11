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
import { Clock, Database, Settings, Upload, User } from 'lucide-react';
import { useState } from 'react';
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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Validation Setting', href: '/validation-setting' },
    ];

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
                    'File uploaded successfully and is being processed in the background.',
                );
                setIsUploadDialogOpen(false);
            },
            onError: (errors: any) => {
                toast.error(errors.file || 'Failed to upload file');
            },
            forceFormData: true,
        });
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
                    </div>
                </div>

                {/* IM Data Information Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Pembelian IM Data Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-blue-600" />
                                IM Pembelian Data
                            </CardTitle>
                            <CardDescription>
                                im_purchases_and_return table information
                            </CardDescription>
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
                                    <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                                        <div className="flex flex-1 items-start gap-2 text-sm">
                                            <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Last Updated
                                                </p>
                                                <p className="font-medium">
                                                    {
                                                        imDataInfo.pembelian
                                                            .last_updated_human
                                                    }
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        imDataInfo.pembelian
                                                            .last_updated_at
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
                                                        imDataInfo.pembelian
                                                            .last_updated_by
                                                    }
                                                </p>
                                            </div>
                                        </div>
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
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-green-600" />
                                IM Penjualan Data
                            </CardTitle>
                            <CardDescription>
                                im_jual table information
                            </CardDescription>
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
                                    <div className="flex flex-col gap-2 md:flex-row md:gap-4">
                                        <div className="flex flex-1 items-start gap-2 text-sm">
                                            <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-muted-foreground">
                                                    Last Updated
                                                </p>
                                                <p className="font-medium">
                                                    {
                                                        imDataInfo.penjualan
                                                            .last_updated_human
                                                    }
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        imDataInfo.penjualan
                                                            .last_updated_at
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
                                                        imDataInfo.penjualan
                                                            .last_updated_by
                                                    }
                                                </p>
                                            </div>
                                        </div>
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

                {/* Settings Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

                    {/* IM Data Upload Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Update IM Data</CardTitle>
                            <CardDescription>
                                Upload validation data files (Pembelian or
                                Penjualan)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2 rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium">
                                    Supported Files:
                                </p>
                                <ul className="list-inside list-disc text-sm text-muted-foreground">
                                    <li>Pembelian: im_purchases_and_return</li>
                                    <li>Penjualan: im_jual</li>
                                </ul>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Max file size: 7GB
                                </p>
                            </div>
                            <div className="pt-10">
                                <Button
                                    onClick={() => setIsUploadDialogOpen(true)}
                                    className="w-full"
                                    variant="default"
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload IM Data
                                </Button>
                            </div>
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
            />
        </AppLayout>
    );
}
