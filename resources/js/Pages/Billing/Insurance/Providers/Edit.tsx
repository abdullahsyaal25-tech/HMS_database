import { Head, useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    Save,
    Building,
    Shield,
    Phone,
    DollarSign,
    Settings,
} from 'lucide-react';

const COVERAGE_TYPES = [
    { value: 'inpatient', label: 'Inpatient' },
    { value: 'outpatient', label: 'Outpatient' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'lab', label: 'Laboratory' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'dental', label: 'Dental' },
    { value: 'vision', label: 'Vision' },
];

interface InsuranceProvider {
    id: number;
    name: string;
    code: string;
    description: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
    coverage_types: string[];
    max_coverage_amount: number | null;
    api_endpoint: string | null;
    has_api_integration: boolean;
    is_active: boolean;
    notes: string | null;
}

interface EditProps {
    provider: InsuranceProvider;
}

const Edit = ({ provider }: EditProps) => {
    const [, setIsLoading] = useState(false);
    const [selectedCoverageTypes, setSelectedCoverageTypes] = useState<string[]>(provider.coverage_types || []);

    const { data, setData, put, processing, errors } = useForm({
        name: provider.name || '',
        code: provider.code || '',
        description: provider.description || '',
        phone: provider.phone || '',
        email: provider.email || '',
        website: provider.website || '',
        address: provider.address || '',
        coverage_types: provider.coverage_types || [],
        max_coverage_amount: provider.max_coverage_amount || undefined,
        api_endpoint: provider.api_endpoint || '',
        has_api_integration: provider.has_api_integration || false,
        is_active: provider.is_active ?? true,
        notes: provider.notes || '',
    });

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

    const handleCoverageTypeChange = (value: string) => {
        const newCoverageTypes = selectedCoverageTypes.includes(value)
            ? selectedCoverageTypes.filter((type) => type !== value)
            : [...selectedCoverageTypes, value];
        
        setSelectedCoverageTypes(newCoverageTypes);
        setData('coverage_types', newCoverageTypes);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        put(`/insurance/providers/${provider.id}`, {
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <>
            <Head title={`Edit Insurance Provider - ${provider.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading 
                            title="Edit Insurance Provider"
                            description={`Update details for ${provider.name}`}
                        />
                    </div>
                    <Link href="/insurance/providers">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Providers
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>
                                Enter the essential details of the insurance provider
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Provider Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        onChange={handleChange}
                                        placeholder="e.g., Blue Cross Blue Shield"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="code">Provider Code *</Label>
                                    <Input
                                        id="code"
                                        name="code"
                                        value={data.code}
                                        onChange={handleChange}
                                        placeholder="e.g., BCBS"
                                        required
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-red-600">{errors.code}</p>
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
                                            step="0.01"
                                            min="0"
                                            value={data.max_coverage_amount || ''}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.max_coverage_amount && (
                                        <p className="text-sm text-red-600">{errors.max_coverage_amount}</p>
                                    )}
                                </div>

                                <div className="col-span-full space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={data.description || ''}
                                        onChange={handleChange}
                                        placeholder="Enter a brief description of the insurance provider"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                Contact Information
                            </CardTitle>
                            <CardDescription>
                                Enter the contact details for the insurance provider
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={data.phone || ''}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-red-600">{errors.phone}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={data.email || ''}
                                        onChange={handleChange}
                                        placeholder="contact@insurance.com"
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website">Website</Label>
                                    <Input
                                        id="website"
                                        name="website"
                                        type="url"
                                        value={data.website || ''}
                                        onChange={handleChange}
                                        placeholder="https://www.insurance.com"
                                    />
                                    {errors.website && (
                                        <p className="text-sm text-red-600">{errors.website}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        value={data.address || ''}
                                        onChange={handleChange}
                                        placeholder="Enter the full address"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coverage & API Information Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Coverage & API Information
                            </CardTitle>
                            <CardDescription>
                                Configure coverage types and API integration settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Coverage Types</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {COVERAGE_TYPES.map((type) => (
                                            <div key={type.value} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`coverage-${type.value}`}
                                                    checked={selectedCoverageTypes.includes(type.value)}
                                                    onCheckedChange={() => handleCoverageTypeChange(type.value)}
                                                />
                                                <Label
                                                    htmlFor={`coverage-${type.value}`}
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    {type.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.coverage_types && (
                                        <p className="text-sm text-red-600">{errors.coverage_types}</p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="api_endpoint">API Endpoint</Label>
                                        <Input
                                            id="api_endpoint"
                                            name="api_endpoint"
                                            type="url"
                                            value={data.api_endpoint || ''}
                                            onChange={handleChange}
                                            placeholder="https://api.insurance.com/v1"
                                        />
                                        {errors.api_endpoint && (
                                            <p className="text-sm text-red-600">{errors.api_endpoint}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="has_api_integration"
                                            checked={data.has_api_integration}
                                            onCheckedChange={(checked) => 
                                                setData('has_api_integration', checked === true)
                                            }
                                        />
                                        <Label htmlFor="has_api_integration" className="text-sm font-normal">
                                            Enable API Integration
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status & Notes Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Status & Notes
                            </CardTitle>
                            <CardDescription>
                                Set the provider status and add any additional notes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) => 
                                            setData('is_active', checked === true)
                                        }
                                    />
                                    <Label htmlFor="is_active" className="text-sm font-normal">
                                        Active (Enable this insurance provider for use)
                                    </Label>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Internal Notes</Label>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        value={data.notes || ''}
                                        onChange={handleChange}
                                        placeholder="Add any internal notes about this provider"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4">
                        <Link href="/insurance/providers">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Update Provider'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default Edit;
