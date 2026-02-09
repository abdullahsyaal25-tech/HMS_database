/**
 * Dashboard Types
 * Type definitions for the comprehensive dashboard data structure
 */

// ============================================================================
// Summary Types
// ============================================================================
export interface DashboardSummary {
  total_patients: number;
  new_patients: number;
  total_doctors: number;
  total_appointments: number;
  completed_appointments: number;
  total_revenue: number;
  appointment_revenue: number;
  pharmacy_revenue: number;
  pending_bills: number;
  outstanding_amount: number;
}

// ============================================================================
// Patient Types
// ============================================================================
export interface PatientStats {
  total: number;
  new_today: number;
  new_this_period: number;
  gender_distribution: Record<string, number>;
  age_distribution: Record<string, number>;
  blood_group_distribution: Record<string, number>;
}

// ============================================================================
// Appointment Types
// ============================================================================
export interface TodayAppointment {
  id: number;
  patient_name: string;
  doctor_name: string;
  department: string;
  time: string;
  status: string;
}

export interface AppointmentStats {
  total: number;
  by_status: Record<string, number>;
  by_department: Record<string, number>;
  today_schedule: TodayAppointment[];
  upcoming_count: number;
}

// ============================================================================
// Financial Types
// ============================================================================
export interface PaymentMethod {
  amount: number;
  count: number;
}

export interface BillAging {
  current: number;
  '30_60': number;
  '60_90': number;
  '90_plus': number;
}

export interface FinancialStats {
  total_revenue: number;
  appointment_revenue: number;
  pharmacy_revenue: number;
  bill_revenue: number;
  payment_methods: Record<string, PaymentMethod>;
  outstanding_bills: number;
  outstanding_amount: number;
  aging: BillAging;
  avg_bill_amount: number;
}

// ============================================================================
// Pharmacy Types
// ============================================================================
export interface PharmacyStats {
  today_sales: number;
  today_revenue: number;
  period_revenue: number;
  low_stock_count: number;
  expiring_count: number;
  expired_count: number;
  total_medicines: number;
  top_medicines: Record<string, number>;
  pending_prescriptions: number;
}

// ============================================================================
// Laboratory Types
// ============================================================================
export interface PendingTest {
  id: number;
  test_type: string;
  patient_name: string;
  doctor_name: string;
  requested_at: string;
}

export interface LaboratoryStats {
  total_today: number;
  completed_today: number;
  pending_count: number;
  by_status: Record<string, number>;
  pending_tests: PendingTest[];
}

// ============================================================================
// Department Types
// ============================================================================
export interface DepartmentStat {
  id: number;
  name: string;
  doctors_count: number;
  appointments_count: number;
  revenue: number;
}

export interface DepartmentStats {
  total: number;
  departments: DepartmentStat[];
}

// ============================================================================
// Activity Types
// ============================================================================
export interface Activity {
  id: number;
  title: string;
  description: string;
  time: string;
  type: 'patient' | 'appointment' | 'billing' | 'doctor' | 'pharmacy' | 'laboratory' | 'system';
}

// ============================================================================
// Trend Types
// ============================================================================
export interface DailyTrend {
  date: string;
  appointments: number;
  patients: number;
  revenue: number;
}

export interface MonthlyTrend {
  month: string;
  appointments: number;
  patients: number;
  revenue: number;
}

export interface TrendsData {
  daily: DailyTrend[];
  monthly: MonthlyTrend[];
}

// ============================================================================
// Main Dashboard Data Type
// ============================================================================
export interface DashboardData {
  summary: DashboardSummary;
  patients: PatientStats;
  appointments: AppointmentStats;
  financial: FinancialStats;
  pharmacy: PharmacyStats;
  laboratory: LaboratoryStats;
  departments: DepartmentStats;
  recent_activities: Activity[];
  trends: TrendsData;
  period: 'today' | 'week' | 'month' | 'year';
  last_updated: string;
  error?: string;
}

// ============================================================================
// Legacy Types (for backward compatibility)
// ============================================================================
export interface LegacyDashboardProps {
  total_patients?: number;
  total_doctors?: number;
  appointments_today?: number;
  revenue_today?: number;
  recent_activities?: Activity[];
  monthly_data?: { month: string; visits: number }[];
  department_data?: { name: string; value: number }[];
  error?: string;
  flash?: {
    success?: string;
    error?: string;
  };
}
