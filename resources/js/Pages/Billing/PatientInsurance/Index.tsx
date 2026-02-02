import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import {
    Search,
    Eye,
    Download,
    Filter,
    X,
    Plus,
    Edit,
    Trash2,
    User,
    Shield,
    Calendar,
    Phone,
    Mail,
    FileText,
    CreditCard,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { type PatientInsurance, type InsuranceProvider } from '@/types/billing';
import { format } from 'date-fns';

interface PatientInsuranceWithStats extends PatientInsurance {
    patient_name?: string;
    patient_phone?: string;
    provider_name?: string;
    status_label?: string;
    status_color?: string;
    claims_count?: number;
}

interface PatientInsuranceFilters {
    search?: string;
    insurance_provider_id?: number | null;
    status?: string;
}

interface PatientInsuranceIndexProps {
    patientInsurances: {
        data: PatientInsuranceWithStats[];
        links: Record<string, unknown>;
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            path: string;
            per_page: number;
            to: number;
            total: number;
        };
    };
    insuranceProviders: InsuranceProvider[];
    filters?: PatientInsuranceFilters;
    statistics?: {
        total_insurances: number;
        active_insurances: number;
        expired_insurances: number;
        pending_insurances: number;
        total_claims: number;
    };
}

const INSURANCE_STATUSES = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800 hover:bg-green-100' },
    { value: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800 hover:bg-red-100' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
];

const RELATIONSHIP_TYPES = [
    { value: 'self', label: 'Self' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'child', label: 'Child' },
    { value: 'parent', label: 'Parent' },
    { value: 'other', label: 'Other' },
];

