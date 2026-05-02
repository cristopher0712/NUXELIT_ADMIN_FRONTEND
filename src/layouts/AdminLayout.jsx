import React from 'react';
import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, Settings, LogOut, Code2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminLayout = () => {
  const { user, logout, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center text-nux-text">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Proyectos', path: '/projects', icon: <FolderKanban size={20} /> },
    { name: 'Desarrolladores', path: '/developers', icon: <Code2 size={20} /> },
    { name: 'Usuarios', path: '/users', icon: <Users size={20} /> },
    { name: 'Configuración', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-nux-bg)] text-[var(--color-nux-text)] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--color-nux-surface)] border-r border-[var(--color-nux-border)] flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[var(--color-nux-border)]">
          <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--color-nux-primary)] to-[var(--color-nux-accent)] bg-clip-text text-transparent">
            NUXELIT ADMIN
          </h1>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[var(--color-nux-primary)] text-white' 
                    : 'text-[var(--color-nux-text-muted)] hover:bg-[var(--color-nux-surface-hover)] hover:text-white'
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--color-nux-border)]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[var(--color-nux-surface)] border-b border-[var(--color-nux-border)] flex items-center justify-between px-8">
          <h2 className="text-lg font-medium text-[var(--color-nux-text-muted)]">Panel de Control</h2>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[var(--color-nux-primary)] flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
              {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
