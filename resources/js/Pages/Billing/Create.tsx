import { Head, useForm, Link } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Alert } from '@/components/ui/alert';
import { CurrencyDisplay, formatCurrency } from '@/components/billing/CurrencyDisplay';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    Save,
    Calendar as CalendarIcon,
    Plus,
    Trash2,
    Stethoscope,
    Shield,
    ClipboardList,
    Calculator,
    Building,
} from 'lucide-react';

// Interface for props from BillController
interface CreateProps {
    patients: Array<{
        id: number;
        patient_id: string;
        first_name: string;
        last_name: string;
        father_name?: string;
        phone?: string;
    }>;
    doctors: Array<{
        id: number;
        doctor_id: string;
        full_name: string;
        specialization: string;
    }>;
    services: Array<{
        id: number;
        service_name: string;
        price: number;
        department: {
            name: string;
        };
    }>;
    patient_insurances: Array<{
        id: number;
        insuranceProvider: {
            name: string;
        };
        policy_number: string;
        coverage_percentage: number;
    }>;
}

// Bill item interface for the form
interface BillItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    service_id?: number;
    type: 'service' | 'test' | 'procedure' | 'medication' | 'other';
}

// Currency formatter helper
const formatCurrencySimple = (amount: number): string => {
    return formatCurrency(amount, { currency: 'USD', locale: 'en-US' });
};

