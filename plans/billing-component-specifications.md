# Billing System - Component Specifications

## Overview

This document provides detailed specifications for all React components, services, and hooks needed for the billing system frontend.

---

## Component Hierarchy

```
resources/js/
├── Pages/
│   └── Billing/
│       ├── Index.tsx
│       ├── Create.tsx
│       ├── Edit.tsx
│       ├── Show.tsx
│       ├── Invoice.tsx
│       ├── Components/
│       │   ├── BillForm.tsx
│       │   ├── BillItemManager.tsx
│       │   ├── BillSummary.tsx
│       │   ├── PaymentSection.tsx
│       │   ├── InsuranceSection.tsx
│       │   └── StatusBadge.tsx
│       ├── Payments/
│       │   ├── Index.tsx
│       │   └── Create.tsx
│       ├── Insurance/
│       │   ├── Claims/
│       │   │   ├── Index.tsx
│       │   │   ├── Create.tsx
│       │   │   └── Show.tsx
│       │   └── Providers/
│       │       ├── Index.tsx
│       │       ├── Create.tsx
│       │       └── Edit.tsx
│       └── Reports/
│           ├── Revenue.tsx
│           ├── Outstanding.tsx
│           ├── PaymentMethods.tsx
│           └── InsuranceClaims.tsx
├── Components/
│   └── billing/
│       ├── BillStatusBadge.tsx
│       ├── PaymentMethodIcon.tsx
│       ├── CurrencyDisplay.tsx
│       ├── InvoiceTemplate.tsx
│       ├── PaymentDialog.tsx
│       ├── RefundDialog.tsx
│       ├── BillFilters.tsx
│       ├── AddItemDialog.tsx
│       └── InsuranceClaimDialog.tsx
├── Hooks/
│   └── billing/
│       ├── useBillCalculations.ts
│       ├── usePaymentProcessing.ts
│       └── useInsuranceClaims.ts
└── Types/
    └── billing.ts
```

---

## Type Definitions

**File:** `resources/js/types/billing.ts`

