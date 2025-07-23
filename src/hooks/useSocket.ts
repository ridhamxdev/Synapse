'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { io, Socket } from 'socket.io-client'

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const { user } = useUser()

  useEffect(() => {
    if (!user) return

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      upgrade: true,
    })

    socketInstance.on('connect', () => {
      console.log('Connected to server')
      
      // Authenticate user
      socketInstance.emit('authenticate', {
        userId: user.id,
        userName: user.fullName,
        userImage: user.imageUrl
      })
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server')
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [user])

  return socket
}
