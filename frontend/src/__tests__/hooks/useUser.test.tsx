import { renderHook } from '@testing-library/react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useUser', () => {
  it('should return user when authenticated', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'EMPLOYEE' as const,
      teamId: 'team1',
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useUser());

    expect(result.current).toEqual(mockUser);
  });

  it('should return null when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });

    const { result } = renderHook(() => useUser());

    expect(result.current).toBeNull();
  });
});
