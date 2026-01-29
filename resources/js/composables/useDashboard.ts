import { ref } from 'vue'
import { useApi } from './useApi'

export interface DashboardMetrics {
  totalPatients: number
  newPatients: number
  patientGrowth: number
  totalAppointments: number
  appointmentGrowth: number
  completionRate: number
  totalRevenue: number
  revenueGrowth: number
  avgRevenuePerAppointment: number
  avgWaitTime: number
  waitTimeImprovement: number
}

export interface Activity {
  id: number
  type: string
  description: string
  created_at: string
}

export function useDashboard() {
  const { get } = useApi()

  const getDashboardMetrics = async (period: string = 'month'): Promise<DashboardMetrics> => {
    try {
      const response = await get(`/api/admin/dashboard/metrics?period=${period}`)
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error)
      throw error
    }
  }

  const getRecentActivity = async (): Promise<Activity[]> => {
    try {
      const response = await get('/api/admin/dashboard/recent-activity')
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to fetch recent activity:', error)
      throw error
    }
  }

  const getDepartmentAnalytics = async (): Promise<any> => {
    try {
      const response = await get('/api/admin/dashboard/department-analytics')
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to fetch department analytics:', error)
      throw error
    }
  }

  const getDoctorWorkload = async (): Promise<any> => {
    try {
      const response = await get('/api/admin/dashboard/doctor-workload')
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to fetch doctor workload:', error)
      throw error
    }
  }

  const getPatientDemographics = async (): Promise<any> => {
    try {
      const response = await get('/api/admin/dashboard/patient-demographics')
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to fetch patient demographics:', error)
      throw error
    }
  }

  const getAppointmentsTrend = async (period: string = 'month'): Promise<any> => {
    try {
      const response = await get(`/api/admin/dashboard/appointments-trend?period=${period}`)
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to fetch appointments trend:', error)
      throw error
    }
  }

  return {
    getDashboardMetrics,
    getRecentActivity,
    getDepartmentAnalytics,
    getDoctorWorkload,
    getPatientDemographics,
    getAppointmentsTrend
  }
}