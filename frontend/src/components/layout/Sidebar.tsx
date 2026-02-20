'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  name: string
  href: string
  icon: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Apply Leave', href: '/leave/request', icon: '➕' },
  { name: 'My Status', href: '/leave/history', icon: '🕐' },
  { name: 'Calendar', href: '/calendar', icon: '📅' },
  { name: 'Manager', href: '/manager', icon: '🛡️', roles: ['MANAGER', 'ADMIN'] },
  { name: 'Analytics', href: '/analytics', icon: '📈', roles: ['MANAGER', 'ADMIN'] },
  { name: 'Rules', href: '/rules', icon: '⚙️', roles: ['ADMIN'] },
  { name: 'Audit Logs', href: '/audit', icon: '📋', roles: ['ADMIN'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true
    return user?.role && item.roles.includes(user.role)
  })

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white/95 backdrop-blur-md border-r border-black/5 z-50">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 pb-4">
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            OptiLeave
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-3 px-6 py-4 mb-1 transition-all duration-300 rounded-lg
                  ${isActive 
                    ? 'bg-white/50 text-black' 
                    : 'text-black/60 hover:bg-white/30 hover:text-black'
                  }
                  ${isActive ? 'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-[60%] before:bg-gradient-to-b before:from-[#00d4ff] before:to-[#7000ff] before:rounded-r-lg' : ''}
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium text-[15px]">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-6 py-4 text-[#ff0055] hover:bg-red-50 transition-all duration-300 rounded-lg"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium text-[15px]">Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/5">
          <p className="text-xs text-black/40 text-center">
            v1.0.0
          </p>
        </div>
      </div>
    </aside>
  )
}
