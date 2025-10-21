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
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CircleCheck, TriangleAlert } from 'lucide-react';
import React, { useEffect } from 'react';
import { route } from 'ziggy-js';

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
    const { flash } = usePage<PageProps>().props;

    const uploadUrl = route(`pembelian.store-${document_type.toLowerCase()}`);
    const saveUrl = route('pembelian.save', {
        type: document_type.toLowerCase(),
    });

    const { data, setData, post, processing, progress, errors, reset } =
        useForm<{ document: File | null }>({
            document: null,
        });

    useEffect(() => {
        if (Object.keys(errors).length > 0)
            console.warn('[Validation Errors]', errors);
    }, [errors]);

    useEffect(() => {
        if (flash?.error) console.error('[Flash Error]', flash.error);
        if (flash?.success) console.info('[Flash Success]', flash.success);
    }, [flash]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(uploadUrl, {
            onSuccess: () => {
                console.log('✅ Uploaded successfully');
                reset('document');
            },
            onError: (errorPayload) => {
                console.error('❌ Upload failed', errorPayload);
            },
        });
    }

    function handleSaveToStorage() {
        if (!data.document) {
            alert('Silakan pilih file terlebih dahulu.');
            return;
        }

        post(saveUrl, {
            onSuccess: () => {
                console.log('✅ File disimpan di storage/app');
                reset('document');
            },
            onError: (errorPayload) => {
                console.error('❌ Gagal menyimpan file', errorPayload);
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

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="document">Pilih File</Label>
                                <Input
                                    id="document"
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) =>
                                        setData(
                                            'document',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    disabled={processing}
                                />
                                {errors.document && (
                                    <p className="text-sm text-destructive">
                                        {errors.document}
                                    </p>
                                )}
                            </div>

                            {progress && (
                                <Progress
                                    value={progress.percentage}
                                    className="w-full"
                                />
                            )}

                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleSaveToStorage}
                                    disabled={processing || !data.document}
                                >
                                    Simpan ke Storage
                                </Button>

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
