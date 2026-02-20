'use client';

import React, { useState, useEffect } from 'react';
import { LeaveType, LeaveBalance, LeaveRequestFormData } from '@/types/leave';

interface LeaveRequestFormProps {
  onSubmit: (data: LeaveRequestFormData) => Promise<void>;
  balance?: LeaveBalance;
  isLoading?: boolean;
}

const leaveTypeLabels: Record<LeaveType, string> = {
  ANNUAL: 'Annual Leave',
  SICK: 'Sick Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  BEREAVEMENT: 'Bereavement Leave',
};

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({
  onSubmit,
  balance,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<LeaveRequestFormData>({
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LeaveRequestFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LeaveRequestFormData, string>> = {};

    if (!formData.leaveType) {
      newErrors.leaveType = 'Leave type is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        leaveType: 'ANNUAL',
        startDate: '',
        endDate: '',
        reason: '',
      });
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof LeaveRequestFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const getBalanceForType = (type: LeaveType): number => {
    if (!balance) return 0;
    return balance[type.toLowerCase() as keyof LeaveBalance];
  };

  const currentBalance = getBalanceForType(formData.leaveType);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Leave Type Selector */}
      <div>
        <label htmlFor="leaveType" className="block text-sm font-medium text-white mb-2">
          Leave Type
        </label>
        <select
          id="leaveType"
          name="leaveType"
          value={formData.leaveType}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          required
        >
          {Object.entries(leaveTypeLabels).map(([value, label]) => (
            <option key={value} value={value} className="bg-gray-800">
              {label}
            </option>
          ))}
        </select>
        {errors.leaveType && (
          <p className="mt-1 text-sm text-red-400">{errors.leaveType}</p>
        )}
      </div>

      {/* Leave Balance Display */}
      {balance && (
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <p className="text-sm text-white/70">Available Balance</p>
          <p className="text-2xl font-bold text-white">{currentBalance} days</p>
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-white mb-2">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            required
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-400">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-white mb-2">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            required
          />
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-400">{errors.endDate}</p>
          )}
        </div>
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-white mb-2">
          Reason
        </label>
        <textarea
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          disabled={isLoading}
          rows={4}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
          placeholder="Please provide a reason for your leave request..."
          required
        />
        {errors.reason && (
          <p className="mt-1 text-sm text-red-400">{errors.reason}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? 'Submitting...' : 'Submit Leave Request'}
      </button>
    </form>
  );
};
