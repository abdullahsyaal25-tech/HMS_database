// New interfaces for structured data
export interface ReferenceRange {
    min?: number;
    max?: number;
    unit?: string;
    values?: string[];
}

export interface TestParameter {
    name: string;
    unit: string;
    description?: string;
}

export interface ReferenceRanges {
    [key: string]: ReferenceRange;
}

export interface TestParameters {
    [key: string]: TestParameter;
}

export interface LabTest {
    id: number;
    test_id: string;
    test_code: string;
    name: string;
    category: LabCategory;
    description: string | null;
    procedure: string | null;
    sample_type: string | null;
    cost: number;
    turnaround_time: number;
    unit: string | null;
    normal_values: string | null;
    reference_ranges: ReferenceRanges | null;
    parameters: TestParameters | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface LabTestResult {
    id: number;
    result_id: string;
    lab_test_id: number;
    patient_id: number;
    performed_at: string;
    results: string;
    status: string;
    notes: string;
    abnormal_flags: string;
    created_at: string;
    updated_at: string;
    patient?: Patient;
    labTest?: LabTest;
}

export interface LabTestRequest {
    id: number;
    request_id: string;
    patient_id: number;
    doctor_id: number;
    department_id: number | null;
    test_name: string;
    test_type: LabTestRequestType;
    status: LabTestRequestStatus;
    scheduled_at: string;
    completed_at: string | null;
    notes: string | null;
    clinical_indications: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    patient?: Patient;
    doctor?: Doctor;
    department?: Department;
    createdBy?: User;
    results?: LabTestResult[];
}

export type LabTestRequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type LabTestRequestType = 'routine' | 'urgent' | 'stat';

export interface LabTestRequestFormData {
    patient_id: string;
    doctor_id: string;
    department_id: string;
    test_name: string;
    test_type: LabTestRequestType;
    scheduled_at: string;
    notes: string;
    clinical_indications: string;
    status?: LabTestRequestStatus;
}

// Forward declarations - these types are defined in other files and re-exported via index.ts
type Patient = import('./patient').Patient;
type Doctor = import('./doctor').Doctor;
type User = import('./index.d').User;
type Department = import('./department').Department;

export interface LabTestFormData {
    name: string;
    description: string | null;
    procedure: string | null;
    cost: number;
    turnaround_time: number;
    unit: string | null;
    normal_values: string | null;
    status: string;
}

export interface LabTestResultFormData {
    lab_test_id: string;
    patient_id: string;
    performed_at: string;
    results: string;
    status: string;
    notes: string;
    abnormal_flags: string;
}

export interface LabTestSearchFilters {
    query?: string;
    status?: string;
    category?: string;
}

export interface LabTestResultSearchFilters {
    query?: string;
    status?: string;
    patient_id?: string;
    lab_test_id?: string;
}

export interface LabTestRequestFilters {
    query?: string;
    status?: LabTestRequestStatus | '';
    patient_id?: string;
    doctor_id?: string;
    test_type?: LabTestRequestType | '';
    date_from?: string;
    date_to?: string;
}

export interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    path: string;
    per_page: number;
    to: number;
    total: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    links: Record<string, unknown>;
    meta: PaginationMeta;
}

// Laboratory Dashboard Types
export interface LaboratoryDashboardStats {
    totalTests: number;
    activeTests: number;
    pendingRequests: number;
    inProgressRequests: number;
    completedRequests: number;
    totalResults: number;
    abnormalResults: number;
    criticalResults: number;
    verifiedResults: number;
    statRequests: number;
}

export interface LaboratoryActivity {
    id: number;
    type: 'request' | 'result' | 'test';
    action: string;
    description: string;
    timestamp: string;
    user?: {
        id: number;
        name: string;
    };
    link?: string;
}

export interface LaboratoryQuickAction {
    id: string;
    label: string;
    description: string;
    href: string;
    icon: string;
    color: string;
    permission?: string;
}

// Result Parameter Types
export interface ResultParameter {
    parameter_id: string;
    name: string;
    value: string | number;
    unit: string;
    referenceMin: number;
    referenceMax: number;
    status: 'normal' | 'abnormal' | 'critical';
    notes?: string;
}

// Extended Lab Test Result with full relations
export interface LabTestResultWithRelations extends LabTestResult {
    patient: Patient;
    labTest: LabTest;
    performedBy?: User;
    verifiedBy?: User;
    relatedResults?: LabTestResult[];
    previousResult?: {
        performed_at: string;
        results: ResultParameter[];
    };
}

// Extended Lab Test Request with full relations
export interface LabTestRequestWithRelations extends LabTestRequest {
    patient: Patient;
    doctor: Doctor;
    createdBy: User;
    results: LabTestResult[];
}

// Laboratory Category Types - 10 categories for comprehensive lab test support
export type LabCategory = 
  | 'Hematology' 
  | 'Biochemistry' 
  | 'Serology' 
  | 'Coagulation' 
  | 'Microbiology' 
  | 'Molecular' 
  | 'Urine' 
  | 'Stool' 
  | 'Semen' 
  | 'Special';

export interface LabCategoryConfig {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
}

// Print Configuration
export interface LabPrintConfig {
    showHeader: boolean;
    showFooter: boolean;
    showSignature: boolean;
    showLogo: boolean;
    headerText: string;
    footerText: string;
}

// Accessibility Types
export interface LabAccessibilityConfig {
    announceStatusChanges: boolean;
    highContrastMode: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
}
