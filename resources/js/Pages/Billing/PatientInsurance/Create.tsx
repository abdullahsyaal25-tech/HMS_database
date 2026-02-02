import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    Save,
    User,
    Shield,
    Calendar,
    DollarSign,
    FileText,
    Search,
    AlertCircle,
} from 'lucide-react';

interface InsuranceProvider {
    id: number;
    name: string;
    code: string;
}

interface Patient {
    id: number;
    full_name: string;
    patient_number: string;
    date_of_birth: string;
}

interface Props {
    providers: InsuranceProvider[];
    patients: Patient[];
}

const COVERAGE_TYPES = [
    { value: 'primary', label: 'Primary' },
    { value: 'secondary', label: 'Secondary' },
    { value: 'tertiary', label: 'Tertiary' },
];

const Create = ({ providers, patients }: Props) => {
    const [, setIsLoading] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [filteredPatients, setFilteredPatients] = useState(patients);

    const { data, setData, post, processing, errors } = useForm({
        patient_id: null as number | null,
        patient_name: '',
        insurance_provider_id: '',
        policy_number: '',
        group_number: '',
        card_number: '',
        coverage_type: 'primary' as string,
        coverage_percentage: undefined as number | undefined,
        max_coverage_amount: undefined as number | undefined,
        effective_date: '',
        expiration_date: '',
        is_primary: false,
        co_pay_amount: undefined as number | undefined,
        deductible_amount: undefined as number | undefined,
        notes: '',
    });

    const handlePatientSearch = (search: string) => {
        setPatientSearch(search);
        const filtered = patients.filter(
            (patient) =>
                patient.full_name.toLowerCase().includes(search.toLowerCase()) ||
                patient.patient_number.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredPatients(filtered);
    };

    const selectPatient = (patient: Patient) => {
        setData('patient_id', patient.id);
        setData('patient_name', patient.full_name);
        setPatientSearch(patient.full_name);
        setShowPatientDropdown(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const target = e.target as HTMLInputElement;
            setData(name as keyof typeof data, target.checked);
        } else if (type === 'number') {
            setData(name as keyof typeof data, value ? parseFloat(value) : undefined);
        } else {
            setData(name as keyof typeof data, value);
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        post('/patient-insurance', {
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <>
            <Head title="Add Patient Insurance" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading
                            title="Add Patient Insurance"
                            description="Register insurance coverage for a patient"
                        />
                    </div>
                    <Link href="/patient-insurance">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Patient Insurance
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Patient Selection Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Patient Selection
                            </CardTitle>
                            <CardDescription>
                                Search and select the patient for this insurance record
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="patient_search">Patient *</Label>
                                <div className="relative">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="patient_search"
                                            value={patientSearch}
                                            onChange={(e) => {
                                                handlePatientSearch(e.target.value);
                                                setShowPatientDropdown(true);
                                            }}
                                            onFocus={() => setShowPatientDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
                                            placeholder="Search by patient name or number..."
                                            className="pl-8"
                                        />
                                    </div>
                                    {showPatientDropdown && patientSearch && filteredPatients.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                            {filteredPatients.map((patient) => (
                                                <div
                                                    key={patient.id}
                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                                    onClick={() => selectPatient(patient)}
                                                >
                                                    <div className="font-medium">{patient.full_name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {patient.patient_number} • DOB: {patient.date_of_birth}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {showPatientDropdown && patientSearch && filteredPatients.length === 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg px-4 py-2 text-muted-foreground">
                                            No patients found
                                        </div>
                                    )}
                                </div>
                                {errors.patient_id && (
                                    <p className="text-sm text-red-600">{errors.patient_id}</p>
                                )}
                                <input type="hidden" name="patient_id" value={data.patient_id || ''} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insurance Provider & Policy Details Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Insurance Provider & Policy Details
                            </CardTitle>
                            <CardDescription>
                                Enter the insurance provider and policy information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="insurance_provider_id">Insurance Provider *</Label>
                                    <Select
                                        value={data.insurance_provider_id}
                                        onValueChange={(value) => handleSelectChange('insurance_provider_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select insurance provider" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {providers.map((provider) => (
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
                                        placeholder="e.g., POL-123456789"
                                        required
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
                                        value={data.group_number || ''}
                                        onChange={handleChange}
                                        placeholder="e.g., GRP-987654"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="card_number">Card Number</Label>
                                    <Input
                                        id="card_number"
                                        name="card_number"
                                        value={data.card_number || ''}
                                        onChange={handleChange}
                                        placeholder="e.g., 1234-5678-9012-3456"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="coverage_type">Coverage Type</Label>
                                    <Select
                                        value={data.coverage_type}
                                        onValueChange={(value) => handleSelectChange('coverage_type', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select coverage type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COVERAGE_TYPES.map((type) => (
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
                                        step="0.01"
                                        value={data.coverage_percentage || ''}
                                        onChange={handleChange}
                                        placeholder="e.g., 80"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coverage Amount Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Coverage Amount
                            </CardTitle>
                            <CardDescription>
                                Enter coverage limits and financial details
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="max_coverage_amount">Maximum Coverage Amount</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="max_coverage_amount"
                                            name="max_coverage_amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.max_coverage_amount || ''}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="co_pay_amount">Co-pay Amount</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="co_pay_amount"
                                            name="co_pay_amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.co_pay_amount || ''}
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
                                            step="0.01"
                                            min="0"
                                            value={data.deductible_amount || ''}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className="pl-8"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Effective Dates Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Effective Dates
                            </CardTitle>
                            <CardDescription>
                                Set the coverage period for this insurance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="effective_date">Effective Date *</Label>
                                    <Input
                                        id="effective_date"
                                        name="effective_date"
                                        type="date"
                                        value={data.effective_date}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.effective_date && (
                                        <p className="text-sm text-red-600">{errors.effective_date}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiration_date">Expiration Date</Label>
                                    <Input
                                        id="expiration_date"
                                        name="expiration_date"
                                        type="date"
                                        value={data.expiration_date || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Status
                            </CardTitle>
                            <CardDescription>
                                Set the insurance status and options
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_primary"
                                        checked={data.is_primary}
                                        onCheckedChange={(checked) =>
                                            setData('is_primary', checked === true)
                                        }
                                    />
                                    <Label htmlFor="is_primary" className="text-sm font-normal">
                                        Primary Insurance (Set as the primary insurance for this patient)
                                    </Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Notes
                            </CardTitle>
                            <CardDescription>
                                Add any additional notes about this insurance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    value={data.notes || ''}
                                    onChange={handleChange}
                                    placeholder="Add any notes about this insurance coverage..."
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4">
                        <Link href="/patient-insurance">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Insurance'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default Create;
