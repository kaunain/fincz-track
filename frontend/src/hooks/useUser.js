import { useAuth } from '../utils/auth';

export const useUser = () => {
  const { user, loading, isRefreshing, fetchUser } = useAuth();

  return {
    user,
    loading,
    isRefreshing,
    refreshUser: fetchUser,
  };
};