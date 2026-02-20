'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { LeaveBalance, LeaveRequest } from '@/types/leave';
import apiClient from '@/lib/api-client';

interface DashboardStats {
  totalRequests: number;
  approved: number;
  pending: number;
  rejected: number;
  totalBalance: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalBalance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch balance
      const balanceRes = await apiClient.get<LeaveBalance>('/api/leave/balance');
      setBalance(balanceRes.data);

      // Fetch leave history
      const historyRes = await apiClient.get<LeaveRequest[]>('/api/leave/history');
      setRequests(historyRes.data);

      // Calculate stats
      const totalBalance =
        balanceRes.data.annual +
        balanceRes.data.sick +
        balanceRes.data.maternity +
        balanceRes.data.paternity +
        balanceRes.data.bereavement;

      const approved = historyRes.data.filter((r) => r.status === 'APPROVED').length;
      const pending = historyRes.data.filter((r) => r.status === 'PENDING').length;
      const rejected = historyRes.data.filter((r) => r.status === 'REJECTED').length;

      setStats({
        totalRequests: historyRes.data.length,
        approved,
        pending,
        rejected,
        totalBalance,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'CANCELLED':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/70">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-gray-400">Welcome to your leave management dashboard</p>
          </div>
          <button
            onClick={() => router.push('/leave/request')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
          >
            + Request Leave
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📊</div>
              <div className="text-xs text-gray-400">All Time</div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{stats.totalRequests}</div>
            <div className="text-sm text-gray-400">Total Requests</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">✅</div>
              <div className="text-xs text-gray-400">Approved</div>
            </div>
            <div className="text-2xl font-bold text-green-400 mb-1">{stats.approved}</div>
            <div className="text-sm text-gray-400">Approved Leaves</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">⏳</div>
              <div className="text-xs text-gray-400">Pending</div>
            </div>
            <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.pending}</div>
            <div className="text-sm text-gray-400">Awaiting Review</div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📅</div>
              <div className="text-xs text-gray-400">Balance</div>
            </div>
            <div className="text-2xl font-bold text-purple-400 mb-1">{stats.totalBalance}</div>
            <div className="text-sm text-gray-400">Days Remaining</div>
          </div>
        </div>

        {/* Leave Balance Breakdown */}
        {balance && (
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Leave Balance</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">{balance.annual}</div>
                <div className="text-xs text-gray-400 mt-1">Annual</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-green-400">{balance.sick}</div>
                <div className="text-xs text-gray-400 mt-1">Sick</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-pink-400">{balance.maternity}</div>
                <div className="text-xs text-gray-400 mt-1">Maternity</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-purple-400">{balance.paternity}</div>
                <div className="text-xs text-gray-400 mt-1">Paternity</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">{balance.bereavement}</div>
                <div className="text-xs text-gray-400 mt-1">Bereavement</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Leave Requests</h2>
            <button
              onClick={() => router.push('/leave/history')}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              View All →
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-400 mb-4">No leave requests yet</p>
              <button
                onClick={() => router.push('/leave/request')}
                className="px-6 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                Create Your First Request
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {request.leaveType.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">
                      {request.leaveType.charAt(0) + request.leaveType.slice(1).toLowerCase()} Leave
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)} ({request.workingDays} days)
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">{request.reason}</div>
                  </div>
                  <div
                    className={`px-3 py-1 text-xs rounded-full border ${getStatusColor(
                      request.status
                    )} flex-shrink-0`}
                  >
                    {request.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
