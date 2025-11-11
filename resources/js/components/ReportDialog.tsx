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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';

interface ReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    validationId: number | null;
    fileName: string | null;
    documentType: 'pembelian' | 'penjualan';
    onReportSubmitted: () => void;
}

export function ReportDialog({
    open,
    onOpenChange,
    validationId,
    fileName,
    documentType,
    onReportSubmitted,
}: ReportDialogProps) {
    const [reportType, setReportType] = useState<string>('wrong_document_type');
    const [reportMessage, setReportMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!validationId) return;

        setIsSubmitting(true);
        try {
            await axios.post(`/${documentType}/${validationId}/report`, {
                report_type: reportType,
                report_message: reportType === 'custom' ? reportMessage : null,
            });

            toast.success('Report submitted successfully', {
                description: `Your report has been submitted and is pending review.`,
            });

            onOpenChange(false);
            onReportSubmitted();

            // Reset form
            setReportType('wrong_document_type');
            setReportMessage('');
        } catch (error: any) {
            console.error('Error submitting report:', error);
            toast.error('Failed to submit report', {
                description:
                    error.response?.data?.error ||
                    'An error occurred while submitting the report.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!isSubmitting) {
            onOpenChange(newOpen);
            if (!newOpen) {
                // Reset form when closing
                setReportType('wrong_document_type');
                setReportMessage('');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Report Validation Issue</DialogTitle>
                    <DialogDescription>
                        Report a problem with this validation. The validation will
                        be marked as reported and awaiting admin review.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="report-type">Issue Type</Label>
                        <Select
                            value={reportType}
                            onValueChange={setReportType}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select issue type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="wrong_document_type">
                                    Salah Tipe Dokumen
                                </SelectItem>
                                <SelectItem value="dirty_data">
                                    Data Tidak Bersih
                                </SelectItem>
                                <SelectItem value="custom">
                                    Custom Message
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {reportType === 'custom' && (
                        <div className="grid gap-2">
                            <Label htmlFor="report-message">
                                Custom Message
                            </Label>
                            <Textarea
                                id="report-message"
                                value={reportMessage}
                                onChange={(e) =>
                                    setReportMessage(e.target.value)
                                }
                                placeholder="Describe the issue..."
                                className="min-h-[100px]"
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            isSubmitting ||
                            (reportType === 'custom' && !reportMessage)
                        }
                        className="bg-orange-600 hover:bg-orange-700"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
