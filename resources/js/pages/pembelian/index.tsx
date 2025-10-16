import AppLayout from "@/layouts/app-layout";
import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import { Card } from "@/components/card";
import { FileText, RefreshCw, AlertTriangle } from "lucide-react";
import { type BreadcrumbItem } from "@/types";

export default function ValidationIndexPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const documentTypes = [
    {
      title: "Reguler",
      description:
        "Digunakan untuk transaksi pembelian normal tanpa kondisi khusus.",
      color: "text-blue-500",
      icon: FileText,
    },
    {
      title: "Retur",
      description: "Gunakan jenis ini untuk transaksi pengembalian barang.",
      color: "text-green-500",
      icon: RefreshCw,
    },
    {
      title: "Mendesak",
      description:
        "Untuk pembelian yang bersifat mendesak dan harus diproses segera.",
      color: "text-red-500",
      icon: AlertTriangle,
    },
  ];

   const breadcrumbs: BreadcrumbItem[] = [
          { title: "Dashboard", href: "/dashboard" },
          { title: "Pembelian", href: "/pembelian" },
        ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}    >
      <Head title="Document Validation Portal" />
      <div className="px-6 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pilih Jenis Dokumen
          </h1>
          <p className="py-2 text-sm text-gray-700 dark:text-gray-300 font-normal max-w-xl">
            Silakan pilih salah satu jenis dokumen di bawah ini untuk mengunggah
            berkas terkait proses validasi pembelian.
          </p>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {documentTypes.map((doc) => (
            <div key={doc.title} onClick={() => setSelectedType(doc.title)}>
              <Card
                title={doc.title}
                description={doc.description}
                color={doc.color}
                icon={doc.icon}
              />
            </div>
          ))}
        </div>
           {selectedType && (
                    <div className="mt-4 text-sm text-gray-900 dark:text-gray-900">
                        Anda memilih: {' '}   
                        <span className="font-semibold text-green-600">{selectedType}</span> ✅
                    </div>
                )}
            
      </div>
    </AppLayout>
  );
}


             
