export interface Appointment {
    id: number;
    appointment_id: string;
    patient_id: number;
    doctor_id: number;
    department_id: number;
    appointment_date: string;
    status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
    reason: string | null;
    notes: string | null;
    fee: number;
    created_at: string;
    updated_at: string;
    patient?: {
        id: number;
        patient_id: string;
        first_name: string;
        phone: string | null;
        user?: {
            id: number;
            name: string;
            username: string;
        };
    };
    doctor?: {
        id: number;
        doctor_id: string;
        full_name: string;
        specialization: string;
        department_id: number;
        fees: number;
        department?: {
            id: number;
            name: string;
        };
    };
    department?: {
        id: number;
        name: string;
        description: string | null;
    };
}

export interface AppointmentFormData {
    patient_id: string;
    doctor_id: string;
    department_id: string;
    appointment_date: string;
    status: string;
    reason: string;
    notes: string;
    fee: string;
}