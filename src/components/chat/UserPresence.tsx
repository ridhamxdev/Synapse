'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/hooks/useSocket'

interface UserPresenceProps {
  userId: string
  showText?: boolean
  className?: string
}

export function UserPresence({ userId, showText = true, className = '' }: UserPresenceProps) {
  const [userStatus, setUserStatus] = useState<{
    isOnline: boolean
    lastSeen?: string
  }>({ isOnline: false })
  
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    const handlePresenceUpdate = (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      if (data.userId === userId) {
        setUserStatus({
          isOnline: data.isOnline,
          lastSeen: data.lastSeen
        })
      }
    }

    socket.on('user-presence-update', handlePresenceUpdate)
    socket.emit('get-user-status', userId)

    return () => {
      socket.off('user-presence-update', handlePresenceUpdate)
    }
  }, [socket, userId])

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        userStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'
      }`} />
      {showText && (
        <span className="text-xs text-gray-500">
          {userStatus.isOnline 
            ? 'Online' 
            : userStatus.lastSeen 
              ? `Last seen ${formatLastSeen(userStatus.lastSeen)}`
              : 'Offline'
          }
        </span>
      )}
    </div>
  )
}
