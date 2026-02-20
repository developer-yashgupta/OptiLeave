'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/layout/AnimatedBackground'
import FaceAuth from '@/components/FaceAuth'
import apiClient, { tokenStorage } from '@/lib/api-client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFaceAuth, setShowFaceAuth] = useState(false)
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null)
  const { login, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      router.push('/dashboard')
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleFaceLogin = async () => {
    if (!email) {
      setError('Please enter your email first')
      return
    }

    setError('')
    setLoading(true)

    try {
      // Fetch user's face descriptor
      const response = await apiClient.post('/api/auth/get-face-descriptor', { email })
      
      if (!response.data.faceDescriptor) {
        setError('No face data found for this account. Please use password login.')
        setLoading(false)
        return
      }

      // Convert array back to Float32Array
      const descriptor = new Float32Array(response.data.faceDescriptor)
      setFaceDescriptor(descriptor)
      setShowFaceAuth(true)
      setLoading(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load face data')
      setLoading(false)
    }
  }

  const handleFaceAuthSuccess = async () => {
    setShowFaceAuth(false)
    setLoading(true)

    try {
      // Login with face authentication
      const response = await apiClient.post('/api/auth/face-login', { email })
      
      if (response.data.token && response.data.user) {
        // Store token using tokenStorage
        tokenStorage.setToken(response.data.token)
        
        // Force page reload to reinitialize auth state from token
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError('Face authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-card p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                OptiLeave
              </h1>
              <p className="text-sm text-gray-400">Smart Leave Management</p>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black/80 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black/80 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#7000ff] text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/95 text-black/60">Or continue with</span>
              </div>
            </div>

            {/* Face Login Button */}
            <button
              type="button"
              onClick={handleFaceLogin}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-white border-2 border-[#7000ff] text-[#7000ff] font-semibold hover:bg-[#7000ff] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="text-xl">👤</span>
              Face ID Login
            </button>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-black/60">
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="text-[#7000ff] hover:text-[#00d4ff] font-semibold transition-colors"
                >
                  Register
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {showFaceAuth && faceDescriptor && (
        <FaceAuth
          mode="login"
          onSuccess={handleFaceAuthSuccess}
          onCancel={() => setShowFaceAuth(false)}
          existingDescriptor={faceDescriptor}
        />
      )}
    </>
  )
}
