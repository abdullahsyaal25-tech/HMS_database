export interface Bill {
    id: number;
    bill_id: string;
    patient_id: number;
    appointment_id: number | null;
    total_amount: number;
    status: 'pending' | 'paid' | 'partial' | 'cancelled';
    payment_method: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    patient?: {
        id: number;
        patient_id: string;
        first_name: string;
        father_name: string | null;
        phone: string | null;
    };
    appointment?: {
        id: number;
        appointment_id: string;
        appointment_date: string;
        doctor?: {
            id: number;
            full_name: string;
            specialization: string;
        };
    };
}

export interface BillItem {
    id: number;
    bill_id: number;
    item_type: string;
    source_type: string | null;
    source_id: number | null;
    category: string | null;
    item_description: string;
    quantity: number;
    unit_price: string;
    discount_amount: string;
    discount_percentage: string;
    total_price: string;
    created_at: string;
    updated_at: string;
    source?: {
        id: number;
        type: string;
        description: string | null;
    };
    net_price: string;
    has_discount: boolean;
    discounted_amount: string;
    bill?: {
        id: number;
        bill_id: string;
        patient_id: number;
        total_amount: number;
    };
}

export interface BillItemsResponse {
    success: boolean;
    data: {
        bill_id: number;
        bill_number: string;
        items: BillItem[];
        total_items: number;
        total_amount: number;
    };
    message?: string;
}

export interface BillFormData {
    patient_id: string;
    appointment_id: string;
    status: string;
    payment_method: string;
    notes: string;
}

export interface BillItemFormData {
    description: string;
    quantity: string;
    unit_price: string;
}