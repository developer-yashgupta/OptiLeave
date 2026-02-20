'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { LeaveRequest, LeaveStatus, LeaveType } from '@/types/leave';
import apiClient from '@/lib/api-client';

export default function LeaveHistoryPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchLeaveHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, typeFilter, requests]);

  const fetchLeaveHistory = async () => {
    try {
      const response = await apiClient.get<LeaveRequest[]>('/api/leave/history');
      setRequests(response.data);
      setFilteredRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch leave history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((r) => r.leaveType === typeFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleCancelRequest = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/leave/${id}`);
      // Refresh the list
      fetchLeaveHistory();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel request');
    }
  };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'CANCELLED':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const canCancel = (request: LeaveRequest) => {
    return (
      (request.status === 'PENDING' || request.status === 'APPROVED') &&
      new Date(request.startDate) > new Date()
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Loading leave history...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Leave History</h1>
            <p className="text-gray-400">View and manage your leave requests</p>
          </div>
          <button
            onClick={() => router.push('/leave/request')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
          >
            + New Request
          </button>
        </div>

        {/* Filters */}
        <div className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL" className="bg-gray-800">All Statuses</option>
                <option value="PENDING" className="bg-gray-800">Pending</option>
                <option value="APPROVED" className="bg-gray-800">Approved</option>
                <option value="REJECTED" className="bg-gray-800">Rejected</option>
                <option value="CANCELLED" className="bg-gray-800">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Leave Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL" className="bg-gray-800">All Types</option>
                <option value="ANNUAL" className="bg-gray-800">Annual</option>
                <option value="SICK" className="bg-gray-800">Sick</option>
                <option value="MATERNITY" className="bg-gray-800">Maternity</option>
                <option value="PATERNITY" className="bg-gray-800">Paternity</option>
                <option value="BEREAVEMENT" className="bg-gray-800">Bereavement</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-400">
          Showing {filteredRequests.length} of {requests.length} requests
        </div>

        {/* Leave requests list */}
        {filteredRequests.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400 mb-4">No leave requests found</p>
            <button
              onClick={() => router.push('/leave/request')}
              className="px-6 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              Create Your First Request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="glass-card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-xl">
                      {request.leaveType.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {request.leaveType.charAt(0) + request.leaveType.slice(1).toLowerCase()} Leave
                      </h3>
                      <p className="text-sm text-gray-400">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(request.status)}`}>
                    {request.status}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Duration</p>
                    <p className="text-sm text-white font-medium">{request.workingDays} working days</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Submitted</p>
                    <p className="text-sm text-white font-medium">{formatDate(request.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Last Updated</p>
                    <p className="text-sm text-white font-medium">{formatDate(request.updatedAt)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-400 mb-1">Reason</p>
                  <p className="text-sm text-white">{request.reason}</p>
                </div>

                {request.rejectionReason && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-xs text-red-400 mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-300">{request.rejectionReason}</p>
                  </div>
                )}

                {canCancel(request) && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleCancelRequest(request.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                    >
                      Cancel Request
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
