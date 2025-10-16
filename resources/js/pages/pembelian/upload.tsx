import { Head, router} from '@inertiajs/react';
import Modal from '@/components/ui/';

export default function Upload({ document_type }) {
    return (
        <
        
        <div className="p-8">
            <h1 className="text-2xl font-bold">Upload Page</h1>
            <p>Document Type: {document_type}</p>
        </div>
    );

}
