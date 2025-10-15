import FileUploader from '@/components/FileUploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle,
    FileSpreadsheet,
    Upload,
} from 'lucide-react';
import { useState } from 'react';

export default function RegulerPage() {
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleUpload = async () => {
        if (!file) return alert('Pilih file terlebih dahulu!');
        setLoading(true);
        setValidationError(null);
        setResult(null);

        // First, validate the file structure
        router.post(route('pembelian.reguler.upload'), { 
            file: file 
        }, {
            onSuccess: (page) => {
                const data = page.props;
                if (data.errors) {
                    setResult({
                        success: false,
                        error: Object.values(data.errors).join(', ')
                    });
                    setLoading(false);
                    return;
                }

                if (!data.success) {
                    setResult(data);
                    setValidationError(
                        'Struktur file tidak sesuai. Silakan periksa kolom yang diperlukan.',
                    );
                    setLoading(false);
                    return;
                }

                // If validation passes, process the file
                router.post(route('pembelian.reguler.process'), { 
                    file: file 
                }, {
                    onSuccess: (processPage) => {
                        const processData = processPage.props;
                        if (processData.errors) {
                            setResult({
                                success: false,
                                error: Object.values(processData.errors).join(', ')
                            });
                            return;
                        }
                        
                        if (processData.success) {
                            setResult({
                                success: true,
                                message: processData.message,
                            });
                        } else {
                            setResult({
                                success: false,
                                error: processData.error || processData.message,
                            });
                        }
                    },
                    onError: (errors) => {
                        setResult({
                            success: false,
                            error: Object.values(errors).join(', ')
                        });
                    },
                    onFinish: () => {
                        setLoading(false);
                    }
                });
            },
            onError: (errors) => {
                setResult({
                    success: false,
                    error: Object.values(errors).join(', ')
                });
                setLoading(false);
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Pembelian Reguler - Validasi Dokumen" />

            <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-800 dark:bg-[#111315] dark:text-gray-100">
                <h1 className="mb-6 flex items-center gap-2 text-3xl font-bold">
                    <FileSpreadsheet className="text-green-600" /> Validasi
                    Dokumen Reguler
                </h1>

                <Card className="border-gray-200 dark:border-gray-800">
                    <CardContent className="space-y-6 p-6">
                        <FileUploader
                            onUpdate={(f) => setFile(f)}
                            acceptedTypes={[
                                'text/csv',
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            ]}
                            label="<span class='filepond--label-action'>Browse</span> or drop file here (.csv, .xlsx)"
                            maxFileSize="50MB"
                        />

                        <Button
                            disabled={loading || !file}
                            onClick={handleUpload}
                            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {loading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" />
                                    Upload dan Proses
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Result */}
                {result && (
                    <Card className="mt-6 border-gray-200 dark:border-gray-800">
                        <CardContent className="p-6">
                            {result.success ? (
                                <div className="mb-3 flex items-center gap-2 text-green-600">
                                    <CheckCircle />{' '}
                                    <span>
                                        {result.message ||
                                            'File berhasil diproses! ✅'}
                                    </span>
                                </div>
                            ) : (
                                <div className="mb-3 flex items-center gap-2 text-red-500">
                                    <AlertTriangle />{' '}
                                    <span>
                                        {result.error ||
                                            'Kesalahan dalam proses file.'}
                                    </span>
                                </div>
                            )}

                            {validationError && (
                                <div className="mb-3 flex items-center gap-2 text-red-500">
                                    <AlertTriangle />{' '}
                                    <span>{validationError}</span>
                                </div>
                            )}

                            {result.found_columns && (
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <strong>Kolom ditemukan:</strong>{' '}
                                        {result.found_columns?.join(', ')}
                                    </div>
                                    {result.missing_columns?.length > 0 && (
                                        <div>
                                            <strong>Kolom hilang:</strong>{' '}
                                            <span className="text-red-500">
                                                {result.missing_columns.join(
                                                    ', ',
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
