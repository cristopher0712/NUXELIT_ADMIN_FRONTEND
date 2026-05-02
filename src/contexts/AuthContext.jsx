import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nuxelit_admin_token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check expiration
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          // Typically we fetch user profile here, but for simplicity we rely on the decoded token or basic user data
          setUser({ id: decoded.id, role: 'ADMIN' });
        }
      } catch (err) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Modo de prueba (Bypass de Base de Datos)
    if (email === 'admin@nuxelit.com' && password === 'admin') {
      const fakeToken = 'fake-jwt-token-development';
      const fakeUser = { id: 'admin123', name: 'Cris', email: 'admin@nuxelit.com', role: 'SUPERADMIN' };
      localStorage.setItem('nuxelit_admin_token', fakeToken);
      setUser(fakeUser);
      return true;
    }

    try {
      // Código original para cuando tengas la base de datos
      const response = await api.post('/admin/login', { email, password });
      const { accessToken, user: userData } = response.data.data;
      localStorage.setItem('nuxelit_admin_token', accessToken);
      setUser(userData);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Credenciales inválidas');
    }
  };

  const logout = () => {
    localStorage.removeItem('nuxelit_admin_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
