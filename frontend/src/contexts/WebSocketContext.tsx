'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  websocketService,
  ConnectionState,
  LeaveUpdateEvent,
  CalendarUpdateEvent,
  DashboardUpdateEvent,
  WebSocketEventHandler,
} from '@/services/websocket.service';
import { useAuth } from '@/hooks/useAuth';
import { tokenStorage } from '@/lib/api-client';

interface WebSocketContextValue {
  connectionState: ConnectionState;
  isConnected: boolean;
  reconnectAttempts: number;
  onLeaveUpdate: (handler: WebSocketEventHandler<LeaveUpdateEvent>) => () => void;
  onCalendarUpdate: (handler: WebSocketEventHandler<CalendarUpdateEvent>) => () => void;
  onDashboardUpdate: (handler: WebSocketEventHandler<DashboardUpdateEvent>) => () => void;
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  wsUrl?: string;
}

export function WebSocketProvider({ children, wsUrl }: WebSocketProviderProps) {
  const { user } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Get WebSocket URL from environment or props
  const webSocketUrl = wsUrl || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    const token = tokenStorage.getToken();
    if (!token) {
      console.warn('Cannot connect to WebSocket: No authentication token');
      return;
    }

    websocketService.connect({
      url: webSocketUrl,
      token,
    });
  }, [webSocketUrl]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  /**
   * Auto-connect when user is authenticated
   * NOTE: Disabled for now - WebSocket server not yet implemented
   */
  useEffect(() => {
    // TODO: Enable when Socket.IO is configured on backend
    // if (user) {
    //   connect();
    // } else {
    //   disconnect();
    // }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  /**
   * Subscribe to connection state changes
   */
  useEffect(() => {
    const unsubscribe = websocketService.onConnectionStateChange((state) => {
      setConnectionState(state);
      setReconnectAttempts(websocketService.getReconnectAttempts());
    });

    // Set initial state
    setConnectionState(websocketService.getConnectionState());

    return unsubscribe;
  }, []);

  /**
   * Subscribe to leave updates
   */
  const onLeaveUpdate = useCallback((handler: WebSocketEventHandler<LeaveUpdateEvent>) => {
    return websocketService.onLeaveUpdate(handler);
  }, []);

  /**
   * Subscribe to calendar updates
   */
  const onCalendarUpdate = useCallback((handler: WebSocketEventHandler<CalendarUpdateEvent>) => {
    return websocketService.onCalendarUpdate(handler);
  }, []);

  /**
   * Subscribe to dashboard updates
   */
  const onDashboardUpdate = useCallback((handler: WebSocketEventHandler<DashboardUpdateEvent>) => {
    return websocketService.onDashboardUpdate(handler);
  }, []);

  const value: WebSocketContextValue = {
    connectionState,
    isConnected: connectionState === 'connected',
    reconnectAttempts,
    onLeaveUpdate,
    onCalendarUpdate,
    onDashboardUpdate,
    connect,
    disconnect,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

/**
 * Hook to access WebSocket context
 */
export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
