import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: number;
  email: string;
  role: 'admin' | 'client';
  birthDate?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, birthDate?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authAPI.isAuthenticated()) {
          const currentUser = authAPI.getCurrentUser();
          if (currentUser) {
            // Validar token com o backend
            try {
              const { user: validatedUser } = await authAPI.getMe();
              setUser(validatedUser);
              // Atualizar localStorage também
              localStorage.setItem('user', JSON.stringify(validatedUser));
            } catch (error) {
              // Token inválido, limpar
              authAPI.logout();
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        authAPI.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const { user } = await authAPI.login(email, password);
    setUser(user);
  };

  const register = async (email: string, password: string, birthDate?: string) => {
    const { user } = await authAPI.register(email, password, birthDate);
    setUser(user);
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

