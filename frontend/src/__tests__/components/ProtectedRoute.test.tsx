import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

// Mock the auth context
jest.mock('@/contexts/AuthContext');
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state when auth is loading', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'EMPLOYEE',
        teamId: 'team-123',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should allow access when user has required role', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-123',
        email: 'manager@example.com',
        name: 'Manager User',
        role: 'MANAGER',
        teamId: 'team-123',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <ProtectedRoute requiredRole="MANAGER">
        <div>Manager Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Manager Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to dashboard when user lacks required role', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-123',
        email: 'employee@example.com',
        name: 'Employee User',
        role: 'EMPLOYEE',
        teamId: 'team-123',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <ProtectedRoute requiredRole="MANAGER">
        <div>Manager Content</div>
      </ProtectedRoute>
    );

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    expect(screen.queryByText('Manager Content')).not.toBeInTheDocument();
  });

  it('should allow access when user has one of multiple required roles', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-123',
        email: 'manager@example.com',
        name: 'Manager User',
        role: 'MANAGER',
        teamId: 'team-123',
      },
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    render(
      <ProtectedRoute requiredRole={['MANAGER', 'ADMIN']}>
        <div>Admin or Manager Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Admin or Manager Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
