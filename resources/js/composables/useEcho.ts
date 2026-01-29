import { ref, onMounted, onUnmounted } from 'vue'

export function useEcho() {
  const echo = ref<any>(null)
  const isConnected = ref(false)

  const connect = () => {
    if (typeof window !== 'undefined' && window.Echo) {
      echo.value = window.Echo
      isConnected.value = true
      console.log('Echo connected successfully')
    } else {
      console.warn('Echo is not available. Make sure Laravel Echo is properly configured.')
    }
  }

  const disconnect = () => {
    if (echo.value && typeof echo.value.disconnect === 'function') {
      echo.value.disconnect()
      isConnected.value = false
      console.log('Echo disconnected')
    }
  }

  const onNotification = (callback: (notification: any) => void) => {
    if (!echo.value || !isConnected.value) {
      console.warn('Echo is not connected. Cannot listen for notifications.')
      return
    }

    // Listen for broadcasted notifications
    echo.value.private(`user.${window.Laravel.userId}`)
      .notification((notification: any) => {
        console.log('Received notification:', notification)
        callback(notification)
      })
  }

  const onChannel = (channel: string, event: string, callback: (data: any) => void) => {
    if (!echo.value || !isConnected.value) {
      console.warn('Echo is not connected. Cannot listen for channel events.')
      return
    }

    echo.value.channel(channel)
      .listen(event, (data: any) => {
        console.log(`Received ${event} on ${channel}:`, data)
        callback(data)
      })
  }

  const joinPresenceChannel = (channel: string, callbacks: {
    here?: (users: any[]) => void
    joining?: (user: any) => void
    leaving?: (user: any) => void
    error?: (error: any) => void
  }) => {
    if (!echo.value || !isConnected.value) {
      console.warn('Echo is not connected. Cannot join presence channel.')
      return
    }

    const presenceChannel = echo.value.join(channel)

    if (callbacks.here) {
      presenceChannel.here((users: any[]) => {
        console.log('Users in channel:', users)
        callbacks.here!(users)
      })
    }

    if (callbacks.joining) {
      presenceChannel.joining((user: any) => {
        console.log('User joined:', user)
        callbacks.joining!(user)
      })
    }

    if (callbacks.leaving) {
      presenceChannel.leaving((user: any) => {
        console.log('User left:', user)
        callbacks.leaving!(user)
      })
    }

    if (callbacks.error) {
      presenceChannel.error((error: any) => {
        console.error('Presence channel error:', error)
        callbacks.error!(error)
      })
    }
  }

  const leaveChannel = (channel: string) => {
    if (!echo.value || !isConnected.value) {
      console.warn('Echo is not connected. Cannot leave channel.')
      return
    }

    echo.value.leave(channel)
    console.log(`Left channel: ${channel}`)
  }

  const getPresenceUsers = (channel: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      if (!echo.value || !isConnected.value) {
        reject(new Error('Echo is not connected'))
        return
      }

      echo.value.join(channel)
        .here((users: any[]) => {
          resolve(users)
        })
        .error((error: any) => {
          reject(error)
        })
    })
  }

  // Auto-connect on mount
  onMounted(() => {
    connect()
  })

  // Auto-disconnect on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    echo,
    isConnected,
    connect,
    disconnect,
    onNotification,
    onChannel,
    joinPresenceChannel,
    leaveChannel,
    getPresenceUsers
  }
}