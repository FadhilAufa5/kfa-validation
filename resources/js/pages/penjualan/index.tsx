import { Card } from '@/components/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    CheckCircle,
    CreditCard,
    FileText,
    ShoppingBasket,
} from 'lucide-react';
import { useState } from 'react';

export default function ValidationIndexPage() {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const documentTypes = [
        {
            title: 'Reguler',
            description:
                'Untuk transaksi penjualan reguler dengan proses standar.',
            color: 'text-blue-500',
            icon: FileText,
            href: '/penjualan/reguler',
        },
        {
            title: 'Ecommerce',
            description:
                'Untuk transaksi penjualan melalui platform e-commerce.',
            color: 'text-purple-500',
            icon: ShoppingBasket,
            href: '/penjualan/ecommerce',
        },
        {
            title: 'Debitur',
            description:
                'Untuk transaksi penjualan dengan pembayaran kredit atau cicilan.',
            color: 'text-orange-500',
            icon: CreditCard,
            href: '/penjualan/debitur',
        },
        {
            title: 'Konsi',
            description:
                'Untuk transaksi penjualan konsinyasi dengan sistem titipan barang.',
            color: 'text-green-500',
            icon: CheckCircle,
            href: '/penjualan/konsi',
        },
    ];

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Penjualan', href: '/penjualan' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Document Validation Portal" />
            <div className="px-6 py-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Pilih Jenis Dokumen
                    </h1>
                    <p className="max-w-xl py-2 text-sm font-normal text-gray-700 dark:text-gray-300">
                        Silakan pilih salah satu jenis dokumen di bawah ini
                        untuk mengunggah berks terkait proses validasi
                        pembelian.
                    </p>
                </div>

                {/* Card Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {documentTypes.map((doc) => (
                        <div
                            key={doc.title}
                            onClick={() => setSelectedType(doc.title)}
                        >
                            <Card
                                title={doc.title}
                                description={doc.description}
                                color={doc.color}
                                icon={doc.icon}
                                href={doc.href}
                                currentSelectedType={
                                    selectedType === doc.title
                                        ? doc.title
                                        : null
                                }
                            />
                        </div>
                    ))}
                </div>
                {selectedType && (
                    <div className="mt-4 text-sm text-gray-900 dark:text-gray-900">
                        Anda memilih:{' '}
                        <span className="font-semibold text-green-600">
                            {selectedType}
                        </span>{' '}
                        ✅
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
