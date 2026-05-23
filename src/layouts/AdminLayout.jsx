import React from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import { LineChart, Layers, Calculator, SlidersHorizontal, LogOut, Hexagon, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


const AdminLayout = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="h-screen flex items-center justify-center text-[var(--color-nux-text)]">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LineChart size={24} /> },
    { name: 'Proyectos', path: '/projects', icon: <Layers size={24} /> },
    { name: 'Estimaciones', path: '/estimations', icon: <Calculator size={24} /> },
    { name: 'Configuración', path: '/settings', icon: <SlidersHorizontal size={24} /> },
  ];


  // Map path to title
  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.name : 'NUXELIT';
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-nux-bg)] text-[var(--color-nux-text)] font-sans">
      {/* Sidebar - Ultra Minimalist Style (Icons Only) - Hidden on Mobile */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-20 bg-transparent flex-col items-center z-50 select-none">
        {/* Top Brand Logo - Aligned perfectly with Header (h-20) */}
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

        {/* Bottom Logout Only */}
        <div className="mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-12 h-12 rounded-full text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300 ease-out hover:translate-x-1.5"
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
          onClick={handleLogout}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-full pointer-events-auto text-red-400/70 hover:text-red-400 bg-transparent transition-all duration-300"
        >
          <LogOut size={20} />
        </button>
      </nav>

      {/* Main Content */}
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

            {/* Mobile welcome */}
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
    </div>
  );
};

export default AdminLayout;
