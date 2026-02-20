import dotenv from 'dotenv'

dotenv.config()

interface EnvConfig {
  DATABASE_URL: string
  REDIS_URL: string
  JWT_SECRET: string
  JWT_EXPIRATION: string
  SMTP_HOST: string
  SMTP_PORT: number
  SMTP_USER: string
  SMTP_PASS: string
  NODE_ENV: string
  PORT: number
}

function validateEnv(): EnvConfig {
  const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '))
    process.exit(1)
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET!.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters long')
    process.exit(1)
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    REDIS_URL: process.env.REDIS_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION || '8h',
    SMTP_HOST: process.env.SMTP_HOST!,
    SMTP_PORT: parseInt(process.env.SMTP_PORT!, 10),
    SMTP_USER: process.env.SMTP_USER!,
    SMTP_PASS: process.env.SMTP_PASS!,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '4000', 10),
  }
}

export const env = validateEnv()
