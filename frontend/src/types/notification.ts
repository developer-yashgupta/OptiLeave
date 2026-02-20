export type NotificationType = 'info' | 'success' | 'error' | 'warning';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}
