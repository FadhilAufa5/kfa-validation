import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Play, RefreshCcw, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

interface FileItem {
    name: string;
    path: string;
    size: number;
    modified: string;
}

interface PageProps {
    files: FileItem[];
    flash?: { success?: string; error?: string };
}

export default function UploadsDashboard() {
    const { files, flash } = usePage<PageProps>().props;
    const { delete: destroy } = useForm();

    const [previewRows, setPreviewRows] = useState<any[][]>([]);
    const [selectedHeader, setSelectedHeader] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeFile, setActiveFile] = useState<string | null>(null);

    const handleDelete = (filename: string) => {
        if (!confirm(`Yakin ingin menghapus file "${filename}"?`)) return;
        destroy(route('files.delete', filename));
    };

    // Step 1: Preview first rows
    const handleProcess = async (filename: string) => {
        console.log(`📄 Previewing ${filename}...`);
        try {
            const res = await axios.get(route('files.preview', filename));
            if (res.data.preview) {
                setPreviewRows(res.data.preview);
                setSelectedHeader(null);
                setActiveFile(filename);
                setModalOpen(true);
            }
        } catch (err) {
            console.error('❌ Gagal memuat preview:', err);
        }
    };

    // Step 2: User confirms which row is header
    const handleConfirmHeader = async () => {
        if (selectedHeader === null || activeFile === null)
            return alert('Pilih baris header terlebih dahulu!');
        try {
            const saveUrl = route('pembelian.save', {
                type: document_type.toLowerCase(),
            });
            const res = await axios.post(saveUrl);
            console.log('✅ Processed file:', res.data);
            setModalOpen(false);
        } catch (err: any) {
            console.error(
                '❌ Gagal memproses file:',
                err.response?.data || err.message,
            );
        }
    };

    return (
        <AppLayout>
            <Head title="Dashboard Uploads" />

            <div className="container mx-auto px-4 py-10">
                <Card className="mx-auto max-w-5xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-2xl font-semibold">
                            📁 Dashboard File Uploads
                        </CardTitle>
                        <div className="flex gap-3">
                            <Link href={route('pembelian.index')}>
                                <Button variant="outline">
                                    <Upload className="mr-2 h-4 w-4" /> Upload
                                    Baru
                                </Button>
                            </Link>
                            <Link href={route('uploads.dashboard')}>
                                <Button variant="outline">
                                    <RefreshCcw className="mr-2 h-4 w-4" />{' '}
                                    Refresh
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {flash?.success && (
                            <Alert className="mb-6 border-green-500 text-green-700">
                                <AlertTitle>Berhasil!</AlertTitle>
                                <AlertDescription>
                                    {flash.success}
                                </AlertDescription>
                            </Alert>
                        )}
                        {flash?.error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertTitle>Terjadi Kesalahan</AlertTitle>
                                <AlertDescription>
                                    {flash.error}
                                </AlertDescription>
                            </Alert>
                        )}

                        {files.length === 0 ? (
                            <p className="py-10 text-center text-muted-foreground">
                                Tidak ada file di{' '}
                                <code>storage/app/uploads</code>.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama File</TableHead>
                                        <TableHead className="text-right">
                                            Aksi
                                        </TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {files.map((file, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{file.name}</TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleProcess(file.name)
                                                    }
                                                >
                                                    <Play className="mr-2 h-4 w-4" />{' '}
                                                    Process
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleDelete(file.name)
                                                    }
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />{' '}
                                                    Hapus
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Header Selection Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>
                            Pilih Baris Header untuk {activeFile}
                        </DialogTitle>
                    </DialogHeader>

                    {previewRows.length > 0 ? (
                        <div className="max-h-[400px] overflow-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        {previewRows[0].map(
                                            (_: any, i: number) => (
                                                <TableHead key={i}>
                                                    Kolom {i + 1}
                                                </TableHead>
                                            ),
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewRows.map((row, rowIndex) => (
                                        <TableRow
                                            key={rowIndex}
                                            className={
                                                selectedHeader === rowIndex
                                                    ? 'bg-blue-100'
                                                    : ''
                                            }
                                            onClick={() =>
                                                setSelectedHeader(rowIndex)
                                            }
                                        >
                                            <TableCell className="cursor-pointer font-semibold">
                                                {rowIndex + 1}
                                            </TableCell>
                                            {Object.values(row).map(
                                                (cell, i) => (
                                                    <TableCell key={i}>
                                                        {String(cell)}
                                                    </TableCell>
                                                ),
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="py-6 text-center text-muted-foreground">
                            Tidak ada data untuk ditampilkan.
                        </p>
                    )}

                    <DialogFooter className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleConfirmHeader}
                            disabled={selectedHeader === null}
                        >
                            Konfirmasi & Proses
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
