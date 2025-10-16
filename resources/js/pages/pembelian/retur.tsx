import { AnimatedTypeCards } from '@/components/AnimatedTypeCards';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function ValidationIndexPage() {
    const [selectedType, setSelectedType] = useState<string | null>(null);

    const documentTypes = [
        {
            title: 'Retur',
            icon: RefreshCw,
            color: 'text-green-500',
            href: '/pembelian/retur',
        },
    ];

    return (
        <AppLayout>
            <Head title="Document Validation Portal" />
            <div className="px-8 py-10">
                <h1 className="mb-6 text-2xl font-bold">Pilih Jenis Dokumen</h1>
                <div className="gap-5">
                    <AnimatedTypeCards
                        types={documentTypes}
                        onSelect={(title) => setSelectedType(title)}
                    />
                </div>

                {selectedType && (
                    <div className="mt-4 text-sm text-green-600 dark:text-green-400">
                        ✅ Anda memilih:{' '}
                        <span className="font-semibold">{selectedType}</span>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
