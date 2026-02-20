import prisma from '../config/database'
import { hashPassword, verifyPassword } from '../utils/password'
import { generateToken, JWTPayload } from '../utils/jwt'

export interface AuthResult {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: string
    teamId: string
  }
}

export class AuthService {
  async authenticate(email: string, password: string): Promise<AuthResult> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { team: true }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    // Generate JWT token
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      teamId: user.teamId
    }

    const token = generateToken(payload)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId
      }
    }
  }

  async register(data: {
    email: string
    password: string
    name: string
    role: string
    teamId: string
  }): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role as any,
        teamId: data.teamId
      }
    })

    // Create leave balance
    await prisma.leaveBalance.create({
      data: {
        userId: user.id
      }
    })

    // Generate token
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      teamId: user.teamId
    }

    const token = generateToken(payload)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId
      }
    }
  }
}

export default new AuthService()
