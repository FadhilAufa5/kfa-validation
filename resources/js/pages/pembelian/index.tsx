import AppLayout from "@/layouts/app-layout";
import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Upload, FileSpreadsheet, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
    ['BX08', 'KF.0225', '1/11/2025', '1107010301', 'Persediaan Barang Jadi', 'None'],
    ['BX09', 'KF.02175', '1/15/2025', '1107010301', 'Persediaan Barang Jadi', 'None'],
    ['BX50', 'KF Bhayangkara Kulon', '1/12/2025', '1107010301', 'Persediaan Barang Jadi', 'None'],
    ['BX43', 'KF Sugiyopranoto Won', '1/30/2025', '1107010301', 'Persediaan Barang Jadi', 'None'],
  ];

  return (
    <AppLayout>
      <Head title="Document Validation Portal" />

      <div className="min-h-screen bg-gray-50 dark:bg-[#111315] text-gray-800 dark:text-gray-100 px-8 py-10 transition-colors duration-300">

        {/* Judul */}
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-6">
          <FileSpreadsheet className="text-black dark:text-gray-500" />
          Document Validation Pembelian
        </h1>

        {/* User Info & Document Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 space-y-2">
              <h2 className="font-semibold text-lg mb-2">User Information</h2>
              <div className="text-sm">
                <div>Nama User: <span className="text-green-500 font-medium">Admin</span></div>
                <div>Role User: <span className="text-blue-400 font-medium">Accountant</span></div>
                <div>Waktu login: 2025-10-14 15:39:36 WIB</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4">
              <h2 className="font-semibold text-lg mb-2">Document Types</h2>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Dokumen Reguler Pembelian</li>
                <li>Dokumen Retur Pembelian</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Upload Your Document</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Note: Pastikan kolom berikut tersedia: <code className="text-green-500">profit_center</code>,{' '}
            <code className="text-green-500">doc_id</code>, <code className="text-green-500">posting_date</code>, dan{' '}
            <code className="text-green-500">kredit</code>.
          </p>

          <Card className="border-dashed border-2 border-gray-300 dark:border-gray-700 bg-gray-100/50 dark:bg-gray-900/40 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-2">Drag and drop file here</p>
            <p className="text-xs text-gray-400 mb-3">Limit 200MB per file – .CSV, .XLSX</p>
            <Button variant="outline" size="sm">Browse Files</Button>
          </Card>

          {fileName && (
            <div className="flex items-center justify-between mt-4 text-sm border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900/60">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-green-500 w-4 h-4" />
                <span>{fileName}</span>
                <span className="text-gray-400">362.7 KiB</span>
              </div>
              <button onClick={() => setFileName(null)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Table Preview */}
        <Card className="border-gray-200 dark:border-gray-800 mb-6 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-900/40">
                  {columns.map((col) => (
                    <TableHead
                      key={col}
                      className="font-semibold text-gray-700 dark:text-gray-300 text-sm px-4 py-3 border-b border-gray-200 dark:border-gray-800"
                    >
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow
                    key={i}
                    className="even:bg-gray-50 dark:even:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    {row.map((cell, j) => (
                      <TableCell key={j} className="px-4 py-2 text-sm">{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="space-y-3">
          <div className="bg-green-600/10 text-green-700 dark:text-green-300 dark:bg-green-900/30 border border-green-600/20 rounded-md px-4 py-3 text-sm">
            Kolom sudah sesuai! File siap untuk diproses.
          </div>
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
            Proses dan Lihat Hasil
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
