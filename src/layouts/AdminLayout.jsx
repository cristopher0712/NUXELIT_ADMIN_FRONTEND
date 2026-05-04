import React from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Settings, LogOut } from 'lucide-react';
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
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={24} /> },
    { name: 'Proyectos', path: '/projects', icon: <FolderKanban size={24} /> },
    { name: 'Configuración', path: '/settings', icon: <Settings size={24} /> },
  ];

  // Map path to title
  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.name : 'NUXELIT';
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-nux-bg)] text-[var(--color-nux-text)] font-sans">
      {/* Sidebar - Ultra Minimalist Style (Icons Only) */}
      <aside className="fixed top-0 left-0 h-screen w-20 bg-[var(--color-nux-bg)] border-r border-[var(--color-nux-border)] flex flex-col items-center py-8 z-50 select-none">
        {/* Top User Profile - Sober & Minimalist */}
        <div className="mb-12 relative group cursor-pointer flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-medium text-xl text-[var(--color-nux-text-muted)] transition-all duration-500 group-hover:bg-white/10 group-hover:text-white relative">
            {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
            {/* Discreet Status Dot inside the box container for stability */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[var(--color-nux-bg)] rounded-full"></div>
          </div>
          {/* Brand Name - Ultra Smooth Transition */}
          <span className="text-[9px] font-black tracking-[0.25em] text-[var(--color-nux-text-muted)] opacity-30 group-hover:opacity-100 group-hover:text-[var(--color-nux-primary)] transition-all duration-700 uppercase">
            NUXELIT
          </span>
        </div>

        {/* Navigation Icons Only */}
        <nav className="flex-1 flex flex-col gap-10">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 hover:animate-dribbble-pop ${
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
            className="flex items-center justify-center w-12 h-12 rounded-full text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300 hover:animate-dribbble-pop"
          >
            <LogOut size={24} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 flex-1 flex flex-col min-h-screen bg-[var(--color-nux-bg)]">
        <header className="sticky top-0 z-40 h-20 flex items-center justify-between px-10 bg-[var(--color-nux-bg)]/80 backdrop-blur-xl border-b border-white/5 shadow-sm">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold text-white uppercase tracking-normal">
              {getPageTitle()}
            </h2>
            <div className="h-8 w-[1px] bg-[var(--color-nux-border)] mx-2 self-center"></div>
            <div className="text-sm font-medium text-[var(--color-nux-text-muted)] flex items-center h-full pt-1.5">
              Welcome back, <span className="text-white font-bold ml-1.5">{user.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-full text-[10px] font-bold tracking-widest text-[var(--color-nux-text-muted)] uppercase">
              <span className="w-2 h-2 rounded-full bg-[var(--color-nux-primary)] animate-pulse shadow-[0_0_8px_var(--color-nux-primary)]"></span>
              Admin Portal
            </div>
          </div>
        </header>
        
        <div className="flex-1 px-10 pb-10 pt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;