export default function PatientInsuranceIndex({
    patientInsurances,
    insuranceProviders,
    filters = {},
    statistics,
}: PatientInsuranceIndexProps) {
    // Filter states
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [providerFilter, setProviderFilter] = useState<string>(
        filters.insurance_provider_id ? String(filters.insurance_provider_id) : 'all'
    );
    const [statusFilter, setStatusFilter] = useState<string>(filters.status || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedInsurance, setSelectedInsurance] = useState<PatientInsuranceWithStats | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Apply filters
    const applyFilters = useCallback(() => {
        const params: Record<string, string> = {};

        if (searchTerm) params.search = searchTerm;
        if (providerFilter !== 'all') params.insurance_provider_id = providerFilter;
        if (statusFilter !== 'all') params.status = statusFilter;

        router.get('/billing/patient-insurances', params, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [searchTerm, providerFilter, statusFilter]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setProviderFilter('all');
        setStatusFilter('all');

        router.get('/billing/patient-insurances', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }, []);

    // Export to CSV
    const exportToCSV = useCallback(() => {
        const headers = [
            'Patient Name',
            'Policy Number',
            'Policy Holder',
            'Insurance Provider',
            'Relationship',
            'Start Date',
            'End Date',
            'Status',
            'Co-Pay',
            'Deductible',
            'Annual Max',
        ];

        const rows = patientInsurances.data.map((insurance) => [
            insurance.patient_name || '',
            insurance.policy_number || '',
            insurance.policy_holder_name || '',
            insurance.provider_name || '',
            insurance.relationship_to_patient || '',
            insurance.coverage_start_date || '',
            insurance.coverage_end_date || '',
            insurance.status_label || '',
            insurance.co_pay_amount || '',
            insurance.deductible_amount || '',
            insurance.annual_max_coverage || '',
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `patient_insurances_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    }, [patientInsurances.data]);

    // Check if any filter is active
    const hasActiveFilters =
        searchTerm ||
        providerFilter !== 'all' ||
        statusFilter !== 'all';

    // View insurance details
    const viewInsuranceDetails = (insurance: PatientInsuranceWithStats) => {
        setSelectedInsurance(insurance);
        setShowDetailsDialog(true);
    };

    // Confirm delete
    const confirmDelete = (insurance: PatientInsuranceWithStats) => {
        setSelectedInsurance(insurance);
        setShowDeleteDialog(true);
    };

    // Delete insurance
    const deleteInsurance = () => {
        if (selectedInsurance) {
            router.delete(`/billing/patient-insurances/${selectedInsurance.id}`, {
                onSuccess: () => {
                    setShowDeleteDialog(false);
                    setSelectedInsurance(null);
                },
            });
        }
    };

    // Get status badge
    const getStatusBadge = (status: string | undefined) => {
        const statusConfig = INSURANCE_STATUSES.find((s) => s.value === status);
        if (!statusConfig) return <Badge variant="secondary">Unknown</Badge>;

        return (
            <Badge className={statusConfig.color}>
                {statusConfig.value === 'active' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                {statusConfig.value === 'expired' && <XCircle className="mr-1 h-3 w-3" />}
                {statusConfig.value === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                {statusConfig.label}
            </Badge>
        );
    };

    // Check if insurance is expired
    const isExpired = (endDate: string | undefined) => {
        if (!endDate) return false;
        return new Date(endDate) < new Date();
    };

    // Get insurance status based on dates and active flag
    const getInsuranceStatus = (insurance: PatientInsuranceWithStats): { value: string; label: string; color: string } => {
        if (!insurance.is_active) {
            return { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
        }
        if (isExpired(insurance.coverage_end_date)) {
            return { value: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' };
        }
        const now = new Date();
        const startDate = insurance.coverage_start_date ? new Date(insurance.coverage_start_date) : null;
        if (startDate && startDate > now) {
            return { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
        }
        return { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' };
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Patient Insurance" />

                {/* Breadcrumbs */}
                <div className="flex items-center text-sm text-muted-foreground">
                    <Link href="/billing" className="hover:underline">
                        Billing
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-foreground">Patient Insurance</span>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Patient Insurance" />
                        <p className="text-muted-foreground mt-1">
                            Manage patient insurance records and coverage information
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportToCSV}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Link href="/billing/patient-insurances/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Insurance
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.total_insurances}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Active</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.active_insurances}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Expired</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.expired_insurances}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                        <XCircle className="h-5 w-5 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Pending</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.pending_insurances}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-yellow-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Claims</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.total_claims}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Filters</CardTitle>
                            <div className="flex gap-2">
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        <X className="mr-2 h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                                    <Filter className="mr-2 h-4 w-4" />
                                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    {showFilters && (
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Patient name, policy number, card number..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="provider">Insurance Provider</Label>
                                    <Select value={providerFilter} onValueChange={setProviderFilter}>
                                        <SelectTrigger id="provider">
                                            <SelectValue placeholder="All Providers" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Providers</SelectItem>
                                            {insuranceProviders.map((provider) => (
                                                <SelectItem key={provider.id} value={String(provider.id)}>
                                                    {provider.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            {INSURANCE_STATUSES.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button onClick={applyFilters}>Apply Filters</Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Patient Insurance Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Patient Insurance Records ({patientInsurances.meta.total})</CardTitle>
                        <CardDescription>
                            Showing {patientInsurances.meta.from || 0} to {patientInsurances.meta.to || 0} of {patientInsurances.meta.total} records
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Policy Details</TableHead>
                                    <TableHead>Insurance Provider</TableHead>
                                    <TableHead>Coverage Period</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {patientInsurances.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No patient insurance records found matching your criteria
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    patientInsurances.data.map((insurance) => {
                                        const status = getInsuranceStatus(insurance);
                                        return (
                                            <TableRow key={insurance.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium flex items-center gap-1">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            {insurance.patient_name || 'Unknown Patient'}
                                                        </span>
                                                        {insurance.patient_phone && (
                                                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {insurance.patient_phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="flex items-center gap-1">
                                                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                            <span className="font-medium">{insurance.policy_number}</span>
                                                        </span>
                                                        {insurance.policy_holder_name && (
                                                            <span className="text-sm text-muted-foreground">
                                                                Holder: {insurance.policy_holder_name}
                                                            </span>
                                                        )}
                                                        {insurance.relationship_to_patient && (
                                                            <span className="text-xs text-muted-foreground">
                                                                ({insurance.relationship_to_patient})
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                                        <span>{insurance.provider_name || 'Unknown'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                                            {insurance.coverage_start_date
                                                                ? format(new Date(insurance.coverage_start_date), 'MMM d, yyyy')
                                                                : '-'}
                                                            {' - '}
                                                            {insurance.coverage_end_date
                                                                ? format(new Date(insurance.coverage_end_date), 'MMM d, yyyy')
                                                                : '-'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge className={status.color}>
                                                        {status.value === 'active' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                                                        {status.value === 'expired' && <XCircle className="mr-1 h-3 w-3" />}
                                                        {status.value === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => viewInsuranceDetails(insurance)}
                                                            title="View Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Link href={`/billing/patient-insurances/${insurance.id}/edit`}>
                                                            <Button variant="ghost" size="sm" title="Edit">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => confirmDelete(insurance)}
                                                            title="Delete"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {patientInsurances.meta.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Page {patientInsurances.meta.current_page} of {patientInsurances.meta.last_page}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={patientInsurances.meta.current_page === 1}
                                        onClick={() => {
                                            router.get(patientInsurances.links.prev as string, {}, {
                                                preserveState: true,
                                                preserveScroll: true,
                                            });
                                        }}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={patientInsurances.meta.current_page === patientInsurances.meta.last_page}
                                        onClick={() => {
                                            router.get(patientInsurances.links.next as string, {}, {
                                                preserveState: true,
                                                preserveScroll: true,
                                            });
                                        }}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Insurance Details Dialog */}
                <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Insurance Details</DialogTitle>
                            <DialogDescription>
                                Policy Number: {selectedInsurance?.policy_number}
                            </DialogDescription>
                        </DialogHeader>
                        {selectedInsurance && (
                            <div className="space-y-6">
                                {/* Status and Basic Info */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {getInsuranceStatus(selectedInsurance).value === 'active' ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        ) : getInsuranceStatus(selectedInsurance).value === 'expired' ? (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                        ) : (
                                            <Clock className="h-5 w-5 text-yellow-600" />
                                        )}
                                        <span className="font-medium">
                                            {getInsuranceStatus(selectedInsurance).label}
                                        </span>
                                    </div>
                                    {selectedInsurance.is_primary && (
                                        <Badge variant="default">Primary Insurance</Badge>
                                    )}
                                </div>

                                {/* Patient Information */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Patient Name</p>
                                        <p className="font-medium">{selectedInsurance.patient_name || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Policy Holder</p>
                                        <p className="font-medium">{selectedInsurance.policy_holder_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Relationship to Patient</p>
                                        <p className="font-medium">
                                            {selectedInsurance.relationship_to_patient
                                                ? selectedInsurance.relationship_to_patient.charAt(0).toUpperCase() +
                                                  selectedInsurance.relationship_to_patient.slice(1)
                                                : 'Self'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Insurance Provider</p>
                                        <p className="font-medium">{selectedInsurance.provider_name || 'Unknown'}</p>
                                    </div>
                                </div>

                                {/* Coverage Period */}
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3">Coverage Period</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Start Date</p>
                                            <p className="font-medium">
                                                {selectedInsurance.coverage_start_date
                                                    ? format(new Date(selectedInsurance.coverage_start_date), 'MMMM d, yyyy')
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">End Date</p>
                                            <p className="font-medium">
                                                {selectedInsurance.coverage_end_date
                                                    ? format(new Date(selectedInsurance.coverage_end_date), 'MMMM d, yyyy')
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Details */}
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3">Coverage Details</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Co-Pay Amount</p>
                                            <p className="font-medium">
                                                {selectedInsurance.co_pay_amount
                                                    ? `$${selectedInsurance.co_pay_amount}`
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Co-Pay Percentage</p>
                                            <p className="font-medium">
                                                {selectedInsurance.co_pay_percentage
                                                    ? `${selectedInsurance.co_pay_percentage}%`
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Deductible Amount</p>
                                            <p className="font-medium">
                                                {selectedInsurance.deductible_amount
                                                    ? `$${selectedInsurance.deductible_amount}`
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Deductible Met</p>
                                            <p className="font-medium">
                                                {selectedInsurance.deductible_met
                                                    ? `$${selectedInsurance.deductible_met}`
                                                    : '$0.00'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Annual Max Coverage</p>
                                            <p className="font-medium">
                                                {selectedInsurance.annual_max_coverage
                                                    ? `$${selectedInsurance.annual_max_coverage}`
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Annual Used</p>
                                            <p className="font-medium">
                                                {selectedInsurance.annual_used_amount
                                                    ? `$${selectedInsurance.annual_used_amount}`
                                                    : '$0.00'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedInsurance.notes && (
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium mb-2">Notes</h4>
                                        <p className="text-sm text-muted-foreground">{selectedInsurance.notes}</p>
                                    </div>
                                )}

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                                        Close
                                    </Button>
                                    <Link href={`/billing/patient-insurances/${selectedInsurance.id}/edit`}>
                                        <Button>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Button>
                                    </Link>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Insurance</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this insurance record? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedInsurance && (
                            <div className="py-4">
                                <div className="flex items-center gap-2 text-red-600 mb-2">
                                    <AlertCircle className="h-5 w-5" />
                                    <span className="font-medium">Warning</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    You are about to delete the insurance record for{' '}
                                    <span className="font-medium">{selectedInsurance.patient_name}</span> with policy number{' '}
                                    <span className="font-medium">{selectedInsurance.policy_number}</span>.
                                </p>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={deleteInsurance}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </HospitalLayout>
    );
}
