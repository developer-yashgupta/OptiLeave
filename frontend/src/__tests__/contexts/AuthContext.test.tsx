import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { tokenStorage } from '@/lib/api-client';
import apiClient from '@/lib/api-client';

// Mock dependencies
jest.mock('@/lib/api-client');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="user-email">{user?.email || 'none'}</div>
      <div data-testid="user-role">{user?.role || 'none'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });

  it('should initialize with unauthenticated state when no token exists', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('user-email')).toHaveTextContent('none');
    });
  });

  it('should provide auth context with expected properties', () => {
    const TestAuthProperties = () => {
      const auth = useAuth();
      return (
        <div>
          <div data-testid="has-login">{typeof auth.login === 'function' ? 'yes' : 'no'}</div>
          <div data-testid="has-logout">{typeof auth.logout === 'function' ? 'yes' : 'no'}</div>
          <div data-testid="has-refresh">{typeof auth.refreshUser === 'function' ? 'yes' : 'no'}</div>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestAuthProperties />
      </AuthProvider>
    );

    expect(screen.getByTestId('has-login')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-logout')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-refresh')).toHaveTextContent('yes');
  });
});
