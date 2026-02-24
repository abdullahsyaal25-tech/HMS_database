import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { MedicineSearch, TotalPrice } from '@/components/pharmacy';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    User,
    Plus,
    Receipt,
    Percent,
    Currency,
    Printer,
    CheckCircle,
    AlertCircle,
    Search,
    X,
} from 'lucide-react';
import { useState, useMemo, useCallback, useRef } from 'react';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import type { Medicine, CartItem, Patient } from '@/types/pharmacy';

interface SaleCreateProps {
    medicines: Medicine[];
    patients: Patient[];
}

interface QuickPatientForm {
    first_name: string;
    last_name: string;
    phone: string;
}


export default function SaleCreate({ medicines, patients: patientsProp }: SaleCreateProps) {
    const patients = patientsProp as Patient[];

    const [cartItems, setCartItems]                 = useState<CartItem[]>([]);
    const [selectedPatient, setSelectedPatient]     = useState<Patient | null>(null);
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [selectedPatientIndex, setSelectedPatientIndex] = useState(-1);
    const [showQuickAddPatient, setShowQuickAddPatient] = useState(false);
    const [quickPatient, setQuickPatient]           = useState<QuickPatientForm>({ first_name: '', last_name: '', phone: '' });
    const [discountType, setDiscountType]           = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue]         = useState(0);
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
    const [saleComplete, setSaleComplete]           = useState(false);
    const [completedSaleId, setCompletedSaleId]     = useState<number | null>(null);

    const { data, setData, post, processing } = useForm({
        patient_id:          '',
        payment_method:      'cash' as 'cash' | 'card' | 'insurance' | 'credit',
        notes:               '',
        discount_amount:     0,
        discount_percentage: 0,
        items:               [] as CartItem[],
    });

    const patientSearchRef = useRef<HTMLInputElement>(null);
    const medicineSearchRef = useRef<HTMLDivElement>(null);

    const filteredPatients = useMemo((): Patient[] => {
        if (!patientSearchQuery.trim()) return patients.slice(0, 5);
        const q = patientSearchQuery.toLowerCase();
        return patients
            .filter(p =>
                p.first_name.toLowerCase().includes(q) ||
                p.father_name.toLowerCase().includes(q) ||
                p.patient_id.toLowerCase().includes(q),
            )
            .slice(0, 5);
    }, [patients, patientSearchQuery]);

    // Handle keyboard navigation for patient search
    const handlePatientSearchKeyDown = (e: React.KeyboardEvent) => {
        if (filteredPatients.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedPatientIndex(prev =>
                    prev < filteredPatients.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedPatientIndex(prev =>
                    prev > 0 ? prev - 1 : filteredPatients.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedPatientIndex >= 0) {
                    handleSelectPatient(filteredPatients[selectedPatientIndex]);
                }
                break;
        }
    };

    const { subtotal, discount, total } = useMemo(() => {
        const sub  = cartItems.reduce((s, i) => s + i.quantity * i.sale_price, 0);
        let   disc = discountType === 'percentage' ? sub * (discountValue / 100) : discountValue;
        disc       = Math.min(disc, sub);
        return { subtotal: sub, discount: disc, total: sub - disc };
    }, [cartItems, discountValue, discountType]);

    const discountExceedsSubtotal = discountType === 'fixed' && discountValue > subtotal && subtotal > 0;

    /* ── Cart handlers ── */
    const handleAddToCart = useCallback((medicine: Medicine) => {
        setCartItems(prev => {
            const existing = prev.find(i => i.medicine_id === medicine.id);
            if (existing) {
                return prev.map(i =>
                    i.medicine_id === medicine.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i,
                );
            }
            // Focus on the new item's quantity input after adding
            setTimeout(() => {
                const input = document.querySelector(`[data-medicine-id="${medicine.id}"]`) as HTMLInputElement;
                if (input) {
                    input.focus();
                    input.select();
                }
            }, 0);
            return [...prev, {
                medicine_id:    medicine.id,
                name:           medicine.name,
                quantity:       1,
                sale_price:     medicine.sale_price,
                stock_quantity: medicine.stock_quantity,
                dosage_form:    medicine.dosage_form,
                strength:       medicine.strength,
            }];
        });
    }, []);

    const handleUpdateQuantity = useCallback((medicineId: number, quantity: number) => {
        setCartItems(prev =>
            prev.map(i => i.medicine_id === medicineId ? { ...i, quantity } : i),
        );
    }, []);

    const handleRemoveItem  = useCallback((medicineId: number) => {
        setCartItems(prev => prev.filter(i => i.medicine_id !== medicineId));
    }, []);

    const handleClearCart   = useCallback(() => setCartItems([]), []);

    /* ── Patient handlers ── */
    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setData('patient_id', patient.id.toString());
        setPatientSearchQuery('');
        setSelectedPatientIndex(-1);
    };

    const handleClearPatient = () => {
        setSelectedPatient(null);
        setData('patient_id', '');
    };

    const renderPatientResults = () => {
        if (!patientSearchQuery) return null;
        if (filteredPatients.length === 0) {
            return (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    No patients found. Click + to add a new one.
                </div>
            );
        }
        return filteredPatients.map((patient, index) => (
            <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className={`w-full px-4 py-2.5 text-left transition-colors flex items-center gap-3 ${
                    index === selectedPatientIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                }`}
            >
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                    <p className="font-medium text-sm">{patient.first_name} {patient.father_name}</p>
                    <p className="text-xs text-muted-foreground">{patient.patient_id}</p>
                </div>
            </button>
        ));
    };

    const handleQuickAddPatient = async () => {
        try {
            const response = await fetch('/pharmacy/quick-patient', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    first_name:  quickPatient.first_name,
                    father_name: quickPatient.last_name,
                    phone:       quickPatient.phone,
                }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to create patient');
            }
            const result = await response.json();
            if (result.success && result.data) {
                const newPatient: Patient = {
                    id:          result.data.id,
                    patient_id:  result.data.patient_id,
                    first_name:  result.data.first_name,
                    father_name: result.data.father_name,
                    phone:       result.data.phone,
                    created_at:  new Date().toISOString(),
                    updated_at:  new Date().toISOString(),
                };
                setSelectedPatient(newPatient);
                setData('patient_id', newPatient.id.toString());
                setShowQuickAddPatient(false);
                setQuickPatient({ first_name: '', last_name: '', phone: '' });
            } else {
                throw new Error(result.message || 'Failed to create patient');
            }
        } catch (error) {
            console.error('Error creating patient:', error);
            alert('Failed to create patient: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    /* ── Checkout handlers ── */
    const handleCheckout = () => {
        if (cartItems.length === 0) return;
        setData({
            ...data,
            items:               cartItems,
            discount_amount:     discount,
            discount_percentage: discountType === 'percentage' ? discountValue : 0,
        });
        setShowCheckoutDialog(true);
    };

    const handleCompleteSale = () => {
        post('/pharmacy/sales', {
            onSuccess: () => setShowCheckoutDialog(false),
        });
    };

    const handlePrintReceipt = () => {
        if (completedSaleId) window.open(`/pharmacy/sales/${completedSaleId}/receipt`, '_blank');
    };

    const handleNewSale = () => {
        setSaleComplete(false);
        setCompletedSaleId(null);
        setCartItems([]);
        setSelectedPatient(null);
        setDiscountValue(0);
        setData({ patient_id: '', payment_method: 'cash', notes: '', discount_amount: 0, discount_percentage: 0, items: [] });
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AFN' }).format(amount);

    /* ── Success screen ── */
    if (saleComplete) {
        return (
            <PharmacyLayout>
                <div className="min-h-[80vh] flex items-center justify-center">
                    <Card className="w-full max-w-md">
                        <CardContent className="pt-6 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Sale Completed!</h2>
                            <p className="text-muted-foreground mb-6">The sale has been processed successfully.</p>
                            <div className="space-y-3">
                                <Button onClick={handlePrintReceipt} className="w-full">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Receipt
                                </Button>
                                <Button variant="outline" onClick={handleNewSale} className="w-full">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Sale
                                </Button>
                                <Link href="/pharmacy/sales">
                                    <Button variant="ghost" className="w-full">View All Sales</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </PharmacyLayout>
        );
    }

    /* ── Main render ── */
    return (
        <PharmacyLayout>
            <div className="space-y-6">
                <Head title="New Sale - Pharmacy" />

                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Heading title="New Sale" />
                        <p className="text-muted-foreground text-sm mt-1">Create a new sale transaction</p>
                    </div>
                    <Link href="/pharmacy/sales">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sales
                        </Button>
                    </Link>
                </div>

                {/* Single column form layout - Unified Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">New Sale</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Row 1: Patient */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Customer / Patient</Label>
                                {selectedPatient ? (
                                    <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {selectedPatient.first_name} {selectedPatient.father_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    ID: {selectedPatient.patient_id}
                                                    {selectedPatient.phone && ` · ${selectedPatient.phone}`}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={handleClearPatient} aria-label="Clear patient">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    ref={patientSearchRef}
                                                    placeholder="Search patient by name or ID..."
                                                    value={patientSearchQuery}
                                                    onChange={e => {
                                                        setPatientSearchQuery(e.target.value);
                                                        setSelectedPatientIndex(-1);
                                                    }}
                                                    onKeyDown={e => {
                                                        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                                            handlePatientSearchKeyDown(e);
                                                        } else if (e.key === 'Enter' && filteredPatients.length > 0) {
                                                            const index = selectedPatientIndex >= 0 ? selectedPatientIndex : 0;
                                                            handleSelectPatient(filteredPatients[index]);
                                                        }
                                                        if (e.key === 'Escape') {
                                                            setPatientSearchQuery('');
                                                            setSelectedPatientIndex(-1);
                                                        }
                                                    }}
                                                    className="pl-9 pr-9"
                                                />
                                                {patientSearchQuery && (
                                                    <Button
                                                        variant="ghost" size="sm"
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                                        onClick={() => setPatientSearchQuery('')}
                                                        tabIndex={-1}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Quick-add patient dialog */}
                                            <Dialog open={showQuickAddPatient} onOpenChange={setShowQuickAddPatient}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="icon" aria-label="Add new patient">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Quick Add Patient</DialogTitle>
                                                        <DialogDescription>Add a new patient quickly for this sale</DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 pt-2">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="firstName">First Name *</Label>
                                                                <Input
                                                                    id="firstName"
                                                                    value={quickPatient.first_name}
                                                                    onChange={e => setQuickPatient(p => ({ ...p, first_name: e.target.value }))}
                                                                    placeholder="John"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="fatherName">Father's Name</Label>
                                                                <Input
                                                                    id="fatherName"
                                                                    value={quickPatient.last_name}
                                                                    onChange={e => setQuickPatient(p => ({ ...p, last_name: e.target.value }))}
                                                                    placeholder="Smith"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="phone">Phone</Label>
                                                            <Input
                                                                id="phone"
                                                                value={quickPatient.phone}
                                                                onChange={e => setQuickPatient(p => ({ ...p, phone: e.target.value }))}
                                                                placeholder="+93 700 123 456"
                                                            />
                                                        </div>
                                                        <Button
                                                            onClick={handleQuickAddPatient}
                                                            disabled={!quickPatient.first_name}
                                                            className="w-full"
                                                        >
                                                            Add Patient
                                                        </Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        {patientSearchQuery && (
                                            <div className="border rounded-md divide-y overflow-hidden">
                                                {renderPatientResults()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Row 2: Medicine Search */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Add Medicine</Label>
                            <MedicineSearch
                                ref={medicineSearchRef}
                                medicines={medicines}
                                onSelect={handleAddToCart}
                                placeholder="Search by name, code, or category..."
                                showStock={true}
                                showPrice={true}
                            />
                        </div>

                        </div>

                        <Separator />

                       
                        {/* Row 3: Sale Items Table */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Sale Items</Label>
                            {cartItems.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border rounded-md">
                                    Search for medicines above to add items to the sale.
                                </div>
                            ) : (
                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="text-left px-3 py-2 text-sm font-medium">Medicine</th>
                                                <th className="text-center px-3 py-2 text-sm font-medium w-24">Qty</th>
                                                <th className="text-right px-3 py-2 text-sm font-medium w-28">Price</th>
                                                <th className="text-right px-3 py-2 text-sm font-medium w-28">Total</th>
                                                <th className="w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cartItems.map((item) => (
                                                <tr key={item.medicine_id} className="border-t">
                                                    <td className="px-3 py-2">
                                                        <p className="font-medium text-sm">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">{item.dosage_form} - {item.strength}</p>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            type="number"
                                                            value={item.quantity || ''}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 0;
                                                                handleUpdateQuantity(item.medicine_id, val);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    medicineSearchRef.current?.focus();
                                                                }
                                                            }}
                                                            className="h-8 w-20 text-center"
                                                            data-medicine-id={item.medicine_id}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-sm">
                                                        {formatCurrency(item.sale_price)}
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-sm font-medium">
                                                        {formatCurrency(item.quantity * item.sale_price)}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveItem(item.medicine_id)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {cartItems.length > 0 && (
                                <div className="flex justify-end">
                                    <Button variant="outline" size="sm" onClick={handleClearCart}>
                                        Clear All
                                    </Button>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Row 4: Discount and Totals */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Discount */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Discount</Label>
                                {discountExceedsSubtotal && (
                                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md">
                                        <p className="text-xs text-amber-800 flex items-center gap-1.5">
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            Discount cannot exceed subtotal ({formatCurrency(subtotal)})
                                        </p>
                                    </div>
                                )}
                                <Tabs value={discountType} onValueChange={v => setDiscountType(v as 'percentage' | 'fixed')}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="percentage">Percentage (%)</TabsTrigger>
                                        <TabsTrigger value="fixed">Fixed Amount</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="percentage" className="mt-3">
                                        <div className="relative">
                                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number" min="0" max="100"
                                                value={discountValue || ''}
                                                onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                                                className="pl-9"
                                                placeholder="0"
                                            />
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="fixed" className="mt-3">
                                        <div className="relative">
                                            <Currency className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number" min="0" step="0.01"
                                                value={discountValue || ''}
                                                onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                                                className="pl-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Order Summary */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Order Summary</Label>
                                <div className="rounded-md border p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Discount</span>
                                            <span className="text-emerald-600">-{formatCurrency(discount)}</span>
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-semibold">Total</span>
                                        <TotalPrice amount={total} size="lg" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="pt-2">
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleCheckout}
                            disabled={cartItems.length === 0 || discountExceedsSubtotal || total < 0}
                        >
                            <Receipt className="mr-2 h-4 w-4" />
                            Complete Sale
                        </Button>
                    </CardFooter>
                </Card>

                {/* ── Checkout confirm dialog ── */}
                <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Confirm Sale</DialogTitle>
                            <DialogDescription>Review the sale details before completing</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-muted p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Items</span>
                                    <span>{cartItems.reduce((s, i) => s + i.quantity, 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Discount</span>
                                        <span className="text-emerald-600">-{formatCurrency(discount)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment Method</span>
                                    <span className="capitalize">Cash</span>
                                </div>
                                {selectedPatient && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Customer</span>
                                        <span>{selectedPatient.first_name} {selectedPatient.father_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setShowCheckoutDialog(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleCompleteSale} disabled={processing} className="flex-1">
                                {processing ? 'Processing...' : 'Complete Sale'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </PharmacyLayout>
    );
}
