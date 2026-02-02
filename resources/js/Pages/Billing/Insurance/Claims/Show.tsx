import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import {
    Shield,
    FileText,
    Calendar,
    User,
    DollarSign,
    ArrowLeft,
    Pencil,
    Eye,
    Send,
    Building,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    History,
    RefreshCw,
} from 'lucide-react';
import type { InsuranceClaim, Patient, InsuranceProvider, Bill } from '@/types/billing';
import { ClaimStatus } from '@/types/billing';
import { format, parseISO } from 'date-fns';

interface ClaimStatusHistory {
    id: number;
    status_from: string;
    status_to: string;
    changed_by?: number;
    changed_by_user?: {
        name: string;
    };
    reason?: string;
    created_at: string;
}

interface ClaimShowProps {
    claim: InsuranceClaim & {
        bill?: Bill & {
            patient?: Patient;
        };
        patient_insurance?: {
            policy_number: string;
            insurance_provider?: InsuranceProvider;
        };
        submitted_by_user?: {
            name: string;
        };
        processed_by_user?: {
            name: string;
        };
        status_history?: ClaimStatusHistory[];
    };
}

const CLAIM_STATUSES = [
    { value: ClaimStatus.DRAFT, label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
    { value: ClaimStatus.SUBMITTED, label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: Send },
    { value: ClaimStatus.PENDING, label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: ClaimStatus.APPROVED, label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    { value: ClaimStatus.PARTIAL, label: 'Partially Approved', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
    { value: ClaimStatus.REJECTED, label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
    { value: ClaimStatus.APPEALED, label: 'Appealed', color: 'bg-orange-100 text-orange-800', icon: RefreshCw },
    { value: ClaimStatus.CANCELLED, label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: XCircle },
];

export default function ClaimShow({ claim }: ClaimShowProps) {
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'MMM dd, yyyy');
        } catch {
            return 'Invalid Date';
        }
    };

    const formatDateTime = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
        } catch {
            return 'Invalid Date';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const getStatusConfig = (status: ClaimStatus) => {
        return CLAIM_STATUSES.find((s) => s.value === status) || CLAIM_STATUSES[0];
    };

    const getStatusBadgeVariant = (status: ClaimStatus) => {
        switch (status) {
            case ClaimStatus.APPROVED:
                return 'default';
            case ClaimStatus.REJECTED:
                return 'destructive';
            case ClaimStatus.PENDING:
            case ClaimStatus.SUBMITTED:
                return 'secondary';
            default:
                return 'outline';
        }
    };

    const canSubmit = claim.status === ClaimStatus.DRAFT;
    const canEdit = claim.status === ClaimStatus.DRAFT || claim.status === ClaimStatus.REJECTED;
    const canAppeal = claim.status === ClaimStatus.REJECTED;
    const canViewBill = !!claim.bill_id;

    return (
        <>
            <Head title={`Insurance Claim - ${claim.claim_number}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title={`Insurance Claim: ${claim.claim_number}`} />
                        <p className="text-muted-foreground mt-1">
                            View and manage insurance claim details
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canEdit && (
                            <Link href={`/insurance/claims/${claim.id}/edit`}>
                                <Button variant="outline">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Claim
                                </Button>
                            </Link>
                        )}
                        {canSubmit && (
                            <Button variant="default">
                                <Send className="mr-2 h-4 w-4" />
                                Submit Claim
                            </Button>
                        )}
                        {canAppeal && (
                            <Button variant="outline">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Appeal
                            </Button>
                        )}
                        <Link href="/insurance/claims">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Claims
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Status Banner */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                    {(() => {
                                        const config = getStatusConfig(claim.status);
                                        const Icon = config.icon;
                                        return <Icon className="h-8 w-8 text-muted-foreground" />;
                                    })()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Claim Status: {getStatusConfig(claim.status).label}</h2>
                                    <p className="text-muted-foreground">
                                        Claim Number: {claim.claim_number}
                                    </p>
                                </div>
                            </div>
                            <Badge variant={getStatusBadgeVariant(claim.status)} className="text-sm px-4 py-1">
                                {getStatusConfig(claim.status).label}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Claim Information Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="mr-2 h-5 w-5" />
                                Claim Information
                            </CardTitle>
                            <CardDescription>
                                Details about this insurance claim
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Patient & Provider */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Patient</h3>
                                    <div className="flex items-center">
                                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                                            {claim.bill?.patient?.full_name || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Insurance Provider</h3>
                                    <div className="flex items-center">
                                        <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                                            {claim.patient_insurance?.insurance_provider?.name || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Policy & Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Policy Number</h3>
                                    <div className="flex items-center">
                                        <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span className="font-mono">
                                            {claim.patient_insurance?.policy_number || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Bill Reference</h3>
                                    {canViewBill ? (
                                        <Link href={`/billing/${claim.bill_id}`} className="flex items-center text-blue-600 hover:underline">
                                            <FileText className="mr-2 h-4 w-4" />
                                            {claim.bill?.bill_number || 'View Bill'}
                                        </Link>
                                    ) : (
                                        <span className="text-muted-foreground">N/A</span>
                                    )}
                                </div>
                            </div>

                            {/* Date Information */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                                    <div className="flex items-center mt-1">
                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{formatDate(claim.created_at)}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Submitted</h3>
                                    <div className="flex items-center mt-1">
                                        <Send className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{formatDate(claim.submission_date)}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Response</h3>
                                    <div className="flex items-center mt-1">
                                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{formatDate(claim.response_date)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Summary Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <DollarSign className="mr-2 h-5 w-5" />
                                Financial Summary
                            </CardTitle>
                            <CardDescription>
                                Claim amounts and payments
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Claimed Amount</h3>
                                <div className="flex items-center mt-1">
                                    <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="text-2xl font-bold">
                                        {formatCurrency(claim.claim_amount)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Approved Amount</h3>
                                <div className="flex items-center mt-1">
                                    <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span className="text-xl font-semibold text-green-600">
                                        {formatCurrency(claim.approved_amount || 0)}
                                    </span>
                                </div>
                            </div>

                            {claim.deductible_amount && claim.deductible_amount > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Deductible</h3>
                                    <div className="flex items-center mt-1">
                                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{formatCurrency(claim.deductible_amount)}</span>
                                    </div>
                                </div>
                            )}

                            {claim.co_pay_amount && claim.co_pay_amount > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Co-Pay</h3>
                                    <div className="flex items-center mt-1">
                                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{formatCurrency(claim.co_pay_amount)}</span>
                                    </div>
                                </div>
                            )}

                            {claim.approved_amount && claim.claim_amount && (
                                <div className="pt-4 border-t">
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Approval Rate</h3>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{
                                                width: `${Math.round((claim.approved_amount / claim.claim_amount) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {Math.round((claim.approved_amount / claim.claim_amount) * 100)}% of claimed amount approved
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Status History Card */}
                {claim.status_history && claim.status_history.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <History className="mr-2 h-5 w-5" />
                                Status History
                            </CardTitle>
                            <CardDescription>
                                Timeline of all status changes for this claim
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                                <div className="space-y-6">
                                    {claim.status_history.map((history, index) => (
                                        <div key={history.id} className="relative flex gap-4 pl-10">
                                            <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-background ${
                                                index === 0 ? 'bg-primary' : 'bg-muted-foreground'
                                            }`} />
                                            <div className="flex-1">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {getStatusConfig(history.status_to as ClaimStatus).label}
                                                        </span>
                                                        {history.status_from && (
                                                            <span className="text-sm text-muted-foreground">
                                                                (from {getStatusConfig(history.status_from as ClaimStatus).label})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDateTime(history.created_at)}
                                                    </span>
                                                </div>
                                                {history.changed_by_user && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Changed by: {history.changed_by_user.name}
                                                    </p>
                                                )}
                                                {history.reason && (
                                                    <p className="text-sm mt-2 p-2 bg-muted rounded">
                                                        {history.reason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Rejection Information */}
                {claim.status === ClaimStatus.REJECTED && (claim.rejection_reason || claim.rejection_codes) && (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="text-red-700 flex items-center">
                                <XCircle className="mr-2 h-5 w-5" />
                                Rejection Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {claim.rejection_reason && (
                                <div>
                                    <h3 className="text-sm font-medium text-red-700">Reason</h3>
                                    <p className="mt-1">{claim.rejection_reason}</p>
                                </div>
                            )}
                            {claim.rejection_codes && claim.rejection_codes.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-red-700">Rejection Codes</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {claim.rejection_codes.map((code, index) => (
                                            <Badge key={index} variant="destructive">
                                                {code}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Notes Section */}
                {(claim.notes || claim.internal_notes) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {claim.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Public Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{claim.notes}</p>
                                </CardContent>
                            </Card>
                        )}

                        {claim.internal_notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Internal Notes</CardTitle>
                                    <CardDescription>Only visible to staff</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{claim.internal_notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Audit Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Audit Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                                <p className="text-sm">{formatDateTime(claim.created_at)}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                                <p className="text-sm">{formatDateTime(claim.updated_at)}</p>
                            </div>
                            {claim.submitted_by_user && (
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Submitted By</h3>
                                    <p className="text-sm">{claim.submitted_by_user.name}</p>
                                </div>
                            )}
                            {claim.processed_by_user && (
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Processed By</h3>
                                    <p className="text-sm">{claim.processed_by_user.name}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Related Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Related Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {canViewBill && (
                                <Link href={`/billing/${claim.bill_id}`}>
                                    <Button variant="outline" size="sm">
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Associated Bill
                                    </Button>
                                </Link>
                            )}
                            {claim.bill?.patient_id && (
                                <Link href={`/patients/${claim.bill.patient_id}`}>
                                    <Button variant="outline" size="sm">
                                        <User className="mr-2 h-4 w-4" />
                                        View Patient
                                    </Button>
                                </Link>
                            )}
                            <Link href="/insurance/claims">
                                <Button variant="outline" size="sm">
                                    <Shield className="mr-2 h-4 w-4" />
                                    View All Claims
                                </Button>
                            </Link>
                            <Link href="/billing">
                                <Button variant="outline" size="sm">
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Billing Dashboard
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
