import { Router } from 'express';
import prisma from '../config/database';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get leave balance
router.get('/balance', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    let balance = await prisma.leaveBalance.findUnique({
      where: { userId },
    });

    // Create default balance if doesn't exist
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: { userId },
      });
    }

    res.json(balance);
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit leave request
router.post('/request', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { leaveType, startDate, endDate, reason } = req.body;

    // Validation
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Calculate working days (simplified - excludes weekends)
    let workingDays = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    // Check balance
    const balance = await prisma.leaveBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      return res.status(400).json({ error: 'Leave balance not found' });
    }

    const leaveTypeKey = leaveType.toLowerCase() as keyof typeof balance;
    const availableDays = balance[leaveTypeKey] as number;

    if (workingDays > availableDays) {
      return res.status(400).json({ error: 'Insufficient leave balance' });
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        leaveType,
        startDate: start,
        endDate: end,
        reason,
        workingDays,
        status: 'PENDING',
      },
    });

    res.status(201).json(leaveRequest);
  } catch (error) {
    console.error('Submit leave request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leave history
router.get('/history', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { status, leaveType } = req.query;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (leaveType) {
      where.leaveType = leaveType;
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(requests);
  } catch (error) {
    console.error('Get leave history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending requests (manager only)
router.get('/pending', requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const teamId = req.user!.teamId;

    const requests = await prisma.leaveRequest.findMany({
      where: {
        status: 'PENDING',
        user: {
          teamId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(requests);
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve leave request (manager only)
router.put('/:id/approve', requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const approverId = req.user!.userId;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'PENDING') {
      return res.status(400).json({ error: 'Leave request is not pending' });
    }

    // Update request and deduct balance in a transaction
    const [updatedRequest] = await prisma.$transaction([
      prisma.leaveRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: approverId,
        },
      }),
      prisma.leaveBalance.update({
        where: { userId: leaveRequest.userId },
        data: {
          [leaveRequest.leaveType.toLowerCase()]: {
            decrement: leaveRequest.workingDays,
          },
        },
      }),
    ]);

    res.json(updatedRequest);
  } catch (error) {
    console.error('Approve leave request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject leave request (manager only)
router.put('/:id/reject', requireRole('MANAGER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const approverId = req.user!.userId;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'PENDING') {
      return res.status(400).json({ error: 'Leave request is not pending' });
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: approverId,
        rejectionReason: reason,
      },
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error('Reject leave request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel leave request
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Check ownership
    if (leaveRequest.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if already started
    if (new Date(leaveRequest.startDate) <= new Date()) {
      return res.status(400).json({ error: 'Cannot cancel leave that has already started' });
    }

    // If approved, restore balance
    if (leaveRequest.status === 'APPROVED') {
      await prisma.$transaction([
        prisma.leaveRequest.update({
          where: { id },
          data: { status: 'CANCELLED' },
        }),
        prisma.leaveBalance.update({
          where: { userId },
          data: {
            [leaveRequest.leaveType.toLowerCase()]: {
              increment: leaveRequest.workingDays,
            },
          },
        }),
      ]);
    } else {
      await prisma.leaveRequest.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    }

    res.json({ message: 'Leave request cancelled successfully' });
  } catch (error) {
    console.error('Cancel leave request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
