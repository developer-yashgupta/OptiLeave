import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env'
import prisma from './config/database'
import redis from './config/redis'
import authRoutes from './routes/auth.routes'
import leaveRoutes from './routes/leave.routes'
import notificationRoutes from './routes/notification.routes'

const app = express()

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/leave', leaveRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Check Redis connection
    await redis.ping()

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
      },
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'OptiLeave API',
    version: '1.0.0',
    status: 'running',
  })
})

// Start server
const PORT = env.PORT

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${env.NODE_ENV}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await prisma.$disconnect()
  await redis.quit()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await prisma.$disconnect()
  await redis.quit()
  process.exit(0)
})
