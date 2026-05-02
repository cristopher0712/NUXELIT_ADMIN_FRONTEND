import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-nux-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--color-nux-primary)] to-[var(--color-nux-accent)] bg-clip-text text-transparent">
            NUXELIT
          </h1>
          <p className="text-[var(--color-nux-text-muted)] mt-2">Panel de Administración</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--color-nux-text-muted)] mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-nux-primary)] focus:ring-1 focus:ring-[var(--color-nux-primary)] transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nuxelit.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-nux-text-muted)] mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-nux-primary)] focus:ring-1 focus:ring-[var(--color-nux-primary)] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--color-nux-primary)] hover:bg-[var(--color-nux-primary-hover)] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
