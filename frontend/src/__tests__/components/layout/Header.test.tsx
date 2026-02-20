import { render, screen, fireEvent } from '@testing-library/react'
import Header from '@/components/layout/Header'
import { useAuth } from '@/hooks/useAuth'

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

describe('Header', () => {
  const mockLogout = jest.fn()

  beforeEach(() => {
    mockLogout.mockClear()
  })

  it('renders user information', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'John Doe', email: 'john@example.com', role: 'EMPLOYEE', teamId: 'team1' },
      logout: mockLogout,
    })

    render(<Header />)
    
    // Check that user name appears (it appears twice - in welcome message and profile)
    const nameElements = screen.getAllByText('John Doe')
    expect(nameElements.length).toBeGreaterThan(0)
    
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('EMPLOYEE')).toBeInTheDocument()
  })

  it('displays correct role badge color for admin', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'ADMIN', teamId: 'team1' },
      logout: mockLogout,
    })

    const { container } = render(<Header />)
    const roleBadge = screen.getByText('ADMIN')
    
    expect(roleBadge).toHaveClass('text-red-300')
  })

  it('displays correct role badge color for manager', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Manager User', email: 'manager@example.com', role: 'MANAGER', teamId: 'team1' },
      logout: mockLogout,
    })

    const { container } = render(<Header />)
    const roleBadge = screen.getByText('MANAGER')
    
    expect(roleBadge).toHaveClass('text-blue-300')
  })

  it('toggles dropdown menu on click', () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'EMPLOYEE', teamId: 'team1' },
      logout: mockLogout,
    })

    render(<Header />)
    
    // Dropdown should not be visible initially
    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument()
    
    // Click to open dropdown
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Dropdown should now be visible
    expect(screen.getByText('Profile Settings')).toBeInTheDocument()
    expect(screen.getByText('Preferences')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('calls logout when logout button is clicked', async () => {
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'EMPLOYEE', teamId: 'team1' },
      logout: mockLogout,
    })

    render(<Header />)
    
    // Open dropdown
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    // Click logout
    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)
    
    expect(mockLogout).toHaveBeenCalledTimes(1)
  })
})
