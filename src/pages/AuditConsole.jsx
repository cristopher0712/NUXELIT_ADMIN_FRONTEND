import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Terminal, Search, RefreshCw, Filter, ShieldAlert, Cpu, Globe, User, Calendar, ChevronLeft, ChevronRight, CheckCircle2, AlertOctagon, PowerOff } from 'lucide-react';

const AuditConsole = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const actionTypes = [
    { value: '', label: 'TODAS LAS ACCIONES' },
    { value: 'LOGIN_SUCCESS', label: 'Inicio Sesión (Éxito)' },
    { value: 'LOGIN_FAILED', label: 'Inicio Sesión (Fallo)' },
    { value: 'LOGIN_FAILED_2FA', label: '2FA Incorrecto' },
    { value: 'ACCOUNT_LOCKED', label: 'Cuenta Bloqueada' },
    { value: 'LOGOUT', label: 'Cierre Sesión (Local)' },
    { value: 'GLOBAL_LOGOUT', label: 'Cierre Sesión (Global)' },
    { value: 'USER_CREATED_CLI', label: 'Usuario Creado (CLI)' },
    { value: 'PASSWORD_RESET_CLI', label: 'Contraseña Reseteada (CLI)' },
    { value: '2FA_RESET_CLI', label: '2FA Reseteado (CLI)' },
  ];

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/audit-logs', {
        params: {
          action: actionFilter,
          search: searchQuery,
          page,
          limit: 15
        }
      });
      const { logs, pages, total } = response.data.data;
      setLogs(logs);
      setTotalPages(pages || 1);
      setTotal(total || 0);
    } catch (error) {
      console.error('Error fetching logs', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  // Resolve status tags
  const getLogTagDetails = (action) => {
    if (action.includes('SUCCESS') || action.includes('CREATED') || action.includes('ACTIVATED')) {
      return {
        color: 'text-green-400 bg-green-500/10 border-green-500/30',
        icon: <CheckCircle2 size={12} className="text-green-400" />
      };
    }
    if (action.includes('FAIL') || action.includes('BLOCKED') || action.includes('DEACTIVATED')) {
      return {
        color: 'text-red-400 bg-red-500/10 border-red-500/30',
        icon: <ShieldAlert size={12} className="text-red-400 animate-pulse" />
      };
    }
    return {
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      icon: <PowerOff size={12} className="text-yellow-400" />
    };
  };

  return (
    <div className="flex flex-col gap-6 animate-dribbble-pop font-mono text-sm select-none max-w-7xl mx-auto w-full">
      
      {/* Console Filter Dashboard */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch gap-4 bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl p-5 shadow-lg">
        
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3 bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg px-3 py-1.5 focus-within:border-[var(--color-nux-primary)] transition-all">
          <Search size={18} className="text-[var(--color-nux-text-muted)]" />
          <input 
            type="text"
            placeholder="Filtrar por IP o Correo..."
            className="bg-transparent text-white focus:outline-none w-full text-xs font-mono"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="hidden" />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Action Filter */}
          <div className="flex items-center gap-2 bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg px-3 py-1.5">
            <Filter size={14} className="text-[var(--color-nux-text-muted)]" />
            <select
              className="bg-transparent text-[var(--color-nux-text-muted)] hover:text-white focus:outline-none text-xs font-mono pr-2 cursor-pointer"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              {actionTypes.map((type) => (
                <option key={type.value} value={type.value} className="bg-[var(--color-nux-surface)] text-white">
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2.5 bg-[var(--color-nux-surface-hover)] border border-[var(--color-nux-border)] hover:border-[var(--color-nux-primary)] text-white hover:text-[var(--color-nux-accent)] hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] rounded-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 text-xs font-bold"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refrescar</span>
          </button>
        </div>

      </div>

      {/* Main Terminal Viewport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Logs terminal box */}
        <div className="lg:col-span-2 flex flex-col bg-[#020205] border border-[var(--color-nux-border)] rounded-xl shadow-2xl overflow-hidden relative">
          
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between bg-[var(--color-nux-surface)] px-4 py-2 border-b border-[var(--color-nux-border)]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
              <span className="text-[11px] text-[var(--color-nux-text-muted)] font-mono ml-2">root@nuxelit-security-core:~# tail -n 50 /var/log/audit.log</span>
            </div>
            <div className="text-[10px] text-[var(--color-nux-accent)] bg-[var(--color-nux-accent)]/10 px-2 py-0.5 rounded border border-[var(--color-nux-accent)]/20 animate-pulse font-bold">
              SYS_SECURE_ON
            </div>
          </div>

          {/* Terminal Console Output */}
          <div className="p-4 overflow-y-auto max-h-[600px] min-h-[450px] custom-scrollbar flex flex-col gap-1.5 font-mono text-xs selection:bg-[var(--color-nux-primary)]/40 selection:text-white">
            {isLoading && logs.length === 0 ? (
              <div className="flex items-center justify-center min-h-[400px] text-[var(--color-nux-text-muted)]">
                <RefreshCw size={24} className="animate-spin text-[var(--color-nux-accent)] mr-2" />
                <span>Cargando flujos de auditoría...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-[var(--color-nux-text-muted)] gap-2">
                <AlertOctagon size={32} className="text-yellow-400/80" />
                <span>No se registraron firmas de eventos de seguridad.</span>
              </div>
            ) : (
              logs.map((log) => {
                const isSelected = selectedLog?._id === log._id;
                const tag = getLogTagDetails(log.action);
                const userText = log.userId ? `${log.userId.name}` : log.email || 'Consola';
                
                return (
                  <div
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-2.5 rounded border cursor-pointer transition-all duration-150 flex flex-col gap-1.5 ${
                      isSelected 
                        ? 'bg-[var(--color-nux-primary)]/15 border-[var(--color-nux-primary)] shadow-[0_0_10px_rgba(124,58,237,0.15)]' 
                        : 'bg-[#05050c]/60 border-transparent hover:bg-[var(--color-nux-surface-hover)]/30 hover:border-[var(--color-nux-border)]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--color-nux-text-muted)]">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="text-white font-bold">{userText}</span>
                      </div>
                      
                      <div className={`px-2 py-0.5 rounded-full border text-[10px] flex items-center gap-1 font-bold ${tag.color}`}>
                        {tag.icon}
                        <span>{log.action}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-[11px] text-[var(--color-nux-text-muted)]">
                      <span>IP: <span className="text-slate-300 font-bold">{log.ipAddress}</span></span>
                      <span className="truncate max-w-[200px] md:max-w-xs">{log.userAgent}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Terminal Pagination Footer */}
          <div className="flex justify-between items-center bg-[var(--color-nux-surface)] px-4 py-3 border-t border-[var(--color-nux-border)] text-xs text-[var(--color-nux-text-muted)]">
            <span>Total: <span className="text-white font-bold">{total}</span> eventos</span>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] hover:border-[var(--color-nux-primary)] rounded disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span>Página <span className="text-white font-bold">{page}</span> de <span className="text-white font-bold">{totalPages}</span></span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] hover:border-[var(--color-nux-primary)] rounded disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>

        {/* Security Inspector (Selected Log Detail panel) */}
        <div className="flex flex-col bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl p-5 shadow-lg gap-5 min-h-[500px]">
          <h3 className="text-white font-bold text-base flex items-center gap-2 border-b border-[var(--color-nux-border)] pb-3">
            <Cpu size={18} className="text-[var(--color-nux-accent)] animate-pulse" />
            Inspector de Firmas
          </h3>

          {selectedLog ? (
            <div className="flex flex-col gap-5 text-xs animate-dribbble-pop">
              
              {/* Event timestamp block */}
              <div className="flex flex-col bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg p-3">
                <span className="text-[10px] text-[var(--color-nux-text-muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Marca de Tiempo
                </span>
                <span className="text-white font-bold">{new Date(selectedLog.timestamp).toLocaleString()}</span>
              </div>

              {/* User block */}
              <div className="flex flex-col bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg p-3">
                <span className="text-[10px] text-[var(--color-nux-text-muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User size={12} /> Usuario Emisor
                </span>
                {selectedLog.userId ? (
                  <>
                    <span className="text-white font-bold">{selectedLog.userId.name}</span>
                    <span className="text-[var(--color-nux-text-muted)]">{selectedLog.userId.email}</span>
                    <span className="text-[9px] font-mono text-[var(--color-nux-primary)] mt-1">ID: {selectedLog.userId._id}</span>
                  </>
                ) : (
                  <>
                    <span className="text-white font-bold">{selectedLog.email || 'Consola CLI'}</span>
                    <span className="text-[var(--color-nux-text-muted)]">Sin sesión iniciada / Local</span>
                  </>
                )}
              </div>

              {/* IP block */}
              <div className="flex flex-col bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg p-3">
                <span className="text-[10px] text-[var(--color-nux-text-muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Globe size={12} /> Dirección IP Origen
                </span>
                <span className="text-[var(--color-nux-accent)] font-bold text-sm tracking-wider">{selectedLog.ipAddress}</span>
              </div>

              {/* User Agent Block */}
              <div className="flex flex-col bg-[var(--color-nux-bg)]/80 border border-[var(--color-nux-border)] rounded-lg p-3 max-w-full">
                <span className="text-[10px] text-[var(--color-nux-text-muted)] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Terminal size={12} /> Agente de Usuario (Dispositivo)
                </span>
                <p className="text-slate-300 break-words font-mono leading-relaxed text-[11px]">{selectedLog.userAgent}</p>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-nux-text-muted)] text-center p-4">
              <Terminal size={32} className="text-[var(--color-nux-text-muted)] opacity-30 mb-2 animate-bounce" />
              <span>Selecciona un registro de auditoría en la terminal para inspeccionar los detalles de seguridad.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AuditConsole;
