import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Edit2, Trash2, Search, Calendar, FileText, ExternalLink, X, CheckCircle, Clock, Filter, Users, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [developersList, setDevelopersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevs, setSelectedDevs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [showDevDropdown, setShowDevDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', order: 'desc' }); // Default sort

  useEffect(() => {
    fetchProjects();
    fetchDevelopers();
  }, []);

  const fetchDevelopers = async () => {
    try {
      const res = await api.get('/developers');
      setDevelopersList(res.data.data);
    } catch (err) {
      console.error('Error fetching developers:', err);
    }
  };

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
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const [selectedProject, setSelectedProject] = useState(null);
  const [showPaymentsModal, setShowPaymentsModal] = useState(false);

  const PaymentsModal = ({ project, onClose }) => {
    if (!project) return null;
    const payments = project.finances?.payments || [];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-6 border-b border-[var(--color-nux-border)] flex justify-between items-center bg-gradient-to-r from-[var(--color-nux-surface)] to-[var(--color-nux-bg)]">
            <div>
              <h2 className="text-xl font-bold">Historial de Pagos</h2>
              <p className="text-sm text-[var(--color-nux-text-muted)] mt-1">{project.client?.name} - {project.serviceType}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[var(--color-nux-bg)] rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-[var(--color-nux-bg)] p-4 rounded-xl border border-[var(--color-nux-border)]">
                <p className="text-xs text-[var(--color-nux-text-muted)] uppercase font-bold tracking-wider">Acordado</p>
                <p className="text-lg font-bold mt-1 text-white">{formatCurrency(project.finances?.agreedPrice || 0)}</p>
              </div>
              <div className="bg-[var(--color-nux-bg)] p-4 rounded-xl border border-[var(--color-nux-border)]">
                <p className="text-xs text-[var(--color-nux-text-muted)] uppercase font-bold tracking-wider">Pagado</p>
                <p className="text-lg font-bold mt-1 text-green-400">{formatCurrency(project.finances?.amountPaid || 0)}</p>
              </div>
              <div className="bg-[var(--color-nux-bg)] p-4 rounded-xl border border-[var(--color-nux-border)]">
                <p className="text-xs text-[var(--color-nux-text-muted)] uppercase font-bold tracking-wider">Pendiente</p>
                <p className="text-lg font-bold mt-1 text-red-400">{formatCurrency(project.finances?.pendingAmount || 0)}</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {payments.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-nux-text-muted)]">
                  No se han registrado pagos para este proyecto.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[var(--color-nux-border)]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--color-nux-bg)] text-[var(--color-nux-text-muted)] border-b border-[var(--color-nux-border)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Fecha</th>
                        <th className="px-4 py-3 font-medium">Monto</th>
                        <th className="px-4 py-3 font-medium">Método</th>
                        <th className="px-4 py-3 font-medium text-right">Recibo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-nux-border)]">
                      {payments.map((payment, idx) => (
                        <tr key={idx} className="hover:bg-[var(--color-nux-surface-hover)] transition-colors">
                          <td className="px-4 py-4">{formatDate(payment.date)}</td>
                          <td className="px-4 py-4 font-bold text-white">{formatCurrency(payment.amount)}</td>
                          <td className="px-4 py-4">
                            <span className="text-xs bg-[var(--color-nux-bg)] px-2 py-1 rounded border border-[var(--color-nux-border)]">
                              {payment.method}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {payment.receiptUrl ? (
                              <a 
                                href={payment.receiptUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[var(--color-nux-primary)] hover:text-[var(--color-nux-primary-hover)] font-medium transition-colors"
                              >
                                Ver <ExternalLink size={14} />
                              </a>
                            ) : (
                              <span className="text-[var(--color-nux-text-muted)] text-xs italic">Sin recibo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 bg-[var(--color-nux-bg)] border-t border-[var(--color-nux-border)] flex justify-end">
            <button 
              onClick={onClose}
              className="bg-[var(--color-nux-surface)] hover:bg-[var(--color-nux-surface-hover)] border border-[var(--color-nux-border)] px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FilterDropdown = ({ label, value, options, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value);

    return (
      <div className="space-y-1.5 relative group">
        <label className="text-[10px] font-bold text-[var(--color-nux-text-muted)] uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full bg-[var(--color-nux-bg)] border rounded-lg px-4 h-10 text-sm flex items-center justify-between cursor-pointer transition-all ${
              isOpen ? 'border-[var(--color-nux-primary)] ring-2 ring-[var(--color-nux-primary)]/20' : 'border-[var(--color-nux-border)] hover:border-[var(--color-nux-primary)]'
            }`}
          >
            <span className={`truncate ${value ? 'text-white font-medium' : 'text-[var(--color-nux-text-muted)]'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown size={14} className={`text-[var(--color-nux-text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[var(--color-nux-primary)]' : ''}`} />
          </div>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
              <div className="absolute top-full left-0 mt-2 w-full bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl shadow-2xl z-20 p-2 animate-dribbble-pop origin-top">
                <div className="max-h-60 overflow-y-auto space-y-1 p-1 custom-scrollbar">
                  <div 
                    onClick={() => { onChange(''); setIsOpen(false); }}
                    className="p-2.5 hover:bg-[var(--color-nux-bg)] rounded-lg cursor-pointer text-sm text-[var(--color-nux-text-muted)] transition-colors hover:text-white"
                  >
                    {placeholder}
                  </div>
                  {options.map(opt => (
                    <div 
                      key={opt.value}
                      onClick={() => { onChange(opt.value); setIsOpen(false); }}
                      className={`p-2.5 rounded-lg cursor-pointer text-sm transition-all ${
                        value === opt.value 
                        ? 'bg-[var(--color-nux-primary)] text-white font-bold' 
                        : 'hover:bg-[var(--color-nux-primary)]/10 text-[var(--color-nux-text-muted)] hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const filteredAndSortedProjects = projects.filter(p => {
    // Client name search
    const matchesSearch = p.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.client?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Developer multi-select (at least one matches)
    const matchesDevs = selectedDevs.length === 0 || 
                       p.developers?.some(dev => selectedDevs.includes(dev._id));
    
    // Status filter
    const matchesStatus = !filterStatus || p.status === filterStatus;
    
    // Type filter
    const matchesType = !filterType || p.serviceType === filterType;
    
    // Price range filter
    let matchesPrice = true;
    if (filterPrice) {
      const price = p.finances?.agreedPrice || 0;
      if (filterPrice === '<1000') matchesPrice = price < 1000;
      else if (filterPrice === '1000-3000') matchesPrice = price >= 1000 && price <= 3000;
      else if (filterPrice === '3000-7000') matchesPrice = price >= 3000 && price <= 7000;
      else if (filterPrice === '>7000') matchesPrice = price > 7000;
    }
    
    // Month filter (based on delivery date)
    let matchesMonth = true;
    if (filterMonth) {
      const date = p.status === 'ENTREGADO' ? p.actualDeliveryDate : p.expectedDeliveryDate;
      if (date) {
        const month = new Date(date).getMonth(); // 0-11
        matchesMonth = month === parseInt(filterMonth);
      } else {
        matchesMonth = false;
      }
    }
    
    return matchesSearch && matchesDevs && matchesStatus && matchesType && matchesPrice && matchesMonth;
  }).sort((a, b) => {
    const { key, order } = sortConfig;
    let comparison = 0;

    if (key === 'date') {
      const dateA = a.status === 'ENTREGADO' ? new Date(a.actualDeliveryDate || 0) : new Date(a.expectedDeliveryDate || 0);
      const dateB = b.status === 'ENTREGADO' ? new Date(b.actualDeliveryDate || 0) : new Date(b.expectedDeliveryDate || 0);
      comparison = dateA - dateB;
    } else if (key === 'price') {
      comparison = (a.finances?.agreedPrice || 0) - (b.finances?.agreedPrice || 0);
    } else if (key === 'pending') {
      comparison = (a.finances?.pendingAmount || 0) - (b.finances?.pendingAmount || 0);
    }

    return order === 'asc' ? comparison : -comparison;
  });

  const sortOptions = [
    { key: 'date', label: 'Fecha de Entrega', icon: <Calendar size={14} /> },
    { key: 'price', label: 'Precio Acordado', icon: <FileText size={14} /> },
    { key: 'pending', label: 'Pago Pendiente', icon: <ArrowDown size={14} /> },
  ];

  const months = [
    { value: '0', label: 'Enero' }, { value: '1', label: 'Febrero' }, { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' }, { value: '4', label: 'Mayo' }, { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' }, { value: '7', label: 'Agosto' }, { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' }, { value: '10', label: 'Noviembre' }, { value: '11', label: 'Diciembre' }
  ];

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
      </div>      <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl shadow-lg overflow-hidden">
        {/* Navigation & Main Filters */}
        <div className="p-4 border-b border-[var(--color-nux-border)] space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Client Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-nux-text-muted)]" size={18} />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-nux-primary)] transition-all shadow-sm"
              />
            </div>

            {/* Developer Filter */}
            <div className="relative min-w-[200px] group">
              <div 
                onClick={() => setShowDevDropdown(!showDevDropdown)}
                className={`flex items-center gap-2 h-11 bg-[var(--color-nux-bg)] border rounded-lg px-4 text-sm cursor-pointer transition-all ${
                  showDevDropdown ? 'border-[var(--color-nux-primary)] ring-2 ring-[var(--color-nux-primary)]/20' : 'border-[var(--color-nux-border)] hover:border-[var(--color-nux-primary)]'
                }`}
              >
                <Users size={18} className={`${showDevDropdown || selectedDevs.length > 0 ? 'text-[var(--color-nux-primary)]' : 'text-[var(--color-nux-text-muted)]'}`} />
                <span className={`flex-1 truncate font-medium transition-colors ${showDevDropdown || selectedDevs.length > 0 ? 'text-white' : 'text-[var(--color-nux-text-muted)] group-hover:text-white'}`}>
                  {selectedDevs.length === 0 ? 'Desarrolladores' : `${selectedDevs.length} seleccionados`}
                </span>
                <ChevronDown size={16} className={`text-[var(--color-nux-text-muted)] transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${showDevDropdown ? 'rotate-180 text-[var(--color-nux-primary)]' : ''}`} />
              </div>
              
              {showDevDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDevDropdown(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl shadow-2xl z-20 p-2 animate-dribbble-pop origin-top">
                    <div className="max-h-60 overflow-y-auto space-y-1 p-1 custom-scrollbar">
                      {developersList.map(dev => (
                        <label key={dev._id} className="flex items-center gap-3 p-2.5 hover:bg-[var(--color-nux-bg)] rounded-lg cursor-pointer transition-all group/item">
                          <div className="relative flex items-center">
                            <input 
                              type="checkbox" 
                              checked={selectedDevs.includes(dev._id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedDevs([...selectedDevs, dev._id]);
                                else setSelectedDevs(selectedDevs.filter(id => id !== dev._id));
                              }}
                              className="peer appearance-none w-5 h-5 rounded-md border-2 border-[var(--color-nux-border)] checked:border-[var(--color-nux-primary)] checked:bg-[var(--color-nux-primary)] transition-all cursor-pointer"
                            />
                            <CheckCircle size={12} className="absolute left-1 top-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          <img src={dev.photoUrl || 'https://via.placeholder.com/150'} alt="" className="w-7 h-7 rounded-full border border-[var(--color-nux-border)]" />
                          <span className={`text-sm truncate transition-colors ${selectedDevs.includes(dev._id) ? 'text-white font-bold' : 'text-[var(--color-nux-text-muted)] group-hover/item:text-white'}`}>
                            {dev.name}
                          </span>
                        </label>
                      ))}
                    </div>
                    {selectedDevs.length > 0 && (
                      <button 
                        onClick={() => { setSelectedDevs([]); setShowDevDropdown(false); }}
                        className="w-full mt-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/5 py-2.5 rounded-lg transition-colors font-medium"
                      >
                        Limpiar selección
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sorting */}
            <div className="relative flex-shrink-0">
              <div 
                className={`flex items-center gap-2 h-11 px-4 border rounded-lg text-sm cursor-pointer transition-all ${
                  sortConfig.active 
                  ? 'bg-[var(--color-nux-primary)] border-[var(--color-nux-primary)] text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]' 
                  : 'bg-[var(--color-nux-bg)] border-[var(--color-nux-border)] text-[var(--color-nux-text-muted)] hover:border-[var(--color-nux-primary)] hover:text-white'
                }`}
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                {!sortConfig.active ? (
                  <>
                    <ArrowUpDown size={18} />
                    <span className="font-medium">Ordenar</span>
                    <ChevronDown size={16} className={`ml-auto opacity-50 transition-transform duration-300 ${showSortDropdown ? 'rotate-180' : ''}`} />
                  </>
                ) : (
                  <>
                    {sortConfig.order === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span className="font-medium">
                      {sortOptions.find(o => o.key === sortConfig.key)?.label}
                    </span>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setSortConfig({ key: 'date', order: 'desc', active: false }); 
                      }}
                      className="ml-1 p-1 hover:bg-white/20 rounded-md transition-colors"
                    >
                      <X size={14} />
                    </button>
                    <ChevronDown size={16} className={`ml-auto opacity-70 transition-transform duration-300 ${showSortDropdown ? 'rotate-180' : ''}`} />
                  </>
                )}
              </div>
              
              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl shadow-2xl z-20 p-2 animate-dribbble-pop origin-top">
                    <div className="space-y-2 p-1">
                      {sortOptions.map(option => (
                        <div key={option.key} className="space-y-1 pb-2 mb-2 border-b border-[var(--color-nux-border)] last:border-0 last:mb-0 last:pb-0">
                          <p className="px-2 py-1 text-[10px] font-bold text-[var(--color-nux-text-muted)] uppercase tracking-widest flex items-center gap-2">
                            {option.icon} {option.label}
                          </p>
                          <div className="grid grid-cols-1 gap-1">
                            <button 
                              onClick={() => { setSortConfig({ key: option.key, order: 'asc', active: true }); setShowSortDropdown(false); }}
                              className={`group w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                                sortConfig.key === option.key && sortConfig.order === 'asc' && sortConfig.active
                                ? 'bg-[var(--color-nux-primary)] text-white font-bold' 
                                : 'hover:bg-[var(--color-nux-primary)]/10 hover:text-[var(--color-nux-primary)]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <ArrowUp size={14} />
                                <span>Ascendente</span>
                              </div>
                              {sortConfig.key === option.key && sortConfig.order === 'asc' && sortConfig.active && (
                                <div 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setSortConfig({ key: 'date', order: 'desc', active: false }); 
                                  }}
                                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                                >
                                  <X size={14} />
                                </div>
                              )}
                            </button>
                            <button 
                              onClick={() => { setSortConfig({ key: option.key, order: 'desc', active: true }); setShowSortDropdown(false); }}
                              className={`group w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                                sortConfig.key === option.key && sortConfig.order === 'desc' && sortConfig.active
                                ? 'bg-[var(--color-nux-primary)] text-white font-bold' 
                                : 'hover:bg-[var(--color-nux-primary)]/10 hover:text-[var(--color-nux-primary)]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <ArrowDown size={14} />
                                <span>Descendente</span>
                              </div>
                              {sortConfig.key === option.key && sortConfig.order === 'desc' && sortConfig.active && (
                                <div 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setSortConfig({ key: 'date', order: 'desc', active: false }); 
                                  }}
                                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                                >
                                  <X size={14} />
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Toggle Advanced Filters */}
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 h-11 px-4 rounded-lg border text-sm font-medium transition-all ${
                showAdvanced 
                ? 'bg-[var(--color-nux-primary)] border-[var(--color-nux-primary)] text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]' 
                : 'bg-[var(--color-nux-bg)] border-[var(--color-nux-border)] text-[var(--color-nux-text-muted)] hover:border-[var(--color-nux-primary)] hover:text-white'
              }`}
            >
              <Filter size={18} />
              Filtros Avanzados
            </button>

            {/* Clear Advanced Filters ONLY */}
            {(filterStatus || filterType || filterPrice || filterMonth) && (
              <button 
                onClick={() => {
                  setFilterStatus(''); setFilterType(''); setFilterPrice(''); setFilterMonth('');
                }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors underline underline-offset-4 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Advanced Filters Section */}
          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-[var(--color-nux-bg)]/50 border border-[var(--color-nux-border)] rounded-xl animate-dribbble-pop origin-top">
              <FilterDropdown 
                label="Estado"
                value={filterStatus}
                placeholder="Todos los estados"
                onChange={setFilterStatus}
                options={[
                  { value: 'EN_DISENO', label: 'En Diseño' },
                  { value: 'EN_DESARROLLO', label: 'En Desarrollo' },
                  { value: 'TESTING', label: 'Testing' },
                  { value: 'ENTREGADO', label: 'Entregado' },
                  { value: 'EN_PAUSA', label: 'En Pausa' },
                  { value: 'CANCELADO', label: 'Cancelado' },
                ]}
              />

              <FilterDropdown 
                label="Tipo de Proyecto"
                value={filterType}
                placeholder="Todos los tipos"
                onChange={setFilterType}
                options={[
                  { value: 'Landing Page', label: 'Landing Page' },
                  { value: 'E-commerce', label: 'E-commerce' },
                  { value: 'App Movil', label: 'App Movil' },
                  { value: 'Software', label: 'Software' },
                  { value: 'Otro', label: 'Otro' },
                ]}
              />

              <FilterDropdown 
                label="Presupuesto"
                value={filterPrice}
                placeholder="Cualquier precio"
                onChange={setFilterPrice}
                options={[
                  { value: '<1000', label: 'Menos de $1,000' },
                  { value: '1000-3000', label: '$1,000 - $3,000' },
                  { value: '3000-7000', label: '$3,000 - $7,000' },
                  { value: '>7000', label: 'Más de $7,000' },
                ]}
              />

              <FilterDropdown 
                label="Mes de Entrega"
                value={filterMonth}
                placeholder="Cualquier mes"
                onChange={setFilterMonth}
                options={months}
              />
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead className="bg-[var(--color-nux-bg)] text-[var(--color-nux-text-muted)] border-b border-[var(--color-nux-border)]">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Servicio</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Desarrolladores</th>
                <th className="px-6 py-4 font-medium">Referido Por</th>
                <th className="px-6 py-4 font-medium">Cronograma</th>
                <th className="px-6 py-4 font-medium">Acordado</th>
                <th className="px-6 py-4 font-medium">Pendiente</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-[var(--color-nux-text-muted)]">Cargando...</td>
                </tr>
              ) : filteredAndSortedProjects.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-[var(--color-nux-text-muted)]">No se encontraron proyectos con los filtros seleccionados.</td>
                </tr>
              ) : (
                filteredAndSortedProjects.map((p) => (
                  <tr key={p._id} className="group border-b border-[var(--color-nux-border)] last:border-0 hover:bg-[var(--color-nux-surface-hover)] transition-colors">
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
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar size={12} className="text-blue-400" />
                          <span className="text-[var(--color-nux-text-muted)]">Inicio:</span>
                          <span className="font-medium">{formatDate(p.startDate)}</span>
                        </div>
                        {p.status === 'ENTREGADO' ? (
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle size={12} className="text-green-400" />
                            <span className="text-[var(--color-nux-text-muted)]">Final:</span>
                            <span className="font-medium">{formatDate(p.actualDeliveryDate)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs">
                            <Clock size={12} className="text-yellow-400" />
                            <span className="text-[var(--color-nux-text-muted)]">Entrega:</span>
                            <span className="font-medium">{formatDate(p.expectedDeliveryDate)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(p.finances?.agreedPrice || 0)}</td>
                    <td className="px-6 py-4 font-medium text-red-400">{formatCurrency(p.finances?.pendingAmount || 0)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedProject(p); setShowPaymentsModal(true); }}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-colors" 
                          title="Ver Pagos y Recibos"
                        >
                          <FileText size={16} />
                        </button>
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

      {showPaymentsModal && (
        <PaymentsModal 
          project={selectedProject} 
          onClose={() => { setShowPaymentsModal(false); setSelectedProject(null); }} 
        />
      )}
    </div>
  );
};

export default Projects;
