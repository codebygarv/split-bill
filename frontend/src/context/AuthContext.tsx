import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { registerForPushNotificationsAsync } from '../services/pushNotifications';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  useCase?: string;
  profileImage?: string;
  groups?: Array<{ _id: string; name: string; code: string; type: string }>;
}

interface AuthResponse {
  requiresOtp?: boolean;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse | void>;
  register: (name: string, email: string, password: string, phone: string, useCase: string) => Promise<AuthResponse | void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, phone: string, profileImage?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    const initPush = async () => {
      if (user && token) {
        const tokenVal = await registerForPushNotificationsAsync();
        if (tokenVal) {
          setPushToken(tokenVal);
          try {
            await api.post('/auth/push-token', { pushToken: tokenVal });
          } catch (err) {
            console.log('Failed to upload push token:', err);
          }
        }
      }
    };
    initPush();
  }, [user, token]);

  const restoreSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        const res = await api.get('/auth/profile');
        setUser(res.data);
      }
    } catch (err) {
      console.log('Failed to restore session:', err);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.requiresOtp) {
        return { requiresOtp: true, email: res.data.email };
      }
      
      const { token: userToken, ...userData } = res.data;
      await AsyncStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);
      return { requiresOtp: false };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const register = async (name: string, email: string, password: string, phone: string, useCase: string) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, phone, useCase });
      if (res.data.requiresOtp) {
        return { requiresOtp: true, email: res.data.email };
      }
      
      const { token: userToken, ...userData } = res.data;
      await AsyncStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);
      return { requiresOtp: false };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { token: userToken, ...userData } = res.data;
      await AsyncStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Verification failed';
      throw new Error(msg);
    }
  };

  const resendOtp = async (email: string) => {
    try {
      await api.post('/auth/resend-otp', { email });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to resend OTP';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      if (pushToken) {
        try {
          await api.post('/auth/logout-push-token', { pushToken });
        } catch (err) {
          console.log('Failed to clear push token on logout:', err);
        }
      }
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setPushToken(null);
      delete api.defaults.headers.common['Authorization'];
    } catch (err) {
      console.log('Failed to clear session:', err);
    }
  };

  const updateProfile = async (name: string, phone: string, profileImage?: string) => {
    try {
      const res = await api.put('/auth/profile', { name, phone, profileImage });
      setUser(prev => prev ? { ...prev, ...res.data } : null);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Update profile failed';
      throw new Error(msg);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data);
    } catch (err) {
      console.log('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
