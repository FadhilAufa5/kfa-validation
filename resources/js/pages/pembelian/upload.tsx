import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useEffect } from 'react'; // ✅ Import useEffect
import { route } from 'ziggy-js';

// ShadCN UI Components
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

// Icons
import { ArrowLeft, CircleCheck, TriangleAlert } from 'lucide-react';

// Define prop types for Inertia and component
interface UploadPageProps {
    document_type: string;
}

interface PageProps {
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function UploadPage({ document_type }: UploadPageProps) {
    // Get shared data from Inertia, including flash messages
    const { flash } = usePage<PageProps>().props;

    // Dynamically generate the correct upload URL based on the document type
    const uploadUrl = route(`pembelian.store-${document_type.toLowerCase()}`);

    // Set up the form using Inertia's useForm hook
    const { data, setData, post, processing, progress, errors, reset } =
        useForm<{
            document: File | null;
        }>({
            document: null,
        });

    // ✅ Log validation errors whenever the `errors` object changes
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.warn('[Validation Errors]', errors);
        }
    }, [errors]);

    // ✅ Log flash messages whenever they appear
    useEffect(() => {
        if (flash?.error) {
            console.error('[Flash Error]', flash.error);
        }
        if (flash?.success) {
            console.info('[Flash Success]', flash.success);
        }
    }, [flash]);

    // Handle form submission
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(uploadUrl, {
            onSuccess: () => {
                // Also good to log success for debugging
                console.log(
                    '✅ Form submitted successfully. Resetting file input.',
                );
                reset('document');
            },
            // ✅ Add onError callback to log any submission failures
            onError: (errorPayload) => {
                console.error('❌ Form submission failed.', errorPayload);
            },
        });
    }

    return (
        <AppLayout>
            <Head title={`Upload Dokumen ${document_type}`} />

            <div className="container mx-auto px-4 py-10">
                <Card className="mx-auto max-w-3xl">
                    <CardHeader>
                        <div className="mb-2 flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl">
                                    Upload Dokumen Pembelian {document_type}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Unggah file Excel (.xlsx, .xls) atau CSV
                                    yang sesuai.
                                </CardDescription>
                            </div>
                            <Link href={route('pembelian.index')}>
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Kembali
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {/* --- Flash Messages Section --- */}
                        {flash?.success && (
                            <Alert className="mb-6 border-green-500 text-green-700 dark:border-green-600 dark:text-green-300">
                                <CircleCheck className="h-4 w-4" />
                                <AlertTitle>Berhasil!</AlertTitle>
                                <AlertDescription>
                                    {flash.success}
                                </AlertDescription>
                            </Alert>
                        )}

                        {flash?.error && (
                            <Alert variant="destructive" className="mb-6">
                                <TriangleAlert className="h-4 w-4" />
                                <AlertTitle>Terjadi Kesalahan</AlertTitle>
                                <AlertDescription>
                                    {flash.error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* --- Upload Form Section --- */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="document">Pilih File</Label>
                                <Input
                                    id="document"
                                    type="file"
                                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                                    onChange={(e) =>
                                        setData(
                                            'document',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    disabled={processing}
                                    className="file:text-foreground"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Hanya menerima file .xlsx, .xls, atau .csv.
                                </p>
                                {errors.document && (
                                    <p className="text-sm text-destructive">
                                        {errors.document}
                                    </p>
                                )}
                            </div>

                            {/* Optional: Show upload progress */}
                            {progress && (
                                <Progress
                                    value={progress.percentage}
                                    className="w-full"
                                />
                            )}

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={processing || !data.document}
                                >
                                    {processing
                                        ? 'Mengunggah...'
                                        : 'Unggah Dokumen'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
