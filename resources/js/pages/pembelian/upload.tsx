// resources/js/Pages/pembelian/upload.tsx

import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage } from '@inertiajs/react';
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

// Icons
import { ArrowLeft, CircleCheck, TriangleAlert } from 'lucide-react';

// FilePond
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import 'filepond/dist/filepond.min.css';
import { FilePond, registerPlugin } from 'react-filepond';

// Register the FilePond plugin
registerPlugin(FilePondPluginFileValidateType);

export default function UploadPage({ document_type }) {
    // Get shared data from Inertia, including flash messages and CSRF token
    const { flash, csrf_token } = usePage().props;

    // Dynamically generate the correct upload URL based on the document type
    const uploadUrl = route('pembelian.store-' + document_type.toLowerCase());

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
                        {flash.success && (
                            <Alert className="mb-6 border-green-500 text-green-700 dark:border-green-600 dark:text-green-300">
                                <CircleCheck className="h-4 w-4" />
                                <AlertTitle>Berhasil!</AlertTitle>
                                <AlertDescription>
                                    {flash.success}
                                </AlertDescription>
                            </Alert>
                        )}

                        {flash.error && (
                            <Alert variant="destructive" className="mb-6">
                                <TriangleAlert className="h-4 w-4" />
                                <AlertTitle>Terjadi Kesalahan</AlertTitle>
                                <AlertDescription>
                                    {flash.error}
                                </AlertDescription>
                            </Alert>
                        )}
                        {/* --- End Flash Messages --- */}

                        <FilePond
                            name="document" // Must match the key in PembelianController
                            credits={false}
                            acceptedFileTypes={[
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                'application/vnd.ms-excel',
                                'text/csv',
                            ]}
                            labelFileTypeNotAllowed="Tipe file tidak valid"
                            fileValidateTypeLabelExpectedTypes="Hanya menerima file .xlsx, .xls, atau .csv"
                            labelIdle='Seret & Lepas file atau <span class="filepond--label-action">Telusuri</span>'
                            server={{
                                url: uploadUrl, // Dynamic URL for the backend
                                method: 'POST',
                                headers: {
                                    'X-CSRF-TOKEN': csrf_token, // Security is important
                                },
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
