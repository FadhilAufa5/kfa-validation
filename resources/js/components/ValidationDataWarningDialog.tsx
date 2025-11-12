import { useState, useEffect } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Database, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ValidationDataWarningDialogProps {
    isPembelianEmpty: boolean;
    isPenjualanEmpty: boolean;
    pembelianCount?: number;
    penjualanCount?: number;
}

export default function ValidationDataWarningDialog({
    isPembelianEmpty,
    isPenjualanEmpty,
    pembelianCount = 0,
    penjualanCount = 0,
}: ValidationDataWarningDialogProps) {
    const [open, setOpen] = useState(false);
    const hasEmptyData = isPembelianEmpty || isPenjualanEmpty;

    useEffect(() => {
        // Show dialog immediately if there's empty validation data
        // This will trigger on every page load (including after login)
        if (hasEmptyData) {
            setOpen(true);
        }
    }, [hasEmptyData]);

    const handleDismiss = () => {
        // Close the dialog - will show again on next page load
        setOpen(false);
    };

    const handleGoToSettings = () => {
        window.location.href = route('validation-setting.index');
    };

    if (!hasEmptyData) {
        return null;
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <AlertDialogTitle className="text-2xl">
                            Validation Data Warning
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-base pt-4">
                        Some validation data tables are empty or missing. This may affect the validation features.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <h4 className="font-semibold mb-3 text-amber-900 dark:text-amber-100 flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Data Status
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    IM Purchases and Return (Pembelian)
                                </span>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={isPembelianEmpty ? 'destructive' : 'default'}
                                        className={isPembelianEmpty ? '' : 'bg-green-600'}
                                    >
                                        {isPembelianEmpty ? 'Empty' : `${pembelianCount.toLocaleString()} rows`}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    IM Jual (Penjualan)
                                </span>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant={isPenjualanEmpty ? 'destructive' : 'default'}
                                        className={isPenjualanEmpty ? '' : 'bg-green-600'}
                                    >
                                        {isPenjualanEmpty ? 'Empty' : `${penjualanCount.toLocaleString()} rows`}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                            Action Required
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            Please upload the validation data files to enable full system functionality:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                            {isPembelianEmpty && (
                                <li>Upload IM Purchases and Return data file</li>
                            )}
                            {isPenjualanEmpty && (
                                <li>Upload IM Jual (Sales) data file</li>
                            )}
                        </ul>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Note:</strong> Users will be redirected to a maintenance page until the validation data is uploaded.
                            Go to the Validation Settings page to upload the required data.
                        </p>
                    </div>
                </div>

                <AlertDialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleDismiss}>
                        Dismiss
                    </Button>
                    <Button onClick={handleGoToSettings} className="gap-2">
                        Go to Validation Settings
                        <ExternalLink className="w-4 h-4" />
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
