'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AnimatedBackground from '@/components/layout/AnimatedBackground'
import FaceAuth from '@/components/FaceAuth'
import apiClient from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    teamId: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFaceAuth, setShowFaceAuth] = useState(false)
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null)
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    // Show face auth modal
    setShowFaceAuth(true)
  }

  const handleFaceAuthSuccess = async (descriptor: Float32Array) => {
    setFaceDescriptor(descriptor)
    setShowFaceAuth(false)
    setLoading(true)

    try {
      // Convert Float32Array to regular array for JSON
      const faceData = Array.from(descriptor)

      const response = await apiClient.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        teamId: formData.teamId || undefined,
        faceDescriptor: faceData,
      })

      if (response.data) {
        alert('Registration successful! Please login.')
        router.push('/login')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
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
              <h1 className="text-3xl font-bold gradient-text mb-2">
                OptiLeave
              </h1>
              <p className="text-sm text-black/60">Create your account</p>
            </div>

            {/* Registration form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-100 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-black/80 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black/80 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-black/80 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label htmlFor="teamId" className="block text-sm font-medium text-black/80 mb-2">
                  Team (Optional)
                </label>
                <select
                  id="teamId"
                  name="teamId"
                  value={formData.teamId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg"
                >
                  <option value="">Select a team</option>
                  <option value="1">Engineering</option>
                  <option value="2">Marketing</option>
                  <option value="3">Sales</option>
                  <option value="4">HR</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#7000ff] text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registering...' : 'Register with Face ID'}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-black/60">
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-[#7000ff] hover:text-[#00d4ff] font-semibold transition-colors"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {showFaceAuth && (
        <FaceAuth
          mode="register"
          onSuccess={handleFaceAuthSuccess}
          onCancel={() => setShowFaceAuth(false)}
        />
      )}
    </>
  )
}
