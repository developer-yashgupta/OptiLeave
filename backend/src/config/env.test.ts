describe('Environment Configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should validate required environment variables', () => {
    // Set all required env vars
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.REDIS_URL = 'redis://localhost:6379'
    process.env.JWT_SECRET = 'test_secret_key_minimum_32_characters_long'
    process.env.SMTP_HOST = 'smtp.test.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'test@test.com'
    process.env.SMTP_PASS = 'testpass'

    const { env } = require('./env')

    expect(env.DATABASE_URL).toBe('postgresql://test:test@localhost:5432/test')
    expect(env.REDIS_URL).toBe('redis://localhost:6379')
    expect(env.JWT_SECRET).toBe('test_secret_key_minimum_32_characters_long')
    expect(env.JWT_EXPIRATION).toBe('8h')
  })

  it('should exit if required environment variables are missing', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

    delete process.env.DATABASE_URL

    expect(() => {
      jest.isolateModules(() => {
        require('./env')
      })
    }).toThrow('process.exit called')

    expect(mockConsoleError).toHaveBeenCalledWith(
      'Missing required environment variables:',
      expect.stringContaining('DATABASE_URL')
    )

    mockExit.mockRestore()
    mockConsoleError.mockRestore()
  })

  it('should exit if JWT_SECRET is too short', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called')
    })
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.REDIS_URL = 'redis://localhost:6379'
    process.env.JWT_SECRET = 'short' // Too short
    process.env.SMTP_HOST = 'smtp.test.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'test@test.com'
    process.env.SMTP_PASS = 'testpass'

    expect(() => {
      jest.isolateModules(() => {
        require('./env')
      })
    }).toThrow('process.exit called')

    expect(mockConsoleError).toHaveBeenCalledWith(
      'JWT_SECRET must be at least 32 characters long'
    )

    mockExit.mockRestore()
    mockConsoleError.mockRestore()
  })
})
