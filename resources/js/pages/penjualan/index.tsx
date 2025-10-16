import AppLayout from "@/layouts/app-layout";
import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import { Card } from "@/components/card";
import { FileText, RefreshCw, AlertTriangle, Plus } from "lucide-react";

export default function ValidationIndexPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const documentTypes = [
    {
      title: "Reguler",
      description:
        "Digunakan untuk transaksi pembelian normal tanpa kondisi khusus.",
      href: "/penjualan/reguler",
      color: "text-blue-500",
      icon: FileText,
    },
    {
      title: "Ecommerce",
      description: "Gunakan jenis ini untuk transaksi penjualan online.",
      href: "/penjualan/ecommerce",
      color: "text-green-500",
      icon: RefreshCw,
    },
    {
      title: "Debitur",
      description:
        "Digunakan untuk transaksi dengan pelanggan berstatus debitur.",
      href: "/penjualan/debitur",
      color: "text-yellow-500",
      icon: AlertTriangle,
    },
    {
      title: "Konsi",
      description:
        "Gunakan jenis ini untuk transaksi penjualan konsinyasi (titipan barang).",
      href: "/penjualan/konsi",
      color: "text-purple-500",
      icon: Plus,
    },
  ];

  return (
    <AppLayout>
      <Head title="Document Validation Portal" />

      <div className="px-8 py-10">
        {/* Judul halaman */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Pilih Jenis Dokumen
        </h1>
        <p className="text-sm text-gray-700 dark:text-gray-400 mb-6">
          Pilih salah satu jenis dokumen penjualan di bawah ini untuk melanjutkan proses validasi.
        </p>

        {/* Grid daftar card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {documentTypes.map((doc) => (
            <div key={doc.title}>
              {/* Gunakan Link agar navigasi tidak reload halaman */}
              <Link
                href={doc.href}
                onClick={() => setSelectedType(doc.title)}
                className="block h-full"
              >
                <Card
                  title={doc.title}
                  description={doc.description}
                  href={doc.href}
                  color={doc.color}
                  icon={doc.icon}
                />
              </Link>
            </div>
          ))}
        </div>

        {/* Optional feedback pilihan user */}
        {selectedType && (
          <div className="mt-6 text-sm text-green-600 dark:text-green-400">
            ✅ Anda memilih: <span className="font-semibold">{selectedType}</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
