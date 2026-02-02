import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    FileText,
    Download,
    RefreshCw,
    Filter,
    X,
    Building2,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileCheck,
    FileClock,
    Calendar,
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface InsuranceClaimRecord {
    id: number;
    claim_number: string;
    patient_name: string;
    insurance_provider: string;
    policy_number: string;
    claim_date: string;
    submitted_date?: string;
    processed_date?: string;
    claimed_amount: number;
    approved_amount?: number;
    status: 'draft' | 'submitted' | 'pending' | 'approved' | 'partial' | 'rejected';
    status_notes?: string;
    department: string;
}

interface InsuranceProviderData {
    provider: string;
    total_claims: number;
    total_amount: number;
    approved_amount: number;
    pending_amount: number;
    rejected_amount: number;
}

interface ClaimStatusData {
    status: string;
    count: number;
    amount: number;
}

interface InsuranceClaimsPageProps {
    reportData?: {
        status_breakdown?: ClaimStatusData[];
        provider_breakdown?: InsuranceProviderData[];
        daily_trends?: Array<{ date: string; claims: number; amount: number }>;
    };
    records?: InsuranceClaimRecord[];
    filters?: {
        date_from?: string;
        date_to?: string;
        period?: string;
        status?: string;
        provider_id?: string;
    };
    insuranceProviders?: Array<{ id: number; name: string }>;
    summary?: {
        total_claims: number;
        total_claimed_amount: number;
        approved_claims: number;
        approved_amount: number;
        pending_claims: number;
        rejected_claims: number;
        partial_claims: number;
        partial_amount: number;
        rejection_rate_percent?: number;
        approval_rate_percent?: number;
    };
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    partial: 'bg-orange-100 text-orange-800',
    rejected: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    pending: 'Pending',
    approved: 'Approved',
    partial: 'Partial',
    rejected: 'Rejected',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
    draft: FileText,
    submitted: FileCheck,
    pending: FileClock,
    approved: CheckCircle,
    partial: AlertCircle,
    rejected: XCircle,
};

