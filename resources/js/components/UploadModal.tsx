import { Modal, Button, Label, FileInput } from "flowbite-react";
import { useState } from "react";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

export function UploadModal({ open, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (!file) return alert("Pilih file terlebih dahulu!");

    // contoh: kirim ke backend pakai fetch/Inertia
    console.log("Uploading file:", file);
    onClose();
  };

  return (
    <Modal show={open} onClose={onClose}>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Upload Dokumen
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Silakan pilih file dokumen yang ingin diunggah.
        </p>

        <div className="mb-4">
          <Label htmlFor="file" value="Pilih File" />
          <FileInput
            id="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button color="gray" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleUpload}>Upload</Button>
        </div>
      </div>
    </Modal>
  );
}