```typescript
// Enums
export type BillStatus = 'active' | 'cancelled' | 'voided';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'insurance' | 'bank_transfer' | 'mobile_money' | 'check';
export type ItemType = 'appointment' | 'lab_test' | 'pharmacy' | 'department_service' | 'manual';
export type ClaimStatus = 'draft' | 'pending' | 'submitted' | 'under_review' | 'approved' | 'partial_approved' | 'rejected' | 'appealed';
export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed';

// Patient
export interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    father_name?: string;
    last_name?: string;
    full_name: string;
    phone?: string;
    email?: string;
    address?: Record<string, string>;
}

// Doctor
export interface Doctor {
    id: number;
    doctor_id: string;
    full_name: string;
    specialization?: string;
    fees?: number;
}

// Bill Item
export interface BillItem {
    id: number;
    bill_id: number;
    item_type: ItemType;
    source_type?: string;
    source_id?: number;
    item_description: string;
    category?: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    discount_percentage: number;
    total_price: number;
    created_at: string;
    updated_at: string;
    
    // Relationships
    source?: Appointment | LabTestRequest | Sale | DepartmentService;
}

// Payment
export interface Payment {
    id: number;
    bill_id: number;
    payment_method: PaymentMethod;
    amount: number;
    payment_date: string;
    transaction_id?: string;
    reference_number?: string;
    card_last_four?: string;
    card_type?: string;
    bank_name?: string;
    check_number?: string;
    amount_tendered?: number;
    change_due?: number;
    insurance_claim_id?: number;
    received_by: number;
    notes?: string;
    status: 'completed' | 'pending' | 'failed' | 'refunded';
    created_at: string;
    updated_at: string;
    
    // Relationships
    receivedBy?: User;
    insuranceClaim?: InsuranceClaim;
}

// Insurance Provider
export interface InsuranceProvider {
    id: number;
    name: string;
    code: string;
    description?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: Record<string, string>;
    coverage_types?: string[];
    max_coverage_amount?: number;
    is_active: boolean;
}

// Patient Insurance
export interface PatientInsurance {
    id: number;
    patient_id: number;
    insurance_provider_id: number;
    policy_number: string;
    policy_holder_name: string;
    relationship_to_patient: string;
    coverage_start_date: string;
    coverage_end_date?: string;
    co_pay_amount: number;
    co_pay_percentage: number;
    deductible_amount: number;
    deductible_met: number;
    annual_max_coverage?: number;
    annual_used_amount: number;
    is_primary: boolean;
    priority_order: number;
    is_active: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
    
    // Relationships
    patient: Patient;
    insuranceProvider: InsuranceProvider;
}

// Insurance Claim
export interface InsuranceClaim {
    id: number;
    bill_id: number;
    patient_insurance_id: number;
    claim_number: string;
    claim_amount: number;
    approved_amount?: number;
    deductible_amount: number;
    co_pay_amount: number;
    status: ClaimStatus;
    submission_date?: string;
    response_date?: string;
    approval_date?: string;
    rejection_reason?: string;
    rejection_codes?: string[];
    documents?: string[];
    notes?: string;
    internal_notes?: string;
    submitted_by?: number;
    processed_by?: number;
    created_at: string;
    updated_at: string;
    
    // Relationships
    bill: Bill;
    patientInsurance: PatientInsurance;
    submittedBy?: User;
    processedBy?: User;
}

// Bill Refund
export interface BillRefund {
    id: number;
    bill_id: number;
    payment_id?: number;
    bill_item_id?: number;
    refund_amount: number;
    refund_type: 'full' | 'partial' | 'item';
    refund_reason: string;
    refund_date: string;
    refund_method: PaymentMethod;
    reference_number?: string;
    status: RefundStatus;
    requested_by: number;
    approved_by?: number;
    approved_at?: string;
    rejection_reason?: string;
    processed_by?: number;
    processed_at?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    
    // Relationships
    bill: Bill;
    payment?: Payment;
    billItem?: BillItem;
    requestedBy: User;
    approvedBy?: User;
    processedBy?: User;
}

// Bill Status History
export interface BillStatusHistory {
    id: number;
    bill_id: number;
    status_from?: string;
    status_to: string;
    field_name: string;
    changed_by: number;
    reason?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
    
    // Relationships
    changedBy: User;
}

// Main Bill Interface
export interface Bill {
    id: number;
    bill_number: string;
    invoice_number?: string;
    patient_id: number;
    doctor_id?: number;
    created_by: number;
    bill_date: string;
    due_date?: string;
    sub_total: number;
    discount: number;
    total_discount: number;
    tax: number;
    total_tax: number;
    total_amount: number;
    amount_paid: number;
    amount_due: number;
    balance_due: number;
    payment_status: PaymentStatus;
    status: BillStatus;
    notes?: string;
    billing_address?: Record<string, string>;
    last_payment_date?: string;
    reminder_sent_count: number;
    reminder_last_sent?: string;
    voided_at?: string;
    voided_by?: number;
    void_reason?: string;
    primary_insurance_id?: number;
    insurance_claim_amount: number;
    insurance_approved_amount?: number;
    patient_responsibility: number;
    created_at: string;
    updated_at: string;
    
    // Relationships
    patient: Patient;
    doctor?: Doctor;
    createdBy: User;
    items: BillItem[];
    payments: Payment[];
    insuranceClaims: InsuranceClaim[];
    refunds: BillRefund[];
    statusHistory: BillStatusHistory[];
    primaryInsurance?: PatientInsurance;
    voidedBy?: User;
}

// Form Data Types
export interface BillFormData {
    patient_id: string;
    doctor_id?: string;
    bill_date: string;
    due_date?: string;
    notes?: string;
    billing_address?: Record<string, string>;
    items: BillItemFormData[];
}

export interface BillItemFormData {
    id?: number;
    item_type: ItemType;
    source_type?: string;
    source_id?: number;
    item_description: string;
    category?: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    discount_percentage: number;
}

export interface PaymentFormData {
    payment_method: PaymentMethod;
    amount: number;
    payment_date: string;
    transaction_id?: string;
    reference_number?: string;
    card_last_four?: string;
    card_type?: string;
    bank_name?: string;
    check_number?: string;
    amount_tendered?: number;
    notes?: string;
}

export interface InsuranceClaimFormData {
    patient_insurance_id: number;
    claim_amount: number;
    notes?: string;
    documents?: File[];
}

// Filter Types
export interface BillFilters {
    search?: string;
    status?: PaymentStatus;
    date_from?: string;
    date_to?: string;
    patient_id?: number;
    doctor_id?: number;
    min_amount?: number;
    max_amount?: number;
    payment_method?: PaymentMethod;
}

// Report Types
export interface RevenueReportData {
    period: string;
    total_revenue: number;
    total_discounts: number;
    total_tax: number;
    net_revenue: number;
    payment_breakdown: Record<PaymentMethod, number>;
}

export interface OutstandingReportData {
    patient: Patient;
    bill_id: number;
    bill_number: string;
    bill_date: string;
    due_date: string;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
    days_overdue: number;
}

// API Response Types
export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export type BillsResponse = PaginatedResponse<Bill>;
export type PaymentsResponse = PaginatedResponse<Payment>;
export type InsuranceClaimsResponse = PaginatedResponse<InsuranceClaim>;
```

