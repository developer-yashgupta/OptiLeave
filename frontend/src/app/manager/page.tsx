'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api-client'
import { LeaveRequest } from '@/types/leave'

export default function ManagerPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({})
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)

  useEffect(() => {
    if (user && user.role !== 'MANAGER' && user.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [user, router])

  useEffect(() => {
    fetchPendingRequests()
  }, [])

  const fetchPendingRequests = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/leave/pending')
      setPendingRequests(response.data)
    } catch (error) {
      console.error('Failed to fetch pending requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      setActionLoading(requestId)
      await apiClient.put(`/api/leave/${requestId}/approve`)
      await fetchPendingRequests()
    } catch (error) {
      console.error('Failed to approve request:', error)
      alert('Failed to approve request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (requestId: string) => {
    const reason = rejectionReason[requestId]
    if (!reason || reason.trim() === '') {
      alert('Please provide a rejection reason')
      return
    }

    try {
      setActionLoading(requestId)
      await apiClient.put(`/api/leave/${requestId}/reject`, { reason })
      setShowRejectModal(null)
      setRejectionReason({ ...rejectionReason, [requestId]: '' })
      await fetchPendingRequests()
    } catch (error) {
      console.error('Failed to reject request:', error)
      alert('Failed to reject request')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'ANNUAL': return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'SICK': return 'bg-red-100 text-red-600 border-red-200'
      case 'MATERNITY': return 'bg-pink-100 text-pink-600 border-pink-200'
      case 'PATERNITY': return 'bg-purple-100 text-purple-600 border-purple-200'
      case 'BEREAVEMENT': return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7000ff] mx-auto"></div>
          <p className="mt-4 text-black/60">Loading...</p>
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
        <h1 className="text-3xl font-bold gradient-text mb-2">Manager Dashboard</h1>
        <p className="text-black/60">Review and manage team leave requests</p>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <span className="text-6xl block mb-4">✅</span>
          <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
          <p className="text-black/60">No pending leave requests to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request: any) => (
            <div key={request.id} className="glass-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7000ff] flex items-center justify-center text-white font-semibold">
                      {request.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{request.user?.name || 'Unknown User'}</h3>
                      <p className="text-sm text-black/60">{request.user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-black/60 mb-1">Leave Type</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getLeaveTypeColor(request.leaveType)}`}>
                        {request.leaveType}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-black/60 mb-1">Duration</p>
                      <p className="font-semibold">{request.workingDays} working days</p>
                    </div>
                    <div>
                      <p className="text-xs text-black/60 mb-1">Start Date</p>
                      <p className="font-semibold">{formatDate(request.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-black/60 mb-1">End Date</p>
                      <p className="font-semibold">{formatDate(request.endDate)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-black/60 mb-1">Reason</p>
                    <p className="text-sm bg-white/50 p-3 rounded-lg">{request.reason}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-6">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={actionLoading === request.id}
                    className="px-6 py-2 bg-gradient-to-r from-[#00ff9d] to-[#00d4ff] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === request.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(request.id)}
                    disabled={actionLoading === request.id}
                    className="px-6 py-2 bg-white border-2 border-[#ff0055] text-[#ff0055] rounded-lg font-semibold hover:bg-[#ff0055] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Reject Modal */}
              {showRejectModal === request.id && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="glass-card p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold mb-4">Reject Leave Request</h3>
                    <p className="text-sm text-black/60 mb-4">
                      Please provide a reason for rejecting this leave request
                    </p>
                    <textarea
                      value={rejectionReason[request.id] || ''}
                      onChange={(e) => setRejectionReason({ ...rejectionReason, [request.id]: e.target.value })}
                      placeholder="Enter rejection reason..."
                      className="w-full p-3 border border-black/10 rounded-lg mb-4 min-h-[100px]"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={actionLoading === request.id}
                        className="flex-1 px-4 py-2 bg-[#ff0055] text-white rounded-lg font-semibold hover:bg-[#ff0055]/90 transition-all disabled:opacity-50"
                      >
                        {actionLoading === request.id ? 'Processing...' : 'Confirm Reject'}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(null)}
                        disabled={actionLoading === request.id}
                        className="flex-1 px-4 py-2 bg-white border border-black/10 rounded-lg font-semibold hover:bg-black/5 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
