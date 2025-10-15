'use client';

import { useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';

import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import 'filepond/dist/filepond.min.css';

// Register FilePond plugins
registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

interface FileUploaderProps {
    server?: string;
    onUpdate?: (file: File | null) => void;
    acceptedTypes?: string[];
    label?: string;
    maxFileSize?: string;
}

export default function FileUploader({
    server,
    onUpdate,
    acceptedTypes = [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    label = 'Drag & drop your file or click to browse',
    maxFileSize = '50MB',
}: FileUploaderProps) {
    const [files, setFiles] = useState<any[]>([]);

    return (
        <div className="w-full">
            <FilePond
                files={files}
                onupdatefiles={(fileItems) => {
                    setFiles(fileItems);
                    onUpdate?.(fileItems[0]?.file ?? null);
                }}
                allowMultiple={false}
                maxFiles={1}
                acceptedFileTypes={acceptedTypes}
                labelIdle={label}
                allowFileTypeValidation={true}
                allowFileSizeValidation={true}
                maxFileSize={maxFileSize}
                server={server ?? undefined}
                name="file"
                credits={false}
                className="text-sm"
            />
        </div>
    );
}