const Create = ({ patients, doctors, services, patient_insurances }: CreateProps) => {
    const [billItems, setBillItems] = useState<BillItem[]>([]);
    const [selectedService, setSelectedService] = useState<string>('');
    const [selectedInsurance, setSelectedInsurance] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        patient_id: '',
        doctor_id: '',
        bill_date: new Date().toISOString().split('T')[0],
        due_date: '',
        discount: 0,
        discount_type: 'fixed' as 'fixed' | 'percentage',
        tax_rate: 0,
        notes: '',
        billing_address: '',
        primary_insurance_id: '',
        items: [] as BillItem[],
    });

    // Calculate totals
    const { subtotal, insuranceCoverage, discountAmount, taxAmount, grandTotal } = useMemo(() => {
        const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
        
        // Get selected insurance
        const insurance = patient_insurances.find(ins => ins.id.toString() === selectedInsurance);
        const insuranceCoverage = insurance ? subtotal * (insurance.coverage_percentage / 100) : 0;
        
        // Calculate discount
        let discountAmount = data.discount;
        if (data.discount_type === 'percentage' && subtotal > 0) {
            discountAmount = subtotal * (data.discount / 100);
        }
        
        // Calculate taxable amount (after insurance and discount)
        const taxableAmount = Math.max(0, subtotal - insuranceCoverage - discountAmount);
        const taxAmount = taxableAmount * (data.tax_rate / 100);
        
        // Grand total
        const grandTotal = Math.max(0, subtotal - insuranceCoverage - discountAmount + taxAmount);
        
        return { subtotal, insuranceCoverage, discountAmount, taxAmount, grandTotal };
    }, [billItems, data.discount, data.discount_type, data.tax_rate, selectedInsurance, patient_insurances]);

    // Update items in form data whenever billItems changes
    useEffect(() => {
        setData('items', billItems);
    }, [billItems]);

    // Service options for combobox
    const serviceOptions: ComboboxOption[] = services.map(service => ({
        value: service.id.toString(),
        label: service.service_name,
        subtitle: `${service.department.name} - ${formatCurrencySimple(service.price)}`,
    }));

    // Handle adding a service to the bill
    const handleAddService = () => {
        const service = services.find(s => s.id.toString() === selectedService);
        if (!service) return;

        const newItem: BillItem = {
            id: Date.now().toString(),
            description: service.service_name,
            quantity: 1,
            unit_price: service.price,
            total: service.price,
            service_id: service.id,
            type: 'service',
        };

        setBillItems(prev => [...prev, newItem]);
        setSelectedService('');
    };

    // Handle adding a manual item
    const handleAddManualItem = () => {
        const newItem: BillItem = {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            unit_price: 0,
            total: 0,
            type: 'other',
        };

        setBillItems(prev => [...prev, newItem]);
    };

    // Handle updating a bill item
    const handleUpdateItem = (id: string, updates: Partial<BillItem>) => {
        setBillItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, ...updates };
                // Recalculate total if quantity or price changed
                if (updates.quantity !== undefined || updates.unit_price !== undefined) {
                    updated.total = updated.quantity * updated.unit_price;
                }
                return updated;
            }
            return item;
        }));
    };

    // Handle removing a bill item
    const handleRemoveItem = (id: string) => {
        setBillItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        post('/billing', {
            onFinish: () => setIsLoading(false),
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, name === 'discount' || name === 'tax_rate' ? parseFloat(value) || 0 : value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    const handleInsuranceChange = (value: string) => {
        setSelectedInsurance(value);
        setData('primary_insurance_id', value);
    };

    return (
        <>
            <Head title="Create New Bill" />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading 
                        title="Create New Bill" 
                        description="Create a new billing invoice for a patient"
                    />
                    
                    <Link href="/billing">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Bills
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>
                                Select the patient and set the billing details
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="patient_id">Patient *</Label>
                                    <Select 
                                        value={data.patient_id} 
                                        onValueChange={(value) => handleSelectChange('patient_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select patient" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {patients.map(patient => (
                                                <SelectItem key={patient.id} value={patient.id.toString()}>
                                                    {patient.patient_id} - {patient.first_name} {patient.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.patient_id && (
                                        <p className="text-sm text-red-600">{errors.patient_id}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="doctor_id">Referring Doctor</Label>
                                    <Select 
                                        value={data.doctor_id} 
                                        onValueChange={(value) => handleSelectChange('doctor_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select doctor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctors.map(doctor => (
                                                <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                                    {doctor.full_name} - {doctor.specialization}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="bill_date">Bill Date *</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="bill_date"
                                            name="bill_date"
                                            type="date"
                                            value={data.bill_date}
                                            onChange={handleChange}
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.bill_date && (
                                        <p className="text-sm text-red-600">{errors.bill_date}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Due Date *</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="due_date"
                                            name="due_date"
                                            type="date"
                                            value={data.due_date}
                                            onChange={handleChange}
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.due_date && (
                                        <p className="text-sm text-red-600">{errors.due_date}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="billing_address">Billing Address</Label>
                                    <Textarea
                                        id="billing_address"
                                        name="billing_address"
                                        value={data.billing_address}
                                        onChange={handleChange}
                                        placeholder="Enter billing address"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Insurance Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Insurance Information
                            </CardTitle>
                            <CardDescription>
                                Select insurance coverage for the patient (if applicable)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="primary_insurance_id">Primary Insurance</Label>
                                    <Select 
                                        value={selectedInsurance} 
                                        onValueChange={handleInsuranceChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select insurance (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Insurance</SelectItem>
                                            {patient_insurances.map(insurance => (
                                                <SelectItem key={insurance.id} value={insurance.id.toString()}>
                                                    {insurance.insuranceProvider.name} - {insurance.policy_number}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedInsurance && (
                                    <div className="space-y-2">
                                        <Label>Coverage Details</Label>
                                        <div className="p-4 bg-muted/50 rounded-lg">
                                            {(() => {
                                                const insurance = patient_insurances.find(ins => ins.id.toString() === selectedInsurance);
                                                if (!insurance) return null;
                                                return (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Insurance Provider:</span>
                                                            <span className="font-medium">{insurance.insuranceProvider.name}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Policy Number:</span>
                                                            <span className="font-medium">{insurance.policy_number}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Coverage:</span>
                                                            <span className="font-medium text-green-600">{insurance.coverage_percentage}%</span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Services Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Stethoscope className="h-5 w-5" />
                                Services
                            </CardTitle>
                            <CardDescription>
                                Search and add department services to the bill
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1">
                                    <Combobox
                                        options={serviceOptions}
                                        value={selectedService}
                                        onValueChange={setSelectedService}
                                        placeholder="Search services..."
                                        searchPlaceholder="Search by name or department..."
                                        emptyText="No services found."
                                    />
                                </div>
                                <Button 
                                    type="button" 
                                    onClick={handleAddService}
                                    disabled={!selectedService}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Service
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bill Items Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Bill Items
                            </CardTitle>
                            <CardDescription>
                                Manage all items included in this bill
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Bill Items Table */}
                            {billItems.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-muted/50">
                                                <tr>
                                                    <th className="text-left p-3 text-sm font-medium">Description</th>
                                                    <th className="text-left p-3 text-sm font-medium">Type</th>
                                                    <th className="text-right p-3 text-sm font-medium w-24">Qty</th>
                                                    <th className="text-right p-3 text-sm font-medium w-28">Unit Price</th>
                                                    <th className="text-right p-3 text-sm font-medium w-28">Total</th>
                                                    <th className="p-3 w-12"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {billItems.map((item) => (
                                                    <tr key={item.id} className="border-t">
                                                        <td className="p-3">
                                                            <Input
                                                                value={item.description}
                                                                onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                                                                placeholder="Item description"
                                                                className="border-0 focus-visible:ring-0 bg-transparent"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <Select
                                                                value={item.type}
                                                                onValueChange={(value) => handleUpdateItem(item.id, { type: value as BillItem['type'] })}
                                                            >
                                                                <SelectTrigger className="w-28 h-8">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="service">Service</SelectItem>
                                                                    <SelectItem value="test">Test</SelectItem>
                                                                    <SelectItem value="procedure">Procedure</SelectItem>
                                                                    <SelectItem value="medication">Medication</SelectItem>
                                                                    <SelectItem value="other">Other</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                                                className="text-right"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.unit_price}
                                                                onChange={(e) => handleUpdateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                                                                className="text-right"
                                                            />
                                                        </td>
                                                        <td className="p-3 text-right font-medium">
                                                            {formatCurrencySimple(item.total)}
                                                        </td>
                                                        <td className="p-3">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <Button type="button" variant="outline" onClick={handleAddManualItem}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Manual Item
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No items added yet. Add services or create manual items.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Totals Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Summary & Totals
                            </CardTitle>
                            <CardDescription>
                                Review the billing summary before submitting
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Totals Calculation */}
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Subtotal:</span>
                                            <CurrencyDisplay amount={subtotal} size="md" />
                                        </div>
                                        
                                        {insuranceCoverage > 0 && (
                                            <div className="flex justify-between items-center text-green-600">
                                                <span>Insurance Coverage ({selectedInsurance ? patient_insurances.find(ins => ins.id.toString() === selectedInsurance)?.coverage_percentage + '%' : '0%'}):</span>
                                                <CurrencyDisplay amount={-insuranceCoverage} size="md" color="success" />
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">Discount:</span>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={data.discount}
                                                        onChange={handleChange}
                                                        name="discount"
                                                        className="w-20 h-8"
                                                    />
                                                    <Select
                                                        value={data.discount_type}
                                                        onValueChange={(value) => setData('discount_type', value as 'fixed' | 'percentage')}
                                                    >
                                                        <SelectTrigger className="w-24 h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="fixed">Fixed</SelectItem>
                                                            <SelectItem value="percentage">%</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <CurrencyDisplay amount={-discountAmount} size="md" color="danger" />
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground">Tax Rate:</span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={data.tax_rate}
                                                    onChange={handleChange}
                                                    name="tax_rate"
                                                    className="w-16 h-8"
                                                />
                                                <span className="text-muted-foreground">%</span>
                                            </div>
                                            <CurrencyDisplay amount={taxAmount} size="md" />
                                        </div>
                                        
                                        <div className="border-t pt-3 mt-3">
                                            <div className="flex justify-between items-center text-lg font-semibold">
                                                <span>Grand Total:</span>
                                                <CurrencyDisplay 
                                                    amount={grandTotal} 
                                                    size="lg" 
                                                    weight="bold"
                                                    color="primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        value={data.notes}
                                        onChange={handleChange}
                                        placeholder="Enter any additional notes for this bill"
                                        rows={4}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Error Alert */}
                    {(errors as Record<string, string> && Object.keys(errors).length > 0) && (
                        <Alert variant="destructive">
                            <p className="font-medium">Please fix the following errors:</p>
                            <ul className="list-disc list-inside mt-2">
                                {Object.entries(errors).map(([key, value]) => (
                                    <li key={key}>{value}</li>
                                ))}
                            </ul>
                        </Alert>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <Link href="/billing">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button 
                            type="submit" 
                            disabled={processing || isLoading || billItems.length === 0}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {processing || isLoading ? 'Saving...' : 'Create Bill'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default Create;
