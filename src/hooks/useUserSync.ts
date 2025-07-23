'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function useUserSync() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (isLoaded && user) {
      // Sync user with database when they login
      fetch('/api/users/sync', {
        method: 'POST'
      }).catch(console.error)
    }
  }, [user, isLoaded])

  return { user, isLoaded }
}
