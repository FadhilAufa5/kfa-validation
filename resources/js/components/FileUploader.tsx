'use client';

import { usePage } from '@inertiajs/react';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import 'filepond/dist/filepond.min.css';
import { useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';

registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

interface FileUploaderProps {
    onUpdate?: (file: File | null) => void;
    documentType?: string;
}

export default function FileUploader({
    onUpdate,
    documentType,
}: FileUploaderProps) {
    const [files, setFiles] = useState<any[]>([]);
    const { csrf_token } = usePage().props;

    // Define the API endpoint based on document type
    const getApiEndpoint = () => {
        if (!documentType) return '/api/upload-csv';

        // Map document type to appropriate API endpoint
        switch (documentType.toLowerCase()) {
            case 'reguler':
                return '/api/upload-reguler';
            case 'retur':
                return '/api/upload-retur';
            case 'mendesak':
                return '/api/upload-mendesak';
            default:
                return '/api/upload-csv';
        }
    };

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
                acceptedFileTypes={[
                    'text/csv',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ]}
                labelIdle="Drag & lepaskan file CSV/XLSX di sini atau klik untuk memilih"
                allowFileTypeValidation
                allowFileSizeValidation
                maxFileSize="100MB"
                credits={false}
                instantUpload={true}
                server={{
                    process: {
                        url: getApiEndpoint(),
                        method: 'POST',
                        withCredentials: false,
                        headers: {
                            'X-CSRF-TOKEN': csrf_token, // Security is important
                            'Document-Type': documentType || 'unknown',
                        },
                        onload: (response) => {
                            alert(
                                `File berhasil diupload dan disimpan di database sebagai dokumen ${documentType || 'umum'}!`,
                            );
                            return response;
                        },
                        onerror: (response) => {
                            alert(
                                `Upload dokumen ${documentType || 'umum'} gagal, cek server!`,
                            );
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
