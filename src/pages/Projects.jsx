import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch (err) {
      console.error('Error fetching projects:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ENTREGADO': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'EN_DESARROLLO': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'TESTING': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'EN_DISENO': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'CANCELADO': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-[var(--color-nux-text-muted)] mt-1">Gestión de clientes y entregas</p>
        </div>
        <button className="flex items-center gap-2 bg-[var(--color-nux-primary)] hover:bg-[var(--color-nux-primary-hover)] px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={20} />
          Nuevo Proyecto
        </button>
      </div>

      <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-[var(--color-nux-border)] flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-nux-text-muted)]" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por cliente o tipo..." 
              className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--color-nux-primary)] transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-nux-bg)] text-[var(--color-nux-text-muted)] border-b border-[var(--color-nux-border)]">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Servicio</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Desarrolladores</th>
                <th className="px-6 py-4 font-medium">Referido Por</th>
                <th className="px-6 py-4 font-medium">Acordado</th>
                <th className="px-6 py-4 font-medium">Pendiente</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-nux-border)]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-[var(--color-nux-text-muted)]">Cargando...</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-[var(--color-nux-text-muted)]">No hay proyectos registrados.</td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p._id} className="hover:bg-[var(--color-nux-surface-hover)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{p.client?.name}</div>
                      <div className="text-xs text-[var(--color-nux-text-muted)]">{p.client?.company || p.client?.email}</div>
                    </td>
                    <td className="px-6 py-4">{p.serviceType}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(p.status)}`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.developers && p.developers.length > 0 ? (
                        <div className="flex -space-x-2">
                          {p.developers.map((dev, i) => (
                            <img 
                              key={i} 
                              src={dev.photoUrl || 'https://via.placeholder.com/150'} 
                              alt={dev.name}
                              title={dev.name}
                              className="w-8 h-8 rounded-full border-2 border-[var(--color-nux-bg)]"
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[var(--color-nux-text-muted)] text-sm">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-nux-text-muted)] text-sm">
                      {p.referredBy || 'Desconocido'}
                    </td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(p.finances?.agreedPrice || 0)}</td>
                    <td className="px-6 py-4 font-medium text-red-400">{formatCurrency(p.finances?.pendingAmount || 0)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-[var(--color-nux-text-muted)] hover:text-white hover:bg-[var(--color-nux-bg)] rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Projects;
