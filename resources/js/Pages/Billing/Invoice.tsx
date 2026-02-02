import { Head, Link } from '@inertiajs/react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Heading from '@/components/heading';
import { ArrowLeft, Printer, Download, AlertCircle, FileText } from 'lucide-react';
import { InvoiceTemplate } from '@/components/billing/InvoiceTemplate';
import type { Bill } from '@/types/billing';

/**
 * Invoice Page Props
 */
interface InvoicePageProps {
    bill: Bill | null;
    error?: string;
}

/**
 * Invoice Page Component
 * 
 * PDF invoice preview/print page for billing.
 * Displays an invoice using the InvoiceTemplate component with
 * print functionality for PDF generation.
 * 
 * Route: /billing/{bill}/invoice
 */
export default function InvoicePage({ bill, error }: InvoicePageProps) {
    const [isPrinting, setIsPrinting] = useState(false);

    /**
     * Handle print functionality
     */
    const handlePrint = useCallback(() => {
        setIsPrinting(true);
        window.print();
        // Reset printing state after a short delay
        setTimeout(() => setIsPrinting(false), 500);
    }, []);

    /**
     * Handle download PDF
     * Opens the PDF download route in a new tab
     */
    const handleDownloadPdf = useCallback(() => {
        if (bill) {
            window.open(`/billing/${bill.id}/invoice/pdf`, '_blank');
        }
    }, [bill]);

    /**
     * Error state when bill is not found
     */
    if (error || !bill) {
        return (
            <>
                <Head title="Invoice Not Found" />
                <div className="container mx-auto py-8 px-4 max-w-4xl">
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/billing">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Bills
                            </Button>
                        </Link>
                    </div>

                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error || 'The requested invoice could not be found. Please check the bill ID and try again.'}
                        </AlertDescription>
                    </Alert>

                    <div className="mt-6">
                        <Link href="/billing">
                            <Button>
                                <FileText className="mr-2 h-4 w-4" />
                                View All Bills
                            </Button>
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    /**
     * Main invoice display
     */
    return (
        <>
            <Head title={`Invoice - ${bill.invoice_number || bill.bill_number}`} />

            {/* Page Header - Hidden during print */}
            <div className="container mx-auto py-6 px-4 max-w-5xl print:hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Link href={`/billing/${bill.id}`}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Bill
                            </Button>
                        </Link>
                        <div>
                            <Heading title="Invoice Preview" />
                            <p className="text-sm text-muted-foreground mt-1">
                                Invoice #{bill.invoice_number || bill.bill_number}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={handleDownloadPdf}
                            disabled={isPrinting}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                        <Button 
                            variant="default"
                            onClick={handlePrint}
                            disabled={isPrinting}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            {isPrinting ? 'Printing...' : 'Print Invoice'}
                        </Button>
                    </div>
                </div>

                {/* Print Instructions */}
                <Card className="mb-6 bg-muted/50">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                            <Printer className="h-5 w-5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                <strong>Tip:</strong> Use the Print button or press <kbd className="px-1 py-0.5 bg-background rounded text-xs">Ctrl+P</kbd> / <kbd className="px-1 py-0.5 bg-background rounded text-xs">Cmd+P</kbd> to print or save as PDF.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice Template - Full width for print */}
            <div className="invoice-wrapper print:p-0">
                <InvoiceTemplate
                    bill={bill}
                    showPrintHeaderFooter={true}
                    invoiceNumber={bill.invoice_number || bill.bill_number}
                />
            </div>

            {/* Print-only footer */}
            <style>{`
                @media print {
                    @page {
                        margin: 0.5cm;
                        size: auto;
                    }
                    
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .invoice-wrapper {
                        padding: 0;
                    }
                }
            `}</style>
        </>
    );
}
