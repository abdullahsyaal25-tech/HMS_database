import { useState, useCallback } from 'react';
import { useApi } from './useApi';

export interface DashboardMetrics {
  totalPatients: number;
  newPatients: number;
  patientGrowth: number;
  totalAppointments: number;
  appointmentGrowth: number;
  completionRate: number;
  totalRevenue: number;
  revenueGrowth: number;
  avgRevenuePerAppointment: number;
  avgWaitTime: number;
  waitTimeImprovement: number;
}

export interface Activity {
  id: number;
  type: string;
  description: string;
  created_at: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export function useDashboard() {
  const { get } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDashboardMetrics = useCallback(async (period: string = 'month'): Promise<DashboardMetrics> => {
    setLoading(true);
    setError(null);
    try {
      const response = await get(`/api/admin/dashboard/metrics?period=${period}`);
      const data = response.data as any;
      return data.data || data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard metrics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [get]);

  const getRecentActivity = useCallback(async (): Promise<Activity[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await get('/api/admin/dashboard/recent-activity');
      const data = response.data as any;
      return data.data || data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recent activity';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [get]);

  const getDepartmentAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get('/api/admin/dashboard/department-analytics');
      const data = response.data as any;
      return data.data || data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch department analytics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [get]);

  const getDoctorWorkload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get('/api/admin/dashboard/doctor-workload');
      const data = response.data as any;
      return data.data || data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch doctor workload';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [get]);

  const getPatientDemographics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get('/api/admin/dashboard/patient-demographics');
      const data = response.data as any;
      return data.data || data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patient demographics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [get]);

  const getAppointmentsTrend = useCallback(async (period: string = 'month') => {
    setLoading(true);
    setError(null);
    try {
      const response = await get(`/api/admin/dashboard/appointments-trend?period=${period}`);
      const data = response.data as any;
      return data.data || data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments trend';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [get]);

  return {
    getDashboardMetrics,
    getRecentActivity,
    getDepartmentAnalytics,
    getDoctorWorkload,
    getPatientDemographics,
    getAppointmentsTrend,
    loading,
    error,
  };
}
