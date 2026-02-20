import prisma from '../config/database'
import { LeaveType, LeaveStatus } from '@prisma/client'

export interface LeaveRequestInput {
  userId: string
  leaveType: LeaveType
  startDate: Date
  endDate: Date
  reason: string
}

export class LeaveService {
  async getLeaveBalance(userId: string) {
    let balance = await prisma.leaveBalance.findUnique({
      where: { userId }
    })

    // Create balance if it doesn't exist
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: { userId }
      })
    }

    return balance
  }

  async submitLeaveRequest(input: LeaveRequestInput) {
    // Validate dates
    if (new Date(input.startDate) > new Date(input.endDate)) {
      throw new Error('Start date must be before end date')
    }

    // Calculate working days (simplified - excludes weekends)
    const workingDays = this.calculateWorkingDays(
      new Date(input.startDate),
      new Date(input.endDate)
    )

    // Check balance
    const balance = await this.getLeaveBalance(input.userId)
    const leaveTypeKey = input.leaveType.toLowerCase() as 'annual' | 'sick' | 'maternity' | 'paternity' | 'bereavement'

    if (typeof balance[leaveTypeKey] === 'number' && balance[leaveTypeKey] < workingDays) {
      throw new Error('Insufficient leave balance')
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: input.userId,
        leaveType: input.leaveType,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason,
        workingDays,
        status: LeaveStatus.PENDING
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return leaveRequest
  }

  async getLeaveHistory(userId: string, filters?: {
    startDate?: Date
    endDate?: Date
    status?: LeaveStatus
    leaveType?: LeaveType
  }) {
    const where: any = { userId }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.leaveType) {
      where.leaveType = filters.leaveType
    }

    if (filters?.startDate || filters?.endDate) {
      where.startDate = {}
      if (filters.startDate) {
        where.startDate.gte = filters.startDate
      }
      if (filters.endDate) {
        where.startDate.lte = filters.endDate
      }
    }

    return prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  }

  async approveLeaveRequest(requestId: string, managerId: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      throw new Error('Leave request not found')
    }

    if (request.status !== LeaveStatus.PENDING) {
      throw new Error('Leave request is not pending')
    }

    // Update request status and deduct balance
    const [updatedRequest] = await prisma.$transaction([
      prisma.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: LeaveStatus.APPROVED,
          approvedBy: managerId
        }
      }),
      prisma.leaveBalance.update({
        where: { userId: request.userId },
        data: {
          [request.leaveType.toLowerCase()]: {
            decrement: request.workingDays
          }
        }
      })
    ])

    return updatedRequest
  }

  async rejectLeaveRequest(requestId: string, managerId: string, reason: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      throw new Error('Leave request not found')
    }

    if (request.status !== LeaveStatus.PENDING) {
      throw new Error('Leave request is not pending')
    }

    return prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: LeaveStatus.REJECTED,
        approvedBy: managerId,
        rejectionReason: reason
      }
    })
  }

  async cancelLeaveRequest(requestId: string, userId: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId }
    })

    if (!request) {
      throw new Error('Leave request not found')
    }

    if (request.userId !== userId) {
      throw new Error('Unauthorized')
    }

    // Check if leave has already started
    if (new Date(request.startDate) <= new Date()) {
      throw new Error('Cannot cancel leave that has already started')
    }

    // If approved, restore balance
    if (request.status === LeaveStatus.APPROVED) {
      await prisma.$transaction([
        prisma.leaveRequest.update({
          where: { id: requestId },
          data: { status: LeaveStatus.CANCELLED }
        }),
        prisma.leaveBalance.update({
          where: { userId: request.userId },
          data: {
            [request.leaveType.toLowerCase()]: {
              increment: request.workingDays
            }
          }
        })
      ])
    } else {
      await prisma.leaveRequest.update({
        where: { id: requestId },
        data: { status: LeaveStatus.CANCELLED }
      })
    }

    return { message: 'Leave request cancelled successfully' }
  }

  private calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0
    const current = new Date(startDate)

    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      // Exclude weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }

    return count
  }
}

export default new LeaveService()
