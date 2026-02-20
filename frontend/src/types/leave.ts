export type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'BEREAVEMENT';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveBalance {
  annual: number;
  sick: number;
  maternity: number;
  paternity: number;
  bereavement: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  workingDays: number;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

export interface LeaveRequestFormData {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}