---

## Custom Hooks

### 1. useBillCalculations

**File:** `resources/js/hooks/billing/useBillCalculations.ts`

```typescript
import { useMemo, useCallback } from 'react';
import { BillItemFormData, Payment } from '@/types/billing';

interface UseBillCalculationsProps {
    items: BillItemFormData[];
    payments?: Payment[];
    taxRate?: number;
}

interface CalculatedTotals {
    subtotal: number;
    totalDiscount: number;
    taxAmount: number;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
}

export function useBillCalculations({
    items,
    payments = [],
    taxRate = 0,
}: UseBillCalculationsProps) {
    const calculateItemTotal = useCallback((item: BillItemFormData): number => {
        const basePrice = item.quantity * item.unit_price;
        const discountAmount = item.discount_amount || 
            (basePrice * (item.discount_percentage || 0) / 100);
        return basePrice - discountAmount;
    }, []);

    const totals = useMemo<CalculatedTotals>(() => {
        const subtotal = items.reduce((sum, item) => {
            return sum + (item.quantity * item.unit_price);
        }, 0);

        const totalDiscount = items.reduce((sum, item) => {
            const itemDiscount = item.discount_amount || 
                (item.quantity * item.unit_price * (item.discount_percentage || 0) / 100);
            return sum + itemDiscount;
        }, 0);

        const taxableAmount = subtotal - totalDiscount;
        const taxAmount = taxableAmount * (taxRate / 100);
        const totalAmount = taxableAmount + taxAmount;

        const amountPaid = payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);

        const balanceDue = Math.max(0, totalAmount - amountPaid);

        return {
            subtotal,
            totalDiscount,
            taxAmount,
            totalAmount,
            amountPaid,
            balanceDue,
        };
    }, [items, payments, taxRate, calculateItemTotal]);

    const calculateChange = useCallback((amountTendered: number): number => {
        return Math.max(0, amountTendered - totals.balanceDue);
    }, [totals.balanceDue]);

    return {
        ...totals,
        calculateItemTotal,
        calculateChange,
    };
}
```

### 2. usePaymentProcessing

**File:** `resources/js/hooks/billing/usePaymentProcessing.ts`

