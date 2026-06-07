import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { setAccessToken, getAccessToken } from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt silent token refresh on page mount/reload
    const initializeAuth = async () => {
      try {
        const response = await api.post('/admin/refresh');
        const { accessToken } = response.data.data;
        
        // Save access token in memory
        setAccessToken(accessToken);
        
        // Decode token to retrieve user details
        const decoded = jwtDecode(accessToken);
        setUser({
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role
        });
      } catch (err) {
        // User session does not exist or has expired, fail silently
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Handle global expired session events
    const handleAuthExpired = () => {
      setAccessToken(null);
      setUser(null);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  /**
   * Login Step 1: Submit email & password
   * Returns state (REQUIRES_2FA or REQUIRES_SETUP) along with a preAuthToken
   */
  const loginStep1 = async (email, password) => {
    try {
      const response = await api.post('/admin/login', { email, password });
      return response.data.data; // { status, preAuthToken, qrCodeDataUrl, secret }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Error en las credenciales');
    }
  };

  /**
   * Login Step 2 (Option A): Verify 6-digit TOTP code
   */
  const verifyTOTP = async (preAuthToken, code) => {
    try {
      const response = await api.post('/admin/verify-totp', { preAuthToken, code });
      const { accessToken, user: userData } = response.data.data;
      
      setAccessToken(accessToken);
      setUser(userData);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Código de verificación inválido');
    }
  };

  /**
   * Login Step 2 (Option B): Complete first-time 2FA Setup
   */
  const setupTOTP = async (preAuthToken, code, newPassword) => {
    try {
      const response = await api.post('/admin/setup-totp', { preAuthToken, code, newPassword });
      const { accessToken, user: userData } = response.data.data;
      
      setAccessToken(accessToken);
      setUser(userData);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Código de confirmación incorrecto');
    }
  };

  /**
   * Logout from local device
   */
  const logout = async () => {
    try {
      await api.post('/admin/logout');
    } catch (err) {
      // Fail silently on logout errors
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  /**
   * Logout from all devices globally
   */
  const logoutGlobal = async () => {
    try {
      await api.post('/admin/logout-global');
    } catch (err) {
      // Fail silently
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginStep1, 
      verifyTOTP, 
      setupTOTP, 
      logout, 
      logoutGlobal 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
