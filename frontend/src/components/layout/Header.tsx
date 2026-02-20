'use client'

import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api-client'
import { Notification } from '@/types/notification'

export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiClient.get('/api/notifications')
        setNotifications(response.data)
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    if (user) {
      fetchNotifications()
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-600 border-red-200'
      case 'MANAGER':
        return 'bg-blue-100 text-blue-600 border-blue-200'
      default:
        return 'bg-green-100 text-green-600 border-green-200'
    }
  }

  return (
    <header className="fixed top-0 right-0 left-[260px] h-20 glass-panel border-b border-black/5 z-40">
      <div className="flex items-center justify-between h-full px-8">
        {/* Page title - can be dynamic based on route */}
        <div>
          <h1 className="text-2xl font-bold gradient-text">Dashboard</h1>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-white/50 rounded-lg transition-all duration-200"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-[#ffbd00] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl shadow-xl border border-black/10 overflow-hidden z-50">
                <div className="p-4 border-b border-black/5">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-black/60 mt-1">{unreadCount} unread</p>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-black/40">
                      <span className="text-3xl block mb-2">🔕</span>
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-black/5 hover:bg-white/50 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-white/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-black leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-xs text-black/50 mt-1">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-3 border-t border-black/5 text-center">
                    <button className="text-xs text-black/60 hover:text-black transition-colors">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User avatar and info */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 glass-panel px-4 py-2 rounded-lg hover:bg-white/50 transition-all cursor-pointer"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7000ff] flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              
              {/* User info */}
              <div className="text-left">
                <div className="text-sm font-semibold text-black">{user?.name || 'User'}</div>
                {user?.role && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                )}
              </div>

              {/* Dropdown arrow */}
              <svg 
                className={`w-4 h-4 text-black/60 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 glass-panel rounded-xl shadow-xl border border-black/10 overflow-hidden z-50">
                <div className="p-4 border-b border-black/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7000ff] flex items-center justify-center text-white font-semibold text-lg">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-black">{user?.name}</p>
                      <p className="text-xs text-black/60">{user?.email}</p>
                    </div>
                  </div>
                  <span className={`inline-block text-xs px-3 py-1 rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                    {user?.role}
                  </span>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      router.push('/profile')
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-white/50 transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg">👤</span>
                    <span className="text-sm font-medium text-black">My Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      router.push('/settings')
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-white/50 transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg">⚙️</span>
                    <span className="text-sm font-medium text-black">Settings</span>
                  </button>

                  <div className="border-t border-black/5 my-2"></div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      logout()
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-[#ff0055]"
                  >
                    <span className="text-lg">🚪</span>
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
