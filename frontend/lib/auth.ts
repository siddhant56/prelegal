'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  id: number
  email: string
}

export function useRequireAuth(): { user: AuthUser | null; loading: boolean } {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('unauthenticated')
        return res.json()
      })
      .then((data: AuthUser) => {
        setUser(data)
        setLoading(false)
      })
      .catch(() => {
        router.replace('/')
      })
  }, [router])

  return { user, loading }
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
}
