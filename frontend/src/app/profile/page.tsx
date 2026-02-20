'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'
import apiClient from '@/lib/api-client'

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [leaveBalance, setLeaveBalance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaveBalance()
  }, [])

  const fetchLeaveBalance = async () => {
    try {
      const response = await apiClient.get('/api/leave/balance')
      setLeaveBalance(response.data)
    } catch (error) {
      console.error('Failed to fetch leave balance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-600 border-red-200'
      case 'MANAGER':
        return 'bg-blue-100 text-blue-600 border-blue-200'
      default:
        return 'bg-green-100 text-green-600 border-green-200'
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-black/60 hover:text-black transition-colors mb-4"
            >
              <span className="text-xl">←</span>
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-3xl font-bold gradient-text mb-2">My Profile</h1>
            <p className="text-black/60">View and manage your profile information</p>
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7000ff] mx-auto mb-4"></div>
            <p className="text-black/60">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="glass-card p-8">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7000ff] flex items-center justify-center text-white font-bold text-4xl flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-black">{user?.name}</h2>
                    <span className={`text-xs px-3 py-1 rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                      {user?.role}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-black/60">
                      <span className="text-lg">📧</span>
                      <span className="text-sm">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-black/60">
                      <span className="text-lg">🏢</span>
                      <span className="text-sm">Team ID: {user?.teamId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-black/60">
                      <span className="text-lg">🆔</span>
                      <span className="text-sm">User ID: {user?.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Balance */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-black mb-6">Leave Balance</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🏖️</span>
                    <span className="text-xs text-black/40">Annual</span>
                  </div>
                  <h4 className="text-3xl font-bold mb-1">{leaveBalance?.annual || 0}</h4>
                  <p className="text-sm text-black/60">days</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🤒</span>
                    <span className="text-xs text-black/40">Sick</span>
                  </div>
                  <h4 className="text-3xl font-bold mb-1">{leaveBalance?.sick || 0}</h4>
                  <p className="text-sm text-black/60">days</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🤱</span>
                    <span className="text-xs text-black/40">Maternity</span>
                  </div>
                  <h4 className="text-3xl font-bold mb-1">{leaveBalance?.maternity || 0}</h4>
                  <p className="text-sm text-black/60">days</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">👨‍👦</span>
                    <span className="text-xs text-black/40">Paternity</span>
                  </div>
                  <h4 className="text-3xl font-bold mb-1">{leaveBalance?.paternity || 0}</h4>
                  <p className="text-sm text-black/60">days</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">🕊️</span>
                    <span className="text-xs text-black/40">Bereavement</span>
                  </div>
                  <h4 className="text-3xl font-bold mb-1">{leaveBalance?.bereavement || 0}</h4>
                  <p className="text-sm text-black/60">days</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-black mb-4">Quick Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/leave/request')}
                  className="p-4 bg-gradient-to-r from-[#00d4ff] to-[#7000ff] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xl">➕</span>
                  Request Leave
                </button>

                <button
                  onClick={() => router.push('/leave/history')}
                  className="p-4 bg-white border-2 border-[#7000ff] text-[#7000ff] rounded-lg font-semibold hover:bg-[#7000ff] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🕐</span>
                  View History
                </button>

                <button
                  onClick={() => router.push('/calendar')}
                  className="p-4 bg-white border-2 border-[#00d4ff] text-[#00d4ff] rounded-lg font-semibold hover:bg-[#00d4ff] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xl">📅</span>
                  View Calendar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
