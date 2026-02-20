/**
 * WebSocket Service Tests
 * Tests for Socket.io client with auto-reconnection and connection state management
 */

import { websocketService, ConnectionState } from '@/services/websocket.service';
import { io, Socket } from 'socket.io-client';

// Mock Socket.io client
jest.mock('socket.io-client');

describe('WebSocket Service', () => {
  let mockSocket: any;
  let mockIo: any;

  beforeEach(() => {
    // Reset the service state
    websocketService.disconnect();

    // Create mock socket with event emitter functionality
    mockSocket = {
      id: 'test-socket-id',
      connected: false,
      on: jest.fn(),
      off: jest.fn(),
      disconnect: jest.fn(),
      io: {
        on: jest.fn(),
      },
    };

    mockIo = {
      on: jest.fn(),
    };

    mockSocket.io = mockIo;

    // Mock io() to return our mock socket
    (io as jest.MockedFunction<typeof io>).mockReturnValue(mockSocket as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    it('should initialize connection with correct configuration', () => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };

      websocketService.connect(config);

      expect(io).toHaveBeenCalledWith(config.url, {
        auth: {
          token: config.token,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 16000,
        timeout: 20000,
        transports: ['websocket', 'polling'],
      });
    });

    it('should not create duplicate connections', () => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };

      mockSocket.connected = true;
      websocketService.connect(config);
      websocketService.connect(config);

      // Should only be called once
      expect(io).toHaveBeenCalledTimes(1);
    });

    it('should set up event handlers on connection', () => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };

      websocketService.connect(config);

      // Verify socket event handlers are registered
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));

      // Verify io event handlers are registered
      expect(mockIo.on).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function));
      expect(mockIo.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
      expect(mockIo.on).toHaveBeenCalledWith('reconnect_failed', expect.any(Function));
    });

    it('should disconnect properly', () => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };

      websocketService.connect(config);
      websocketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(websocketService.getConnectionState()).toBe('disconnected');
    });
  });

  describe('Connection State Management', () => {
    it('should start with disconnected state', () => {
      expect(websocketService.getConnectionState()).toBe('disconnected');
      expect(websocketService.isConnected()).toBe(false);
    });

    it('should update state to connecting when connect is called', () => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };

      const stateListener = jest.fn();
      websocketService.onConnectionStateChange(stateListener);

      websocketService.connect(config);

      expect(stateListener).toHaveBeenCalledWith('connecting');
    });

    it('should update state to connected on successful connection', () => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };

      const stateListener = jest.fn();
      websocketService.onConnectionStateChange(stateListener);

      websocketService.connect(config);

      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )?.[1];
      mockSocket.connected = true;
      connectHandler?.();

      expect(stateListener).toHaveBeenCalledWith('connected');
      expect(websocketService.isConnected()).toBe(true);
    });

    it('should update state to error on connection error', () => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };

      const stateListener = jest.fn();
      websocketService.onConnectionStateChange(stateListener);

      websocketService.connect(config);

      // Simulate connection error
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect_error'
      )?.[1];
      errorHandler?.(new Error('Connection failed'));

      expect(stateListener).toHaveBeenCalledWith('error');
    });

    it('should update state to disconnected on disconnect', () => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };

      const stateListener = jest.fn();
      websocketService.onConnectionStateChange(stateListener);

      websocketService.connect(config);

      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'disconnect'
      )?.[1];
      mockSocket.connected = false;
      disconnectHandler?.('transport close');

      expect(stateListener).toHaveBeenCalledWith('disconnected');
    });

    it('should update state to reconnecting on reconnection attempt', () => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };

      const stateListener = jest.fn();
      websocketService.onConnectionStateChange(stateListener);

      websocketService.connect(config);

      // Simulate reconnection attempt
      const reconnectAttemptHandler = mockIo.on.mock.calls.find(
        (call: any) => call[0] === 'reconnect_attempt'
      )?.[1];
      reconnectAttemptHandler?.(2);

      expect(stateListener).toHaveBeenCalledWith('reconnecting');
      expect(websocketService.getReconnectAttempts()).toBe(2);
    });

    it('should allow unsubscribing from state changes', () => {
      const stateListener = jest.fn();
      const unsubscribe = websocketService.onConnectionStateChange(stateListener);

      unsubscribe();

      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };
      websocketService.connect(config);

      // Listener should not be called after unsubscribe
      expect(stateListener).not.toHaveBeenCalled();
    });
  });

  describe('Event Subscriptions', () => {
    beforeEach(() => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };
      websocketService.connect(config);
    });

    it('should subscribe to leave updates', () => {
      const handler = jest.fn();
      websocketService.onLeaveUpdate(handler);

      expect(mockSocket.on).toHaveBeenCalledWith('leave:update', handler);
    });

    it('should unsubscribe from leave updates', () => {
      const handler = jest.fn();
      const unsubscribe = websocketService.onLeaveUpdate(handler);

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith('leave:update', handler);
    });

    it('should subscribe to calendar updates', () => {
      const handler = jest.fn();
      websocketService.onCalendarUpdate(handler);

      expect(mockSocket.on).toHaveBeenCalledWith('calendar:update', handler);
    });

    it('should unsubscribe from calendar updates', () => {
      const handler = jest.fn();
      const unsubscribe = websocketService.onCalendarUpdate(handler);

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith('calendar:update', handler);
    });

    it('should subscribe to dashboard updates', () => {
      const handler = jest.fn();
      websocketService.onDashboardUpdate(handler);

      expect(mockSocket.on).toHaveBeenCalledWith('dashboard:update', handler);
    });

    it('should unsubscribe from dashboard updates', () => {
      const handler = jest.fn();
      const unsubscribe = websocketService.onDashboardUpdate(handler);

      unsubscribe();

      expect(mockSocket.off).toHaveBeenCalledWith('dashboard:update', handler);
    });

    it('should handle subscription when not connected', () => {
      websocketService.disconnect();

      const handler = jest.fn();
      const unsubscribe = websocketService.onLeaveUpdate(handler);

      // Should return a no-op unsubscribe function
      expect(unsubscribe).toBeInstanceOf(Function);
      unsubscribe(); // Should not throw
    });
  });

  describe('Reconnection Logic', () => {
    it('should reset reconnect attempts on successful connection', () => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };

      websocketService.connect(config);

      // Simulate reconnection attempt
      const reconnectAttemptHandler = mockIo.on.mock.calls.find(
        (call: any) => call[0] === 'reconnect_attempt'
      )?.[1];
      reconnectAttemptHandler?.(3);

      expect(websocketService.getReconnectAttempts()).toBe(3);

      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )?.[1];
      connectHandler?.();

      expect(websocketService.getReconnectAttempts()).toBe(0);
    });

    it('should reset reconnect attempts on successful reconnection', () => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };

      websocketService.connect(config);

      // Simulate reconnection attempt
      const reconnectAttemptHandler = mockIo.on.mock.calls.find(
        (call: any) => call[0] === 'reconnect_attempt'
      )?.[1];
      reconnectAttemptHandler?.(2);

      // Simulate successful reconnection
      const reconnectHandler = mockIo.on.mock.calls.find(
        (call: any) => call[0] === 'reconnect'
      )?.[1];
      reconnectHandler?.(2);

      expect(websocketService.getReconnectAttempts()).toBe(0);
      expect(websocketService.getConnectionState()).toBe('connected');
    });

    it('should update state to error on reconnection failure', () => {
      const config = {
        url: 'ws://localhost:4000',
        token: 'test-jwt-token',
      };

      const stateListener = jest.fn();
      websocketService.onConnectionStateChange(stateListener);

      websocketService.connect(config);

      // Simulate reconnection failure
      const reconnectFailedHandler = mockIo.on.mock.calls.find(
        (call: any) => call[0] === 'reconnect_failed'
      )?.[1];
      reconnectFailedHandler?.();

      expect(stateListener).toHaveBeenCalledWith('error');
    });
  });
});
