'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/users/sync', {
        method: 'POST'
      })
      .then(response => response.json())
      .then(data => {
        if (data.user) {
          setDbUser(data.user)
        }
      })
      .catch(console.error)
    }
  }, [user, isLoaded])  

  return { user, isLoaded, dbUser }
}
