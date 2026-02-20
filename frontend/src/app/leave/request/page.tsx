'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm';
import { LeaveRequestFormData, LeaveBalance } from '@/types/leave';
import apiClient from '@/lib/api-client';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function LeaveRequestPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<LeaveBalance | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch leave balance on mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await apiClient.get<LeaveBalance>('/api/leave/balance');
        setBalance(response.data);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
        setError('Failed to load leave balance');
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, []);

  const handleSubmit = async (data: LeaveRequestFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiClient.post('/api/leave/request', data);
      setSuccess(true);

      // Refresh balance
      const response = await apiClient.get<LeaveBalance>('/api/leave/balance');
      setBalance(response.data);

      // Redirect to history after 2 seconds
      setTimeout(() => {
        router.push('/leave/history');
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error || 'Failed to submit leave request. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Request Leave</h1>
            <p className="text-white/70">
              Submit a new leave request. Your manager will be notified for approval.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-400 font-medium">
                ✓ Leave request submitted successfully!
              </p>
              <p className="text-green-400/70 text-sm mt-1">
                Redirecting to leave history...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 font-medium">✗ {error}</p>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-xl">
            {isLoadingBalance ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : (
              <LeaveRequestForm
                onSubmit={handleSubmit}
                balance={balance}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-white/70 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
