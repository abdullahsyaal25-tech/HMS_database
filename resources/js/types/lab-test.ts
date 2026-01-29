export interface LabTest {
    id: number;
    test_id: string;
    name: string;
    description: string | null;
    department_id: number;
    normal_range: string | null;
    unit: string | null;
    cost: number;
    created_at: string;
    updated_at: string;
    department?: {
        id: number;
        name: string;
        description: string | null;
    };
}

export interface LabTestResult {
    id: number;
    lab_test_id: number;
    patient_id: number;
    doctor_id: number;
    result_value: string;
    reference_range: string | null;
    status: 'pending' | 'completed' | 'cancelled';
    notes: string | null;
    created_at: string;
    updated_at: string;
    lab_test?: {
        id: number;
        test_id: string;
        name: string;
        description: string | null;
        normal_range: string | null;
        unit: string | null;
        cost: number;
    };
    patient?: {
        id: number;
        patient_id: string;
        first_name: string;
        father_name: string | null;
        phone: string | null;
    };
    doctor?: {
        id: number;
        doctor_id: string;
        full_name: string;
        specialization: string;
    };
}

export interface LabTestFormData {
    name: string;
    description: string;
    department_id: string;
    normal_range: string;
    unit: string;
    cost: string;
}

export interface LabTestResultFormData {
    lab_test_id: string;
    patient_id: string;
    doctor_id: string;
    result_value: string;
    reference_range: string;
    status: string;
    notes: string;
}