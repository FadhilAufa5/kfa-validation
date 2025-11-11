import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Report {
    id: number;
    status: 'pending' | 'accepted' | 'revoked';
    report_type: 'custom' | 'wrong_document_type' | 'dirty_data';
    report_message?: string;
}

interface ViewReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fileName: string | null;
    report: Report | null;
    documentType: 'pembelian' | 'penjualan';
    onReportReviewed: () => void;
}

export function ViewReportDialog({
    open,
    onOpenChange,
    fileName,
    report,
    documentType,
    onReportReviewed,
}: ViewReportDialogProps) {
    const [reviewNotes, setReviewNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getReportTypeLabel = (type: string) => {
        switch (type) {
            case 'wrong_document_type':
                return 'Salah Tipe Dokumen';
            case 'dirty_data':
                return 'Data Tidak Bersih';
            case 'custom':
                return 'Custom Message';
            default:
                return type;
        }
    };

    const handleAccept = async () => {
        if (!report) return;

        setIsSubmitting(true);
        try {
            await axios.post(`/${documentType}/report/${report.id}/accept`, {
                review_notes: reviewNotes,
            });

            toast.success('Report accepted', {
                description: `The report for "${fileName}" has been accepted.`,
            });

            onOpenChange(false);
            onReportReviewed();
            setReviewNotes('');
        } catch (error: any) {
            console.error('Error accepting report:', error);
            toast.error('Failed to accept report', {
                description:
                    error.response?.data?.error ||
                    'An error occurred while accepting the report.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRevoke = async () => {
        if (!report) return;

        setIsSubmitting(true);
        try {
            await axios.post(`/${documentType}/report/${report.id}/revoke`, {
                review_notes: reviewNotes,
            });

            toast.success('Report revoked', {
                description: `The report for "${fileName}" has been declined.`,
            });

            onOpenChange(false);
            onReportReviewed();
            setReviewNotes('');
        } catch (error: any) {
            console.error('Error revoking report:', error);
            toast.error('Failed to revoke report', {
                description:
                    error.response?.data?.error ||
                    'An error occurred while revoking the report.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!isSubmitting) {
            onOpenChange(newOpen);
            if (!newOpen) {
                setReviewNotes('');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Review Report</DialogTitle>
                    <DialogDescription>
                        Review and take action on this validation report.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Reported File</Label>
                        <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                            {fileName}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Issue Type</Label>
                        <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                            {report && getReportTypeLabel(report.report_type)}
                        </div>
                    </div>
                    {report?.report_message && (
                        <div className="grid gap-2">
                            <Label>Report Message</Label>
                            <div className="rounded-md bg-gray-100 p-3 dark:bg-gray-800">
                                {report.report_message}
                            </div>
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="review-notes">
                            Review Notes (Optional)
                        </Label>
                        <Textarea
                            id="review-notes"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Add notes about your decision..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRevoke}
                        disabled={isSubmitting}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 sm:w-auto"
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        {isSubmitting ? 'Processing...' : 'Revoke Report'}
                    </Button>
                    <Button
                        onClick={handleAccept}
                        disabled={isSubmitting}
                        className="w-full bg-green-600 hover:bg-green-700 sm:w-auto"
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {isSubmitting ? 'Processing...' : 'Accept Report'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
