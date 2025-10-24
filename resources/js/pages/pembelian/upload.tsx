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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    CircleCheck,
    Loader2,
    RotateCcw,
    Sheet,
    TriangleAlert,
    UploadCloud,
} from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface UploadPageProps {
    document_type: string;
    document_category: string;
}

interface PageProps {
    flash?: {
        success?: string;
        error?: string;
    };
}

type UploadStep =
    | 'initial'
    | 'previewing'
    | 'processing'
    | 'validating'
    | 'validation_complete'
    | 'finished';

interface ValidationResult {
    status: 'valid' | 'invalid';
    invalid_groups: {
        [key: string]: {
            discrepancy_category: string;
            error: string;
            uploaded_total: number;
            source_total: number;
            discrepancy_value: number;
        };
    };
    invalid_rows: {
        row_index: number;
        key_value: string;
        total_omset: number;
        error: string;
    }[];
}

export default function UploadPage({ document_type, document_category }: UploadPageProps) {
    const { flash } = usePage<PageProps>().props;

    const saveUrl = route('pembelian.save', {
        type: document_category.toLowerCase(),
    });
    const validateUrl = route('pembelian.validateFile', {
        type: document_category.toLowerCase(),
    });

    const { data, setData, reset } = useForm<{ document: File | null }>({
        document: null,
    });

    const [step, setStep] = useState<UploadStep>('initial');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [apiError, setApiError] = useState<string | null>(null);

    const [uploadedFilename, setUploadedFilename] = useState<string | null>(
        null,
    );
    const [previewData, setPreviewData] = useState<string[][] | null>(null);
    const [headerRow, setHeaderRow] = useState<number>(1);
    const [processedResult, setProcessedResult] = useState<{
        data_count: number;
    } | null>(null);
    const [validationResult, setValidationResult] =
        useState<ValidationResult | null>(null);

    const handleReset = () => {
        reset('document');
        setStep('initial');
        setIsLoading(false);
        setUploadProgress(0);
        setApiError(null);
        setUploadedFilename(null);
        setPreviewData(null);
        setHeaderRow(1);
        setProcessedResult(null);
        setValidationResult(null);
    };

    /** Step 1: Upload & Preview **/
    async function handleUploadAndPreview() {
        if (!data.document) {
            setApiError('Silakan pilih file terlebih dahulu.');
            return;
        }

        setIsLoading(true);
        setApiError(null);
        setStep('previewing');
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('document', data.document);

        try {
            const uploadResponse = await axios.post(saveUrl, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) /
                            (progressEvent.total || 1),
                    );
                    setUploadProgress(percentCompleted);
                },
            });

            const { filename } = uploadResponse.data;
            if (!filename)
                throw new Error('Server tidak mengembalikan nama file.');
            setUploadedFilename(filename);

            const previewUrl = route('pembelian.preview', { filename });
            const previewResponse = await axios.get(previewUrl);
            setPreviewData(previewResponse.data.preview);
        } catch (error: any) {
            console.error('❌ Upload or Preview failed', error);
            const errorMessage =
                error.response?.data?.error ||
                error.message ||
                'Terjadi kesalahan yang tidak diketahui.';
            setApiError(errorMessage);
            setStep('initial');
        } finally {
            setIsLoading(false);
        }
    }

    /** Step 2: Process File **/
    async function handleProcessFile() {
        if (!uploadedFilename) {
            setApiError('Tidak ada file yang diunggah untuk diproses.');
            return;
        }

        setIsLoading(true);
        setApiError(null);
        setStep('processing');

        try {
            const processUrl = route('pembelian.processWithHeader', {
                filename: uploadedFilename,
            });
            const response = await axios.post(processUrl, { headerRow });
            console.log('✅ Processed Data:', response.data.data);
            setProcessedResult({ data_count: response.data.data_count });

            // ✅ Next Step: Automatically validate after processing
            await handleValidateFile(uploadedFilename);
        } catch (error: any) {
            console.error('❌ Processing failed', error);
            const errorMessage =
                error.response?.data?.error ||
                'Gagal memproses file. Pastikan baris header yang dipilih benar.';
            setApiError(errorMessage);
            setStep('previewing');
        } finally {
            setIsLoading(false);
        }
    }

    /** Step 3: Validate File **/
    async function handleValidateFile(filenameParam?: string) {
        const filenameToUse = filenameParam || uploadedFilename;
        if (!filenameToUse) {
            setApiError('Tidak ada file yang diunggah untuk divalidasi.');
            return;
        }

        console.log('Validating File:', filenameToUse);
        setIsLoading(true);
        setApiError(null);
        setStep('validating');

        try {
            const response = await axios.post(validateUrl, {
                filename: filenameToUse,
            });
            setValidationResult(response.data);
            setStep('validation_complete');
            console.log(response.data);
        } catch (error: any) {
            console.error('❌ Validation failed', error);
            const errorMessage =
                error.response?.data?.error ||
                error.message ||
                'Terjadi kesalahan saat memvalidasi file.';
            setApiError(errorMessage);
            setStep('previewing');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AppLayout>
            <Head title={`Upload Dokumen ${document_category}`} />
            <div className="container mx-auto px-4 py-10">
                <Card className="mx-auto max-w-4xl">
                    <CardHeader>
                        <div className="mb-2 flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl">
                                    Upload Dokumen Pembelian {document_category}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Unggah, pratinjau, dan proses file Anda
                                    dalam beberapa langkah mudah.
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
                        {apiError && (
                            <Alert variant="destructive" className="mb-6">
                                <TriangleAlert className="h-4 w-4" />
                                <AlertTitle>Terjadi Kesalahan</AlertTitle>
                                <AlertDescription>{apiError}</AlertDescription>
                            </Alert>
                        )}
                        {flash?.error && !apiError && (
                            <Alert variant="destructive" className="mb-6">
                                <TriangleAlert className="h-4 w-4" />
                                <AlertTitle>Terjadi Kesalahan</AlertTitle>
                                <AlertDescription>
                                    {flash.error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Step 1: Upload */}
                        {step === 'initial' && (
                            <div className="space-y-6">
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
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleUploadAndPreview}
                                        disabled={isLoading || !data.document}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <UploadCloud className="mr-2 h-4 w-4" />
                                        )}
                                        Unggah & Pratinjau
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Preview */}
                        {step === 'previewing' && isLoading && (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Mengunggah file...
                                </p>
                                <Progress
                                    value={uploadProgress}
                                    className="w-full"
                                />
                            </div>
                        )}

                        {step === 'previewing' && !isLoading && previewData && (
                            <div className="space-y-6">
                                <Alert
                                    variant="default"
                                    className="border-blue-500"
                                >
                                    <Sheet className="h-4 w-4" />
                                    <AlertTitle>Pratinjau Data</AlertTitle>
                                    <AlertDescription>
                                        File <strong>{uploadedFilename}</strong>{' '}
                                        berhasil diunggah. Klik pada baris di
                                        bawah untuk memilihnya sebagai header.
                                    </AlertDescription>
                                </Alert>

                                <div className="max-h-80 overflow-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-16">
                                                    Baris
                                                </TableHead>
                                                {previewData[0]?.map(
                                                    (_, colIndex) => (
                                                        <TableHead
                                                            key={colIndex}
                                                        >
                                                            Kolom{' '}
                                                            {String.fromCharCode(
                                                                65 + colIndex,
                                                            )}
                                                        </TableHead>
                                                    ),
                                                )}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.map(
                                                (row, rowIndex) => (
                                                    <TableRow
                                                        key={rowIndex}
                                                        onClick={() =>
                                                            setHeaderRow(
                                                                rowIndex + 1,
                                                            )
                                                        }
                                                        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                                                            headerRow ===
                                                            rowIndex + 1
                                                                ? 'bg-muted'
                                                                : ''
                                                        }`}
                                                    >
                                                        <TableCell className="font-medium">
                                                            {rowIndex + 1}
                                                        </TableCell>
                                                        {row.map(
                                                            (
                                                                cell,
                                                                cellIndex,
                                                            ) => (
                                                                <TableCell
                                                                    key={
                                                                        cellIndex
                                                                    }
                                                                >
                                                                    {cell}
                                                                </TableCell>
                                                            ),
                                                        )}
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Label
                                        htmlFor="header-row"
                                        className="whitespace-nowrap"
                                    >
                                        Baris Header Dipilih:
                                    </Label>
                                    <Input
                                        id="header-row"
                                        type="number"
                                        min="1"
                                        className="w-24"
                                        value={headerRow}
                                        onChange={(e) =>
                                            setHeaderRow(
                                                parseInt(e.target.value, 10) ||
                                                    1,
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={handleReset}
                                        disabled={isLoading}
                                    >
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Unggah File Lain
                                    </Button>
                                    <Button
                                        onClick={handleProcessFile}
                                        disabled={isLoading}
                                    >
                                        {isLoading && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Proses Data
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Processing */}
                        {step === 'processing' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <p className="text-sm text-muted-foreground">
                                        Memproses file...
                                    </p>
                                </div>
                                <Progress value={50} className="w-full" />
                            </div>
                        )}

                        {/* Step 4: Validating */}
                        {step === 'validating' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <p className="text-sm text-muted-foreground">
                                        Memvalidasi file...
                                    </p>
                                </div>
                                <Progress value={75} className="w-full" />
                            </div>
                        )}

                        {/* Step 5: Validation Result */}
                        {step === 'validation_complete' && validationResult && (
                            <div className="space-y-6">
                                {validationResult.status === 'valid' ? (
                                    <Alert className="border-green-500 text-green-700 dark:border-green-600 dark:text-green-300">
                                        <CircleCheck className="h-4 w-4" />
                                        <AlertTitle>
                                            Validasi Berhasil!
                                        </AlertTitle>
                                        <AlertDescription>
                                            File{' '}
                                            <strong>{uploadedFilename}</strong>{' '}
                                            lolos validasi.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <Alert
                                        variant="destructive"
                                        className="mb-6"
                                    >
                                        <TriangleAlert className="h-4 w-4" />
                                        <AlertTitle>Validasi Gagal!</AlertTitle>
                                        <AlertDescription>
                                            File{' '}
                                            <strong>{uploadedFilename}</strong>{' '}
                                            tidak lolos validasi. Ditemukan{' '}
                                            {
                                                Object.keys(
                                                    validationResult.invalid_groups,
                                                ).length
                                            }{' '}
                                            grup data yang tidak valid.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Show link to validation details in history */}
                                {validationResult.status === 'invalid' && (
                                    <div className="space-y-4">
                                        <Alert
                                            variant="destructive"
                                            className="mb-6"
                                        >
                                            <TriangleAlert className="h-4 w-4" />
                                            <AlertTitle>Perhatian</AlertTitle>
                                            <AlertDescription>
                                                File <strong>{uploadedFilename}</strong> gagal validasi. 
                                                Detail validasi dapat dilihat di halaman History Pembelian.
                                            </AlertDescription>
                                        </Alert>
                                        <div className="flex justify-center">
                                            <Link href="/pembelian/history">
                                                <Button>
                                                    Lihat History Validasi
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <Button
                                        variant="outline"
                                        onClick={handleReset}
                                    >
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        Kembali
                                    </Button>
                                    {validationResult.status === 'invalid' && (
                                        <Button
                                            onClick={handleValidateFile}
                                            disabled={isLoading}
                                        >
                                            {isLoading && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Coba Validasi Lagi
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
