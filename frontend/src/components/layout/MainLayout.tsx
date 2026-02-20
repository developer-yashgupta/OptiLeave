'use client'

import { useAuth } from '@/hooks/useAuth'
import AnimatedBackground from './AnimatedBackground'
import Sidebar from './Sidebar'
import Header from './Header'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth()

  // Don't show layout if not authenticated or still loading
  if (loading || !user) {
    return null
  }

  return (
    <>
      <AnimatedBackground />
      <Sidebar />
      <Header />
      <main className="ml-64 mt-16 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </>
  )
}
