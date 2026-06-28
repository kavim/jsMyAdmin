import { create } from 'zustand';
import { Connection } from '@/types';

interface AuthState {
  token: string | null;
  connection: Connection | null;
  isAuthenticated: boolean;
  setAuth: (token: string, connection: Connection) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  connection: localStorage.getItem('connection')
    ? JSON.parse(localStorage.getItem('connection')!)
    : null,
  isAuthenticated: !!localStorage.getItem('token'),
  setAuth: (token, connection) => {
    localStorage.setItem('token', token);
    localStorage.setItem('connection', JSON.stringify(connection));
    set({ token, connection, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('connection');
    set({ token: null, connection: null, isAuthenticated: false });
  },
}));