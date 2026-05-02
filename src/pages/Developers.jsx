import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Edit2, Code2 } from 'lucide-react';

const Developers = () => {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    try {
      const res = await api.get('/developers');
      // For public logic with formattedCounts we'd use /developers/public
      // But in admin we probably just want all of them. Let's fetch public to show the formatted badge.
      const resStats = await api.get('/developers/public');
      setDevelopers(resStats.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Equipo de Desarrollo</h1>
          <p className="text-[var(--color-nux-text-muted)] mt-1">Gestión de perfiles y estadísticas</p>
        </div>
        <button className="flex items-center gap-2 bg-[var(--color-nux-primary)] hover:bg-[var(--color-nux-primary-hover)] px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={20} />
          Nuevo Desarrollador
        </button>
      </div>

      {loading ? (
        <div className="text-[var(--color-nux-text-muted)]">Cargando equipo...</div>
      ) : developers.length === 0 ? (
        <div className="text-[var(--color-nux-text-muted)] p-8 text-center bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl">
          No hay desarrolladores registrados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {developers.map((dev) => (
            <div key={dev.id} className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl overflow-hidden shadow-lg hover:border-[var(--color-nux-primary)] transition-colors group">
              <div className="h-32 bg-gradient-to-br from-[var(--color-nux-surface-hover)] to-[var(--color-nux-bg)] relative">
                <button className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-[var(--color-nux-primary)] rounded-full text-white backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100">
                  <Edit2 size={16} />
                </button>
              </div>
              <div className="px-6 pb-6 relative">
                <div className="w-24 h-24 rounded-2xl border-4 border-[var(--color-nux-surface)] bg-[var(--color-nux-bg)] -mt-12 overflow-hidden flex items-center justify-center">
                  {dev.photoUrl ? (
                    <img src={dev.photoUrl} alt={dev.name} className="w-full h-full object-cover" />
                  ) : (
                    <Code2 size={40} className="text-[var(--color-nux-text-muted)]" />
                  )}
                </div>
                
                <div className="mt-4">
                  <h3 className="text-xl font-bold">{dev.name}</h3>
                  <div className="inline-block mt-2 px-3 py-1 bg-[var(--color-nux-primary)]/10 border border-[var(--color-nux-primary)]/20 text-[var(--color-nux-primary)] text-xs font-semibold rounded-full">
                    {dev.formattedCount} Proyectos Entregados
                  </div>
                  <p className="mt-4 text-sm text-[var(--color-nux-text-muted)] line-clamp-3">
                    {dev.bio || 'Sin biografía.'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Developers;
