import { Router } from 'express';
import prisma from '../config/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

const router = Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, teamId, faceDescriptor } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Get or create default team
    let defaultTeam = await prisma.team.findFirst();
    
    if (!defaultTeam) {
      // Create a default team if none exists
      console.log('No teams found, creating default team...');
      defaultTeam = await prisma.team.create({
        data: {
          name: 'Default Team',
          managerId: 'temp-manager-id',
        },
      });
      console.log('Default team created:', defaultTeam.id);
    }

    // Validate teamId if provided
    let finalTeamId = defaultTeam.id;
    if (teamId) {
      const teamExists = await prisma.team.findUnique({
        where: { id: teamId },
      });
      if (teamExists) {
        finalTeamId = teamId;
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'EMPLOYEE',
        teamId: finalTeamId,
        faceDescriptor: faceDescriptor ? JSON.stringify(faceDescriptor) : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        teamId: true,
      },
    });

    // Create default leave balance
    await prisma.leaveBalance.create({
      data: {
        userId: user.id,
      },
    });

    res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        teamId: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
    });

    // Return user data without password
    const { password: _, ...userData } = user;

    res.json({
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get face descriptor for login
router.post('/get-face-descriptor', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        faceDescriptor: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.faceDescriptor) {
      return res.status(404).json({ error: 'No face data found for this user' });
    }

    res.json({
      faceDescriptor: JSON.parse(user.faceDescriptor as string),
    });
  } catch (error) {
    console.error('Get face descriptor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Face login endpoint
router.post('/face-login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        teamId: true,
        faceDescriptor: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.faceDescriptor) {
      return res.status(401).json({ error: 'Face authentication not set up' });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
    });

    // Return user data without face descriptor
    const { faceDescriptor: _, ...userData } = user;

    res.json({
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Face login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint (placeholder - token invalidation would require Redis blacklist)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
