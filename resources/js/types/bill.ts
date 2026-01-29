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
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at: string;
    updated_at: string;
    bill?: {
        id: number;
        bill_id: string;
        patient_id: number;
        total_amount: number;
    };
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