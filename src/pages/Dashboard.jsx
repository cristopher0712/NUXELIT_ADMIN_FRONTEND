import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Briefcase, CheckCircle, Clock, DollarSign, Hexagon } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/projects/dashboard');
        setStats(res.data.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err.response || err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-[var(--color-nux-text-muted)]">Cargando estadísticas...</div>;
  if (!stats) return <div className="text-red-400">Error al cargar estadísticas</div>;

  // Prepare chart data
  const chartData = Object.keys(stats.deliveredLast30DaysByType).map(key => ({
    name: key,
    Proyectos: stats.deliveredLast30DaysByType[key]
  }));

  const formatCurrency = (value) => new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(value);

  const activeTypesData = stats.activeProjectsByType ? Object.keys(stats.activeProjectsByType).map(key => ({
    name: key,
    value: stats.activeProjectsByType[key]
  })) : [];

  const COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'];

  const statCards = [
    { title: 'Ingresos de este Mes', value: formatCurrency(stats.financials.monthlyRevenue || 0), icon: <DollarSign size={24} className="text-green-400"/> },
    { title: 'Proyectos Activos', value: stats.activeProjects, icon: <Briefcase size={24} className="text-blue-400"/> },
    { title: 'Entregas a Tiempo', value: `${stats.performance.onTimePercentage}%`, icon: <Clock size={24} className="text-purple-400"/> },
    { title: 'Calificación Promedio', value: `${stats.performance.averageRating} / 5`, icon: <CheckCircle size={24} className="text-yellow-400"/> },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--color-nux-primary)]/20 rounded-full blur-3xl animate-slow-spin"></div>
        
        <div className="z-10 relative group">
          {/* Softened title glow/aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-20 bg-[var(--color-nux-primary)]/20 blur-3xl rounded-full pointer-events-none animate-pulse-soft"></div>
          
          <div className="relative">
            <h1 className="text-4xl font-black bg-gradient-to-r from-white via-white to-[var(--color-nux-text-muted)] bg-clip-text text-transparent tracking-tight">
              Dashboard
            </h1>
            <p className="text-[var(--color-nux-text-muted)] mt-2 font-medium tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-nux-primary)] animate-pulse shadow-[0_0_8px_var(--color-nux-primary)]"></span>
              Resumen general de la agencia
            </p>
          </div>
        </div>

        {/* Animated Logo Widget */}
        <div className="relative w-full max-w-md h-52 flex items-center justify-center z-10 mt-8 md:mt-0">
          {/* Developer 1 - Santiago (Purple) - Purple Glow */}
          <div className="absolute left-2 top-6 animate-float bg-[var(--color-nux-bg)] border border-[var(--color-nux-primary)]/50 px-3 py-1.5 rounded-xl text-sm font-medium shadow-[0_0_15px_rgba(124,58,237,0.3)] antialiased tracking-wide">
            Santiago Castilla
          </div>
          
          {/* Developer 2 - Cristopher (Cyan) - Cyan Glow */}
          <div className="absolute right-2 top-10 animate-float-delayed bg-[var(--color-nux-bg)] border border-[var(--color-nux-accent)]/50 px-3 py-1.5 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] text-white antialiased tracking-wide">
            Cristopher Acevedo
          </div>

          {/* Developer 3 - Richard (Pink) - Pink Glow */}
          <div className="absolute left-1/2 bottom-[-15px] -translate-x-1/2 animate-float bg-[var(--color-nux-bg)] border border-pink-500/50 px-3 py-1.5 rounded-xl text-sm font-medium shadow-[0_0_15px_rgba(236,72,153,0.3)] antialiased tracking-wide">
            Richard Guzman
          </div>

          {/* Center Logo - Synchronized Glow */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center animate-pulse-glow">
              <Hexagon size={48} className="text-[var(--color-nux-primary)] animate-slow-spin absolute" />
              <Hexagon size={48} className="text-[var(--color-nux-accent)]" />
              <div className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white]"></div>
            </div>
            <div className="animate-text-glow mt-3">
              <span className="font-bold tracking-widest text-lg bg-gradient-to-r from-[var(--color-nux-primary)] to-[var(--color-nux-accent)] bg-clip-text text-transparent antialiased">
                NUXELIT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl p-6 flex items-center space-x-4 shadow-lg">
            <div className="w-12 h-12 rounded-lg bg-[var(--color-nux-surface-hover)] flex items-center justify-center">
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-nux-text-muted)]">{card.title}</p>
              <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart */}
        <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl p-6 shadow-lg lg:col-span-2 h-[450px] flex flex-col">
          <h3 className="text-lg font-medium mb-2">Entregados últimos 30 días (Por Tipo)</h3>
          {chartData.length > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27273a" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} tickMargin={10} />
                  <YAxis stroke="#94a3b8" allowDecimals={false} tick={{fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{fill: '#1e1e2d'}}
                    contentStyle={{ backgroundColor: '#14141e', borderColor: '#27273a', borderRadius: '8px' }}
                  />
                                    <Legend 
                    wrapperStyle={{ paddingTop: '20px' }} 
                    iconType="circle" 
                    iconSize={8}
                    formatter={(value) => <span className="text-xs font-medium text-[var(--color-nux-text-muted)] ml-1">{value}</span>}
                  />
                  <Bar dataKey="Proyectos" fill="var(--color-nux-primary)" radius={[4, 4, 0, 0]} name="Proyectos Entregados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--color-nux-text-muted)]">
              No hay proyectos entregados en los últimos 30 días.
            </div>
          )}
        </div>

        {/* Donut Chart */}
        <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl p-6 shadow-lg h-[450px] flex flex-col">
          <h3 className="text-lg font-medium mb-2">Tipos de Proyectos Activos</h3>
          {activeTypesData.length > 0 ? (
            <div className="flex-1 min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                  <Pie
                    data={activeTypesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {activeTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#14141e', borderColor: '#27273a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle" 
                    iconSize={8}
                    formatter={(value) => <span className="text-xs font-medium text-[var(--color-nux-text-muted)] ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--color-nux-text-muted)]">
              No hay proyectos activos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
