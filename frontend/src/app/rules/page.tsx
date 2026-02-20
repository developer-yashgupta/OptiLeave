'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface Rule {
  id: string
  name: string
  description: string
  type: string
  enabled: boolean
  priority: number
}

export default function RulesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [rules, setRules] = useState<Rule[]>([
    {
      id: '1',
      name: 'Minimum Notice Period',
      description: 'Leave requests must be submitted at least 7 days in advance',
      type: 'VALIDATION',
      enabled: true,
      priority: 1,
    },
    {
      id: '2',
      name: 'Maximum Consecutive Days',
      description: 'Annual leave cannot exceed 14 consecutive days',
      type: 'VALIDATION',
      enabled: true,
      priority: 2,
    },
    {
      id: '3',
      name: 'Team Coverage',
      description: 'At least 70% of team must be available at all times',
      type: 'BUSINESS',
      enabled: true,
      priority: 3,
    },
    {
      id: '4',
      name: 'Holiday Blackout',
      description: 'No leave during critical business periods (Dec 15-31)',
      type: 'BUSINESS',
      enabled: false,
      priority: 4,
    },
    {
      id: '5',
      name: 'Auto-Approval Threshold',
      description: 'Automatically approve leave requests under 2 days',
      type: 'AUTOMATION',
      enabled: false,
      priority: 5,
    },
  ])

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [user, router])

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ))
  }

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'VALIDATION': return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'BUSINESS': return 'bg-purple-100 text-purple-600 border-purple-200'
      case 'AUTOMATION': return 'bg-green-100 text-green-600 border-green-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'VALIDATION': return '✓'
      case 'BUSINESS': return '💼'
      case 'AUTOMATION': return '⚡'
      default: return '⚙️'
    }
  }

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
        <h1 className="text-3xl font-bold gradient-text mb-2">Leave Rules</h1>
        <p className="text-black/60">Configure and manage leave approval rules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">📋</span>
            <span className="text-xs text-black/40">Total</span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{rules.length}</h3>
          <p className="text-sm text-black/60">Total Rules</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">✅</span>
            <span className="text-xs text-black/40">Active</span>
          </div>
          <h3 className="text-3xl font-bold mb-1 text-[#00ff9d]">
            {rules.filter(r => r.enabled).length}
          </h3>
          <p className="text-sm text-black/60">Active Rules</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">⏸️</span>
            <span className="text-xs text-black/40">Inactive</span>
          </div>
          <h3 className="text-3xl font-bold mb-1 text-[#ffbd00]">
            {rules.filter(r => !r.enabled).length}
          </h3>
          <p className="text-sm text-black/60">Inactive Rules</p>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="glass-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{getRuleTypeIcon(rule.type)}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{rule.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRuleTypeColor(rule.type)} mt-1`}>
                      {rule.type}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-black/60 mb-4 ml-11">{rule.description}</p>

                <div className="flex items-center gap-4 ml-11">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-black/40">Priority:</span>
                    <span className="text-sm font-semibold">{rule.priority}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-black/40">Status:</span>
                    <span className={`text-sm font-semibold ${rule.enabled ? 'text-[#00ff9d]' : 'text-black/40'}`}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-6">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    rule.enabled
                      ? 'bg-white border-2 border-[#ff0055] text-[#ff0055] hover:bg-[#ff0055] hover:text-white'
                      : 'bg-gradient-to-r from-[#00d4ff] to-[#7000ff] text-white hover:shadow-lg'
                  }`}
                >
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button className="px-6 py-2 bg-white border border-black/10 rounded-lg font-semibold hover:bg-black/5 transition-all">
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Rule Button */}
      <div className="mt-8">
        <button className="w-full glass-card p-6 hover:shadow-lg transition-all group">
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl group-hover:scale-110 transition-transform">➕</span>
            <span className="font-semibold text-lg gradient-text">Add New Rule</span>
          </div>
        </button>
      </div>
    </div>
  )
}
