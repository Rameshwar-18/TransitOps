import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        } catch (error) {
          console.error('Failed to fetch user', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const signup = async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const hasAccess = (moduleName, accessType) => {
    if (!user) return false;
    const PERMISSIONS = {
      trip: {
        write: ['Dispatcher'],
        read: ['Dispatcher', 'SafetyOfficer']
      },
      maintenance: {
        write: ['FleetManager'],
        read: ['FleetManager', 'Dispatcher', 'FinancialAnalyst']
      },
      fuelExpense: {
        write: ['FinancialAnalyst'],
        read: ['FinancialAnalyst']
      },
      analytics: {
        write: ['FleetManager', 'FinancialAnalyst'],
        read: ['FleetManager', 'FinancialAnalyst']
      }
    };
    return PERMISSIONS[moduleName]?.[accessType]?.includes(user.role) || false;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, loading, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
};
