'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { io, Socket } from 'socket.io-client'
import { toast } from 'sonner'

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const { user } = useUser()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current)
    }
  }, [])

  const createConnection = useCallback(() => {
    if (!user || isConnectingRef.current) return

    isConnectingRef.current = true
    setConnectionError(null)
    console.log('🔄 Creating new socket connection...')

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin

    if (!socketUrl || typeof socketUrl !== 'string') {
      console.error('❌ Invalid socket URL:', socketUrl)
      setConnectionError('Invalid socket URL configuration')
      isConnectingRef.current = false
      return
    }

    console.log('🌐 Connecting to:', socketUrl)

    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      forceNew: true,
      autoConnect: true,
      auth: {
        userId: user.id || '',
        timestamp: Date.now().toString()
      },
      query: {
        userId: user.id || '',
        timestamp: Date.now().toString()
      },
      upgrade: true,
      rememberUpgrade: false,
      closeOnBeforeunload: true
    })

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id)
      setIsConnected(true)
      setConnectionError(null)
      isConnectingRef.current = false

      const authData = {
        userId: user.id,
        userName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous',
        userImage: user.imageUrl || null,
        timestamp: Date.now()
      }

      if (!authData.userId || typeof authData.userId !== 'string') {
        console.error('❌ Invalid user ID for authentication:', authData.userId)
        setConnectionError('Invalid user authentication data')
        return
      }

      socketInstance.emit('authenticate', authData)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message)
      setIsConnected(false)
      setConnectionError(`Connection failed: ${error.message}`)
      isConnectingRef.current = false
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      setIsConnected(false)
      isConnectingRef.current = false
      if (reason !== 'io client disconnect') {
        setConnectionError(`Disconnected: ${reason}`)
      }
    })

    socketInstance.on('reconnect_failed', () => {
      console.error('🔴 Reconnection failed after all attempts')
      setConnectionError('Failed to reconnect to server')
      isConnectingRef.current = false
    })

    socketInstance.on('auth-error', (error) => {
      console.error('❌ Authentication error:', error)
      setConnectionError(`Auth failed: ${error.message}`)
    })

    keepAliveRef.current = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('ping', { timestamp: Date.now() })
      }
    }, 30000)

    setSocket(socketInstance)
    return socketInstance
  }, [user])

  useEffect(() => {
    if (!user) {
      cleanup()
      setSocket(null)
      setIsConnected(false)
      setConnectionError(null)
      return
    }

    const socketInstance = createConnection()

    return () => {
      console.log('🧹 Cleaning up socket connection')
      cleanup()
      isConnectingRef.current = false
      if (socketInstance) {
        socketInstance.removeAllListeners()
        socketInstance.disconnect()
      }
      setSocket(null)
      setIsConnected(false)
      setConnectionError(null)
    }
  }, [user, createConnection, cleanup])

  return {
    socket,
    isConnected,
    connectionError
  }
}
