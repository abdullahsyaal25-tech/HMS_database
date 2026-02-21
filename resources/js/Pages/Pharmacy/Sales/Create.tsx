import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

import { MedicineSearch, Cart, PriceDisplay, TotalPrice } from '@/components/pharmacy';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    ShoppingCart,
    User,
    Plus,
    Receipt,
    Percent,
    Currency,
    Calculator,
    Printer,
    CheckCircle,
    AlertCircle,
    Search,
    X,
    Keyboard,
} from 'lucide-react';
import { useState, useMemo, useCallback, useRef } from 'react';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import type { Medicine, CartItem, Patient } from '@/types/pharmacy';

interface SaleCreateProps {
    medicines: Medicine[];
    patients: Patient[];
    taxRate?: number;
}

interface QuickPatientForm {
    first_name: string;
    last_name: string;
    phone: string;
}

export default function SaleCreate({ medicines, patients: patientsProp, taxRate = 0 }: SaleCreateProps) {
    // Ensure patients is properly typed
    const patients = patientsProp as Patient[];
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [showQuickAddPatient, setShowQuickAddPatient] = useState(false);
    const [quickPatient, setQuickPatient] = useState<QuickPatientForm>({
        first_name: '',
        last_name: '',
        phone: '',
    });
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState(0);
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
    const [saleComplete, setSaleComplete] = useState(false);
    const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);

    // Keyboard navigation state
    const [focusedElement, setFocusedElement] = useState<string | null>(null);

    const { data, setData, post, processing } = useForm({
        patient_id: '',
        payment_method: 'cash' as 'cash' | 'card' | 'insurance' | 'credit',
        notes: '',
        discount_amount: 0,
        discount_percentage: 0,
        tax_amount: 0,
        items: [] as CartItem[],
    });

    // Refs for keyboard navigation
    const patientSearchRef = useRef<HTMLInputElement>(null);

    // Filter patients based on search
    const filteredPatients = useMemo((): Patient[] => {
        if (!patientSearchQuery.trim()) return patients.slice(0, 5);
        const query = patientSearchQuery.toLowerCase();
        return patients.filter((p: Patient) => 
            p.first_name.toLowerCase().includes(query) ||
            p.father_name.toLowerCase().includes(query) ||
            p.patient_id.toLowerCase().includes(query)
        ).slice(0, 5);
    }, [patients, patientSearchQuery]);

    // Calculate totals
    const { subtotal, discount, tax, total } = useMemo(() => {
        const sub = cartItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        let disc = 0;
        if (discountType === 'percentage') {
            disc = sub * (discountValue / 100);
        } else {
            disc = discountValue;
        }
        // Ensure discount doesn't exceed subtotal
        disc = Math.min(disc, sub);
        const calculatedTax = sub * (taxRate / 100);
        const tot = sub - disc + calculatedTax;
        return {
            subtotal: sub,
            discount: disc,
            tax: calculatedTax,
            total: tot,
        };
    }, [cartItems, discountValue, discountType, taxRate]);

    // Check if discount exceeds subtotal (for validation warning)
    const discountExceedsSubtotal = discountType === 'fixed' && discountValue > subtotal && subtotal > 0;

    // Cart handlers
    const handleAddToCart = useCallback((medicine: Medicine) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.medicine_id === medicine.id);
            if (existing) {
                return prev.map(item =>
                    item.medicine_id === medicine.id
                        ? { ...item, quantity: Math.min(item.quantity + 1, medicine.stock_quantity) }
                        : item
                );
            }
            return [...prev, {
                medicine_id: medicine.id,
                name: medicine.name,
                quantity: 1,
                unit_price: medicine.unit_price,
                stock_quantity: medicine.stock_quantity,
                dosage_form: medicine.dosage_form,
                strength: medicine.strength,
            }];
        });
    }, []);

    const handleUpdateQuantity = useCallback((medicineId: number, quantity: number) => {
        setCartItems(prev =>
            prev.map(item =>
                item.medicine_id === medicineId
                    ? { ...item, quantity: Math.max(1, quantity) }
                    : item
            )
        );
    }, []);

    const handleRemoveItem = useCallback((medicineId: number) => {
        setCartItems(prev => prev.filter(item => item.medicine_id !== medicineId));
    }, []);

    const handleClearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    // Patient handlers
    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setData('patient_id', patient.id.toString());
        setPatientSearchQuery('');
        setFocusedElement('medicine-search');
    };

    // Render patient search results
    const renderPatientResults = () => {
        if (!patientSearchQuery) return null;
        
        const patients = filteredPatients;
        if (patients.length === 0) {
            return (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    No patients found. Click "+ Add Patient" to create a new one.
                </div>
            );
        }
        
        return patients.map((patient: Patient, index: number) => (
            <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSelectPatient(patient);
                    }
                }}
                className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 ${index === 0 && focusedElement === 'patient-results' ? 'bg-muted' : ''}`}
                tabIndex={0}
                role="option"
                aria-selected={selectedPatient?.id === patient.id}>
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                    <p className="font-medium text-sm">
                        {patient.first_name} {patient.father_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {patient.patient_id}
                    </p>
                </div>
            </button>
        ));
    };

    const handleClearPatient = () => {
        setSelectedPatient(null);
        setData('patient_id', '');
        setFocusedElement('patient-search');
    };

    const handleQuickAddPatient = async () => {
        try {
            // Make API call to create the patient using web route
            const response = await fetch('/pharmacy/quick-patient', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    first_name: quickPatient.first_name,
                    father_name: quickPatient.last_name,
                    phone: quickPatient.phone,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create patient');
            }

            const result = await response.json();
            
            if (result.success && result.data) {
                const newPatient: Patient = {
                    id: result.data.id,
                    patient_id: result.data.patient_id,
                    first_name: result.data.first_name,
                    father_name: result.data.father_name,
                    phone: result.data.phone,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                setSelectedPatient(newPatient);
                setData('patient_id', newPatient.id.toString());
                setShowQuickAddPatient(false);
                setQuickPatient({ first_name: '', last_name: '', phone: '' });
                setFocusedElement('medicine-search');
            } else {
                throw new Error(result.message || 'Failed to create patient');
            }
        } catch (error) {
            console.error('Error creating patient:', error);
            alert('Failed to create patient: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // Checkout handler
    const handleCheckout = () => {
        if (cartItems.length === 0) return;

        setData({
            ...data,
            items: cartItems,
            discount_amount: discount,
            discount_percentage: discountType === 'percentage' ? discountValue : 0,
            tax_amount: tax,
        });

        setShowCheckoutDialog(true);
    };

    const handleCompleteSale = () => {
        post('/pharmacy/sales', {
            onSuccess: () => {
                setShowCheckoutDialog(false);
                // Sale completed successfully - controller redirects to receipt page
            },
        });
    };

    const handlePrintReceipt = () => {
        if (completedSaleId) {
            window.open(`/pharmacy/sales/${completedSaleId}/receipt`, '_blank');
        }
    };

    const handleNewSale = () => {
        setSaleComplete(false);
        setCompletedSaleId(null);
        setCartItems([]);
        setSelectedPatient(null);
        setDiscountValue(0);
        setData({
            patient_id: '',
            payment_method: 'cash',
            notes: '',
            discount_amount: 0,
            discount_percentage: 0,
            tax_amount: 0,
            items: [],
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'AFN',
        }).format(amount);
    };

    // Focus ring style
    const focusRing = "ring-2 ring-ring ring-offset-2 ring-offset-background";

    // Success state after sale completion
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
                            <p className="text-muted-foreground mb-6">
                                The sale has been processed successfully.
                            </p>
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
                                    <Button variant="ghost" className="w-full">
                                        View All Sales
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </PharmacyLayout>
        );
    }

    return (
        <PharmacyLayout>
            <div className="space-y-6">
                <Head title="New Sale - POS" />
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Point of Sale" />
                        <p className="text-muted-foreground mt-1">
                            Create a new sale transaction
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Keyboard shortcuts hint */}
                        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground mr-2">
                            <Keyboard className="h-3 w-3" />
                            <span>Keyboard navigation enabled</span>
                        </div>
                        <Link href="/pharmacy/sales">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Sales
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Main Form Layout - Single Column */}
                <div className="space-y-6">
                    
                    {/* SECTION 1: CUSTOMER - Most Prominent */}
                    <Card className="border-2 border-primary/20 shadow-lg">
                        <CardHeader className="bg-primary/5 pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="h-5 w-5 text-primary" />
                                Customer / Patient
                                <Badge variant="outline" className="ml-2 text-xs">Step 1 of 3</Badge>
                            </CardTitle>
                            <CardDescription>
                                Select an existing patient or add a new one
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {selectedPatient ? (
                                <div className="p-4 rounded-lg bg-muted/50 border-2 border-primary/20">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-lg">
                                                    {selectedPatient.first_name} {selectedPatient.father_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    ID: {selectedPatient.patient_id}
                                                </p>
                                                {selectedPatient.phone && (
                                                    <p className="text-sm text-muted-foreground">
                                                        📞 {selectedPatient.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearPatient}
                                            aria-label="Clear selected patient"
                                            className={focusedElement === 'clear-patient' ? focusRing : ''}
                                            tabIndex={0}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Patient Search with Plus Button */}
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                ref={patientSearchRef}
                                                placeholder="Search patient by name or ID..."
                                                value={patientSearchQuery}
                                                onChange={(e) => setPatientSearchQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && filteredPatients.length > 0) {
                                                        handleSelectPatient(filteredPatients[0]);
                                                    } else if (e.key === 'Escape') {
                                                        setPatientSearchQuery('');
                                                    }
                                                }}
                                                className={`pl-9 pr-10 h-12 text-base ${focusedElement === 'patient-search' ? focusRing : ''}`}
                                                tabIndex={0}
                                                aria-label="Search for patient"
                                            />
                                            {patientSearchQuery && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                                    onClick={() => setPatientSearchQuery('')}
                                                    tabIndex={-1}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        
                                        {/* Quick Add Patient Button */}
                                        <Dialog open={showQuickAddPatient} onOpenChange={setShowQuickAddPatient}>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    variant="default"
                                                    size="lg"
                                                    className="h-12 px-4"
                                                    tabIndex={0}
                                                    aria-label="Add new patient"
                                                >
                                                    <Plus className="h-5 w-5" />
                                                    <span className="ml-1 hidden sm:inline">Add Patient</span>
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Quick Add Patient</DialogTitle>
                                                    <DialogDescription>
                                                        Add a new patient quickly for this sale
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 pt-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="firstName">First Name *</Label>
                                                            <Input
                                                                id="firstName"
                                                                value={quickPatient.first_name}
                                                                onChange={(e) => setQuickPatient(prev => ({ ...prev, first_name: e.target.value }))}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && quickPatient.first_name) {
                                                                        handleQuickAddPatient();
                                                                    }
                                                                }}
                                                                placeholder="John"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="fatherName">Father's Name</Label>
                                                            <Input
                                                                id="fatherName"
                                                                value={quickPatient.last_name}
                                                                onChange={(e) => setQuickPatient(prev => ({ ...prev, last_name: e.target.value }))}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter' && quickPatient.first_name) {
                                                                        handleQuickAddPatient();
                                                                    }
                                                                }}
                                                                placeholder="Smith"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="phone">Phone</Label>
                                                        <Input
                                                            id="phone"
                                                            value={quickPatient.phone}
                                                            onChange={(e) => setQuickPatient(prev => ({ ...prev, phone: e.target.value }))}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && quickPatient.first_name) {
                                                                    handleQuickAddPatient();
                                                                }
                                                            }}
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
                                    
                                    {/* Patient Search Results */}
                                    {patientSearchQuery && (
                                        <div className="border rounded-md divide-y" role="listbox">
                                            {renderPatientResults()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* SECTION 2: MEDICINES */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Search className="h-5 w-5" />
                                Search Medicines
                                <Badge variant="outline" className="ml-2 text-xs">Step 2 of 3</Badge>
                            </CardTitle>
                            <CardDescription>
                                Search medicines by name or code to add to cart
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Medicine Search */}
                            <MedicineSearch
                                medicines={medicines}
                                onSelect={handleAddToCart}
                                placeholder="Search by name, code, or category..."
                                showStock={true}
                                showPrice={true}
                            />
                        </CardContent>
                    </Card>

                    {/* SECTION 3: CART & CHECKOUT */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cart */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5" />
                                        Cart
                                        {cartItems.length > 0 && (
                                            <Badge variant="secondary">
                                                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Cart
                                        items={cartItems}
                                        onUpdateQuantity={handleUpdateQuantity}
                                        onRemoveItem={handleRemoveItem}
                                        onClearCart={handleClearCart}
                                        discount={discount}
                                        tax={tax}
                                        maxHeight="400px"
                                        emptyMessage="Your cart is empty. Search for medicines above to add items."
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Side - Discount & Summary */}
                        <div className="space-y-6">
                            {/* Discount */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Percent className="h-5 w-5" />
                                        Discount
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {discountExceedsSubtotal && (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                            <p className="text-sm text-amber-800 flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4" />
                                                Discount cannot exceed subtotal ({formatCurrency(subtotal)})
                                            </p>
                                        </div>
                                    )}
                                    <Tabs value={discountType} onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}>
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="percentage">Percentage</TabsTrigger>
                                            <TabsTrigger value="fixed">Fixed Amount</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="percentage" className="mt-4">
                                            <div className="relative">
                                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={discountValue}
                                                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleCheckout();
                                                        }
                                                    }}
                                                    className={`pl-9 ${focusedElement === 'discount-value' ? focusRing : ''}`}
                                                    tabIndex={0}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="fixed" className="mt-4">
                                            <div className="relative">
                                                <Currency className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={discountValue}
                                                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleCheckout();
                                                        }
                                                    }}
                                                    className={`pl-9 ${focusedElement === 'discount-value' ? focusRing : ''}`}
                                                    tabIndex={0}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>

                            {/* Order Summary */}
                            <Card className="border-primary/20">
                                <CardHeader className="bg-primary/5">
                                    <CardTitle className="flex items-center gap-2">
                                        <Calculator className="h-5 w-5" />
                                        Order Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <PriceDisplay amount={subtotal} size="sm" />
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Discount</span>
                                            <span className="text-emerald-600">-{formatCurrency(discount)}</span>
                                        </div>
                                    )}
                                    {tax > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                                            <PriceDisplay amount={tax} size="sm" />
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Total</span>
                                        <TotalPrice amount={total} size="lg" />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-3">
                                    {cartItems.length > 0 ? (
                                        <Button 
                                            onClick={handleCheckout}
                                            className="w-full"
                                            size="lg"
                                            disabled={discountExceedsSubtotal || total < 0}
                                            tabIndex={0}
                                        >
                                            <Receipt className="mr-2 h-4 w-4" />
                                            Proceed to Checkout
                                        </Button>
                                    ) : (
                                        <Button disabled className="w-full" size="lg">
                                            <AlertCircle className="mr-2 h-4 w-4" />
                                            Add items to checkout
                                        </Button>
                                    )}
                                    
                                    {/* Keyboard hint */}
                                    <p className="text-xs text-muted-foreground text-center">
                                        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to checkout
                                    </p>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Checkout Dialog */}
                <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Confirm Sale</DialogTitle>
                            <DialogDescription>
                                Review the sale details before completing
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-muted p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Items</span>
                                    <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
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
                                {tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Payment Method</span>
                                    <span className="capitalize">{data.payment_method}</span>
                                </div>
                                {selectedPatient && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Customer</span>
                                        <span>{selectedPatient.first_name} {selectedPatient.father_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowCheckoutDialog(false)}
                                className="flex-1"
                                tabIndex={0}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCompleteSale}
                                disabled={processing}
                                className="flex-1"
                                tabIndex={0}
                            >
                                {processing ? 'Processing...' : 'Complete Sale'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </PharmacyLayout>
    );
}

