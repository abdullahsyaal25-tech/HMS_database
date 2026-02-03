import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import {
    FileText,
    Download,
    ArrowLeft,
    DollarSign,
    CheckCircle,
    Clock,
    AlertCircle,
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { format } from 'date-fns';

interface BillItem {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
}

interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    father_name: string;
}

interface Bill {
    id: number;
    bill_number: string;
    patient_id: number;
    patient: Patient;
    bill_date: string;
    total_amount: number;
    amount_paid: number;
    amount_due: number;
    payment_status: string;
    status: string;
    items: BillItem[];
}

interface BillingReportShowProps {
    bills: Bill[];
    startDate: string;
    endDate: string;
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'paid':
            return 'bg-green-100 text-green-800';
        case 'partial':
            return 'bg-blue-100 text-blue-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'overdue':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getStatusIcon(status: string) {
    switch (status) {
        case 'paid':
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'partial':
            return <Clock className="h-4 w-4 text-blue-600" />;
        case 'pending':
            return <Clock className="h-4 w-4 text-yellow-600" />;
        case 'overdue':
            return <AlertCircle className="h-4 w-4 text-red-600" />;
        default:
            return <Clock className="h-4 w-4 text-gray-600" />;
    }
}

export default function BillingReportShow({ bills, startDate, endDate }: BillingReportShowProps) {
    const totalRevenue = bills.reduce((sum, bill) => sum + bill.total_amount, 0);
    const totalPaid = bills.reduce((sum, bill) => sum + bill.amount_paid, 0);
    const totalOutstanding = bills.reduce((sum, bill) => sum + bill.amount_due, 0);
    const paidCount = bills.filter(b => b.payment_status === 'paid').length;
    const partialCount = bills.filter(b => b.payment_status === 'partial').length;
    const pendingCount = bills.filter(b => b.payment_status === 'pending').length;
    const overdueCount = bills.filter(b => b.payment_status === 'overdue').length;

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Billing Report" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Billing Report" />
                        <p className="text-muted-foreground mt-1">
                            Report from {format(new Date(startDate), 'MMM dd, yyyy')} to {format(new Date(endDate), 'MMM dd, yyyy')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/reports/billing/download">
                            <Button>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </Button>
                        </Link>
                        <Link href="/reports">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Reports
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                <span className="text-2xl font-bold">
                                    <CurrencyDisplay amount={totalRevenue} />
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Amount Collected
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                                <span className="text-2xl font-bold">
                                    <CurrencyDisplay amount={totalPaid} />
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Outstanding
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-600" />
                                <span className="text-2xl font-bold">
                                    <CurrencyDisplay amount={totalOutstanding} />
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Bills
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-gray-600" />
                                <span className="text-2xl font-bold">{bills.length}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Status Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Payment Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <div className="flex flex-col items-center p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600 mb-1" />
                                <span className="text-2xl font-bold">{paidCount}</span>
                                <span className="text-xs text-green-700">Paid</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-blue-50 rounded-lg">
                                <Clock className="h-5 w-5 text-blue-600 mb-1" />
                                <span className="text-2xl font-bold">{partialCount}</span>
                                <span className="text-xs text-blue-700">Partial</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-yellow-50 rounded-lg">
                                <Clock className="h-5 w-5 text-yellow-600 mb-1" />
                                <span className="text-2xl font-bold">{pendingCount}</span>
                                <span className="text-xs text-yellow-700">Pending</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-red-50 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-red-600 mb-1" />
                                <span className="text-2xl font-bold">{overdueCount}</span>
                                <span className="text-xs text-red-700">Overdue</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                                <FileText className="h-5 w-5 text-gray-600 mb-1" />
                                <span className="text-2xl font-bold">{bills.length}</span>
                                <span className="text-xs text-gray-700">Total</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bills Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Bills Detail</CardTitle>
                                <CardDescription>
                                    Showing {bills.length} bills
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Bill #</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Patient</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Paid</th>
                                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Due</th>
                                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bills.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No bills found for the selected date range
                                            </td>
                                        </tr>
                                    ) : (
                                        bills.map((bill) => (
                                            <tr key={bill.id} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-4 font-medium">{bill.bill_number}</td>
                                                <td className="py-3 px-4">
                                                    {format(new Date(bill.bill_date), 'MMM dd, yyyy')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {bill.patient?.first_name} {bill.patient?.father_name}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <CurrencyDisplay amount={bill.total_amount} />
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <CurrencyDisplay amount={bill.amount_paid} />
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <CurrencyDisplay amount={bill.amount_due} />
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <Badge className={getStatusColor(bill.payment_status)}>
                                                        <span className="flex items-center gap-1">
                                                            {getStatusIcon(bill.payment_status)}
                                                            {bill.payment_status.charAt(0).toUpperCase() + bill.payment_status.slice(1)}
                                                        </span>
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}