```typescript
import { useState, useCallback } from 'react';
import { useForm } from '@inertiajs/react';
import { PaymentFormData, PaymentMethod, Bill } from '@/types/billing';

interface UsePaymentProcessingProps {
    bill: Bill;
    onSuccess?: () => void;
}

export function usePaymentProcessing({ bill, onSuccess }: UsePaymentProcessingProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data, setData, post, reset } = useForm<PaymentFormData>({
        payment_method: 'cash',
        amount: bill.balance_due,
        payment_date: new Date().toISOString().split('T')[0],
        transaction_id: '',
        reference_number: '',
        card_last_four: '',
        card_type: '',
        bank_name: '',
        check_number: '',
        amount_tendered: undefined,
        notes: '',
    });

    const updatePaymentMethod = useCallback((method: PaymentMethod) => {
        setData('payment_method', method);
        
        // Reset method-specific fields
        if (method !== 'cash') {
            setData('amount_tendered', undefined);
        }
        if (method !== 'card') {
            setData('card_last_four', '');
            setData('card_type', '');
        }
        if (method !== 'bank_transfer') {
            setData('bank_name', '');
        }
        if (method !== 'check') {
            setData('check_number', '');
        }
    }, [setData]);

    const calculateChange = useCallback((): number => {
        if (data.payment_method !== 'cash' || !data.amount_tendered) {
            return 0;
        }
        return Math.max(0, data.amount_tendered - data.amount);
    }, [data.payment_method, data.amount_tendered, data.amount]);

    const processPayment = useCallback(async () => {
        setIsProcessing(true);
        setError(null);

        try {
            await post(`/billing/${bill.id}/payments`, {
                onSuccess: () => {
                    reset();
                    onSuccess?.();
                },
                onError: (errors) => {
                    setError(errors.message || 'Payment processing failed');
                },
            });
        } finally {
            setIsProcessing(false);
        }
    }, [bill.id, data, post, reset, onSuccess]);

    const isValid = useCallback((): boolean => {
        if (data.amount <= 0) return false;
        if (data.amount > bill.balance_due) return false;

        // Method-specific validation
        switch (data.payment_method) {
            case 'card':
                return !!data.transaction_id;
            case 'check':
                return !!data.check_number;
            case 'bank_transfer':
                return !!data.reference_number;
            case 'cash':
                return !data.amount_tendered || data.amount_tendered >= data.amount;
            default:
                return true;
        }
    }, [data, bill.balance_due]);

    return {
        data,
        setData,
        isProcessing,
        error,
        updatePaymentMethod,
        calculateChange,
        processPayment,
        isValid: isValid(),
    };
}
```

---

## UI Components

### 1. BillStatusBadge

**File:** `resources/js/components/billing/BillStatusBadge.tsx`

```typescript
import { Badge } from '@/components/ui/badge';
import { PaymentStatus, BillStatus } from '@/types/billing';
import { cn } from '@/lib/utils';

interface BillStatusBadgeProps {
    status: PaymentStatus | BillStatus;
    type?: 'payment' | 'bill';
    className?: string;
}

const paymentStatusConfig: Record<PaymentStatus, { label: string; variant: string }> = {
    pending: { label: 'Pending', variant: 'warning' },
    partial: { label: 'Partial', variant: 'info' },
    paid: { label: 'Paid', variant: 'success' },
    overdue: { label: 'Overdue', variant: 'destructive' },
    cancelled: { label: 'Cancelled', variant: 'secondary' },
};

const billStatusConfig: Record<BillStatus, { label: string; variant: string }> = {
    active: { label: 'Active', variant: 'default' },
    cancelled: { label: 'Cancelled', variant: 'secondary' },
    voided: { label: 'Voided', variant: 'destructive' },
};

export function BillStatusBadge({ status, type = 'payment', className }: BillStatusBadgeProps) {
    const config = type === 'payment' 
        ? paymentStatusConfig[status as PaymentStatus]
        : billStatusConfig[status as BillStatus];

    return (
        <Badge 
            variant={config.variant as never}
            className={cn(className)}
        >
            {config.label}
        </Badge>
    );
}
```

