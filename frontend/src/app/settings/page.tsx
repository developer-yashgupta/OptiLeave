'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import MainLayout from '@/components/layout/MainLayout'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('general')

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-black/60 hover:text-black transition-colors mb-4"
            >
              <span className="text-xl">←</span>
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-3xl font-bold gradient-text mb-2">Settings</h1>
            <p className="text-black/60">Manage your account preferences</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <div className="glass-card">
          <div className="border-b border-black/5">
            <div className="flex gap-2 p-2">
              <button
                onClick={() => setActiveTab('general')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'general'
                    ? 'bg-gradient-to-r from-[#00d4ff] to-[#7000ff] text-white'
                    : 'text-black/60 hover:bg-white/50'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'notifications'
                    ? 'bg-gradient-to-r from-[#00d4ff] to-[#7000ff] text-white'
                    : 'text-black/60 hover:bg-white/50'
                }`}
              >
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'security'
                    ? 'bg-gradient-to-r from-[#00d4ff] to-[#7000ff] text-white'
                    : 'text-black/60 hover:bg-white/50'
                }`}
              >
                Security
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Profile Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black/80 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.name}
                        className="w-full px-4 py-2 rounded-lg"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black/80 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue={user?.email}
                        className="w-full px-4 py-2 rounded-lg"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black/80 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.role}
                        className="w-full px-4 py-2 rounded-lg"
                        disabled
                      />
                    </div>
                  </div>

                  <p className="text-xs text-black/60 mt-4">
                    Contact your administrator to update profile information
                  </p>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                      <div>
                        <p className="font-medium text-black">Email Notifications</p>
                        <p className="text-sm text-black/60">Receive email updates for leave requests</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00d4ff]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                      <div>
                        <p className="font-medium text-black">Push Notifications</p>
                        <p className="text-sm text-black/60">Receive browser notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00d4ff]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
                      <div>
                        <p className="font-medium text-black">Leave Reminders</p>
                        <p className="text-sm text-black/60">Get reminders about upcoming leaves</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00d4ff]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">Security Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white/50 rounded-lg">
                      <p className="font-medium text-black mb-2">Change Password</p>
                      <p className="text-sm text-black/60 mb-4">Update your password to keep your account secure</p>
                      <button className="px-6 py-2 bg-gradient-to-r from-[#00d4ff] to-[#7000ff] text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                        Change Password
                      </button>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg">
                      <p className="font-medium text-black mb-2">Face Authentication</p>
                      <p className="text-sm text-black/60 mb-4">Manage your face authentication settings</p>
                      <button className="px-6 py-2 bg-white border-2 border-[#7000ff] text-[#7000ff] rounded-lg font-semibold hover:bg-[#7000ff] hover:text-white transition-all">
                        Update Face ID
                      </button>
                    </div>

                    <div className="p-4 bg-white/50 rounded-lg">
                      <p className="font-medium text-black mb-2">Active Sessions</p>
                      <p className="text-sm text-black/60 mb-4">Manage your active login sessions</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">💻</span>
                            <div>
                              <p className="text-sm font-medium text-black">Current Session</p>
                              <p className="text-xs text-black/60">Windows • Chrome</p>
                            </div>
                          </div>
                          <span className="text-xs text-[#00ff9d] font-semibold">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
