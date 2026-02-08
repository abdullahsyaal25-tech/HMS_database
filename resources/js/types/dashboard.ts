export interface DashboardStats {
  total_patients: number;
  total_doctors: number;
  appointments_today: number;
  revenue_today: number;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  time: string;
  type: 'patient' | 'appointment' | 'bill' | 'doctor';
}

export interface MonthlyData {
  month: string;
  visits: number;
}

export interface DepartmentData {
  name: string;
  value: number;
}
