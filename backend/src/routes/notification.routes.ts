import { Router } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user notifications
router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Get recent leave requests for the user
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId,
        updatedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    // Transform to notifications
    const notifications = leaveRequests.map((request) => {
      let message = '';
      let type = 'info';

      switch (request.status) {
        case 'APPROVED':
          message = `Your ${request.leaveType.toLowerCase()} leave request has been approved`;
          type = 'success';
          break;
        case 'REJECTED':
          message = `Your ${request.leaveType.toLowerCase()} leave request has been rejected`;
          type = 'error';
          break;
        case 'PENDING':
          message = `Your ${request.leaveType.toLowerCase()} leave request is pending approval`;
          type = 'info';
          break;
        case 'CANCELLED':
          message = `Your ${request.leaveType.toLowerCase()} leave request has been cancelled`;
          type = 'warning';
          break;
      }

      return {
        id: request.id,
        message,
        type,
        timestamp: request.updatedAt,
        read: false,
      };
    });

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
