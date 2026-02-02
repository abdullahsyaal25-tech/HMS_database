import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Heading from '@/components/heading';
import { ArrowLeft, Save, User, Building2, Calendar, DollarSign, FileText, Shield } from 'lucide-react';
import { type PatientInsurance, type InsuranceProvider, type Patient } from '@/types/billing';

interface PatientInsuranceEditProps {
    patientInsurance: PatientInsurance & {
        patient_name?: string;
        patient_phone?: string;
        provider_name?: string;
    };
    insuranceProviders: InsuranceProvider[];
    coverageTypes: { value: string; label: string }[];
}

const COVERAGE_TYPES = [
    { value: 'primary', label: 'Primary' },
    { value: 'secondary', label: 'Secondary' },
    { value: 'tertiary', label: 'Tertiary' },
];

const RELATIONSHIP_TYPES = [
    { value: 'self', label: 'Self' },
    { value: 'spouse', label: 'Spouse' },
    { value: 'child', label: 'Child' },
    { value: 'parent', label: 'Parent' },
    { value: 'other', label: 'Other' },
];

export default function PatientInsuranceEdit({
    patientInsurance,
    insuranceProviders,
    coverageTypes = COVERAGE_TYPES,
}: PatientInsuranceEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        patient_id: patientInsurance.patient_id.toString(),
        insurance_provider_id: patientInsurance.insurance_provider_id.toString(),
        policy_number: patientInsurance.policy_number || '',
        policy_holder_name: patientInsurance.policy_holder_name || '',
        relationship_to_patient: patientInsurance.relationship_to_patient || 'self',
        group_number: (patientInsurance as unknown as Record<string, unknown>).group_number?.toString() || '',
        card_number: (patientInsurance as unknown as Record<string, unknown>).card_number?.toString() || '',
        coverage_type: patientInsurance.is_primary ? 'primary' : patientInsurance.priority_order === 2 ? 'secondary' : patientInsurance.priority_order === 3 ? 'tertiary' : 'primary',
        coverage_percentage: patientInsurance.co_pay_percentage?.toString() || '',
        max_coverage_amount: patientInsurance.annual_max_coverage?.toString() || '',
        co_pay_amount: patientInsurance.co_pay_amount?.toString() || '',
        deductible_amount: patientInsurance.deductible_amount?.toString() || '',
        coverage_start_date: patientInsurance.coverage_start_date || '',
        coverage_end_date: patientInsurance.coverage_end_date || '',
        is_active: patientInsurance.is_active,
        notes: patientInsurance.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/billing/patient-insurances/${patientInsurance.id}`);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setData(name as keyof typeof data, (e.target as HTMLInputElement).checked);
        } else {
            setData(name as keyof typeof data, value);
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    const getPatientFullName = (patient: Patient | undefined): string => {
        if (!patient) return 'Unknown Patient';
        return `${patient.first_name} ${patient.father_name ? patient.father_name + ' ' : ''}${patient.full_name || ''}`.trim();
    };

    return (
        <>
            <Head title={`Edit Insurance - ${patientInsurance.policy_number}`} />

            <div className="space-y-6">
                {/* Breadcrumbs */}
                <div className="flex items-center text-sm text-muted-foreground">
                    <Link href="/billing" className="hover:underline">
                        Billing
                    </Link>
                    <span className="mx-2">/</span>
                    <Link href="/billing/patient-insurances" className="hover:underline">
                        Patient Insurance
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-foreground">
                        Edit Insurance
                    </span>
                </div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Edit Patient Insurance" />
                        <p className="text-muted-foreground mt-1">
                            Update insurance information for patient
                        </p>
                    </div>
                    <Link href="/billing/patient-insurances">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to List
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Patient Information (Read-only) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Patient Information
                            </CardTitle>
                            <CardDescription>
                                Patient details associated with this insurance record
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label>Patient Name</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        <p className="font-medium">
                                            {patientInsurance.patient_name || getPatientFullName(patientInsurance.patient)}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Patient ID</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        <p className="font-medium">
                                            {patientInsurance.patient?.patient_id || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        <p className="font-medium">
                                            {patientInsurance.patient_phone || patientInsurance.patient?.phone || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insurance Provider & Policy Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Insurance Provider & Policy Details
                            </CardTitle>
                            <CardDescription>
                                Select insurance provider and enter policy information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="insurance_provider_id">Insurance Provider *</Label>
                                    <Select
                                        value={data.insurance_provider_id}
                                        onValueChange={(value) => handleSelectChange('insurance_provider_id', value)}
                                    >
                                        <SelectTrigger id="insurance_provider_id">
                                            <SelectValue placeholder="Select insurance provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {insuranceProviders.map((provider) => (
                                                <SelectItem key={provider.id} value={provider.id.toString()}>
                                                    {provider.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.insurance_provider_id && (
                                        <p className="text-sm text-red-600">{errors.insurance_provider_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="policy_number">Policy Number *</Label>
                                    <Input
                                        id="policy_number"
                                        name="policy_number"
                                        value={data.policy_number}
                                        onChange={handleChange}
                                        placeholder="Enter policy number"
                                    />
                                    {errors.policy_number && (
                                        <p className="text-sm text-red-600">{errors.policy_number}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="group_number">Group Number</Label>
                                    <Input
                                        id="group_number"
                                        name="group_number"
                                        value={data.group_number}
                                        onChange={handleChange}
                                        placeholder="Enter group number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="card_number">Card Number</Label>
                                    <Input
                                        id="card_number"
                                        name="card_number"
                                        value={data.card_number}
                                        onChange={handleChange}
                                        placeholder="Enter card number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="policy_holder_name">Policy Holder Name</Label>
                                    <Input
                                        id="policy_holder_name"
                                        name="policy_holder_name"
                                        value={data.policy_holder_name}
                                        onChange={handleChange}
                                        placeholder="Enter policy holder name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="relationship_to_patient">Relationship to Patient</Label>
                                    <Select
                                        value={data.relationship_to_patient}
                                        onValueChange={(value) => handleSelectChange('relationship_to_patient', value)}
                                    >
                                        <SelectTrigger id="relationship_to_patient">
                                            <SelectValue placeholder="Select relationship" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {RELATIONSHIP_TYPES.map((relation) => (
                                                <SelectItem key={relation.value} value={relation.value}>
                                                    {relation.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coverage Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Coverage Details
                            </CardTitle>
                            <CardDescription>
                                Configure coverage type and limits
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="coverage_type">Coverage Type</Label>
                                    <Select
                                        value={data.coverage_type}
                                        onValueChange={(value) => handleSelectChange('coverage_type', value)}
                                    >
                                        <SelectTrigger id="coverage_type">
                                            <SelectValue placeholder="Select coverage type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {coverageTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="coverage_percentage">Coverage Percentage (%)</Label>
                                    <Input
                                        id="coverage_percentage"
                                        name="coverage_percentage"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={data.coverage_percentage}
                                        onChange={handleChange}
                                        placeholder="0-100"
                                    />
                                    {errors.coverage_percentage && (
                                        <p className="text-sm text-red-600">{errors.coverage_percentage}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max_coverage_amount">Maximum Coverage Amount</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="max_coverage_amount"
                                            name="max_coverage_amount"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.max_coverage_amount}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="co_pay_amount">Co-Pay Amount</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="co_pay_amount"
                                            name="co_pay_amount"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.co_pay_amount}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="deductible_amount">Deductible Amount</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="deductible_amount"
                                            name="deductible_amount"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.deductible_amount}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className="pl-8"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coverage Period & Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Coverage Period & Status
                            </CardTitle>
                            <CardDescription>
                                Set the effective and expiration dates for this insurance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="coverage_start_date">Effective Date *</Label>
                                    <Input
                                        id="coverage_start_date"
                                        name="coverage_start_date"
                                        type="date"
                                        value={data.coverage_start_date}
                                        onChange={handleChange}
                                    />
                                    {errors.coverage_start_date && (
                                        <p className="text-sm text-red-600">{errors.coverage_start_date}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="coverage_end_date">Expiration Date</Label>
                                    <Input
                                        id="coverage_end_date"
                                        name="coverage_end_date"
                                        type="date"
                                        value={data.coverage_end_date}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Checkbox
                                            id="is_active"
                                            name="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked as boolean)}
                                        />
                                        Active Status
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {data.is_active ? 'Insurance is active and can be used' : 'Insurance is inactive'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Additional Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    value={data.notes}
                                    onChange={handleChange}
                                    placeholder="Enter any additional notes or special instructions"
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <Link href="/billing/patient-insurances">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Update Insurance'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
