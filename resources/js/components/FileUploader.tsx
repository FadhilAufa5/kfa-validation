'use client';

import { useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import 'filepond/dist/filepond.min.css';

registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

interface FileUploaderProps {
  onUpdate?: (file: File | null) => void;
}

export default function FileUploader({ onUpdate }: FileUploaderProps) {
  const [files, setFiles] = useState<any[]>([]);

  return (
    <div className="w-full">
      <FilePond
        files={files}
        onupdatefiles={(fileItems) => {
          setFiles(fileItems);
          const actualFile = fileItems[0]?.file as File | null;
          onUpdate?.(actualFile ?? null);
        }}
        allowMultiple={false}
        maxFiles={1}
        acceptedFileTypes={['text/csv']}
        labelIdle="Drag & lepaskan file CSV di sini atau klik untuk memilih"
        allowFileTypeValidation
        allowFileSizeValidation
        maxFileSize="10MB"
        credits={false}
        instantUpload={true}
        server={{
          process: {
            url: 'http://kfa-validation-.test/api/upload-csv',
            method: 'POST',
            withCredentials: false,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            onload: (response) => {
              alert('File berhasil diupload dan disimpan di database!');
              return response;
            },
            onerror: (response) => {
              alert('Upload gagal, cek server!');
              return response;
            },
          },
        }}
        name="file"
        className="text-sm"
      />
    </div>
  );
}
