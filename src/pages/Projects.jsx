import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';
import { Plus, Edit2, Trash2, Search, Calendar, FileText, ExternalLink, X, CheckCircle, Clock, Filter, Users, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Save, MoreHorizontal } from 'lucide-react';

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
  const [filterLate, setFilterLate] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [showDevDropdown, setShowDevDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', order: 'desc' }); // Default sort

  // Edit States
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editedProject, setEditedProject] = useState(null);

  // Details Modal States
  const [detailsModalProject, setDetailsModalProject] = useState(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const startEditing = (p) => {
    setEditingProjectId(p._id);
    setEditedProject({
      ...p,
      client: { ...p.client },
      developers: p.developers ? p.developers.map(d => d._id) : []
    });
  };

  const cancelEditing = () => {
    setEditingProjectId(null);
    setEditedProject(null);
  };

  const saveEditing = async () => {
    try {
      await api.put(`/projects/${editingProjectId}`, {
        client: editedProject.client,
        serviceType: editedProject.serviceType,
        status: editedProject.status,
        developers: editedProject.developers,
        startDate: editedProject.startDate,
        expectedDeliveryDate: editedProject.expectedDeliveryDate,
        actualDeliveryDate: editedProject.actualDeliveryDate
      });
      fetchProjects();
      setEditingProjectId(null);
      setEditedProject(null);
    } catch (err) {
      console.error('Error saving project:', err);
      // Fallback: alert on error
      alert('Error al guardar el proyecto. Inténtalo de nuevo.');
    }
  };

  const saveDetails = async () => {
    try {
      await api.put(`/projects/${detailsModalProject._id}`, {
        client: detailsModalProject.client,
        serviceType: detailsModalProject.serviceType,
        details: detailsModalProject.details
      });
      fetchProjects();
      setIsEditingDetails(false);
    } catch (err) {
      console.error('Error saving details:', err);
      alert('Error al guardar los detalles. Inténtalo de nuevo.');
    }
  };

  useEffect(() => {
    fetchProjects();
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
      setLoading(true);
      // Fetch developers first to have them available for assignment
      const developersRes = await api.get('/developers');
      const devs = developersRes.data.data;
      setDevelopersList(devs);

      const res = await api.get('/projects');
      
      // Assign random developers to real projects that don't have them
      const allProjectsList = res.data.data.map(p => {
        if (!p.developers || p.developers.length === 0) {
          const numDevs = Math.floor(Math.random() * 2) + 1; // 1 to 2 devs
          const shuffled = [...devs].sort(() => 0.5 - Math.random());
          p.developers = shuffled.slice(0, numDevs);
        }
        return p;
      });

      setProjects(allProjectsList);
    } catch (err) {
      console.error('Error fetching projects:', err.response || err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDIENTE': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
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
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-[var(--color-nux-border)] flex justify-between items-center bg-gradient-to-r from-[var(--color-nux-surface)] to-[var(--color-nux-bg)]">
            <div>
              <h2 className="text-xl font-bold">Historial de Pagos</h2>
              <p className="text-sm text-[var(--color-nux-text-muted)] mt-1">{project.client?.name} - {project.serviceType}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[var(--color-nux-bg)] rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
                <div className="overflow-x-auto rounded-xl border border-[var(--color-nux-border)]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[var(--color-nux-bg)] text-[var(--color-nux-text-muted)] border-b border-[var(--color-nux-border)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Fecha</th>
                        <th className="px-4 py-3 font-medium">Monto</th>
                        <th className="px-4 py-3 font-medium">Método</th>
                        <th className="px-4 py-3 font-medium">Recibo</th>
                        <th className="px-4 py-3 font-medium text-center">Acciones</th>
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
                          <td className="px-4 py-4">
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
                          <td className="px-4 py-4 text-center">
                            <div className="w-10 mx-auto flex justify-center">
                              {idx === payments.length - 1 ? (
                                <button className="p-2 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer">
                                  <Trash2 size={15} />
                                </button>
                              ) : (
                                <div className="w-8"></div>
                              )}
                            </div>
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
      <div className="space-y-1.5 relative group select-none">
        <label className="text-[10px] font-bold text-[var(--color-nux-text-muted)] uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
          <div 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full bg-[var(--color-nux-bg)] border rounded-lg px-4 h-10 text-sm flex items-center justify-between cursor-pointer transition-all duration-200 ${
              isOpen || value 
              ? 'border-[var(--color-nux-primary)] bg-[var(--color-nux-primary)]/10 text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] ring-1 ring-[var(--color-nux-primary)]/30' 
              : 'border-[var(--color-nux-border)] text-[var(--color-nux-text-muted)] hover:border-[var(--color-nux-primary)] hover:bg-[var(--color-nux-primary)]/10 hover:text-white'
            }`}
          >
            <span className={`truncate ${value || isOpen ? 'text-white font-medium' : 'text-[var(--color-nux-text-muted)]'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown size={14} className={`text-[var(--color-nux-text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[var(--color-nux-primary)]' : ''}`} />
          </div>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
              <div className="absolute top-full left-0 mt-2 w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] rounded-xl shadow-2xl z-[100] p-2 animate-dribbble-pop origin-top">
                <div className="max-h-60 overflow-y-auto space-y-1 p-1 custom-scrollbar bg-[var(--color-nux-bg)] rounded-lg" data-lenis-prevent="true">
                  <div 
                    onClick={() => { onChange(''); setIsOpen(false); }}
                    className="p-2.5 hover:bg-white/5 rounded-lg cursor-pointer text-sm text-[var(--color-nux-text-muted)] transition-all duration-300 ease-out hover:text-white hover:translate-x-1"
                  >
                    {placeholder}
                  </div>
                  {options.map(opt => (
                    <div 
                      key={opt.value}
                      onClick={() => { onChange(opt.value); setIsOpen(false); }}
                      className={`p-2.5 rounded-lg cursor-pointer text-sm transition-all duration-300 ease-out hover:translate-x-1 ${
                        value === opt.value 
                        ? 'bg-[var(--color-nux-primary)] text-white font-bold shadow-[0_0_10px_rgba(124,58,237,0.3)]' 
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
    const matchesSearch = p.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.client?.company?.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesDevs = true;
    if (selectedDevs.length === 1) {
      matchesDevs = p.developers?.some(dev => dev._id === selectedDevs[0]);
    } else if (selectedDevs.length > 1) {
      const projectDevIds = p.developers?.map(d => d._id) || [];
      matchesDevs = projectDevIds.length === selectedDevs.length && 
                    selectedDevs.every(id => projectDevIds.includes(id));
    }
    const matchesStatus = !filterStatus || p.status === filterStatus;
    const matchesType = !filterType || p.serviceType === filterType;
    let matchesPrice = true;
    if (filterPrice) {
      const price = p.finances?.agreedPrice || 0;
      if (filterPrice === '<1000') matchesPrice = price < 1000;
      else if (filterPrice === '1000-3000') matchesPrice = price >= 1000 && price <= 3000;
      else if (filterPrice === '3000-7000') matchesPrice = price >= 3000 && price <= 7000;
      else if (filterPrice === '>7000') matchesPrice = price > 7000;
    }
    let matchesMonth = true;
    if (filterMonth) {
      const date = p.status === 'ENTREGADO' ? p.actualDeliveryDate : p.expectedDeliveryDate;
      if (date) {
        const month = new Date(date).getMonth();
        matchesMonth = month === parseInt(filterMonth);
      } else {
        matchesMonth = false;
      }
    }

    let matchesLate = true;
    if (filterLate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const deliveryDate = new Date(p.expectedDeliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);
      
      const isActiveLate = p.status !== 'ENTREGADO' && deliveryDate < today;
      
      const actualDate = p.actualDeliveryDate ? new Date(p.actualDeliveryDate) : null;
      if (actualDate) actualDate.setHours(0, 0, 0, 0);
      const isPastLate = p.status === 'ENTREGADO' && actualDate && actualDate > deliveryDate;

      if (filterLate === 'ACTIVE_LATE') matchesLate = isActiveLate;
      else if (filterLate === 'PAST_LATE') matchesLate = isPastLate;
      else if (filterLate === 'ON_TIME') matchesLate = !isActiveLate && !isPastLate;
    }

    return matchesSearch && matchesDevs && matchesStatus && matchesType && matchesPrice && matchesMonth && matchesLate;
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

  const CustomSelect = ({ value, options, onChange, placeholder, minWidth = 'min-w-[120px]' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value);
    const triggerRef = React.useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const openMenu = (e) => {
      e.stopPropagation();
      if (!isOpen) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      }
      setIsOpen(!isOpen);
    };

    return (
      <div className={`${minWidth}`}>
        <div 
          ref={triggerRef}
          onClick={openMenu}
          className={`w-full bg-[var(--color-nux-bg)] border rounded px-2 py-1.5 text-xs cursor-pointer flex justify-between items-center transition-all ${isOpen ? 'border-[var(--color-nux-primary)] shadow-[0_0_10px_rgba(124,58,237,0.2)] text-white' : 'border-[var(--color-nux-primary)]/40 hover:border-[var(--color-nux-primary)] text-white'}`}
        >
          <span className={`truncate pr-2 ${!selectedOption && placeholder ? 'text-[var(--color-nux-text-muted)]' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={14} className={`transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-[var(--color-nux-primary)]' : 'text-[var(--color-nux-text-muted)]'}`} />
        </div>
        {isOpen && createPortal(
          <>
            <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>
            <div 
              style={{ top: coords.top, left: coords.left, width: Math.max(coords.width, 150) }}
              className="fixed bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] rounded-lg shadow-2xl z-[101] p-1 animate-dribbble-pop origin-top max-h-48 overflow-y-auto custom-scrollbar"
            >
              {options.map(opt => (
                <div 
                  key={opt.value}
                  onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}
                  className={`px-2 py-1.5 rounded-md cursor-pointer text-xs transition-all duration-200 hover:translate-x-1 ${
                    value === opt.value 
                    ? 'bg-[var(--color-nux-primary)] text-white font-bold' 
                    : 'hover:bg-[var(--color-nux-primary)]/20 text-[var(--color-nux-text-muted)] hover:text-white'
                  }`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </>,
          document.body
        )}
      </div>
    );
  };

  const CustomDatePicker = ({ value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value + 'T00:00:00Z') : new Date());
    const triggerRef = React.useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    
    const daysInMonth = new Date(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), 1).getDay();
    
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const nextMonth = (e) => { e.stopPropagation(); setCurrentMonth(new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 1))); };
    const prevMonth = (e) => { e.stopPropagation(); setCurrentMonth(new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 1, 1))); };

    const handleSelectDate = (day, e) => {
      e.stopPropagation();
      const newDate = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), day));
      onChange(newDate.toISOString().split('T')[0]);
      setIsOpen(false);
    };

    const openMenu = (e) => {
      e.stopPropagation();
      if (!isOpen) {
        const rect = triggerRef.current.getBoundingClientRect();
        let menuLeft = rect.left;
        if (menuLeft + 220 > window.innerWidth) {
          menuLeft = window.innerWidth - 230;
        }
        setCoords({ top: rect.bottom + 4, left: menuLeft });
      }
      setIsOpen(!isOpen);
    };

    return (
      <div className="flex-1">
        <div 
          ref={triggerRef}
          onClick={openMenu}
          className={`w-full bg-[var(--color-nux-bg)] border rounded px-2 py-1.5 text-xs cursor-pointer flex justify-between items-center transition-all ${isOpen ? 'border-[var(--color-nux-primary)] shadow-[0_0_10px_rgba(124,58,237,0.2)] text-white' : 'border-[var(--color-nux-primary)]/40 hover:border-[var(--color-nux-primary)] text-white'}`}
        >
          <span className={`truncate ${!value ? 'text-[var(--color-nux-text-muted)]' : ''}`}>
            {value ? new Date(value + 'T00:00:00Z').toLocaleDateString('es-ES', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' }) : placeholder}
          </span>
          <Calendar size={14} className={`transition-colors duration-300 flex-shrink-0 ml-2 ${isOpen ? 'text-[var(--color-nux-primary)]' : 'text-[var(--color-nux-text-muted)]'}`} />
        </div>
        {isOpen && createPortal(
          <>
            <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>
            <div 
              style={{ top: coords.top, left: coords.left }}
              className="fixed w-[220px] bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] rounded-xl shadow-2xl z-[101] p-3 animate-dribbble-pop origin-top"
            >
              <div className="flex justify-between items-center mb-2">
                <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-lg text-[var(--color-nux-text-muted)] hover:text-white transition-colors"><ChevronDown className="rotate-90" size={14} /></button>
                <div className="text-xs font-bold text-white tracking-wider uppercase">{monthNames[currentMonth.getUTCMonth()]} {currentMonth.getUTCFullYear()}</div>
                <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-lg text-[var(--color-nux-text-muted)] hover:text-white transition-colors"><ChevronDown className="-rotate-90" size={14} /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-1 border-b border-white/5 pb-1">
                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(d => <div key={d} className="text-[9px] text-[var(--color-nux-primary)] font-bold uppercase">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 mt-2">
                {blanks.map(b => <div key={`blank-${b}`} className="h-6"></div>)}
                {days.map(d => {
                  const isSelected = value && new Date(value + 'T00:00:00Z').getUTCDate() === d && new Date(value + 'T00:00:00Z').getUTCMonth() === currentMonth.getUTCMonth() && new Date(value + 'T00:00:00Z').getUTCFullYear() === currentMonth.getUTCFullYear();
                  const isToday = new Date().getDate() === d && new Date().getMonth() === currentMonth.getUTCMonth() && new Date().getFullYear() === currentMonth.getUTCFullYear();
                  return (
                    <div 
                      key={d}
                      onClick={(e) => handleSelectDate(d, e)}
                      className={`h-6 flex items-center justify-center text-xs rounded-md cursor-pointer transition-all duration-200 hover:scale-110 relative ${
                        isSelected 
                        ? 'bg-[var(--color-nux-primary)] text-white font-bold shadow-[0_0_10px_rgba(124,58,237,0.4)] z-10' 
                        : 'text-[var(--color-nux-text-muted)] hover:bg-[var(--color-nux-primary)]/20 hover:text-white'
                      }`}
                    >
                      {d}
                      {isToday && !isSelected && <div className="absolute bottom-0.5 w-1 h-1 bg-[var(--color-nux-primary)] rounded-full"></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <p className="text-[var(--color-nux-text-muted)] font-medium">Gestión de clientes y entregas de proyectos</p>
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--color-nux-primary)] hover:bg-[var(--color-nux-primary-hover)] px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95">
          <Plus size={20} />
          Nuevo Proyecto
        </button>
      </div>

      <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-[var(--color-nux-border)] space-y-4 select-none">
          <div className="flex flex-col md:flex-row md:flex-wrap items-center gap-4 w-full">
            <div className="relative w-full md:flex-1 md:min-w-[240px] group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${searchTerm ? 'text-[var(--color-nux-primary)]' : 'text-[var(--color-nux-text-muted)] group-focus-within:text-[var(--color-nux-primary)]'}`} size={18} />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-[var(--color-nux-bg)] border rounded-lg pl-10 pr-4 h-11 text-sm focus:outline-none transition-all duration-200 text-white ${
                  searchTerm 
                  ? 'border-[var(--color-nux-primary)] bg-[var(--color-nux-primary)]/10 shadow-[0_0_15px_rgba(124,58,237,0.2)] ring-1 ring-[var(--color-nux-primary)]/30' 
                  : 'border-[var(--color-nux-border)] focus:border-[var(--color-nux-primary)] focus:bg-[var(--color-nux-primary)]/10 focus:shadow-[0_0_15px_rgba(124,58,237,0.2)] focus:ring-1 focus:ring-[var(--color-nux-primary)]/30'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:min-w-[200px] group">
              <div 
                onClick={() => setShowDevDropdown(!showDevDropdown)}
                className={`flex items-center gap-2 h-11 bg-[var(--color-nux-bg)] border rounded-lg px-4 text-sm cursor-pointer transition-all duration-200 ${
                  showDevDropdown || selectedDevs.length > 0
                  ? 'border-[var(--color-nux-primary)] bg-[var(--color-nux-primary)]/10 text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] ring-1 ring-[var(--color-nux-primary)]/30' 
                  : 'border-[var(--color-nux-border)] text-[var(--color-nux-text-muted)] hover:border-[var(--color-nux-primary)] hover:bg-[var(--color-nux-primary)]/10 hover:text-white'
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
                  <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] rounded-xl shadow-2xl z-[80] p-2 animate-dribbble-pop origin-top">
                    <div className="max-h-60 overflow-y-auto space-y-1 p-1 custom-scrollbar">
                      {developersList.map(dev => (
                        <label key={dev._id} className="flex items-center gap-3 p-2.5 hover:bg-[var(--color-nux-primary)]/10 rounded-lg cursor-pointer transition-all duration-300 ease-out hover:translate-x-1 group/item">
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

            <div className="relative flex-shrink-0 group">
              <div 
                className={`flex items-center gap-2 h-11 px-4 border rounded-lg text-sm cursor-pointer transition-all duration-200 ${
                  sortConfig.active || showSortDropdown
                  ? 'border-[var(--color-nux-primary)] bg-[var(--color-nux-primary)]/10 text-white shadow-[0_0_15px_rgba(124,58,237,0.2)] ring-1 ring-[var(--color-nux-primary)]/30' 
                  : 'bg-[var(--color-nux-bg)] border-[var(--color-nux-border)] text-[var(--color-nux-text-muted)] hover:border-[var(--color-nux-primary)] hover:text-white hover:bg-[var(--color-nux-primary)]/10'
                }`}
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                {!sortConfig.active ? (
                  <>
                    <ArrowUpDown size={18} className={`${showSortDropdown ? 'text-[var(--color-nux-primary)]' : ''}`} />
                    <span className="font-medium">Ordenar</span>
                    <ChevronDown size={16} className={`ml-auto transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${showSortDropdown ? 'rotate-180 text-[var(--color-nux-primary)]' : 'text-[var(--color-nux-text-muted)]'}`} />
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
                    <ChevronDown size={16} className={`ml-auto transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${showSortDropdown ? 'rotate-180' : 'text-[var(--color-nux-text-muted)]'}`} />
                  </>
                )}
              </div>
              
              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] rounded-xl shadow-2xl z-[80] p-2 animate-dribbble-pop origin-top">
                    <div className="space-y-2 p-1">
                      {sortOptions.map(option => (
                        <div key={option.key} className="space-y-1 pb-2 mb-2 border-b border-[var(--color-nux-border)] last:border-0 last:mb-0 last:pb-0">
                          <div className="px-2 py-1 text-[10px] font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">{option.label}</div>
                          <div className="grid grid-cols-2 gap-1">
                            <button 
                              onClick={() => { setSortConfig({ key: option.key, order: 'asc', active: true }); setShowSortDropdown(false); }}
                              className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-all duration-300 ease-out hover:-translate-y-0.5 group/sortitem ${
                                sortConfig.key === option.key && sortConfig.order === 'asc' && sortConfig.active
                                ? 'bg-[var(--color-nux-primary)] text-white font-bold' 
                                : 'hover:bg-[var(--color-nux-primary)]/10 text-[var(--color-nux-text-muted)] hover:text-white'
                              }`}
                            >
                              <span>Ascendente</span>
                            </button>
                            <button 
                              onClick={() => { setSortConfig({ key: option.key, order: 'desc', active: true }); setShowSortDropdown(false); }}
                              className={`flex items-center justify-between p-2.5 rounded-lg text-xs transition-all duration-300 ease-out hover:-translate-y-0.5 group/sortitem ${
                                sortConfig.key === option.key && sortConfig.order === 'desc' && sortConfig.active
                                ? 'bg-[var(--color-nux-primary)] text-white font-bold' 
                                : 'hover:bg-[var(--color-nux-primary)]/10 text-[var(--color-nux-text-muted)] hover:text-white'
                              }`}
                            >
                              <span>Descendente</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-between md:justify-start">
              <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 h-11 px-4 rounded-xl border text-sm font-bold transition-all duration-300 group/filterbtn ${
                showAdvanced 
                ? 'bg-[var(--color-nux-primary)] border-white/40 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:bg-[var(--color-nux-primary-hover)] hover:shadow-[0_0_35px_rgba(124,58,237,0.6)] hover:border-white/60 hover:-translate-y-1' 
                : 'bg-[var(--color-nux-bg)] border-white/10 text-[var(--color-nux-text-muted)] hover:border-white/30 hover:text-white hover:bg-white/5'
              }`}
            >
              <Filter 
                size={18} 
                className={`transition-transform duration-300 ${
                  showAdvanced ? 'text-white scale-110 rotate-12' : 'text-[var(--color-nux-text-muted)] group-hover/filterbtn:text-white group-hover/filterbtn:scale-110'
                }`} 
              />
              Filtros Avanzados
            </button>

            {(filterStatus || filterType || filterPrice || filterMonth || filterLate) && (
              <button 
                onClick={() => {
                  setFilterStatus(''); setFilterType(''); setFilterPrice(''); setFilterMonth(''); setFilterLate('');
                }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors underline underline-offset-4 font-medium"
              >
                Limpiar filtros
              </button>
            )}
            </div>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-5 bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] rounded-xl shadow-2xl animate-dribbble-pop origin-top select-none relative z-[60]">
              <FilterDropdown label="Estado" value={filterStatus} placeholder="Todos los estados" onChange={setFilterStatus} options={[
                  { value: 'PENDIENTE', label: 'Pendiente' },
                  { value: 'EN_DISENO', label: 'En Diseño' },
                  { value: 'EN_DESARROLLO', label: 'En Desarrollo' },
                  { value: 'TESTING', label: 'Testing' },
                  { value: 'ENTREGADO', label: 'Entregado' },
                  { value: 'CANCELADO', label: 'Cancelado' },
                ]} />
              <FilterDropdown label="Tipo de Proyecto" value={filterType} placeholder="Todos los tipos" onChange={setFilterType} options={[
                  { value: 'Landing Page', label: 'Landing Page' },
                  { value: 'E-commerce', label: 'E-commerce' },
                  { value: 'App Movil', label: 'App Movil' },
                  { value: 'Software', label: 'Software' },
                  { value: 'Otro', label: 'Otro' },
                ]} />
              <FilterDropdown label="Presupuesto" value={filterPrice} placeholder="Cualquier precio" onChange={setFilterPrice} options={[
                  { value: '<1000', label: 'Menos de $1,000' },
                  { value: '1000-3000', label: '$1,000 - $3,000' },
                  { value: '3000-7000', label: '$3,000 - $7,000' },
                  { value: '>7000', label: 'Más de $7,000' },
                ]} />
              <FilterDropdown label="Mes de Entrega" value={filterMonth} placeholder="Cualquier mes" onChange={setFilterMonth} options={months} />
              <FilterDropdown 
                label="Tiempo de Entrega" 
                value={filterLate} 
                placeholder="Todos" 
                onChange={setFilterLate} 
                options={[
                  { value: 'ACTIVE_LATE', label: 'Retrasados / En curso' },
                  { value: 'PAST_LATE', label: 'Entrega Tardía' },
                  { value: 'ON_TIME', label: 'Al día / A tiempo' },
                ]} 
              />
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto relative z-0">
          <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
            <thead className="bg-[var(--color-nux-bg)] text-[var(--color-nux-text-muted)] border-b border-[var(--color-nux-border)]">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Servicio</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Desarrolladores</th>
                <th className="px-6 py-4 font-medium">Cronograma</th>
                <th className="px-6 py-4 font-medium">Acordado</th>
                <th className="px-6 py-4 font-medium">Pendiente</th>
                <th className="px-6 py-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-transparent">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-[var(--color-nux-text-muted)]">Cargando...</td>
                </tr>
              ) : filteredAndSortedProjects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-[var(--color-nux-text-muted)]">No se encontraron proyectos con los filtros seleccionados.</td>
                </tr>
              ) : (
                filteredAndSortedProjects.map((p) => (
                  <tr 
                    key={p._id} 
                    className="group relative z-0 hover:z-10 border-b border-[var(--color-nux-border)] last:border-0 hover:bg-white/[0.03] transition-all duration-300 select-none cursor-default hover:scale-[1.005] hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                  >
                    {/* Neon Bar Indicator */}
                    <td className="px-6 py-4 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-nux-primary)] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center pointer-events-none z-20 shadow-[0_0_15px_var(--color-nux-primary)]"></div>
                      
                      {editingProjectId === p._id ? (
                        <div className="flex flex-col gap-2 w-[180px] max-w-[200px]">
                          <input 
                            type="text" 
                            value={editedProject.client?.name || ''} 
                            onChange={(e) => setEditedProject({...editedProject, client: {...editedProject.client, name: e.target.value}})}
                            className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-primary)] rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-nux-primary)]/50"
                            placeholder="Nombre del cliente"
                          />
                          <input 
                            type="text" 
                            value={editedProject.client?.company || ''} 
                            onChange={(e) => setEditedProject({...editedProject, client: {...editedProject.client, company: e.target.value}})}
                            className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-primary)] rounded px-2 py-1 text-xs text-[var(--color-nux-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-nux-primary)]/50"
                            placeholder="Compañía"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="font-medium text-white group-hover:text-[var(--color-nux-primary-hover)] transition-colors">{p.client?.name}</div>
                          <div className="text-xs text-[var(--color-nux-text-muted)]">{p.client?.company}</div>
                        </>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingProjectId === p._id ? (
                        <CustomSelect
                          value={editedProject.serviceType}
                          onChange={(val) => setEditedProject({...editedProject, serviceType: val})}
                          placeholder="Servicio"
                          options={[
                            { value: 'Landing Page', label: 'Landing Page' },
                            { value: 'E-commerce', label: 'E-commerce' },
                            { value: 'App Movil', label: 'App Movil' },
                            { value: 'Software', label: 'Software' },
                            { value: 'Otro', label: 'Otro' }
                          ]}
                        />
                      ) : (
                        p.serviceType
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingProjectId === p._id ? (
                        <CustomSelect
                          value={editedProject.status}
                          onChange={(val) => setEditedProject({...editedProject, status: val})}
                          placeholder="Estado"
                          options={[
                            { value: 'PENDIENTE', label: 'PENDIENTE' },
                            { value: 'EN_DISENO', label: 'EN DISEÑO' },
                            { value: 'EN_DESARROLLO', label: 'EN DESARROLLO' },
                            { value: 'TESTING', label: 'TESTING' },
                            { value: 'ENTREGADO', label: 'ENTREGADO' },
                            { value: 'CANCELADO', label: 'CANCELADO' }
                          ]}
                        />
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(p.status)}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {editingProjectId === p._id ? (
                        <div className="space-y-2 min-w-[160px]">
                          <div className="flex flex-wrap gap-1">
                            {editedProject.developers.map((devId) => {
                              const dev = developersList.find(d => d._id === devId);
                              if (!dev) return null;
                              return (
                                <span key={devId} className="flex items-center gap-1 bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] rounded-full pl-1 pr-1.5 py-0.5 text-[10px]">
                                  <img src={dev.photoUrl || 'https://via.placeholder.com/150'} alt={dev.name} className="w-4 h-4 rounded-full" />
                                  <span className="truncate max-w-[60px]">{dev.name}</span>
                                  <button onClick={() => setEditedProject({...editedProject, developers: editedProject.developers.filter(id => id !== devId)})} className="text-red-400 hover:text-red-300 ml-0.5"><X size={10} /></button>
                                </span>
                              );
                            })}
                          </div>
                          <CustomSelect
                            value=""
                            onChange={(val) => {
                              if (val && !editedProject.developers.includes(val)) {
                                setEditedProject({...editedProject, developers: [...editedProject.developers, val]});
                              }
                            }}
                            placeholder="+ Añadir Dev"
                            options={developersList.filter(d => !editedProject.developers.includes(d._id)).map(dev => ({ value: dev._id, label: dev.name }))}
                          />
                        </div>
                      ) : (
                        p.developers && p.developers.length > 0 ? (
                          <div className="flex -space-x-2">
                            {p.developers.map((dev, i) => (
                              <img 
                                key={i} 
                                src={dev.photoUrl || 'https://via.placeholder.com/150'} 
                                alt={dev.name}
                                className="w-8 h-8 rounded-full border-2 border-[var(--color-nux-bg)]"
                                title={dev.name}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[var(--color-nux-text-muted)] text-sm">Sin asignar</span>
                        )
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {editingProjectId === p._id ? (
                          <>
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar size={12} className="text-blue-400 flex-shrink-0" />
                              <span className="text-[var(--color-nux-text-muted)] w-10 flex-shrink-0">Inicio:</span>
                              <CustomDatePicker 
                                value={editedProject.startDate ? new Date(editedProject.startDate).toISOString().split('T')[0] : ''}
                                onChange={(val) => setEditedProject({...editedProject, startDate: val})}
                                placeholder="Seleccionar"
                              />
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Clock size={12} className="text-yellow-400 flex-shrink-0" />
                              <span className="text-[var(--color-nux-text-muted)] w-10 flex-shrink-0">Entrega:</span>
                              <CustomDatePicker 
                                value={editedProject.expectedDeliveryDate ? new Date(editedProject.expectedDeliveryDate).toISOString().split('T')[0] : ''}
                                onChange={(val) => setEditedProject({...editedProject, expectedDeliveryDate: val})}
                                placeholder="Seleccionar"
                              />
                            </div>
                            {editedProject.status === 'ENTREGADO' && (
                              <div className="flex items-center gap-2 text-xs">
                                <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                                <span className="text-[var(--color-nux-text-muted)] w-10 flex-shrink-0">Final:</span>
                                <CustomDatePicker 
                                  value={editedProject.actualDeliveryDate ? new Date(editedProject.actualDeliveryDate).toISOString().split('T')[0] : ''}
                                  onChange={(val) => setEditedProject({...editedProject, actualDeliveryDate: val})}
                                  placeholder="Seleccionar"
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 text-xs">
                              <Calendar size={12} className="text-blue-400" />
                              <span className="text-[var(--color-nux-text-muted)]">Inicio:</span>
                              <span className="font-medium">{formatDate(p.startDate)}</span>
                            </div>

                            {p.status === 'ENTREGADO' ? (
                              <>
                                {p.actualDeliveryDate && p.expectedDeliveryDate && new Date(p.actualDeliveryDate) > new Date(p.expectedDeliveryDate) ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs opacity-60">
                                      <Clock size={12} className="text-yellow-400" />
                                      <span className="text-[var(--color-nux-text-muted)]">Pactado:</span>
                                      <span className="font-medium">{formatDate(p.expectedDeliveryDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-orange-400 font-bold bg-orange-400/5 p-1 rounded border border-orange-400/10">
                                      <CheckCircle size={12} className="text-orange-400" />
                                      <span>Final (Tardía): {formatDate(p.actualDeliveryDate)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-xs">
                                    <CheckCircle size={12} className="text-green-400" />
                                    <span className="text-[var(--color-nux-text-muted)]">Final:</span>
                                    <span className="font-medium">{formatDate(p.actualDeliveryDate)}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-xs">
                                <Clock size={12} className="text-yellow-400" />
                                <span className="text-[var(--color-nux-text-muted)]">Entrega:</span>
                                <span className="font-medium">{formatDate(p.expectedDeliveryDate)}</span>
                              </div>
                            )}

                            {p.status !== 'ENTREGADO' && p.expectedDeliveryDate && (() => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const deliveryDate = new Date(p.expectedDeliveryDate);
                              deliveryDate.setHours(0, 0, 0, 0);
                              return deliveryDate < today;
                            })() && (
                              <div className="flex items-center gap-2 text-red-400 mt-2 pt-2 border-t border-red-400/10 animate-pulse">
                                <Clock size={12} className="text-red-400" />
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold uppercase tracking-wider">Día en curso (Retraso)</span>
                                  <span className="font-bold">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-medium">{formatCurrency(p.finances?.agreedPrice || 0)}</td>
                    <td className="px-6 py-4 font-medium text-red-400">{formatCurrency(p.finances?.pendingAmount || 0)}</td>
                    
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 min-w-[140px]">
                        {editingProjectId === p._id ? (
                          <>
                            <button 
                              onClick={() => saveEditing()}
                              className="p-2 text-green-400 hover:text-white hover:bg-green-500/20 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 border border-green-500/30"
                              title="Guardar"
                            >
                              <Save size={16} />
                            </button>
                            <button 
                              onClick={() => cancelEditing()}
                              className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 border border-red-500/30"
                              title="Cancelar"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => { setSelectedProject(p); setShowPaymentsModal(true); }}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95" 
                              title="Ver pagos"
                            >
                              <FileText size={16} />
                            </button>
                            <button 
                              onClick={() => startEditing(p)}
                              className="p-2 text-[var(--color-nux-text-muted)] hover:text-white hover:bg-[var(--color-nux-bg)] rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                              title="Editar proyecto"
                            >
                              <Edit2 size={16} />
                            </button>
                            <div className="w-8 flex justify-center">
                              {p.status === 'CANCELADO' && (
                                <button className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                        <button 
                          onClick={() => {
                            setDetailsModalProject({
                              ...p,
                              details: p.details || { technologies: 'No definidas', architecture: 'No definida', serviceUrls: 'Sin URLs asignadas', deployedAt: 'No desplegado', notes: 'Sin notas' }
                            });
                            setIsEditingDetails(false);
                          }}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Más Detalles"
                        >
                          <MoreHorizontal size={16} />
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

      {detailsModalProject && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setDetailsModalProject(null)}></div>
          <div className="relative w-full max-w-4xl bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl shadow-2xl animate-dribbble-pop flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex-none flex items-center justify-between p-6 border-b border-[var(--color-nux-border)] bg-[var(--color-nux-bg)] rounded-t-2xl z-10">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  Detalles del Proyecto
                  {isEditingDetails && <span className="text-xs px-2 py-1 bg-[var(--color-nux-primary)]/20 text-[var(--color-nux-primary)] rounded-md uppercase tracking-wider font-bold">Editando</span>}
                </h2>
                <p className="text-[var(--color-nux-text-muted)] mt-1">Información avanzada y técnica</p>
              </div>
              <div className="flex items-center gap-3">
                {isEditingDetails ? (
                  <button onClick={saveDetails} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95">
                    <Save size={18} /> Guardar
                  </button>
                ) : (
                  <button onClick={() => setIsEditingDetails(true)} className="flex items-center gap-2 bg-[var(--color-nux-primary)] hover:bg-[var(--color-nux-primary-hover)] text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95">
                    <Edit2 size={18} /> Editar Detalles
                  </button>
                )}
                <button onClick={() => setDetailsModalProject(null)} className="p-2 text-[var(--color-nux-text-muted)] hover:text-white hover:bg-white/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-auto overflow-y-auto custom-scrollbar min-h-0" data-lenis-prevent="true">
              {/* Left Column: Quotation & General Info */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-nux-primary)] uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Información General</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[var(--color-nux-text-muted)] mb-1">Nombre de Cliente</label>
                      {isEditingDetails ? (
                        <input 
                          type="text" 
                          value={detailsModalProject.client.name} 
                          onChange={(e) => setDetailsModalProject({...detailsModalProject, client: {...detailsModalProject.client, name: e.target.value}})}
                          className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-primary)]/40 rounded-lg px-3 py-2 text-white text-sm focus:border-[var(--color-nux-primary)] outline-none"
                        />
                      ) : (
                        <div className="text-white bg-[var(--color-nux-bg)]/50 border border-transparent px-3 py-2 rounded-lg text-sm">{detailsModalProject.client.name}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-nux-text-muted)] mb-1">Compañía</label>
                      {isEditingDetails ? (
                        <input 
                          type="text" 
                          value={detailsModalProject.client.company || ''} 
                          onChange={(e) => setDetailsModalProject({...detailsModalProject, client: {...detailsModalProject.client, company: e.target.value}})}
                          className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-primary)]/40 rounded-lg px-3 py-2 text-white text-sm focus:border-[var(--color-nux-primary)] outline-none"
                        />
                      ) : (
                        <div className="text-white bg-[var(--color-nux-bg)]/50 border border-transparent px-3 py-2 rounded-lg text-sm">{detailsModalProject.client.company || 'N/A'}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-nux-text-muted)] mb-1">Tipo de Proyecto</label>
                      {isEditingDetails ? (
                        <select 
                          value={detailsModalProject.serviceType} 
                          onChange={(e) => setDetailsModalProject({...detailsModalProject, serviceType: e.target.value})}
                          className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-primary)]/40 rounded-lg px-3 py-2 text-white text-sm focus:border-[var(--color-nux-primary)] outline-none"
                        >
                          <option value="Landing Page">Landing Page</option>
                          <option value="E-commerce">E-commerce</option>
                          <option value="App Movil">App Movil</option>
                          <option value="Software">Software</option>
                          <option value="Otro">Otro</option>
                        </select>
                      ) : (
                        <div className="text-white bg-[var(--color-nux-bg)]/50 border border-transparent px-3 py-2 rounded-lg text-sm">{detailsModalProject.serviceType}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[var(--color-nux-primary)] uppercase tracking-wider mb-4 border-b border-white/5 pb-2 flex items-center justify-between">
                    <span>Cotización Generada</span>
                  </h3>
                  
                  <div className="w-full bg-[#111827] border border-[#26344f] rounded-2xl overflow-hidden shadow-lg mt-2 relative">
                    {/* Header bg */}
                    <div className="h-32 relative bg-gradient-to-br from-[#111827] via-[#111329] to-[#07111f] p-6 border-b border-[#26344f]">
                      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(132, 82, 255, 0.55), transparent 34%), radial-gradient(circle at 80% 10%, rgba(33, 163, 245, 0.45), transparent 32%)' }}></div>
                      <div className="relative flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6d4dfc] to-[#21a3f5] flex items-center justify-center text-white font-bold text-lg shadow-lg">N</div>
                        <div>
                          <div className="text-white font-bold text-lg leading-tight">Nuxelit</div>
                          <div className="text-[#a7b4cc] text-xs">Propuesta de cotización</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="inline-block px-3 py-1 rounded-full bg-[#8452ff]/10 border border-[#8452ff]/50 text-[#a884ff] text-[10px] font-bold uppercase tracking-wider mb-4">
                        COT-{detailsModalProject._id.substring(detailsModalProject._id.length - 6).toUpperCase()}
                      </div>
                      
                      <h1 className="text-xl font-bold text-white mb-2 leading-tight">Cotización para {detailsModalProject.client.name}</h1>
                      <p className="text-xs text-[#a7b4cc] mb-6">Detalles y desglose de la propuesta comercial para el proyecto solicitado.</p>
                      
                      <div className="bg-[#171f33] border border-[#2b3958] rounded-xl p-4 mb-4">
                        <div className="mb-4">
                          <div className="text-[10px] text-[#8f9bb3] uppercase tracking-wider font-bold mb-1">Servicio solicitado</div>
                          <div className="text-white font-bold text-sm">{detailsModalProject.serviceType}</div>
                        </div>
                        <div className="mb-4 pt-4 border-t border-[#2b3958]">
                          <div className="text-[10px] text-[#8f9bb3] uppercase tracking-wider font-bold mb-1">Descripción / Notas</div>
                          <div className="text-[#dce4f2] text-xs whitespace-pre-wrap">{detailsModalProject.details.notes || 'Sin descripción detallada.'}</div>
                        </div>
                        <div className="flex gap-4 pt-4 border-t border-[#2b3958]">
                          <div className="flex-1">
                            <div className="text-[10px] text-[#8f9bb3] uppercase tracking-wider font-bold mb-1">Presupuesto</div>
                            <div className="text-white font-bold text-base">${(detailsModalProject.finances?.agreedPrice || 0).toLocaleString()} USD</div>
                          </div>
                          <div className="flex-1">
                            <div className="text-[10px] text-[#8f9bb3] uppercase tracking-wider font-bold mb-1">Tiempo estimado</div>
                            <div className="text-white font-bold text-xs mt-1">{detailsModalProject.expectedDeliveryDate ? new Date(detailsModalProject.expectedDeliveryDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'A convenir'}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-[#101827] border border-[#2b3958] rounded-xl p-4">
                        <div className="text-[10px] text-[#8f9bb3] uppercase tracking-wider font-bold mb-3">Datos del cliente</div>
                        <div className="flex justify-between py-2 border-b border-[#26344f] text-xs">
                          <span className="text-[#8f9bb3]">Nombre</span>
                          <span className="text-white font-bold">{detailsModalProject.client.name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#26344f] text-xs">
                          <span className="text-[#8f9bb3]">Correo</span>
                          <span className="text-[#21a3f5] font-bold">{detailsModalProject.client.email}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[#26344f] text-xs">
                          <span className="text-[#8f9bb3]">Empresa</span>
                          <span className="text-white font-bold">{detailsModalProject.client.company || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between pt-2 text-xs items-center">
                          <span className="text-[#8f9bb3]">Estado</span>
                          <span className="text-[#f5b540] font-bold bg-[#f5b540]/10 px-2 py-1 rounded-full text-[10px]">{detailsModalProject.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Technical Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-nux-primary)] uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Detalles Técnicos</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[var(--color-nux-text-muted)] mb-1">Tecnologías Usadas</label>
                      {isEditingDetails ? (
                        <input 
                          type="text" 
                          value={detailsModalProject.details.technologies} 
                          onChange={(e) => setDetailsModalProject({...detailsModalProject, details: {...detailsModalProject.details, technologies: e.target.value}})}
                          placeholder="Ej: React, Node.js, MongoDB"
                          className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-primary)]/40 rounded-lg px-3 py-2 text-white text-sm focus:border-[var(--color-nux-primary)] outline-none"
                        />
                      ) : (
                        <div className="text-white bg-[var(--color-nux-bg)]/50 border border-transparent px-3 py-2 rounded-lg text-sm">{detailsModalProject.details.technologies}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-nux-text-muted)] mb-1">Arquitectura Propuesta</label>
                      {isEditingDetails ? (
                        <input 
                          type="text" 
                          value={detailsModalProject.details.architecture} 
                          onChange={(e) => setDetailsModalProject({...detailsModalProject, details: {...detailsModalProject.details, architecture: e.target.value}})}
                          className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-primary)]/40 rounded-lg px-3 py-2 text-white text-sm focus:border-[var(--color-nux-primary)] outline-none"
                        />
                      ) : (
                        <div className="text-white bg-[var(--color-nux-bg)]/50 border border-transparent px-3 py-2 rounded-lg text-sm">{detailsModalProject.details.architecture}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-nux-text-muted)] mb-1">URLs de Servicios</label>
                      {isEditingDetails ? (
                        <textarea 
                          value={detailsModalProject.details.serviceUrls} 
                          onChange={(e) => setDetailsModalProject({...detailsModalProject, details: {...detailsModalProject.details, serviceUrls: e.target.value}})}
                          rows="2"
                          className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-primary)]/40 rounded-lg px-3 py-2 text-white text-sm focus:border-[var(--color-nux-primary)] outline-none resize-none"
                        ></textarea>
                      ) : (
                        <div className="text-white bg-[var(--color-nux-bg)]/50 border border-transparent px-3 py-2 rounded-lg text-sm whitespace-pre-wrap">{detailsModalProject.details.serviceUrls}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-nux-text-muted)] mb-1">Desplegado en</label>
                      {isEditingDetails ? (
                        <input 
                          type="text" 
                          value={detailsModalProject.details.deployedAt} 
                          onChange={(e) => setDetailsModalProject({...detailsModalProject, details: {...detailsModalProject.details, deployedAt: e.target.value}})}
                          className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-primary)]/40 rounded-lg px-3 py-2 text-white text-sm focus:border-[var(--color-nux-primary)] outline-none"
                        />
                      ) : (
                        <div className="text-white bg-[var(--color-nux-bg)]/50 border border-transparent px-3 py-2 rounded-lg text-sm">{detailsModalProject.details.deployedAt}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[var(--color-nux-primary)] uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Notas Generales</h3>
                  {isEditingDetails ? (
                    <textarea 
                      value={detailsModalProject.details.notes} 
                      onChange={(e) => setDetailsModalProject({...detailsModalProject, details: {...detailsModalProject.details, notes: e.target.value}})}
                      rows="4"
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-primary)]/40 rounded-lg px-3 py-2 text-white text-sm focus:border-[var(--color-nux-primary)] outline-none resize-none"
                    ></textarea>
                  ) : (
                    <div className="text-[var(--color-nux-text-muted)] bg-[var(--color-nux-bg)]/50 border border-transparent px-3 py-3 rounded-lg text-sm whitespace-pre-wrap italic min-h-[100px]">{detailsModalProject.details.notes}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
