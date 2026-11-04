import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize auth state directly from persistent storage on initial bundle load
  const storedToken = localStorage.getItem('smartroute_token') || localStorage.getItem('sr_access_token');
  const storedUserRaw = localStorage.getItem('smartroute_user') || localStorage.getItem('sr_user');
  let parsedStoredUser = null;
  if (storedUserRaw) {
    try {
      parsedStoredUser = JSON.parse(storedUserRaw);
    } catch {
      parsedStoredUser = null;
    }
  }
  const storedUser = parsedStoredUser;

  const [token, setToken] = useState(storedToken || null);
  const [user, setUser] = useState(storedUser ? (typeof storedUser === 'object' ? storedUser : JSON.parse(storedUser)) : null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!storedToken);
  const [isLoading, setIsLoading] = useState(true);

  // Background profile synchronization & session maintenance
  useEffect(() => {
    const activeToken = localStorage.getItem('smartroute_token') || localStorage.getItem('sr_access_token');
    if (activeToken) {
      // Synchronize storage keys across smartroute_* and legacy sr_*
      if (!localStorage.getItem('smartroute_token')) {
        localStorage.setItem('smartroute_token', activeToken);
      }
      if (!localStorage.getItem('sr_access_token')) {
        localStorage.setItem('sr_access_token', activeToken);
      }
      const rawUser = localStorage.getItem('smartroute_user') || localStorage.getItem('sr_user');
      if (rawUser && !localStorage.getItem('smartroute_user')) {
        localStorage.setItem('smartroute_user', rawUser);
      }

      // Background profile validation to keep permissions and name fresh
      api.get('/auth/profile')
        .then((res) => {
          const profileUser = res.user || res.data?.user;
          if (res.success && profileUser) {
            setUser(profileUser);
            localStorage.setItem('smartroute_user', JSON.stringify(profileUser));
            localStorage.setItem('sr_user', JSON.stringify(profileUser));
          }
        })
        .catch((err) => {
          // IMPORTANT: Never clear persistent storage on network errors, server restarts,
          // or offline states. The authenticated session remains permanently active in localStorage!
          console.warn('[AuthContext] Background profile sync deferred:', err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const persistSession = (userData, accessToken, refreshToken) => {
    if (!accessToken || !userData) return userData;

    // Primary SmartRoute persistent storage keys
    localStorage.setItem('smartroute_token', accessToken);
    localStorage.setItem('smartroute_user', JSON.stringify(userData));
    if (refreshToken) {
      localStorage.setItem('smartroute_refresh_token', refreshToken);
    }

    // Backward-compatible sr_* keys
    localStorage.setItem('sr_access_token', accessToken);
    localStorage.setItem('sr_user', JSON.stringify(userData));
    if (refreshToken) {
      localStorage.setItem('sr_refresh_token', refreshToken);
    }

    setToken(accessToken);
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);

    return userData;
  };

  const login = async (credentials, endpoint = '/auth/login') => {
    const res = await api.post(endpoint, credentials);

    // If backend requires OTP (e.g. Passenger login 2-step flow)
    if (res.requireOtp) {
      return res;
    }

    const accessToken = res.accessToken || res.tokens?.accessToken || res.data?.tokens?.accessToken || res.data?.accessToken;
    const refToken = res.refreshToken || res.tokens?.refreshToken || res.data?.tokens?.refreshToken || res.data?.refreshToken;
    const userData = res.user || res.data?.user;

    if (res.success && accessToken && userData) {
      persistSession(userData, accessToken, refToken);
      return userData;
    }
    throw new Error(res.error || 'Authentication failed. Please verify credentials.');
  };

  const verifyLoginOtp = async (mobile, otp) => {
    const res = await api.post('/auth/login/verify-otp', { mobile, otp });
    const accessToken = res.accessToken || res.tokens?.accessToken || res.data?.tokens?.accessToken || res.data?.accessToken;
    const refToken = res.refreshToken || res.tokens?.refreshToken || res.data?.tokens?.refreshToken || res.data?.refreshToken;
    const userData = res.user || res.data?.user;

    if (res.success && accessToken && userData) {
      persistSession(userData, accessToken, refToken);
      return userData;
    }
    throw new Error(res.error || 'OTP verification failed. Please check the code.');
  };

  const loginWithOtp = async (identifier, otp) => {
    return verifyLoginOtp(identifier, otp);
  };

  const setAuthSession = (userData, accessToken, refreshToken) => {
    return persistSession(userData, accessToken, refreshToken);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // Ignore network errors on logout
    }

    // Explicitly purge persistent credentials only when user intentionally logs out
    localStorage.removeItem('smartroute_token');
    localStorage.removeItem('smartroute_user');
    localStorage.removeItem('smartroute_refresh_token');
    localStorage.removeItem('sr_access_token');
    localStorage.removeItem('sr_user');
    localStorage.removeItem('sr_refresh_token');

    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role || 'guest',
        isAuthenticated: Boolean(token && user) || isAuthenticated,
        isLoading,
        loading: isLoading,
        login,
        verifyLoginOtp,
        loginWithOtp,
        logout,
        setAuthSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
