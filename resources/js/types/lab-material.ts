// Laboratory Materials Types

export interface LabMaterial {
    id: number;
    material_id: string;
    material_code: string;
    name: string;
    quantity: number;
    lab_test_id: number | null;
    description: string | null;
    status: LabMaterialStatus;
    reorder_level: number;
    unit: string;
    cost_per_unit: number;
    supplier: string | null;
    expiry_date: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    labTest?: LabTest;
    createdBy?: User;
}

export type LabMaterialStatus = 'active' | 'low_stock' | 'out_of_stock';

export interface LabMaterialFormData {
    name: string;
    quantity: number;
    lab_test_id: string;
    description: string;
    status: LabMaterialStatus;
    reorder_level: number;
    unit: string;
    cost_per_unit: number;
    supplier: string;
    expiry_date: string;
}

export interface LabMaterialSearchFilters {
    query?: string;
    status?: LabMaterialStatus | '';
    lab_test_id?: string;
    stock_status?: 'low_stock' | 'out_of_stock' | '';
}

export interface LabMaterialStatistics {
    totalMaterials: number;
    lowStockCount: number;
    outOfStockCount: number;
    activeCount: number;
}

export interface LabMaterialStockUpdate {
    material_id: number;
    quantity: number;
    action: 'add' | 'remove';
    reason?: string;
}

export interface LabMaterialBulkUpdate {
    material_ids: number[];
    status: LabMaterialStatus;
}

// Forward declarations - these types are defined in other files and re-exported via index.ts
type LabTest = import('./lab-test').LabTest;
type User = import('./index.d').User;

// Export for use in other files
export type {
    LabMaterial,
    LabMaterialFormData,
    LabMaterialSearchFilters,
    LabMaterialStatistics,
    LabMaterialStockUpdate,
    LabMaterialBulkUpdate,
};
