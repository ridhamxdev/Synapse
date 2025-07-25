'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function useUserSync() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (isLoaded && user) {

      fetch('/api/users/sync', {
        method: 'POST'
      }).catch(console.error)
    }
  }, [user, isLoaded])  

  return { user, isLoaded }
}
