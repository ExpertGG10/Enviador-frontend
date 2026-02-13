import { useState, useCallback, useEffect } from 'react';
import { authService, User } from '../services/authService';

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  register: (
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  changePassword: (
    oldPassword: string,
    newPassword: string
  ) => Promise<void>;
}

const STORAGE_KEY = 'auth_token';
const USER_STORAGE_KEY = 'auth_user';

export const useAuth = (): AuthContextType => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(false);

  // Recuperar usuário ao carregar token
  useEffect(() => {
    if (token && !user) {
      setLoading(true);
      authService
        .getCurrentUser(token)
        .then((userData) => {
          setUser(userData);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        })
        .catch((error) => {
          console.error('Erro ao carregar usuário:', error);
          // Token inválido, fazer logout
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    }
  }, [token, user]);

  const register = useCallback(
    async (
      username: string,
      email: string,
      password: string,
      firstName?: string,
      lastName?: string
    ) => {
      setLoading(true);
      try {
        const response = await authService.register(
          username,
          email,
          password,
          firstName,
          lastName
        );
        localStorage.setItem(STORAGE_KEY, response.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
        setToken(response.token);
        setUser(response.user);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login(username, password);
      localStorage.setItem(STORAGE_KEY, response.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
      setToken(response.token);
      setUser(response.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const updateUser = useCallback(
    async (data: Partial<User>) => {
      if (!token) throw new Error('Não autenticado');
      setLoading(true);
      try {
        const updated = await authService.updateUser(token, data);
        setUser(updated);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      if (!token) throw new Error('Não autenticado');
      setLoading(true);
      try {
        await authService.changePassword(token, oldPassword, newPassword);
        // Logout após mudança de senha
        await logout();
      } finally {
        setLoading(false);
      }
    },
    [token, logout]
  );

  return {
    token,
    user,
    loading,
    isAuthenticated: !!token,
    register,
    login,
    logout,
    updateUser,
    changePassword,
  };
};
