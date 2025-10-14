
import AppLayout from "@/layouts/app-layout";
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Folder, RefreshCw, Plus } from 'lucide-react'

export default function ValidationLogPage() {
  return (
    <AppLayout>
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-[#111315] dark:text-gray-100 p-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Folder className="text-yellow-500 dark:text-yellow-400" />
            Log Proses Validasi
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Riwayat Validasi Dokumen
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Process
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <Card className="bg-white dark:bg-[#1a1c1f] border border-gray-200 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden transition-colors duration-300">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100/80 dark:bg-gray-900/40">
                {[
                  'User',
                  'File Type',
                  'File Name',
                  'Role',
                  'Upload Time',
                  'Validation Score',
                  'Validation Status',
                  'Action',
                ].map((head) => (
                  <TableHead
                    key={head}
                    className="font-semibold text-gray-700 dark:text-gray-200 text-sm px-5 py-3 border-b border-gray-200 dark:border-gray-800"
                  >
                    {head}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              <TableRow className="even:bg-gray-50 odd:bg-white dark:even:bg-gray-900/30 dark:odd:bg-transparent transition-colors">
                <TableCell
                  colSpan={8}
                  className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm"
                >
                  Belum ada data validasi.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </AppLayout>
    
  )
}
