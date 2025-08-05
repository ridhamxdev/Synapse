'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'

interface DbUser {
  id: string
  clerkId: string
  name: string
  email: string
  imageUrl?: string
  phone?: string
  bio?: string
  isOnline: boolean
  lastSeen: string
}

export function useUserSync() {
  const { user, isLoaded } = useUser()
  const [dbUser, setDbUser] = useState<DbUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const syncUser = useCallback(async () => {
    if (!isLoaded || !user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.user) {
        setDbUser(data.user)
      }
    } catch (error) {
      console.error('User sync error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, isLoaded])

  const refreshUser = useCallback(async () => {
    if (!isLoaded || !user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/users/profile')
      const data = await response.json()
      if (data.user) {
        setDbUser(data.user)
      }
    } catch (error) {
      console.error('User refresh error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, isLoaded])

  useEffect(() => {
    syncUser()
  }, [syncUser])

  return { user, isLoaded, dbUser, isLoading, refreshUser, syncUser }
}
