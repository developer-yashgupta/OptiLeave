import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';

/**
 * Hook to get current user data
 * Returns the authenticated user or null if not authenticated
 */
export const useUser = (): User | null => {
  const { user } = useAuth();
  return user;
};
