'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { io, Socket } from 'socket.io-client'

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const { user, isLoaded } = useUser()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current)
      keepAliveRef.current = null
    }
  }, [])

  const createConnection = useCallback(() => {
    if (!isLoaded || !user || isConnectingRef.current) return

    isConnectingRef.current = true
    setConnectionError(null)

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin

    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      forceNew: true,
      autoConnect: true,
      auth: {
        userId: user.id,
        userName: user.username || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        userImage: user.imageUrl || null,
        timestamp: Date.now().toString()
      }
    })

    socketInstance.on('connect', () => {
      setIsConnected(true)
      setConnectionError(null)
      isConnectingRef.current = false

      socketInstance.emit('authenticate', {
        userId: user.id,
        userName: user.username || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        userImage: user.imageUrl || null,
        timestamp: Date.now()
      })
    })

    socketInstance.on('connect_error', (error) => {
      setIsConnected(false)
      setConnectionError(`Connection failed: ${error.message}`)
      isConnectingRef.current = false
    })

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false)
      isConnectingRef.current = false
      
      if (reason !== 'io client disconnect') {
        setConnectionError(`Disconnected: ${reason}`)
      }
    })

    keepAliveRef.current = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('ping', { timestamp: Date.now() })
      }
    }, 30000)

    setSocket(socketInstance)
    return socketInstance

  }, [user, isLoaded])

  const disconnectSocket = useCallback(() => {
    cleanup()
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
    }
    setSocket(null)
    setIsConnected(false)
    setConnectionError(null)
    isConnectingRef.current = false
  }, [socket, cleanup])

  useEffect(() => {
    if (!isLoaded) return

    if (!user) {
      cleanup()
      setSocket(null)
      setIsConnected(false)
      setConnectionError(null)
      return
    }

    const socketInstance = createConnection()

    return () => {
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
  }, [isLoaded, user, createConnection, cleanup])

  return {
    socket,
    isConnected,
    connectionError,
    isLoading: !isLoaded,
    disconnectSocket
  }
}
