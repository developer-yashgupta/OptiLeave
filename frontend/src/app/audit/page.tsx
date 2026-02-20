'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  action: string
  entity: string
  entityId: string
  details: string
  ipAddress: string
}

export default function AuditPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: '1',
      timestamp: new Date().toISOString(),
      userId: '1',
      userName: 'John Doe',
      action: 'CREATE',
      entity: 'LEAVE_REQUEST',
      entityId: 'lr-001',
      details: 'Created annual leave request for 5 days',
      ipAddress: '192.168.1.100',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userId: '2',
      userName: 'Manager Engineering',
      action: 'APPROVE',
      entity: 'LEAVE_REQUEST',
      entityId: 'lr-001',
      details: 'Approved leave request',
      ipAddress: '192.168.1.101',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      userId: '3',
      userName: 'Admin User',
      action: 'UPDATE',
      entity: 'RULE',
      entityId: 'rule-003',
      details: 'Updated team coverage rule threshold to 70%',
      ipAddress: '192.168.1.102',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      userId: '1',
      userName: 'John Doe',
      action: 'LOGIN',
      entity: 'USER',
      entityId: 'user-001',
      details: 'User logged in successfully',
      ipAddress: '192.168.1.100',
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      userId: '2',
      userName: 'Manager Engineering',
      action: 'REJECT',
      entity: 'LEAVE_REQUEST',
      entityId: 'lr-002',
      details: 'Rejected leave request - Insufficient notice period',
      ipAddress: '192.168.1.101',
    },
  ])
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [user, router])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'UPDATE': return 'bg-yellow-100 text-yellow-600 border-yellow-200'
      case 'DELETE': return 'bg-red-100 text-red-600 border-red-200'
      case 'APPROVE': return 'bg-green-100 text-green-600 border-green-200'
      case 'REJECT': return 'bg-red-100 text-red-600 border-red-200'
      case 'LOGIN': return 'bg-purple-100 text-purple-600 border-purple-200'
      case 'LOGOUT': return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return '➕'
      case 'UPDATE': return '✏️'
      case 'DELETE': return '🗑️'
      case 'APPROVE': return '✅'
      case 'REJECT': return '❌'
      case 'LOGIN': return '🔓'
      case 'LOGOUT': return '🔒'
      default: return '📝'
    }
  }

  const filteredLogs = filter === 'ALL' 
    ? logs 
    : logs.filter(log => log.action === filter)

  return (
    <div className="p-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-black/60 hover:text-black transition-colors mb-4"
        >
          <span className="text-xl">←</span>
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-3xl font-bold gradient-text mb-2">Audit Logs</h1>
        <p className="text-black/60">Track all system activities and changes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">📊</span>
            <span className="text-xs text-black/40">Total</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{logs.length}</h3>
          <p className="text-sm text-black/60">Total Events</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">👥</span>
            <span className="text-xs text-black/40">Users</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">
            {new Set(logs.map(l => l.userId)).size}
          </h3>
          <p className="text-sm text-black/60">Active Users</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">⚡</span>
            <span className="text-xs text-black/40">Today</span>
          </div>
          <h3 className="text-3xl font-bold mb-1 text-[#00d4ff]">
            {logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}
          </h3>
          <p className="text-sm text-black/60">Today's Events</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🔒</span>
            <span className="text-xs text-black/40">Security</span>
          </div>
          <h3 className="text-3xl font-bold mb-1 text-[#00ff9d]">
            {logs.filter(l => l.action === 'LOGIN' || l.action === 'LOGOUT').length}
          </h3>
          <p className="text-sm text-black/60">Auth Events</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-black/60">Filter by action:</span>
          {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN'].map((action) => (
            <button
              key={action}
              onClick={() => setFilter(action)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === action
                  ? 'bg-gradient-to-r from-[#00d4ff] to-[#7000ff] text-white'
                  : 'bg-white border border-black/10 hover:bg-black/5'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/50 border-b border-black/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black/60 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black/60 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black/60 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black/60 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black/60 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-black/60 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7000ff] flex items-center justify-center text-white text-xs font-semibold">
                        {log.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getActionColor(log.action)}`}>
                      <span>{getActionIcon(log.action)}</span>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4 text-sm text-black/60 max-w-md truncate">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-black/60 font-mono">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <span className="text-6xl block mb-4">🔍</span>
            <h3 className="text-xl font-semibold mb-2">No logs found</h3>
            <p className="text-black/60">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="mt-6 flex justify-end">
        <button className="px-6 py-3 bg-gradient-to-r from-[#00d4ff] to-[#7000ff] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2">
          <span>📥</span>
          Export Logs
        </button>
      </div>
    </div>
  )
}
