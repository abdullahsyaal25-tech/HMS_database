export interface Medicine {
    id: number;
    medicine_id: string;
    name: string;
    description: string | null;
    category_id: number;
    manufacturer: string | null;
    batch_number: string | null;
    expiry_date: string | null;
    stock_quantity: number;
    reorder_level: number;
    sale_price: number;
    sale_price?: number;
    cost_price?: number;
    barcode?: string | null;
    dosage_form: string | null;
    strength: string | null;
    created_at: string;
    updated_at: string;
    category?: {
        id: number;
        name: string;
        description: string | null;
    };
}

export interface MedicineCategory {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface MedicineFormData {
    name: string;
    description: string;
    category_id: string;
    manufacturer: string;
    batch_number: string;
    expiry_date: string;
    stock_quantity: string;
    reorder_level: string;
    sale_price: string;
    dosage_form: string;
    strength: string;
}