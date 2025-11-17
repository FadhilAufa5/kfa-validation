import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
}

interface TableInfo {
  name: string;
  description: string;
  columns: ColumnInfo[];
}

interface ImDataInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dataType: 'pembelian' | 'penjualan';
}

const pembelianColumns: ColumnInfo[] = [
  { name: 'nama_outlet', type: 'string(50)', nullable: true, description: 'Outlet name' },
  { name: 'kode_outlet', type: 'string(50)', nullable: true, description: 'Outlet code' },
  { name: 'nama_bm', type: 'string(50)', nullable: true, description: 'BM name' },
  { name: 'kode_bm', type: 'integer', nullable: true, description: 'BM code' },
  { name: 'kode_doc_type', type: 'string(50)', nullable: true, description: 'Document type code' },
  { name: 'deskripsi_kode_type', type: 'string(50)', nullable: true, description: 'Document type description' },
  { name: 'dpp', type: 'integer', nullable: true, description: 'DPP value' },
  { name: 'ppn', type: 'integer', nullable: true, description: 'PPN value' },
  { name: 'total', type: 'integer', nullable: true, description: 'Total value' },
  { name: 'document_id', type: 'integer', nullable: true, description: 'Document ID' },
  { name: 'no_transaksi', type: 'string(50)', nullable: true, description: 'Transaction number' },
  { name: 'tanggal', type: 'string(50)', nullable: true, description: 'Date' },
  { name: 'no_referensi', type: 'string(50)', nullable: true, description: 'Reference number' },
];

const penjualanColumns: ColumnInfo[] = [
  { name: 'regional_name', type: 'string(50)', nullable: true, description: 'Regional name' },
  { name: 'pc', type: 'integer', nullable: true, description: 'PC value' },
  { name: 'noreff', type: 'string(50)', nullable: true, description: 'Reference number' },
  { name: 'id', type: 'string(50)', nullable: true, description: 'ID' },
  { name: 'kode_komunikasi_sap', type: 'string(50)', nullable: true, description: 'SAP communication code' },
  { name: 'kd_profit_center', type: 'string(50)', nullable: true, description: 'Profit center code' },
  { name: 'transaction_id', type: 'string(50)', nullable: true, description: 'Transaction ID' },
  { name: 'transaction_time', type: 'string(50)', nullable: true, description: 'Transaction time' },
  { name: 'type_profit_center', type: 'string(50)', nullable: true, description: 'Profit center type' },
  { name: 'tanggal_retrieve', type: 'string(50)', nullable: true, description: 'Retrieve date' },
  { name: 'tanggal', type: 'string(50)', nullable: true, description: 'Date' },
  { name: 'total', type: 'decimal(15,2)', nullable: true, description: 'Total amount' },
  { name: 'dpp', type: 'decimal(15,2)', nullable: true, description: 'DPP amount' },
  { name: 'ppn', type: 'decimal(15,2)', nullable: true, description: 'PPN amount' },
  { name: 'cogs', type: 'string(50)', nullable: true, description: 'COGS' },
  { name: 'carabayar', type: 'integer', nullable: true, description: 'Payment method' },
  { name: 'reference_number', type: 'string(50)', nullable: true, description: 'Reference number' },
  { name: 'kd_customer', type: 'string(50)', nullable: true, description: 'Customer code' },
  { name: 'document_id', type: 'string(50)', nullable: true, description: 'Document ID' },
  { name: 'no_invoice', type: 'string(50)', nullable: true, description: 'Invoice number' },
  { name: 'tanggal_invoice', type: 'string(50)', nullable: true, description: 'Invoice date' },
  { name: 'kd_profit_center_klinik', type: 'string(50)', nullable: true, description: 'Clinic profit center code' },
  { name: 'total_uangmuka', type: 'string(50)', nullable: true, description: 'Down payment total' },
  { name: 'total_penjualan', type: 'string(50)', nullable: true, description: 'Sales total' },
  { name: 'total_pelunasan', type: 'string(50)', nullable: true, description: 'Payment total' },
  { name: 'cogs_kons', type: 'string(50)', nullable: true, description: 'COGS konsignment' },
  { name: 'kapitasi', type: 'string(50)', nullable: true, description: 'Kapitasi' },
  { name: 'ongkir', type: 'string(50)', nullable: true, description: 'Shipping cost' },
  { name: 'point', type: 'string(50)', nullable: true, description: 'Points' },
  { name: 'kd_profit_center_apotek', type: 'string(50)', nullable: true, description: 'Pharmacy profit center code' },
];

export default function ImDataInfoDialog({
  isOpen,
  onClose,
  dataType,
}: ImDataInfoDialogProps) {
  const tableInfo: TableInfo = {
    name: dataType === 'pembelian' ? 'im_purchases_and_return' : 'im_jual',
    description: dataType === 'pembelian' 
      ? 'IM Pembelian Data table structure and column formats' 
      : 'IM Penjualan Data table structure and column formats',
    columns: dataType === 'pembelian' ? pembelianColumns : penjualanColumns,
  };

  const getTypeColor = (type: string) => {
    if (type.includes('integer')) return 'text-blue-700 bg-blue-100';
    if (type.includes('decimal')) return 'text-green-700 bg-green-100';
    if (type.includes('string')) return 'text-purple-700 bg-purple-100';
    return 'text-gray-700 bg-gray-100';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            {dataType === 'pembelian' ? 'IM Pembelian' : 'IM Penjualan'} Data Format
          </DialogTitle>
          <DialogDescription>
            {tableInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Table: {tableInfo.name}</h4>
            <p className="text-sm text-muted-foreground">
              Total columns: {tableInfo.columns.length}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Column Structure</h4>
            
            <div className="grid gap-3">
              {tableInfo.columns.map((column, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium truncate">
                        {column.name}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getTypeColor(
                          column.type,
                        )}`}
                      >
                        {column.type}
                      </span>
                      {column.nullable && (
                        <span className="text-xs px-2 py-1 rounded-full text-amber-700 bg-amber-100">
                          nullable
                        </span>
                      )}
                    </div>
                    {column.description && (
                      <p className="text-xs text-muted-foreground">
                        {column.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <h5 className="font-medium text-sm text-blue-800 mb-1">Upload Requirements</h5>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Ensure column names match exactly (case-sensitive)</li>
              <li>• Follow the data types specified above</li>
              <li>• CSV format is recommended</li>
              <li>• First row should contain column headers</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
