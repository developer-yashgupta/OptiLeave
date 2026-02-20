'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api-client'

interface AnalyticsData {
  totalRequests: number
  approvedRequests: number
  rejectedRequests: number
  pendingRequests: number
  averageProcessingTime: number
  leaveTypeBreakdown: { [key: string]: number }
  monthlyTrends: { month: string; count: number }[]
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    if (user && user.role !== 'MANAGER' && user.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [user, router])

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      // Fetch all leave requests to calculate analytics
      const response = await apiClient.get('/api/leave/pending')
      const allRequests = response.data

      // Calculate analytics (simplified version)
      const analyticsData: AnalyticsData = {
        totalRequests: allRequests.length,
        approvedRequests: 0,
        rejectedRequests: 0,
        pendingRequests: allRequests.length,
        averageProcessingTime: 0,
        leaveTypeBreakdown: {},
        monthlyTrends: [],
      }

      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7000ff] mx-auto"></div>
          <p className="mt-4 text-black/60">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-black/60 hover:text-black transition-colors mb-4"
        >
          <span className="text-xl">←</span>
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-3xl font-bold gradient-text mb-2">Analytics Dashboard</h1>
        <p className="text-black/60">Team leave insights and trends</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">📊</span>
            <span className="text-xs text-black/40">Total</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{analytics?.totalRequests || 0}</h3>
          <p className="text-sm text-black/60">Total Requests</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">✅</span>
            <span className="text-xs text-black/40">Approved</span>
          </div>
          <h3 className="text-3xl font-bold mb-1 text-[#00ff9d]">{analytics?.approvedRequests || 0}</h3>
          <p className="text-sm text-black/60">Approved</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">⏳</span>
            <span className="text-xs text-black/40">Pending</span>
          </div>
          <h3 className="text-3xl font-bold mb-1 text-[#ffbd00]">{analytics?.pendingRequests || 0}</h3>
          <p className="text-sm text-black/60">Pending Review</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">❌</span>
            <span className="text-xs text-black/40">Rejected</span>
          </div>
          <h3 className="text-3xl font-bold mb-1 text-[#ff0055]">{analytics?.rejectedRequests || 0}</h3>
          <p className="text-sm text-black/60">Rejected</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Leave Type Breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span>📈</span>
            Leave Type Distribution
          </h3>
          <div className="space-y-4">
            {['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT'].map((type) => {
              const count = analytics?.leaveTypeBreakdown[type] || 0
              const percentage = analytics?.totalRequests ? (count / analytics.totalRequests) * 100 : 0
              
              return (
                <div key={type}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{type}</span>
                    <span className="text-sm text-black/60">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-black/5 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#00d4ff] to-[#7000ff] h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Team Availability */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span>👥</span>
            Team Availability
          </h3>
          <div className="text-center py-8">
            <div className="relative inline-block">
              <svg className="w-40 h-40" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#EBE8E7"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset="62.8"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#7000ff" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold gradient-text">75%</div>
                  <div className="text-xs text-black/60">Available</div>
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm text-black/60">
              15 out of 20 team members available
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span>📅</span>
          Monthly Leave Trends
        </h3>
        <div className="h-64 flex items-end justify-between gap-2">
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => {
            const height = Math.random() * 80 + 20
            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-[#00d4ff] to-[#7000ff] rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                  style={{ height: `${height}%` }}
                  title={`${month}: ${Math.floor(height / 10)} requests`}
                ></div>
                <span className="text-xs text-black/60">{month}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">⚡</span>
            <h4 className="font-semibold">Peak Season</h4>
          </div>
          <p className="text-sm text-black/60">
            December has the highest leave requests with 45% increase
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">⏱️</span>
            <h4 className="font-semibold">Avg. Processing</h4>
          </div>
          <p className="text-sm text-black/60">
            Leave requests are processed in average 2.5 days
          </p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🎯</span>
            <h4 className="font-semibold">Approval Rate</h4>
          </div>
          <p className="text-sm text-black/60">
            85% of leave requests are approved on first submission
          </p>
        </div>
      </div>
    </div>
  )
}
