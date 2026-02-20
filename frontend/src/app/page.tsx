'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect authenticated users to dashboard
        router.push('/dashboard')
      } else {
        // Redirect unauthenticated users to login
        router.push('/login')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-card p-8">
          <div className="animate-pulse text-center">
            <div className="text-2xl mb-2">🔄</div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
