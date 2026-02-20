/**
 * WebSocket Context Tests
 * Tests for React WebSocket context and provider
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { WebSocketProvider, useWebSocket } from '@/contexts/WebSocketContext';
import { websocketService } from '@/services/websocket.service';
import { useAuth } from '@/hooks/useAuth';
import { tokenStorage } from '@/lib/api-client';

// Mock dependencies
jest.mock('@/services/websocket.service');
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/api-client', () => ({
  ...jest.requireActual('@/lib/api-client'),
  tokenStorage: {
    getToken: jest.fn(),
    setToken: jest.fn(),
    removeToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setRefreshToken: jest.fn(),
    removeRefreshToken: jest.fn(),
  },
}));

// Test component that uses the WebSocket context
function TestComponent() {
  const {
    connectionState,
    isConnected,
    reconnectAttempts,
    onLeaveUpdate,
    onCalendarUpdate,
    onDashboardUpdate,
    connect,
    disconnect,
  } = useWebSocket();

  return (
    <div>
      <div data-testid="connection-state">{connectionState}</div>
      <div data-testid="is-connected">{isConnected ? 'true' : 'false'}</div>
      <div data-testid="reconnect-attempts">{reconnectAttempts}</div>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
      <button onClick={() => onLeaveUpdate(() => {})}>Subscribe Leave</button>
      <button onClick={() => onCalendarUpdate(() => {})}>Subscribe Calendar</button>
      <button onClick={() => onDashboardUpdate(() => {})}>Subscribe Dashboard</button>
    </div>
  );
}

describe('WebSocket Context', () => {
  const mockWebSocketService = websocketService as jest.Mocked<typeof websocketService>;
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
  const mockTokenStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Default mock implementations
    mockWebSocketService.connect = jest.fn();
    mockWebSocketService.disconnect = jest.fn();
    mockWebSocketService.getConnectionState = jest.fn().mockReturnValue('disconnected');
    mockWebSocketService.getReconnectAttempts = jest.fn().mockReturnValue(0);
    mockWebSocketService.onConnectionStateChange = jest.fn().mockReturnValue(() => {});
    mockWebSocketService.onLeaveUpdate = jest.fn().mockReturnValue(() => {});
    mockWebSocketService.onCalendarUpdate = jest.fn().mockReturnValue(() => {});
    mockWebSocketService.onDashboardUpdate = jest.fn().mockReturnValue(() => {});

    // Default token storage (no token)
    mockTokenStorage.getToken = jest.fn().mockReturnValue(null);

    // Default auth state (not authenticated)
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
    });
  });

  describe('Provider Setup', () => {
    it('should throw error when useWebSocket is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useWebSocket must be used within a WebSocketProvider');

      consoleSpy.mockRestore();
    });

    it('should provide WebSocket context to children', () => {
      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      expect(screen.getByTestId('connection-state')).toHaveTextContent('disconnected');
      expect(screen.getByTestId('is-connected')).toHaveTextContent('false');
      expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('0');
    });

    it('should use custom WebSocket URL from props', () => {
      const customUrl = 'ws://custom-server:8080';

      mockTokenStorage.getToken = jest.fn().mockReturnValue('test-token');
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'EMPLOYEE', teamId: 'team1' },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <WebSocketProvider wsUrl={customUrl}>
          <TestComponent />
        </WebSocketProvider>
      );

      expect(mockWebSocketService.connect).toHaveBeenCalledWith({
        url: customUrl,
        token: 'test-token',
      });
    });

    it('should use environment variable for WebSocket URL', () => {
      const envUrl = 'ws://env-server:9000';
      process.env.NEXT_PUBLIC_WS_URL = envUrl;

      mockTokenStorage.getToken = jest.fn().mockReturnValue('test-token');
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'EMPLOYEE', teamId: 'team1' },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      expect(mockWebSocketService.connect).toHaveBeenCalledWith({
        url: envUrl,
        token: 'test-token',
      });

      delete process.env.NEXT_PUBLIC_WS_URL;
    });
  });

  describe('Auto-Connection', () => {
    it('should auto-connect when user is authenticated', () => {
      mockTokenStorage.getToken = jest.fn().mockReturnValue('test-jwt-token');
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'EMPLOYEE', teamId: 'team1' },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      expect(mockWebSocketService.connect).toHaveBeenCalledWith({
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      });
    });

    it('should not connect when user is not authenticated', () => {
      mockTokenStorage.getToken = jest.fn().mockReturnValue(null);
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      expect(mockWebSocketService.connect).not.toHaveBeenCalled();
    });

    it('should disconnect when user logs out', () => {
      const { rerender } = render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      // Initially authenticated
      mockTokenStorage.getToken = jest.fn().mockReturnValue('test-jwt-token');
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'EMPLOYEE', teamId: 'team1' },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      rerender(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      // User logs out
      mockTokenStorage.getToken = jest.fn().mockReturnValue(null);
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      rerender(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      expect(mockWebSocketService.disconnect).toHaveBeenCalled();
    });

    it('should disconnect on unmount', () => {
      const { unmount } = render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      unmount();

      expect(mockWebSocketService.disconnect).toHaveBeenCalled();
    });
  });

  describe('Connection State Management', () => {
    it('should update connection state from service', async () => {
      let stateChangeCallback: ((state: any) => void) | null = null;

      mockWebSocketService.onConnectionStateChange = jest.fn((callback) => {
        stateChangeCallback = callback;
        return () => {};
      });

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      // Simulate state change to connected
      await act(async () => {
        stateChangeCallback?.('connected');
      });

      await waitFor(() => {
        expect(screen.getByTestId('connection-state')).toHaveTextContent('connected');
        expect(screen.getByTestId('is-connected')).toHaveTextContent('true');
      });
    });

    it('should update reconnect attempts from service', async () => {
      let stateChangeCallback: ((state: any) => void) | null = null;

      mockWebSocketService.onConnectionStateChange = jest.fn((callback) => {
        stateChangeCallback = callback;
        return () => {};
      });

      mockWebSocketService.getReconnectAttempts = jest.fn().mockReturnValue(3);

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      // Simulate state change to reconnecting
      await act(async () => {
        stateChangeCallback?.('reconnecting');
      });

      await waitFor(() => {
        expect(screen.getByTestId('reconnect-attempts')).toHaveTextContent('3');
      });
    });

    it('should unsubscribe from state changes on unmount', () => {
      const unsubscribe = jest.fn();
      mockWebSocketService.onConnectionStateChange = jest.fn().mockReturnValue(unsubscribe);

      const { unmount } = render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Event Subscriptions', () => {
    it('should provide onLeaveUpdate subscription', () => {
      const mockUnsubscribe = jest.fn();
      mockWebSocketService.onLeaveUpdate = jest.fn().mockReturnValue(mockUnsubscribe);

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      const subscribeButton = screen.getByText('Subscribe Leave');
      act(() => {
        subscribeButton.click();
      });

      expect(mockWebSocketService.onLeaveUpdate).toHaveBeenCalled();
    });

    it('should provide onCalendarUpdate subscription', () => {
      const mockUnsubscribe = jest.fn();
      mockWebSocketService.onCalendarUpdate = jest.fn().mockReturnValue(mockUnsubscribe);

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      const subscribeButton = screen.getByText('Subscribe Calendar');
      act(() => {
        subscribeButton.click();
      });

      expect(mockWebSocketService.onCalendarUpdate).toHaveBeenCalled();
    });

    it('should provide onDashboardUpdate subscription', () => {
      const mockUnsubscribe = jest.fn();
      mockWebSocketService.onDashboardUpdate = jest.fn().mockReturnValue(mockUnsubscribe);

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      const subscribeButton = screen.getByText('Subscribe Dashboard');
      act(() => {
        subscribeButton.click();
      });

      expect(mockWebSocketService.onDashboardUpdate).toHaveBeenCalled();
    });
  });

  describe('Manual Connection Control', () => {
    it('should allow manual connection', () => {
      mockTokenStorage.getToken = jest.fn().mockReturnValue('test-jwt-token');
      mockUseAuth.mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'EMPLOYEE', teamId: 'team1' },
        isAuthenticated: true,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      // Clear the auto-connect call
      mockWebSocketService.connect.mockClear();

      const connectButton = screen.getByText('Connect');
      act(() => {
        connectButton.click();
      });

      expect(mockWebSocketService.connect).toHaveBeenCalledWith({
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      });
    });

    it('should allow manual disconnection', () => {
      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      const disconnectButton = screen.getByText('Disconnect');
      act(() => {
        disconnectButton.click();
      });

      expect(mockWebSocketService.disconnect).toHaveBeenCalled();
    });

    it('should not connect manually without token', () => {
      mockTokenStorage.getToken = jest.fn().mockReturnValue(null);
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: jest.fn(),
        logout: jest.fn(),
        refreshUser: jest.fn(),
      });

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      const connectButton = screen.getByText('Connect');
      act(() => {
        connectButton.click();
      });

      expect(mockWebSocketService.connect).not.toHaveBeenCalled();
    });
  });
});