### 2. CurrencyDisplay

**File:** `resources/js/components/billing/CurrencyDisplay.tsx`

```typescript
import { cn } from '@/lib/utils';

interface CurrencyDisplayProps {
    amount: number;
    currency?: string;
    symbol?: string;
    className?: string;
    showSign?: boolean;
}

export function CurrencyDisplay({
    amount,
    currency = 'USD',
    symbol = '$',
    className,
    showSign = false,
}: CurrencyDisplayProps) {
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        signDisplay: showSign ? 'auto' : 'never',
    }).format(amount);

    return (
        <span className={cn('tabular-nums', className)}>
            {formatted}
        </span>
    );
}
```

### 3. PaymentMethodIcon

**File:** `resources/js/components/billing/PaymentMethodIcon.tsx`

```typescript
import { 
    Banknote, 
    CreditCard, 
    Shield, 
    Building2, 
    Smartphone,
    FileText,
    LucideIcon 
} from 'lucide-react';
import { PaymentMethod } from '@/types/billing';
import { cn } from '@/lib/utils';

interface PaymentMethodIconProps {
    method: PaymentMethod;
    className?: string;
    size?: number;
}

const iconMap: Record<PaymentMethod, LucideIcon> = {
    cash: Banknote,
    card: CreditCard,
    insurance: Shield,
    bank_transfer: Building2,
    mobile_money: Smartphone,
    check: FileText,
};

const labelMap: Record<PaymentMethod, string> = {
    cash: 'Cash',
    card: 'Card',
    insurance: 'Insurance',
    bank_transfer: 'Bank Transfer',
    mobile_money: 'Mobile Money',
    check: 'Check',
};

export function PaymentMethodIcon({ method, className, size = 16 }: PaymentMethodIconProps) {
    const Icon = iconMap[method];
    
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Icon size={size} />
            <span className="text-sm">{labelMap[method]}</span>
        </div>
    );
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
    return labelMap[method];
}
```

### 4. BillSummary

**File:** `resources/js/Pages/Billing/Components/BillSummary.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { BillStatusBadge } from '@/components/billing/BillStatusBadge';
import { Separator } from '@/components/ui/separator';
import { CalculatedTotals } from '@/hooks/billing/useBillCalculations';
import { PaymentStatus } from '@/types/billing';

interface BillSummaryProps {
    totals: CalculatedTotals;
    paymentStatus: PaymentStatus;
    className?: string;
}

export function BillSummary({ totals, paymentStatus, className }: BillSummaryProps) {
    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Bill Summary</CardTitle>
                    <BillStatusBadge status={paymentStatus} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <CurrencyDisplay amount={totals.subtotal} />
                    </div>
                    
                    {totals.totalDiscount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Discount</span>
                            <span className="text-green-600">
                                -<CurrencyDisplay amount={totals.totalDiscount} />
                            </span>
                        </div>
                    )}
                    
                    {totals.taxAmount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax</span>
                            <CurrencyDisplay amount={totals.taxAmount} />
                        </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <CurrencyDisplay amount={totals.totalAmount} className="text-lg" />
                    </div>
                    
                    {totals.amountPaid > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Amount Paid</span>
                            <span className="text-green-600">
                                <CurrencyDisplay amount={totals.amountPaid} />
                            </span>
                        </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold text-lg">
                        <span>Balance Due</span>
                        <CurrencyDisplay 
                            amount={totals.balanceDue} 
                            className={totals.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
```

---

## Page Components

### 1. Bill Index Page

**File:** `resources/js/Pages/Billing/Index.tsx`

Key features:
- Data table with sorting and filtering
- Search by patient name, bill number
- Filter by status, date range, amount
- Bulk actions (export, print)
- Quick view modal
- Pagination

