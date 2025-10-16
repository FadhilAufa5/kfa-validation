import DocumentTypeCard from '@/components/DocumentTypeCard';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';

export default function ValidationIndexPage() {
    const [fileName, setFileName] = useState<string | null>('beli_reg_sap.csv');

    const columns = [
        'profit_center',
        'nama_outlet',
        'posting_date',
        'account_no',
        'gl_acct_long_text',
        'text',
    ];

    const data = [
        [
            'BX08',
            'KF.0225',
            '1/11/2025',
            '1107010301',
            'Persediaan Barang Jadi',
            'None',
        ],
        [
            'BX09',
            'KF.02175',
            '1/15/2025',
            '1107010301',
            'Persediaan Barang Jadi',
            'None',
        ],
        [
            'BX50',
            'KF Bhayangkara Kulon',
            '1/12/2025',
            '1107010301',
            'Persediaan Barang Jadi',
            'None',
        ],
        [
            'BX43',
            'KF Sugiyopranoto Won',
            '1/30/2025',
            '1107010301',
            'Persediaan Barang Jadi',
            'None',
        ],
    ];

    const documentTypes = [
        {
            type: 'Reguler',
            icon: 'FileText',
            color: '#2563eb',
            route: 'pembelian.reguler',
        },
        {
            type: 'Retur',
            icon: 'Receipt',
            color: '#16a34a',
            route: 'pembelian.retur',
        },
        {
            type: 'Mendesak',
            icon: 'FileSignature',
            color: '#dc2626',
            route: 'pembelian.urgent',
        },
    ];

    return (
        <AppLayout>
            <Head title="Document Validation Portal" />

            <div className="min-h-screen bg-gray-50 px-8 py-10 text-gray-800 transition-colors duration-300 dark:bg-[#111315] dark:text-gray-100">
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                    {documentTypes.map((doc, i) => (
                        <Link key={i} href={route(doc.route)}>
                            <DocumentTypeCard
                                key={i}
                                type={doc.type}
                                icon={doc.icon}
                                color={doc.color}
                                onClick={() => route(doc.route)}
                            />
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