// ============================================================================
// Helper Components
// ============================================================================

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'blue',
}: {
    title: string;
    value: React.ReactNode;
    subtitle?: string;
    icon: React.ElementType;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
}) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        red: 'bg-red-100 text-red-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className={cn('p-3 rounded-full', colorClasses[color])}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: string }) {
    const statusClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
    const Icon = STATUS_ICONS[status] || FileText;
    const label = STATUS_LABELS[status] || status;

    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', statusClass)}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function InsuranceClaimsPage({
    reportData,
    records = [],
    filters = {},
    insuranceProviders = [],
    summary,
}: InsuranceClaimsPageProps) {
    // Filter states
    const [dateFrom, setDateFrom] = useState(filters.date_from || format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(filters.date_to || format(new Date(), 'yyyy-MM-dd'));
    const [period, setPeriod] = useState(filters.period || 'custom');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedProvider, setSelectedProvider] = useState(filters.provider_id || 'all');

    // Apply filters
    const applyFilters = useCallback(() => {
        const params: Record<string, string> = {
            date_from: dateFrom,
            date_to: dateTo,
            period,
        };

        if (selectedStatus !== 'all') {
            params.status = selectedStatus;
        }

        if (selectedProvider !== 'all') {
            params.provider_id = selectedProvider;
        }

        router.get('/reports/billing/insurance-claims', params, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [dateFrom, dateTo, period, selectedStatus, selectedProvider]);

    // Clear filters
    const clearFilters = useCallback(() => {
        const defaultDateFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const defaultDateTo = format(new Date(), 'yyyy-MM-dd');

        setDateFrom(defaultDateFrom);
        setDateTo(defaultDateTo);
        setPeriod('custom');
        setSelectedStatus('all');
        setSelectedProvider('all');

        router.get('/reports/billing/insurance-claims', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }, []);

    // Quick date range selection
    const setQuickDateRange = useCallback((range: 'today' | 'week' | 'month' | 'year') => {
        const today = new Date();
        let from: Date;
        let to: Date = today;

        switch (range) {
            case 'today':
                from = today;
                break;
            case 'week':
                from = subDays(today, 7);
                break;
            case 'month':
                from = startOfMonth(today);
                to = endOfMonth(today);
                break;
            case 'year':
                from = new Date(today.getFullYear(), 0, 1);
                to = new Date(today.getFullYear(), 11, 31);
                break;
            default:
                from = subDays(today, 30);
        }

        setDateFrom(format(from, 'yyyy-MM-dd'));
        setDateTo(format(to, 'yyyy-MM-dd'));
        setPeriod(range);

        setTimeout(applyFilters, 0);
    }, [applyFilters]);

    // Export to CSV
    const exportToCSV = useCallback(() => {
        const headers = [
            'Claim Number',
            'Patient Name',
            'Insurance Provider',
            'Policy Number',
            'Claim Date',
            'Submitted Date',
            'Processed Date',
            'Claimed Amount',
            'Approved Amount',
            'Status',
            'Department',
            'Notes',
        ];

        const rows = records.map((record) => [
            record.claim_number,
            record.patient_name,
            record.insurance_provider,
            record.policy_number,
            record.claim_date,
            record.submitted_date || 'N/A',
            record.processed_date || 'N/A',
            record.claimed_amount.toString(),
            record.approved_amount?.toString() || '0',
            record.status,
            record.department,
            record.status_notes || 'N/A',
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `insurance_claims_report_${dateFrom}_to_${dateTo}.csv`;
        link.click();
    }, [records, dateFrom, dateTo]);

    // Export to PDF (simulated)
    const exportToPDF = useCallback(() => {
        alert('PDF export functionality would be implemented here with a library like jsPDF or dompdf');
    }, []);

    // Format chart data for claims by status
    const statusChartData = useMemo(() => {
        const statusBreakdown = reportData?.status_breakdown;
        if (!statusBreakdown) return [];

        return statusBreakdown.map((item) => ({
            status: STATUS_LABELS[item.status] || item.status,
            count: item.count,
            amount: item.amount,
        }));
    }, [reportData?.status_breakdown]);

    // Format chart data for claims by insurance provider
    const providerChartData = useMemo(() => {
        const providerBreakdown = reportData?.provider_breakdown;
        if (!providerBreakdown) return [];

        return providerBreakdown.map((item) => ({
            provider: item.provider.length > 20 ? item.provider.substring(0, 20) + '...' : item.provider,
            fullProvider: item.provider,
            total_claims: item.total_claims,
            total_amount: item.total_amount,
            approved_amount: item.approved_amount,
            pending_amount: item.pending_amount,
            rejected_amount: item.rejected_amount,
        }));
    }, [reportData?.provider_breakdown]);

    // Calculate totals for summary
    const totals = useMemo(() => {
        if (summary) return summary;

        const totalClaims = records.length;
        const totalClaimedAmount = records.reduce((sum, r) => sum + r.claimed_amount, 0);
        const approvedClaims = records.filter((r) => r.status === 'approved').length;
        const approvedAmount = records
            .filter((r) => r.status === 'approved' || r.status === 'partial')
            .reduce((sum, r) => sum + (r.approved_amount || 0), 0);
        const pendingClaims = records.filter((r) => r.status === 'pending' || r.status === 'submitted').length;
        const rejectedClaims = records.filter((r) => r.status === 'rejected').length;
        const partialClaims = records.filter((r) => r.status === 'partial').length;
        const partialAmount = records
            .filter((r) => r.status === 'partial')
            .reduce((sum, r) => sum + (r.approved_amount || 0), 0);

        return {
            total_claims: totalClaims,
            total_claimed_amount: totalClaimedAmount,
            approved_claims: approvedClaims,
            approved_amount: approvedAmount,
            pending_claims: pendingClaims,
            rejected_claims: rejectedClaims,
            partial_claims: partialClaims,
            partial_amount: partialAmount,
            rejection_rate_percent: totalClaims > 0 ? (rejectedClaims / totalClaims) * 100 : 0,
            approval_rate_percent: totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0,
        };
    }, [summary, records]);

    // Check if any filter is active
    const hasActiveFilters =
        dateFrom !== format(subDays(new Date(), 30), 'yyyy-MM-dd') ||
        dateTo !== format(new Date(), 'yyyy-MM-dd') ||
        period !== 'custom' ||
        selectedStatus !== 'all' ||
        selectedProvider !== 'all';

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Insurance Claims Report" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href="/reports/billing">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back
                                </Button>
                            </Link>
                        </div>
                        <Heading title="Insurance Claims Report" />
                        <p className="text-muted-foreground mt-1">
                            Track insurance claims analytics and processing status
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportToCSV}>
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                        <Button variant="outline" onClick={exportToPDF}>
                            <FileText className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                        <Button variant="outline" onClick={applyFilters}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <CardTitle className="text-base">Filters</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        <X className="mr-1 h-4 w-4" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date_from">From Date</Label>
                                <Input
                                    id="date_from"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date_to">To Date</Label>
                                <Input
                                    id="date_to"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="period">Quick Range</Label>
                                <Select value={period} onValueChange={setPeriod}>
                                    <SelectTrigger id="period">
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="week">Last 7 Days</SelectItem>
                                        <SelectItem value="month">This Month</SelectItem>
                                        <SelectItem value="year">This Year</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Claim Status</Label>
                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="submitted">Submitted</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="provider">Insurance Provider</Label>
                                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                                    <SelectTrigger id="provider">
                                        <SelectValue placeholder="All Providers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Providers</SelectItem>
                                        {insuranceProviders.map((provider) => (
                                            <SelectItem key={provider.id} value={provider.id.toString()}>
                                                {provider.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Quick Date Range Buttons */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('today')}>
                                <Clock className="h-3 w-3 mr-1" />
                                Today
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('week')}>
                                <Calendar className="h-3 w-3 mr-1" />
                                Last 7 Days
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('month')}>
                                <Calendar className="h-3 w-3 mr-1" />
                                This Month
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('year')}>
                                <Calendar className="h-3 w-3 mr-1" />
                                This Year
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Claims"
                        value={totals.total_claims.toLocaleString()}
                        subtitle={`${totals.total_claimed_amount.toLocaleString()} total claimed`}
                        icon={FileText}
                        color="blue"
                    />
                    <StatCard
                        title="Approved Claims"
                        value={totals.approved_claims.toLocaleString()}
                        subtitle={`${totals.approved_amount.toLocaleString()} approved`}
                        icon={CheckCircle}
                        color="green"
                    />
                    <StatCard
                        title="Pending Claims"
                        value={totals.pending_claims.toLocaleString()}
                        subtitle="Awaiting processing"
                        icon={Clock}
                        color="yellow"
                    />
                    <StatCard
                        title="Rejected Claims"
                        value={totals.rejected_claims.toLocaleString()}
                        subtitle={`${totals.rejection_rate_percent.toFixed(1)}% rejection rate`}
                        icon={XCircle}
                        color="red"
                    />
                </div>

                {/* Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Claims by Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Claims by Status</CardTitle>
                            <CardDescription>Distribution of claims by processing status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={statusChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="status" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: number) => value.toLocaleString()}
                                        labelStyle={{ color: '#888' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="count" name="Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Claims by Insurance Provider */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Claims by Insurance Provider</CardTitle>
                            <CardDescription>Claims distribution across insurance providers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={providerChartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="provider" type="category" width={100} />
                                    <Tooltip
                                        formatter={(value: number) => value.toLocaleString()}
                                        labelStyle={{ color: '#888' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="total_claims" name="Total Claims" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="approved_amount" name="Approved" fill="#22c55e" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Claims Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Claims Details</CardTitle>
                                <CardDescription>Detailed list of insurance claims</CardDescription>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {records.length} claims found
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Claim #</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Insurance Provider</TableHead>
                                        <TableHead>Claim Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Approved</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Department</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                No claims found for the selected filters
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        records.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">{record.claim_number}</TableCell>
                                                <TableCell>{record.patient_name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span>{record.insurance_provider}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{format(parseISO(record.claim_date), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell>
                                                    <CurrencyDisplay amount={record.claimed_amount} />
                                                </TableCell>
                                                <TableCell>
                                                    {record.approved_amount ? (
                                                        <CurrencyDisplay amount={record.approved_amount} />
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={record.status} />
                                                </TableCell>
                                                <TableCell>{record.department}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}
