import { io, Socket } from 'socket.io-client';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface WebSocketConfig {
  url: string;
  token: string;
}

export interface LeaveUpdateEvent {
  id: string;
  userId: string;
  status: string;
  leaveType: string;
  startDate: string;
  endDate: string;
}

export interface CalendarUpdateEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'LEAVE' | 'DEADLINE' | 'HOLIDAY';
  userId?: string;
  status?: string;
}

export interface DashboardUpdateEvent {
  pendingCount: number;
  teamAvailability: number;
  riskAlerts: Array<{
    type: string;
    severity: string;
    message: string;
    affectedUsers: string[];
  }>;
}

export type WebSocketEventHandler<T = any> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize WebSocket connection with JWT authentication
   */
  connect(config: WebSocketConfig): void {
    if (this.socket?.connected) {
      console.warn('WebSocket already connected');
      return;
    }

    this.updateConnectionState('connecting');

    // Create Socket.io client with auto-reconnection configuration
    this.socket = io(config.url, {
      auth: {
        token: config.token,
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 16000,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
  }

  /**
   * Set up Socket.io event handlers for connection management
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.updateConnectionState('connected');
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      this.updateConnectionState('error');
    });

    // Disconnected
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.updateConnectionState('disconnected');
    });

    // Reconnection attempt
    this.socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`WebSocket reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      this.reconnectAttempts = attempt;
      this.updateConnectionState('reconnecting');
    });

    // Reconnection successful
    this.socket.io.on('reconnect', (attempt) => {
      console.log(`WebSocket reconnected after ${attempt} attempts`);
      this.reconnectAttempts = 0;
      this.updateConnectionState('connected');
    });

    // Reconnection failed
    this.socket.io.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed after maximum attempts');
      this.updateConnectionState('error');
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.updateConnectionState('disconnected');
    }
  }

  /**
   * Subscribe to leave request updates
   */
  onLeaveUpdate(handler: WebSocketEventHandler<LeaveUpdateEvent>): () => void {
    if (!this.socket) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return () => {};
    }

    this.socket.on('leave:update', handler);
    return () => this.socket?.off('leave:update', handler);
  }

  /**
   * Subscribe to calendar updates
   */
  onCalendarUpdate(handler: WebSocketEventHandler<CalendarUpdateEvent>): () => void {
    if (!this.socket) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return () => {};
    }

    this.socket.on('calendar:update', handler);
    return () => this.socket?.off('calendar:update', handler);
  }

  /**
   * Subscribe to dashboard updates
   */
  onDashboardUpdate(handler: WebSocketEventHandler<DashboardUpdateEvent>): () => void {
    if (!this.socket) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return () => {};
    }

    this.socket.on('dashboard:update', handler);
    return () => this.socket?.off('dashboard:update', handler);
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Update connection state and notify listeners
   */
  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.stateListeners.forEach((listener) => listener(state));
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current reconnection attempt count
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
