import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Briefcase, CheckCircle, Clock, DollarSign, Hexagon, Hourglass, Layout, Code, CheckSquare, AlertTriangle, PauseCircle, XCircle, Star, TrendingUp, Layers, Zap, Award, LineChart, Rocket, Crown, Timer } from 'lucide-react';

const ParticlesBackground = () => {
  const particles = React.useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      duration: `${Math.random() * 20 + 15}s`,
      delay: `-${Math.random() * 20}s`,
      opacity: Math.random() * 0.5 + 0.1
    }));
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bg-white rounded-full animate-particle shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        ></div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredType, setHoveredType] = useState(null);

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

  // Prepare chart data for all statuses
  const statusLabels = {
    'PENDIENTE': 'Pendiente',
    'EN_DISENO': 'Diseño',
    'EN_DESARROLLO': 'Desarrollo',
    'TESTING': 'Testing',
    'ENTREGADO': 'Entregado',
    'ENTREGADO_TARDE': 'Entregado Tarde',
    'EN_RETRASO': 'Retrasado',
    'EN_PAUSA': 'En Pausa',
    'CANCELADO': 'Cancelado'
  };

  const statusPriority = {
    'ENTREGADO': 1,
    'ENTREGADO_TARDE': 2,
    'TESTING': 3,
    'EN_DESARROLLO': 4,
    'EN_DISENO': 5,
    'EN_RETRASO': 6,
    'PENDIENTE': 7,
    'EN_PAUSA': 8,
    'CANCELADO': 9
  };

  const chartData = stats.projectsByStatus ? Object.keys(stats.projectsByStatus).map(key => ({
    name: statusLabels[key] || key,
    Proyectos: stats.projectsByStatus[key],
    originalKey: key
  })).sort((a, b) => (statusPriority[a.originalKey] || 99) - (statusPriority[b.originalKey] || 99)) : [];

  const formatCurrency = (value) => new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(value);

  const activeTypesData = stats.activeProjectsByType ? Object.keys(stats.activeProjectsByType).map(key => ({
    name: key,
    value: stats.activeProjectsByType[key]
  })) : [];

  const DONUT_COLORS = [
    { id: 'grad-purple', from: '#5b21b6', to: '#a855f7', shadow: '#9333ea', class: 'bg-gradient-to-tr from-purple-800 to-purple-400' },
    { id: 'grad-cyan', from: '#164e63', to: '#22d3ee', shadow: '#0891b2', class: 'bg-gradient-to-tr from-cyan-800 to-cyan-400' },
    { id: 'grad-orange', from: '#9a3412', to: '#fb923c', shadow: '#ea580c', class: 'bg-gradient-to-tr from-orange-800 to-orange-400' },
    { id: 'grad-emerald', from: '#065f46', to: '#34d399', shadow: '#10b981', class: 'bg-gradient-to-tr from-emerald-800 to-emerald-400' },
    { id: 'grad-rose', from: '#9f1239', to: '#fb7185', shadow: '#e11d48', class: 'bg-gradient-to-tr from-rose-800 to-rose-400' },
  ];

  const totalTypes = activeTypesData.reduce((sum, d) => sum + d.value, 0);
  let cumulativePercent = 0;

  const statCards = [
    { 
      title: 'Ingresos Totales', 
      value: formatCurrency(stats.financials.monthlyRevenue || 0), 
      icon: <LineChart size={28} />, 
      color: 'from-emerald-400 to-green-600', 
      shadow: 'rgba(16,185,129,0.3)',
      bg: 'bg-emerald-500/10',
      textAccent: 'text-emerald-400',
      bgAccent: 'bg-emerald-400',
      sub: 'Facturación Acumulada'
    },
    { 
      title: 'Total de Proyectos', 
      value: stats.totalProjects, 
      icon: <Hexagon size={28} />, 
      color: 'from-blue-400 to-cyan-500', 
      shadow: 'rgba(56,189,248,0.3)',
      bg: 'bg-blue-500/10',
      textAccent: 'text-blue-400',
      bgAccent: 'bg-blue-400',
      sub: 'Registrados'
    },
    { 
      title: 'Entregas a Tiempo', 
      value: `${stats.performance.onTimePercentage}%`, 
      icon: <Timer size={28} />, 
      color: 'from-purple-400 to-fuchsia-500', 
      shadow: 'rgba(192,132,252,0.3)',
      bg: 'bg-purple-500/10',
      textAccent: 'text-purple-400',
      bgAccent: 'bg-purple-400',
      sub: 'Tasa de Eficiencia'
    },
    { 
      title: 'Calificación', 
      value: `${stats.performance.averageRating}`, 
      icon: <Award size={28} />, 
      color: 'from-amber-400 to-orange-500', 
      shadow: 'rgba(251,191,36,0.3)',
      bg: 'bg-amber-500/10',
      textAccent: 'text-amber-400',
      bgAccent: 'bg-amber-400',
      sub: 'Promedio de Clientes',
      suffix: '/ 5.0'
    }
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

      {/* Metric Cards Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <div key={i} className="group relative bg-[#0a0a0f] border border-[var(--color-nux-border)] hover:border-[#2a2a3e] rounded-2xl p-6 overflow-hidden transition-all duration-500 hover:-translate-y-1" style={{ boxShadow: `0 10px 30px -10px ${card.shadow}` }}>
            
            {/* Background Glow Effect on hover */}
            <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${card.bg}`}></div>
            
            {/* Subtle left accent line */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-r-full opacity-50 group-hover:opacity-100 transition-opacity duration-300 ${card.bg}`}></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex flex-col space-y-3">
                <span className="text-[11px] font-bold text-[var(--color-nux-text-muted)] uppercase tracking-widest">{card.title}</span>
                <div className="flex items-baseline space-x-1">
                  <span className={`text-4xl font-black bg-gradient-to-r ${card.color} bg-clip-text text-transparent drop-shadow-sm`}>
                    {card.value}
                  </span>
                  {card.suffix && <span className="text-xs font-bold text-[var(--color-nux-text-muted)]">{card.suffix}</span>}
                </div>
                <span className={`text-[10px] font-semibold ${card.textAccent} opacity-80 uppercase tracking-wider`}>{card.sub}</span>
              </div>
              
              <div className="relative transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 origin-center">
                {/* Safe glow effect without SVG filter */}
                <div className={`absolute inset-0 ${card.bgAccent} blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 rounded-full scale-150`}></div>
                <div className={`relative z-10 ${card.textAccent}`}>
                  {card.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Bar Chart */}
        <div className="bg-gradient-to-br from-[#050508] via-[#12121a] to-[#050508] animate-gradient-shift border border-[var(--color-nux-border)] rounded-xl p-6 shadow-2xl lg:col-span-2 h-[450px] flex flex-col relative overflow-hidden">
          
          {/* Animated Particles (Stars) Background */}
          <ParticlesBackground />

          {/* Ambient passive background orbs */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-nux-primary)]/10 rounded-full blur-[80px] animate-slow-spin"></div>
            <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-purple-900/10 rounded-full blur-[60px] animate-float-delayed"></div>
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <h3 className="text-lg font-medium mb-2 text-white/90 drop-shadow-md">Estado General de Proyectos</h3>
          {chartData.length > 0 ? (
            (() => {
              const totalProjects = chartData.reduce((acc, curr) => acc + curr.Proyectos, 0);
              
              let step = 2;
              if (totalProjects > 100) step = 20;
              else if (totalProjects > 50) step = 10;
              else if (totalProjects > 20) step = 5;

              const remainder = totalProjects % step;
              let topGridValue = remainder === 0 ? totalProjects : totalProjects + (step - remainder);
              
              // Ensure there's always a step of headroom above the highest possible stack
              if (topGridValue === totalProjects) {
                topGridValue += step;
              }

              const safeTopValue = topGridValue === 0 ? step : topGridValue;
              const numGridLines = Math.max(safeTopValue / step, 1);

              return (
                <div className="flex flex-col h-full">
                  <div className="relative flex-1 mt-8 mb-6 border-l-2 border-b-2 border-[#27273a] flex items-end ml-4">
                  {/* Horizontal grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[...Array(numGridLines)].map((_, i) => {
                      const val = safeTopValue - (i * step);
                      return (
                        <div key={i} className="w-full border-t border-[#27273a] opacity-40 h-0 relative">
                          <span className="absolute -left-8 -top-3 text-[10px] text-[var(--color-nux-text-muted)] font-bold">
                            {val}
                          </span>
                        </div>
                      );
                    })}
                    {/* The 0 line at the very bottom */}
                    <div className="w-full h-0 relative">
                      <span className="absolute -left-8 -top-3 text-[10px] text-[var(--color-nux-text-muted)] font-bold">
                        0
                      </span>
                    </div>
                  </div>

                  {/* Bars Container */}
                  <div className="relative w-full h-full flex justify-around items-end z-10 px-2 sm:px-6">
                    {chartData.map((entry, index) => {
                      let config;
                      switch(entry.originalKey) {
                        case 'PENDIENTE': config = { bgSolid: 'bg-gradient-to-t from-gray-600 to-gray-400', glow: 'shadow-[0_0_15px_rgba(156,163,175,0.4)]' }; break;
                        case 'EN_DISENO': config = { bgSolid: 'bg-gradient-to-t from-purple-800 to-purple-400', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]' }; break;
                        case 'EN_DESARROLLO': config = { bgSolid: 'bg-gradient-to-t from-blue-800 to-blue-400', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]' }; break;
                        case 'TESTING': config = { bgSolid: 'bg-gradient-to-t from-yellow-700 to-yellow-400', glow: 'shadow-[0_0_15px_rgba(234,179,8,0.4)]' }; break;
                        case 'ENTREGADO': config = { bgSolid: 'bg-gradient-to-t from-emerald-800 to-emerald-400', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]' }; break;
                        case 'ENTREGADO_TARDE': config = { bgSolid: 'bg-gradient-to-t from-orange-800 to-orange-400', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.4)]' }; break;
                        case 'EN_RETRASO': config = { bgSolid: 'bg-gradient-to-t from-red-800 to-red-400', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]' }; break;
                        case 'EN_PAUSA': config = { bgSolid: 'bg-gradient-to-t from-gray-700 to-gray-500', glow: 'shadow-[0_0_15px_rgba(107,114,128,0.4)]' }; break;
                        case 'CANCELADO': config = { bgSolid: 'bg-gradient-to-t from-rose-900 to-rose-500', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]' }; break;
                        default: config = { bgSolid: 'bg-gradient-to-t from-gray-600 to-white', glow: 'shadow-[0_0_15px_rgba(255,255,255,0.4)]' }; break;
                      }

                      const heightPercent = entry.Proyectos === 0 ? 0 : (entry.Proyectos / safeTopValue) * 100;

                      return (
                        <div key={index} className="relative h-full flex flex-col justify-end items-center group w-full max-w-[40px] md:max-w-[50px] mx-1">
                          
                          {/* Floating Interactive Tooltip */}
                          <div className="absolute bottom-[calc(100%+15px)] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] px-4 py-3 rounded-xl shadow-2xl z-30 pointer-events-none min-w-[120px] text-center">
                            <div className="text-3xl font-black text-white">{entry.Proyectos}</div>
                            <div className="text-[10px] font-bold text-[var(--color-nux-text-muted)] uppercase tracking-widest mt-1">{entry.name}</div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--color-nux-bg)] border-b border-r border-[var(--color-nux-border)] rotate-45"></div>
                          </div>

                          {/* Animated Neon Bar */}
                          <div 
                            className={`w-full rounded-t-xl transition-all duration-500 ease-out group-hover:brightness-150 group-hover:scale-x-125 group-hover:-translate-y-2 cursor-pointer relative ${config.bgSolid} ${entry.Proyectos > 0 ? config.glow : ''}`}
                            style={{ height: entry.Proyectos === 0 ? '4px' : `calc(${heightPercent}% + 4px)` }}
                          >
                            {/* Inner highlight for 3D effect */}
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/20 to-transparent rounded-t-xl opacity-50 pointer-events-none"></div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Custom Legend */}
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-2 pt-5 border-t border-[var(--color-nux-border)]">
                  {chartData.map((entry, index) => {
                    let circleColor;
                    switch(entry.originalKey) {
                      case 'PENDIENTE': circleColor = 'bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.6)]'; break;
                      case 'EN_DISENO': circleColor = 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]'; break;
                      case 'EN_DESARROLLO': circleColor = 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'; break;
                      case 'TESTING': circleColor = 'bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.6)]'; break;
                      case 'ENTREGADO': circleColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'; break;
                      case 'ENTREGADO_TARDE': circleColor = 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]'; break;
                      case 'EN_RETRASO': circleColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'; break;
                      case 'EN_PAUSA': circleColor = 'bg-gray-500 shadow-[0_0_8px_rgba(107,114,128,0.6)]'; break;
                      case 'CANCELADO': circleColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'; break;
                      default: circleColor = 'bg-white'; break;
                    }
                    return (
                      <div key={`legend-${index}`} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${circleColor}`}></div>
                        <span className="text-[10px] font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">{entry.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })()
          ) : (
            <div className="relative z-10 h-full flex items-center justify-center text-[var(--color-nux-text-muted)]">
              No hay proyectos registrados.
            </div>
          )}
          </div>
        </div>

        {/* Donut Chart */}
        {/* Donut Chart */}
        <div className="bg-gradient-to-br from-[#050508] via-[#12121a] to-[#050508] animate-gradient-shift border border-[var(--color-nux-border)] rounded-xl p-6 shadow-2xl h-[450px] flex flex-col relative overflow-hidden">
          <ParticlesBackground />
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--color-nux-primary)]/10 rounded-full blur-[80px] animate-slow-spin"></div>
            <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-purple-900/10 rounded-full blur-[60px] animate-float-delayed"></div>
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <h3 className="text-lg font-medium mb-2 text-white/90 drop-shadow-md">Tipos de Proyectos</h3>
            {activeTypesData.length > 0 ? (
              <div className="flex-1 flex flex-col">
                {/* Horizontal Progress Bars */}
                <div className="flex-1 flex flex-col justify-center space-y-6 mt-2 w-full px-2 lg:px-6 relative z-10">
                  {activeTypesData.sort((a,b) => b.value - a.value).map((entry, index) => {
                    const percent = totalTypes > 0 ? (entry.value / totalTypes) * 100 : 0;
                    const color = DONUT_COLORS[index % DONUT_COLORS.length];
                    
                    return (
                      <div key={index} className="w-full group cursor-pointer">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-widest group-hover:text-white transition-colors duration-300">
                            {entry.name}
                          </span>
                          <span className="text-lg font-black text-white drop-shadow-md">
                            {entry.value}
                          </span>
                        </div>
                        {/* Track */}
                        <div className="w-full h-3 bg-[#0f0f17] rounded-full border border-[var(--color-nux-border)] shadow-inner relative overflow-hidden">
                          {/* Progress */}
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${color.class} relative group-hover:brightness-150`}
                            style={{ 
                              width: `${percent}%`,
                              filter: `drop-shadow(0 0 8px ${color.shadow})`
                            }}
                          >
                            {/* Inner highlight for 3D effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full opacity-50 pointer-events-none"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>


              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[var(--color-nux-text-muted)]">
                No hay proyectos activos.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
