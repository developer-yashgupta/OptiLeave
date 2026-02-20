import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { useAuth } from '@/hooks/useAuth'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

describe('Sidebar', () => {
  beforeEach(() => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
  })

  it('renders logo and navigation for employee', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'EMPLOYEE', teamId: 'team1' },
    })

    render(<Sidebar />)
    
    expect(screen.getByText('Leave Manager')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Leave Requests')).toBeInTheDocument()
    expect(screen.getByText('Calendar')).toBeInTheDocument()
  })

  it('shows manager-only items for manager role', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Manager', email: 'manager@example.com', role: 'MANAGER', teamId: 'team1' },
    })

    render(<Sidebar />)
    
    expect(screen.getByText('Team')).toBeInTheDocument()
    expect(screen.getByText('Approvals')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('shows admin-only items for admin role', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Admin', email: 'admin@example.com', role: 'ADMIN', teamId: 'team1' },
    })

    render(<Sidebar />)
    
    expect(screen.getByText('Rules')).toBeInTheDocument()
    expect(screen.getByText('Audit Logs')).toBeInTheDocument()
  })

  it('hides manager items for employee role', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Employee', email: 'employee@example.com', role: 'EMPLOYEE', teamId: 'team1' },
    })

    render(<Sidebar />)
    
    expect(screen.queryByText('Team')).not.toBeInTheDocument()
    expect(screen.queryByText('Approvals')).not.toBeInTheDocument()
    expect(screen.queryByText('Rules')).not.toBeInTheDocument()
  })
})
