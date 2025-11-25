import { create } from 'zustand';
import { auth } from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  googleConnected: false,
  loading: true,

  checkAuth: async () => {
    try {
      const response = await auth.getStatus();
      set({
        isAuthenticated: response.data.authenticated,
        user: response.data.email ? { email: response.data.email } : null,
        googleConnected: response.data.googleConnected,
        loading: false
      });
    } catch (error) {
      console.error('Error checking auth:', error);
      set({
        isAuthenticated: false,
        user: null,
        googleConnected: false,
        loading: false
      });
    }
  },

  logout: async () => {
    try {
      await auth.logout();
      set({
        isAuthenticated: false,
        user: null,
        googleConnected: false
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}));

export default useAuthStore;
