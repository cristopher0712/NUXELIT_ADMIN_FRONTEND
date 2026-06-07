import React, { useState } from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import { LineChart, Layers, Calculator, SlidersHorizontal, LogOut, Hexagon, Shield, Terminal, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout = () => {
  const { user, logout, logoutGlobal, loading } = useAuth();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (loading) return <div className="h-screen flex items-center justify-center text-[var(--color-nux-text)] bg-[var(--color-nux-bg)]">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LineChart size={24} /> },
    { name: 'Proyectos', path: '/projects', icon: <Layers size={24} /> },
    { name: 'Estimaciones', path: '/estimations', icon: <Calculator size={24} /> },
    { name: 'Configuración', path: '/settings', icon: <SlidersHorizontal size={24} /> },
  ];

  // Map path to title
  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    if (currentItem) return currentItem.name;
    if (location.pathname === '/audit-logs') return 'Consola de Seguridad';
    return 'NUXELIT';
  };

  const handleLocalLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
    setShowLogoutModal(false);
  };

  const handleGlobalLogout = async () => {
    setIsLoggingOut(true);
    await logoutGlobal();
    setIsLoggingOut(false);
    setShowLogoutModal(false);
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-nux-bg)] text-[var(--color-nux-text)] font-sans relative">
      
      {/* Sidebar - Ultra Minimalist Style (Icons Only) - Hidden on Mobile */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-20 bg-transparent flex-col items-center z-50 select-none">
        {/* Top Brand Logo */}
        <div className="h-20 w-full flex flex-col items-center justify-center gap-1 border-b border-transparent">
          <div className="relative flex items-center justify-center mt-2">
            <Hexagon size={32} className="text-[var(--color-nux-primary)] animate-slow-spin absolute" />
            <Hexagon size={32} className="text-[var(--color-nux-accent)]" />
          </div>
          <span className="text-[9px] font-black tracking-[0.2em] bg-gradient-to-r from-[var(--color-nux-primary)] to-[var(--color-nux-accent)] bg-clip-text text-transparent uppercase text-center mt-0.5">
            NUXELIT
          </span>
        </div>

        {/* Navigation Icons Only */}
        <nav className="flex-1 flex flex-col gap-10 mt-8">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ease-out hover:translate-x-1.5 ${
                  isActive 
                    ? 'bg-[var(--color-nux-primary)] text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]' 
                    : 'text-[var(--color-nux-text-muted)] hover:text-white hover:bg-[var(--color-nux-surface-hover)]'
                }`
              }
            >
              {item.icon}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Logout Trigger */}
        <div className="mt-auto mb-6">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center justify-center w-12 h-12 rounded-full text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300 ease-out hover:translate-x-1.5 cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut size={24} />
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar - Transparent & Floating */}
      <nav className="md:hidden fixed bottom-4 left-0 w-full h-16 bg-transparent flex items-center justify-around z-50 pb-safe pointer-events-none">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-14 rounded-full pointer-events-auto transition-all duration-300 ${
                isActive 
                  ? 'bg-[var(--color-nux-primary)]/10 text-[var(--color-nux-primary)] shadow-[0_0_15px_rgba(124,58,237,0.3)]' 
                  : 'text-[var(--color-nux-text-muted)] hover:text-white bg-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`transition-all duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                  {item.icon}
                </div>
                {isActive && <div className="w-1 h-1 bg-[var(--color-nux-primary)] rounded-full mt-1 shadow-[0_0_5px_var(--color-nux-primary)] animate-dribbble-pop"></div>}
              </>
            )}
          </NavLink>
        ))}
        <button 
          onClick={() => setShowLogoutModal(true)}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-full pointer-events-auto text-red-400/70 hover:text-red-400 bg-transparent transition-all duration-300 cursor-pointer"
        >
          <LogOut size={20} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="md:ml-20 flex-1 flex flex-col min-h-screen bg-[var(--color-nux-bg)] min-w-0">
        <header className="sticky top-0 z-40 h-16 md:h-20 flex items-center justify-between px-4 md:px-10 bg-[var(--color-nux-bg)]/80 backdrop-blur-xl border-b border-[var(--color-nux-border)] shadow-sm">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex flex-col justify-center">
              <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-normal truncate max-w-[160px] md:max-w-none">
                {getPageTitle()}
              </h2>
              <div className="hidden md:block text-[13px] font-medium text-[var(--color-nux-text-muted)] tracking-wide mt-0.5">
                Bienvenido de vuelta, <span className="text-white font-bold">{user.name}</span>
              </div>
            </div>

            {/* Mobile welcome banner */}
            <div className="flex md:hidden text-xs font-medium text-[var(--color-nux-text-muted)] items-center h-full pt-1">
              Hola, <span className="text-white font-bold ml-1 truncate max-w-[80px]">{user?.name?.split(' ')[0] || 'Admin'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-2 mr-4">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-nux-primary)] font-bold border border-[var(--color-nux-primary)]/30 bg-[var(--color-nux-primary)]/10 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(124,58,237,0.2)]">Santiago C.</span>
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-nux-accent)] font-bold border border-[var(--color-nux-accent)]/30 bg-[var(--color-nux-accent)]/10 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(6,182,212,0.2)]">Cristopher A.</span>
              <span className="text-[10px] uppercase tracking-wider text-pink-400 font-bold border border-pink-500/30 bg-pink-500/10 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(236,72,153,0.2)]">Richard G.</span>
            </div>

            {/* Terminal Security Console Button (Header Right Side) */}
            <NavLink
              to="/audit-logs"
              className={({ isActive }) =>
                `p-2.5 rounded-lg border transition-all duration-300 flex items-center justify-center relative cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-nux-primary)]/20 border-[var(--color-nux-primary)] text-[var(--color-nux-accent)] shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-[var(--color-nux-surface)] border-[var(--color-nux-border)] text-[var(--color-nux-text-muted)] hover:text-white hover:border-[var(--color-nux-primary)] hover:shadow-[0_0_10px_rgba(124,58,237,0.2)]'
                }`
              }
              title="Consola de Seguridad"
            >
              <Terminal size={18} />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-nux-accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-nux-accent)]"></span>
              </span>
            </NavLink>

            {/* Admin Badge */}
            <div className="relative group flex items-center gap-2 px-3 py-1.5 bg-[var(--color-nux-bg)] border border-[var(--color-nux-primary)]/40 rounded-lg text-[10px] font-black tracking-widest uppercase overflow-hidden cursor-default">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-nux-primary)]/0 via-[var(--color-nux-primary)]/20 to-[var(--color-nux-primary)]/0 animate-shimmer"></div>
              <Shield size={14} className="text-[var(--color-nux-primary)] relative z-10" />
              <span className="bg-gradient-to-r from-[var(--color-nux-primary)] to-[var(--color-nux-accent)] bg-clip-text text-transparent relative z-10">Admin Portal</span>
            </div>
          </div>
        </header>
        
        <div className="flex-1 px-4 md:px-10 pb-6 md:pb-10 pt-6 w-full min-w-0">
          <Outlet />
        </div>
      </main>

      {/* Premium Custom Logout Modal Overlay */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-dribbble-pop">
          <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] w-full max-w-sm rounded-xl p-6 shadow-2xl relative">
            <button 
              onClick={() => !isLoggingOut && setShowLogoutModal(false)}
              className="absolute top-4 right-4 text-[var(--color-nux-text-muted)] hover:text-white transition-colors cursor-pointer"
              disabled={isLoggingOut}
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-lg font-bold text-white">Cerrar Sesión</h3>
              <p className="text-[var(--color-nux-text-muted)] text-sm mt-1">
                ¿De qué manera deseas salir del portal?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleLocalLogout}
                disabled={isLoggingOut}
                className="w-full bg-[var(--color-nux-surface-hover)] hover:bg-[var(--color-nux-border)] border border-[var(--color-nux-border)] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                Cerrar sesión en este dispositivo
              </button>
              
              <button
                onClick={handleGlobalLogout}
                disabled={isLoggingOut}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={isLoggingOut ? 'animate-spin' : ''} />
                Cerrar sesión en todos los dispositivos
              </button>

              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="w-full bg-transparent text-[var(--color-nux-text-muted)] hover:text-white py-2 rounded-lg transition-colors text-sm font-medium mt-1 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLayout;