### 2. Bill Create Page

**File:** `resources/js/Pages/Billing/Create.tsx`

Key features:
- Patient search/selection
- Doctor selection
- Bill item manager with multiple sources
- Real-time total calculation
- Payment recording
- Insurance selection
- Save as draft or finalize

### 3. Bill Show Page

**File:** `resources/js/Pages/Billing/Show.tsx`

Key features:
- Bill header with actions
- Patient information card
- Bill items table
- Payments history
- Insurance claims section
- Activity log/timeline
- Print invoice button

---

## Services

### 1. BillingService

**File:** `resources/js/services/billing.ts`

```typescript
import axios from 'axios';
import { 
    Bill, 
    BillFormData, 
    PaymentFormData, 
    InsuranceClaimFormData,
    BillsResponse,
    BillFilters 
} from '@/types/billing';

export const BillingService = {
    // Bills
    getBills: (filters?: BillFilters, page = 1) => 
        axios.get<BillsResponse>('/api/billing', { params: { ...filters, page } }),
    
    getBill: (id: number) => 
        axios.get<Bill>(`/api/billing/${id}`),
    
    createBill: (data: BillFormData) => 
        axios.post<Bill>('/api/billing', data),
    
    updateBill: (id: number, data: Partial<BillFormData>) => 
        axios.put<Bill>(`/api/billing/${id}`, data),
    
    deleteBill: (id: number) => 
        axios.delete(`/api/billing/${id}`),
    
    voidBill: (id: number, reason: string) => 
        axios.post(`/api/billing/${id}/void`, { reason }),
    
    generateInvoice: (id: number) => 
        axios.get(`/api/billing/${id}/invoice`, { responseType: 'blob' }),
    
    // Payments
    recordPayment: (billId: number, data: PaymentFormData) => 
        axios.post(`/api/billing/${billId}/payments`, data),
    
    // Insurance Claims
    submitClaim: (billId: number, data: InsuranceClaimFormData) => 
        axios.post(`/api/billing/${billId}/claims`, data),
    
    // Reports
    getRevenueReport: (startDate: string, endDate: string) => 
        axios.get('/api/reports/billing/revenue', { params: { start_date: startDate, end_date: endDate } }),
    
    getOutstandingReport: () => 
        axios.get('/api/reports/billing/outstanding'),
};
```

---

## Implementation Checklist

### Components
- [ ] BillStatusBadge
- [ ] CurrencyDisplay
- [ ] PaymentMethodIcon
- [ ] BillSummary
- [ ] BillItemManager
- [ ] PaymentSection
- [ ] InsuranceSection
- [ ] BillFilters
- [ ] AddItemDialog
- [ ] PaymentDialog
- [ ] RefundDialog
- [ ] InsuranceClaimDialog
- [ ] InvoiceTemplate

### Hooks
- [ ] useBillCalculations
- [ ] usePaymentProcessing
- [ ] useInsuranceClaims

### Pages
- [ ] Billing/Index
- [ ] Billing/Create
- [ ] Billing/Edit
- [ ] Billing/Show
- [ ] Billing/Invoice
- [ ] Billing/Payments/Index
- [ ] Billing/Payments/Create
- [ ] Billing/Insurance/Claims/Index
- [ ] Billing/Insurance/Claims/Create
- [ ] Billing/Insurance/Claims/Show
- [ ] Billing/Insurance/Providers/Index
- [ ] Billing/Insurance/Providers/Create
- [ ] Billing/Insurance/Providers/Edit
- [ ] Billing/Reports/Revenue
- [ ] Billing/Reports/Outstanding
- [ ] Billing/Reports/PaymentMethods
- [ ] Billing/Reports/InsuranceClaims

### Types
- [ ] billing.ts (all type definitions)

### Services
- [ ] billing.ts (API service)

---

*Document Version: 1.0*
*Last Updated: 2026-02-01*
