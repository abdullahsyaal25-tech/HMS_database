import { ref, computed } from 'vue'
import { useApi } from './useApi'

export interface Notification {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  data: any
  priority: 'low' | 'normal' | 'high' | 'urgent'
  read_at: string | null
  created_at: string
  updated_at: string
}

export function useNotifications() {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const { get, put, delete: deleteRequest } = useApi()

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read_at).length
  })

  const fetchNotifications = async (page: number = 1) => {
    loading.value = true
    try {
      const response = await get(`/api/notifications?page=${page}`)
      notifications.value = response.data.data || response.data
      return response
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await put(`/api/notifications/${notificationId}/read`, {})
      
      // Update local state
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        notifications.value[index].read_at = new Date().toISOString()
      }
      
      return response
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await put('/api/notifications/mark-all-read', {})
      
      // Update local state
      notifications.value.forEach(notification => {
        notification.read_at = new Date().toISOString()
      })
      
      return response
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }

  const removeNotification = async (notificationId: number) => {
    try {
      const response = await deleteRequest(`/api/notifications/${notificationId}`)
      
      // Update local state
      notifications.value = notifications.value.filter(n => n.id !== notificationId)
      
      return response
    } catch (error) {
      console.error('Failed to remove notification:', error)
      throw error
    }
  }

  const getUnreadNotifications = () => {
    return notifications.value.filter(n => !n.read_at)
  }

  const getNotificationsByType = (type: string) => {
    return notifications.value.filter(n => n.type === type)
  }

  const getNotificationsByPriority = (priority: string) => {
    return notifications.value.filter(n => n.priority === priority)
  }

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    getUnreadNotifications,
    getNotificationsByType,
    getNotificationsByPriority
  }
}