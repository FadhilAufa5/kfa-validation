import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, AlertCircle, FileSpreadsheet } from "lucide-react";

interface ImDataUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File, dataType: string) => void;
  initialDataType?: string;
}

export default function ImDataUploadDialog({
  isOpen,
  onClose,
  onConfirm,
  initialDataType = "pembelian",
}: ImDataUploadDialogProps) {
  const [dataType, setDataType] = useState<string>(initialDataType);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const expectedFilenames = {
    pembelian: "im_purchases_and_return",
    penjualan: "im_jual",
  };

  // Update dataType when initialDataType changes
  useEffect(() => {
    setDataType(initialDataType);
  }, [initialDataType]);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setError("");
      return;
    }

    // Validate file extension
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      setError("Invalid file type. Please upload an Excel or CSV file.");
      return;
    }

    // Validate filename
    const expectedFilename = expectedFilenames[dataType as keyof typeof expectedFilenames];
    const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
    
    if (!fileNameWithoutExt.toLowerCase().includes(expectedFilename.toLowerCase())) {
      setError(
        `Invalid filename for ${dataType}. Expected filename containing "${expectedFilename}"`
      );
      return;
    }

    setFile(selectedFile);
    setError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    if (!dataType) {
      setError("Please select a data type");
      return;
    }

    onConfirm(file, dataType);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setDataType(initialDataType);
    setError("");
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getDialogTitle = () => {
    return dataType === "pembelian" 
      ? "Upload Pembelian Data" 
      : "Upload Penjualan Data";
  };

  const getDialogDescription = () => {
    const tableName = dataType === "pembelian" 
      ? "im_purchases_and_return" 
      : "im_jual";
    return `Upload validation data file for ${tableName}. Large files will be processed in the background.`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Data Type Display (Read-only) */}
          <div className="rounded-lg bg-muted p-4">
            <Label className="text-sm text-muted-foreground">Data Type</Label>
            <p className="text-base font-medium mt-1">
              {dataType === "pembelian" 
                ? "Pembelian (im_purchases_and_return)" 
                : "Penjualan (im_jual)"}
            </p>
          </div>

          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Upload File</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              } ${error ? "border-red-500" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-green-500" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileChange(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your file here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    Browse Files
                  </Button>
                </div>
              )}
            </div>
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg space-y-2">
            <p className="text-xs text-blue-900">
              <strong>Expected filename:</strong> {expectedFilenames[dataType as keyof typeof expectedFilenames]}
            </p>
            <p className="text-xs text-blue-900">
              <strong>Important:</strong> Large files (300MB - 7GB) will be processed
              in the background. The existing data will be replaced with the new data.
              Supported formats: .xlsx, .xls, .csv
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file}>
            <Upload className="mr-2 h-4 w-4" />
            Upload & Process
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
