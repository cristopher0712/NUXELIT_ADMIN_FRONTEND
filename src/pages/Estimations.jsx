import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Plus, Upload, BookOpen, Eye, Edit, Copy, Download, Trash2, X, AlertTriangle, 
  Check, Info, FileSpreadsheet, Loader2, ArrowRight, DollarSign, Calendar, Clock, 
  User, CheckCircle, AlertCircle, Image as ImageIcon, PlusCircle, Trash, RefreshCw, ChevronDown
} from 'lucide-react';
import { 
  getEstimations, getEstimationStats, getEstimationById, createEstimation, 
  updateEstimation, updateEstimationStatus, duplicateEstimation, deleteEstimation, 
  getEstimationHtml, uploadArchImage, deleteArchImage, getCatalog, updateCatalog, 
  importCatalog 
} from '../services/estimationService';
import { parseEstimationExcel, parseCatalogExcel } from '../utils/excelParser';
import { generateEstimationPdf } from '../utils/pdfGenerator';

const StatusBadge = ({ status }) => {
  const styles = {
    'Pendiente': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'Aprobado': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'Rechazado': 'bg-red-500/10 text-red-400 border border-red-500/20',
    'Modificado': 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
      {status}
    </span>
  );
};

const StatusSelect = ({ status, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const styles = {
    'Pendiente': 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20',
    'Aprobado': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
    'Rechazado': 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
    'Modificado': 'bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20'
  };

  const options = [
    { value: 'Pendiente', label: 'Pendiente' },
    { value: 'Aprobado', label: 'Aprobado' },
    { value: 'Rechazado', label: 'Rechazado' },
    { value: 'Modificado', label: 'Modificado' }
  ];

  const handleToggle = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // If clicking trigger or dropdown menu content, do nothing
      if (triggerRef.current && triggerRef.current.contains(event.target)) {
        return;
      }
      if (menuRef.current && menuRef.current.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      const handleReposition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setCoords({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width
          });
        }
      };
      
      window.addEventListener('scroll', handleReposition, true);
      window.addEventListener('resize', handleReposition);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleReposition, true);
        window.removeEventListener('resize', handleReposition);
      };
    }
  }, [isOpen]);

  return (
    <div className="inline-block text-left" ref={triggerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider outline-none transition flex items-center gap-1.5 cursor-pointer ${styles[status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}
      >
        <span>{status}</span>
        <ChevronDown size={10} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className="absolute rounded-xl bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] shadow-2xl z-[99999] py-1.5 overflow-hidden animate-dribbble-pop"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            minWidth: '144px',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-wider transition ${
                status === opt.value
                  ? 'bg-[var(--color-nux-surface-hover)] text-white'
                  : 'text-[var(--color-nux-text-muted)] hover:text-white hover:bg-[var(--color-nux-surface-hover)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  opt.value === 'Pendiente' ? 'bg-amber-500' :
                  opt.value === 'Aprobado' ? 'bg-emerald-500' :
                  opt.value === 'Rechazado' ? 'bg-red-500' :
                  'bg-violet-500'
                }`} />
                {opt.label}
              </span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default function Estimations() {
  // Lists & Filtering
  const [estimations, setEstimations] = useState([]);
  const [stats, setStats] = useState({
    totalEstimations: 0,
    byStatus: { 'Pendiente': 0, 'Aprobado': 0, 'Rechazado': 0, 'Modificado': 0 },
    totalHoursEstimated: 0,
    averageHours: 0,
    totalCostEstimated: 0
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Master Catalog singleton reference
  const [catalog, setCatalog] = useState({ activities: [], plans: [], packages: [], config: {} });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form Mode & Targets
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [activeFormTab, setActiveFormTab] = useState('general'); // 'general' | 'activities' | 'cost' | 'architecture' | 'notes' | 'approval'
  const [activeCatalogTab, setActiveCatalogTab] = useState('activities'); // 'activities' | 'plans' | 'packages' | 'config'
  const [currentEstimationId, setCurrentEstimationId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    client: '',
    project: '',
    responsible: '',
    planBase: '',
    projectType: 'Landing page',
    environment: 'Dev',
    priority: 'Media',
    scope: '',
    assumptions: '',
    currency: 'COP',
    hourlyRate: 150000,
    hoursPerDay: 8,
    globalRisk: 0.10,
    selectedPackages: [],
    activities: [],
    cost: { enabled: false, hourlyRate: 150000, currency: 'COP', subtotal: 0, total: 0, notes: '' },
    notes: [],
    approval: { preparedBy: '', approvedBy: '' },
    summary: { subtotalHours: 0, riskHours: 0, totalHours: 0, totalDays: 0, weeks: 0, estimatedCost: 0, executiveNote: '' }
  });

  // Selected Detail for Viewer
  const [selectedEstimation, setSelectedEstimation] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');

  // Import Preview State
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [importWarnings, setImportWarnings] = useState([]);
  const [importLoading, setImportLoading] = useState(false);

  const fileInputRef = useRef(null);
  const catalogFileInputRef = useRef(null);

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getEstimations({ search, status: statusFilter, page: pagination.page, limit: pagination.limit });
      setEstimations(res.data.data.list);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Error fetching estimations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await getEstimationStats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchCatalogData = async () => {
    try {
      const res = await getCatalog();
      setCatalog(res.data.data);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter, pagination.page]);

  useEffect(() => {
    fetchStats();
    fetchCatalogData();
  }, []);

  // Form Math Calculations
  const triggerRecalculation = (updatedActivities, globalRisk, hoursPerDay, hourlyRate) => {
    const risk = Number(globalRisk) || 0;
    const hPerDay = Number(hoursPerDay) || 8;
    const rate = Number(hourlyRate) || 0;

    let subtotalHours = 0;
    const computedActivities = updatedActivities.map(act => {
      const qty = Number(act.quantity) ?? 1;
      const base = Number(act.baseHours) || 0;
      const fact = Number(act.factor) || 1;
      const rPercent = Number(act.riskPercent) || 0;

      const estimatedHours = Math.round((qty * base * fact * (1 + rPercent)) * 100) / 100;
      const days = Math.round((estimatedHours / hPerDay) * 100) / 100;

      subtotalHours += estimatedHours;

      return {
        ...act,
        estimatedHours,
        days
      };
    });

    subtotalHours = Math.round(subtotalHours * 100) / 100;
    const riskHours = Math.round((subtotalHours * risk) * 100) / 100;
    const totalHours = Math.round((subtotalHours + riskHours) * 100) / 100;
    const totalDays = Math.round((totalHours / hPerDay) * 100) / 100;
    const weeks = Math.round((totalDays / 5) * 100) / 100;
    const estimatedCost = Math.round((totalHours * rate) * 100) / 100;

    const totalsByPhase = {};
    computedActivities.forEach(act => {
      const phase = act.phase || 'General';
      if (!totalsByPhase[phase]) {
        totalsByPhase[phase] = { phase, hours: 0, percentage: '0%', roles: new Set() };
      }
      totalsByPhase[phase].hours += act.estimatedHours;
      if (act.role) totalsByPhase[phase].roles.add(act.role);
    });

    const computedTotalsByPhase = Object.values(totalsByPhase).map(p => {
      const hours = Math.round(p.hours * 100) / 100;
      const pct = totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0;
      return {
        phase: p.phase,
        hours,
        percentage: `${pct}%`,
        roles: Array.from(p.roles).join(', ')
      };
    });

    setFormData(prev => {
      const costSubtotal = subtotalHours * (prev.cost?.hourlyRate || rate);
      const costTotal = totalHours * (prev.cost?.hourlyRate || rate);
      return {
        ...prev,
        activities: computedActivities,
        totalsByPhase: computedTotalsByPhase,
        summary: {
          ...prev.summary,
          subtotalHours,
          riskHours,
          totalHours,
          totalDays,
          weeks,
          estimatedCost
        },
        cost: {
          ...prev.cost,
          subtotal: costSubtotal,
          total: costTotal
        }
      };
    });
  };

  // Populate from Plan Base Selection
  const handlePlanBaseChange = (planName) => {
    if (!planName) {
      triggerRecalculation([], formData.globalRisk, formData.hoursPerDay, formData.hourlyRate);
      return;
    }

    const selectedPlan = catalog.plans?.find(p => p.name === planName);
    if (!selectedPlan) return;

    // Map plan activities to form activity structure
    const newActivities = selectedPlan.activities.map(planAct => {
      // Find matching activity definition in master activities to extract metadata
      const meta = catalog.activities?.find(a => a.name === planAct.activityName) || {};
      
      const qty = planAct.quantity || 1;
      const baseHours = meta.baseHours || 0;
      const riskPercent = meta.riskPercent || 0;

      // Extract complexity factor
      const cf = catalog.config?.complexities?.find(f => f.name === (meta.complexity || 'Media'));
      const factor = cf ? cf.factor : 1.0;

      return {
        origin: 'Plan',
        phase: meta.phase || 'General',
        name: planAct.activityName,
        description: meta.description || '',
        type: meta.type || '',
        role: meta.role || '',
        complexity: meta.complexity || 'Media',
        quantity: qty,
        baseHours,
        factor,
        riskPercent,
        dependency: meta.dependency || '',
        estimatedHours: 0,
        days: 0
      };
    });

    setFormData(prev => ({ ...prev, planBase: planName }));
    triggerRecalculation(newActivities, formData.globalRisk, formData.hoursPerDay, formData.hourlyRate);
  };

  // Toggle Packages
  const handlePackageToggle = (pkgName) => {
    const alreadySelected = formData.selectedPackages?.includes(pkgName);
    const updatedSelected = alreadySelected
      ? formData.selectedPackages.filter(p => p !== pkgName)
      : [...(formData.selectedPackages || []), pkgName];

    // Recalculate all activities: filter out non-plan, non-selected packages
    // keep plan items, add selected packages items, keep additionals
    const baseActivities = formData.activities.filter(a => a.origin === 'Plan');
    const additionalActivities = formData.activities.filter(a => a.origin === 'Adicional');
    
    const packageActivities = [];
    updatedSelected.forEach(pName => {
      const pkg = catalog.packages?.find(k => k.name === pName);
      if (!pkg) return;

      pkg.activities.forEach(pkgAct => {
        const meta = catalog.activities?.find(a => a.name === pkgAct.activityName) || {};
        const cf = catalog.config?.complexities?.find(f => f.name === (meta.complexity || 'Media'));
        const factor = cf ? cf.factor : 1.0;

        packageActivities.push({
          origin: 'Paquete',
          phase: meta.phase || 'General',
          name: pkgAct.activityName,
          description: meta.description || '',
          type: meta.type || '',
          role: meta.role || '',
          complexity: meta.complexity || 'Media',
          quantity: pkgAct.quantity || 1,
          baseHours: meta.baseHours || 0,
          factor,
          riskPercent: meta.riskPercent || 0,
          dependency: meta.dependency || '',
          estimatedHours: 0,
          days: 0
        });
      });
    });

    const newActivities = [...baseActivities, ...packageActivities, ...additionalActivities];
    setFormData(prev => ({ ...prev, selectedPackages: updatedSelected }));
    triggerRecalculation(newActivities, formData.globalRisk, formData.hoursPerDay, formData.hourlyRate);
  };

  // Add Dynamic Activity Row
  const handleAddActivityRow = () => {
    const newAct = {
      origin: 'Adicional',
      phase: 'Desarrollo',
      name: '',
      description: '',
      type: 'Desarrollo',
      role: 'Fullstack Developer',
      complexity: 'Media',
      quantity: 1,
      baseHours: 0,
      factor: 1.0,
      riskPercent: 0,
      dependency: '',
      estimatedHours: 0,
      days: 0
    };

    const newActivities = [...formData.activities, newAct];
    triggerRecalculation(newActivities, formData.globalRisk, formData.hoursPerDay, formData.hourlyRate);
  };

  // Edit Activity Row
  const handleActivityRowChange = (index, field, value) => {
    const updated = [...formData.activities];
    const row = { ...updated[index], [field]: value };

    // Auto-update factor if complexity changes
    if (field === 'complexity') {
      const cf = catalog.config?.complexities?.find(f => f.name === value);
      row.factor = cf ? cf.factor : 1.0;
    }

    updated[index] = row;
    triggerRecalculation(updated, formData.globalRisk, formData.hoursPerDay, formData.hourlyRate);
  };

  // Remove Activity Row
  const handleRemoveActivityRow = (index) => {
    const updated = formData.activities.filter((_, i) => i !== index);
    triggerRecalculation(updated, formData.globalRisk, formData.hoursPerDay, formData.hourlyRate);
  };

  // General Form Input Change
  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Trigger recalculation if math variables change
    if (['globalRisk', 'hoursPerDay', 'hourlyRate'].includes(name)) {
      const val = Number(value) || 0;
      const gRisk = name === 'globalRisk' ? val : formData.globalRisk;
      const hDay = name === 'hoursPerDay' ? val : formData.hoursPerDay;
      const hRate = name === 'hourlyRate' ? val : formData.hourlyRate;
      
      triggerRecalculation(formData.activities, gRisk, hDay, hRate);
    }
  };

  // Notes addition/removal
  const handleAddNoteRow = () => {
    setFormData(prev => ({
      ...prev,
      notes: [...(prev.notes || []), { title: '', description: '' }]
    }));
  };

  const handleNoteRowChange = (index, field, value) => {
    const updated = [...formData.notes];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, notes: updated }));
  };

  const handleRemoveNoteRow = (index) => {
    const updated = formData.notes.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, notes: updated }));
  };

  // Open Form Modals
  const openCreateModal = () => {
    setFormMode('create');
    setFormData({
      title: '',
      client: '',
      project: '',
      responsible: '',
      planBase: '',
      projectType: catalog.config?.developmentTypes?.[0]?.name || 'Landing page',
      environment: catalog.config?.environments?.[0]?.name || 'Dev',
      priority: catalog.config?.priorities?.[0]?.name || 'Media',
      scope: '',
      assumptions: '',
      currency: catalog.config?.currencies?.[0]?.code || 'COP',
      hourlyRate: 150000,
      hoursPerDay: 8,
      globalRisk: 0.10,
      selectedPackages: [],
      activities: [],
      cost: { enabled: false, hourlyRate: 150000, currency: 'COP', subtotal: 0, total: 0, notes: '' },
      notes: [
        { title: 'Exclusiones', description: 'No se incluye la compra de licencias externas, pasarelas de pago o dominios.' },
        { title: 'Garantía', description: 'Soporte correctivo sin costo durante los primeros 30 días posteriores al despliegue.' }
      ],
      approval: { preparedBy: 'Santiago C.', approvedBy: '' },
      summary: { subtotalHours: 0, riskHours: 0, totalHours: 0, totalDays: 0, weeks: 0, estimatedCost: 0, executiveNote: '' }
    });
    setActiveFormTab('general');
    setIsFormOpen(true);
  };

  const openEditModal = async (id) => {
    setFormMode('edit');
    setCurrentEstimationId(id);
    setLoading(true);
    try {
      const res = await getEstimationById(id);
      setFormData(res.data.data);
      setActiveFormTab('general');
      setIsFormOpen(true);
    } catch (err) {
      console.error(err);
      alert('Error al cargar la estimación.');
    } finally {
      setLoading(false);
    }
  };

  // Save Form
  const handleSaveEstimation = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formMode === 'create') {
        await createEstimation(formData);
      } else {
        await updateEstimation(currentEstimationId, formData);
      }
      setIsFormOpen(false);
      fetchData();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al guardar la estimación.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Handlers
  const confirmDelete = (id) => {
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteEstimation(deleteTargetId);
      setIsDeleteOpen(false);
      fetchData();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar la estimación.');
    } finally {
      setLoading(false);
    }
  };

  // Duplicate Handlers
  const handleDuplicate = async (id) => {
    setLoading(true);
    try {
      await duplicateEstimation(id);
      fetchData();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('Error al duplicar la estimación.');
    } finally {
      setLoading(false);
    }
  };

  // Detail Viewer & HTML rendering
  const openDetail = async (id) => {
    setLoading(true);
    try {
      const res = await getEstimationById(id);
      setSelectedEstimation(res.data.data);
      
      const htmlRes = await getEstimationHtml(id);
      setHtmlContent(htmlRes.data);
      setIsDetailOpen(true);
    } catch (err) {
      console.error(err);
      alert('Error al renderizar el detalle.');
    } finally {
      setLoading(false);
    }
  };

  // Update Status directly from Detail Viewer
  const handleStatusChange = async (newStatus) => {
    if (!selectedEstimation) return;
    setLoading(true);
    try {
      await updateEstimationStatus(selectedEstimation._id, newStatus);
      const res = await getEstimationById(selectedEstimation._id);
      setSelectedEstimation(res.data.data);
      const htmlRes = await getEstimationHtml(selectedEstimation._id);
      setHtmlContent(htmlRes.data);
      fetchData();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el estado.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatusDirectly = async (id, newStatus) => {
    setLoading(true);
    try {
      await updateEstimationStatus(id, newStatus);
      fetchData();
      fetchStats();
      if (selectedEstimation && selectedEstimation._id === id) {
        const res = await getEstimationById(id);
        setSelectedEstimation(res.data.data);
        const htmlRes = await getEstimationHtml(id);
        setHtmlContent(htmlRes.data);
      }
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el estado.');
    } finally {
      setLoading(false);
    }
  };

  // PDF Downloader
  const downloadPdf = async (id, title) => {
    setLoading(true);
    try {
      const htmlRes = await getEstimationHtml(id);
      await generateEstimationPdf(htmlRes.data, `Estimacion_${title.replace(/\s+/g, '_')}`);
    } catch (err) {
      console.error(err);
      alert('Error al descargar el PDF.');
    } finally {
      setLoading(false);
    }
  };

  // File Upload Handlers (Excel Import)
  const handleExcelDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleExcelParse(file);
  };

  const handleExcelFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleExcelParse(file);
  };

  const handleExcelParse = async (file) => {
    setImportFile(file);
    setImportLoading(true);
    setImportWarnings([]);
    try {
      const result = await parseEstimationExcel(file);
      setImportData(result.estimation);
      setImportWarnings(result.warnings || []);
    } catch (err) {
      console.error(err);
      alert('Error al parsear el Excel. Verifica que cumpla con el formato de la plantilla.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importData) return;
    setLoading(true);
    try {
      // Import the catalog mapping sheets first if parsed
      if (importData.activities?.length > 0) {
        // Automatically save parsed catalog definitions to master database as well!
        const parsedCatalog = await parseCatalogExcel(importFile);
        if (parsedCatalog.catalog.activities?.length > 0) {
          await importCatalog(parsedCatalog.catalog);
          fetchCatalogData();
        }
      }

      await createEstimation(importData);
      setIsImportOpen(false);
      setImportFile(null);
      setImportData(null);
      fetchData();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('Error al importar la estimación.');
    } finally {
      setLoading(false);
    }
  };

  // Image Upload Handler
  const handleArchImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentEstimationId) return;

    const fd = new FormData();
    fd.append('image', file);

    setLoading(true);
    try {
      const res = await uploadArchImage(currentEstimationId, fd);
      setFormData(prev => ({
        ...prev,
        architectureImages: res.data.data.architectureImages
      }));
    } catch (err) {
      console.error(err);
      alert('Error al subir la imagen.');
    } finally {
      setLoading(false);
    }
  };

  const handleArchImageDelete = async (index) => {
    if (!currentEstimationId) return;
    setLoading(true);
    try {
      const res = await deleteArchImage(currentEstimationId, index);
      setFormData(prev => ({
        ...prev,
        architectureImages: res.data.data.architectureImages
      }));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar la imagen.');
    } finally {
      setLoading(false);
    }
  };

  // Catalog Manager saving
  const handleSaveCatalog = async () => {
    setLoading(true);
    try {
      await updateCatalog(catalog);
      setIsCatalogOpen(false);
      alert('Catálogo actualizado exitosamente.');
    } catch (err) {
      console.error(err);
      alert('Error al guardar el catálogo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCatalogExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await parseCatalogExcel(file);
      setCatalog(result.catalog);
      alert('Datos cargados desde Excel en memoria. Haz clic en Guardar para persistir los cambios.');
    } catch (err) {
      console.error(err);
      alert('Error al parsear el catálogo.');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val, curr = 'COP') => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: curr, minimumFractionDigits: 0 }).format(val);
  };

  return (
    <>
      <div className="space-y-6 animate-dribbble-pop">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-white to-[var(--color-nux-text-muted)] bg-clip-text text-transparent">
            Estimaciones de Tiempos
          </h1>
          <p className="text-sm text-[var(--color-nux-text-muted)] mt-1">
            Carga planillas Excel, gestiona alcances, personaliza actividades y exporta reportes en PDF.
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl p-5 relative overflow-hidden group hover:border-[var(--color-nux-primary)]/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
          <p className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Total Estimaciones</p>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats.totalEstimations}</span>
            <div className="bg-violet-500/10 p-2 rounded-lg text-violet-400">
              <FileSpreadsheet size={20} />
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <p className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Pendientes</p>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats.byStatus['Pendiente'] || 0}</span>
            <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <p className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Aprobadas</p>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats.byStatus['Aprobado'] || 0}</span>
            <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-500">
              <CheckCircle size={20} />
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500" />
          <p className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Total Horas</p>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{stats.totalHoursEstimated} h</span>
            <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400">
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl p-5 relative overflow-hidden group hover:border-pink-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-pink-500" />
          <p className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Costo Estimado</p>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-lg font-black text-white truncate max-w-full block">
              {formatMoney(stats.totalCostEstimated)}
            </span>
            <div className="bg-pink-500/10 p-2 rounded-lg text-pink-400">
              <DollarSign size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-nux-text-muted)]" />
          <input 
            type="text" 
            placeholder="Buscar por título, cliente o proyecto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)] transition"
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none cursor-pointer focus:border-[var(--color-nux-primary)]"
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Aprobado">Aprobado</option>
            <option value="Rechazado">Rechazado</option>
            <option value="Modificado">Modificado</option>
          </select>

          <button 
            onClick={() => setIsCatalogOpen(true)}
            className="flex items-center gap-2 border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-surface-hover)] text-white text-sm px-4 py-2.5 rounded-xl transition"
          >
            <BookOpen size={18} />
            <span>Catálogo</span>
          </button>

          <button 
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-surface-hover)] text-white text-sm px-4 py-2.5 rounded-xl transition"
          >
            <Upload size={18} />
            <span>Importar Excel</span>
          </button>

          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-[var(--color-nux-primary)] to-[#a855f7] hover:brightness-110 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg transition"
          >
            <Plus size={18} />
            <span>Crear desde cero</span>
          </button>
        </div>
      </div>

      {/* Estimations Table */}
      <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-nux-border)] bg-[var(--color-nux-bg)]/40 text-[var(--color-nux-text-muted)] text-[10px] uppercase font-black tracking-wider">
                <th className="py-4 px-6">Código</th>
                <th className="py-4 px-6">Título</th>
                <th className="py-4 px-6">Cliente / Proyecto</th>
                <th className="py-4 px-6">Responsable</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-right">Horas</th>
                <th className="py-4 px-6 text-right">Costo</th>
                <th className="py-4 px-6">Fecha</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-nux-border)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-[var(--color-nux-text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-[var(--color-nux-primary)]" size={32} />
                      <span>Cargando estimaciones...</span>
                    </div>
                  </td>
                </tr>
              ) : estimations.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center text-[var(--color-nux-text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                      <FileSpreadsheet size={48} className="text-[var(--color-nux-border)]" />
                      <span className="font-bold text-white text-base">No hay estimaciones</span>
                      <span className="text-xs">Crea una nueva estimación o importa una plantilla Excel para comenzar.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                estimations.map((est) => (
                  <tr key={est._id} className="hover:bg-[var(--color-nux-surface-hover)] transition">
                    <td className="py-4 px-6 font-mono font-bold text-[var(--color-nux-accent)]">{est.code}</td>
                    <td className="py-4 px-6 font-bold text-white max-w-xs truncate">{est.title}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{est.client}</div>
                      <div className="text-xs text-[var(--color-nux-text-muted)]">{est.project}</div>
                    </td>
                    <td className="py-4 px-6 text-white">{est.responsible}</td>
                    <td className="py-4 px-6">
                      <StatusSelect 
                        status={est.status} 
                        onChange={(newStatus) => updateStatusDirectly(est._id, newStatus)} 
                        disabled={loading} 
                      />
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-white">{est.summary?.totalHours} h</td>
                    <td className="py-4 px-6 text-right font-bold text-white">
                      {formatMoney(est.summary?.estimatedCost || 0, est.currency)}
                    </td>
                    <td className="py-4 px-6 text-xs text-[var(--color-nux-text-muted)]">
                      {new Date(est.date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openDetail(est._id)}
                          title="Ver Detalle"
                          className="p-2 hover:bg-[var(--color-nux-bg)] rounded-lg text-cyan-400 hover:text-cyan-300 transition"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openEditModal(est._id)}
                          title="Editar"
                          className="p-2 hover:bg-[var(--color-nux-bg)] rounded-lg text-violet-400 hover:text-violet-300 transition"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDuplicate(est._id)}
                          title="Duplicar"
                          className="p-2 hover:bg-[var(--color-nux-bg)] rounded-lg text-amber-400 hover:text-amber-300 transition"
                        >
                          <Copy size={16} />
                        </button>
                        <button 
                          onClick={() => downloadPdf(est._id, est.title)}
                          title="Descargar PDF"
                          className="p-2 hover:bg-[var(--color-nux-bg)] rounded-lg text-emerald-400 hover:text-emerald-300 transition"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(est._id)}
                          title="Eliminar"
                          className="p-2 hover:bg-[var(--color-nux-bg)] rounded-lg text-red-400 hover:text-red-300 transition"
                        >
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-[var(--color-nux-bg)]/40 px-6 py-4 border-t border-[var(--color-nux-border)] flex items-center justify-between">
            <span className="text-xs text-[var(--color-nux-text-muted)]">
              Mostrando página {pagination.page} de {pagination.totalPages} ({pagination.total} estimaciones)
            </span>
            <div className="flex gap-2">
              <button 
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-surface-hover)] rounded-lg text-xs disabled:opacity-50 transition"
              >
                Anterior
              </button>
              <button 
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-surface-hover)] rounded-lg text-xs disabled:opacity-50 transition"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* MODAL 1: Excel Import */}
      {isImportOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-dribbble-pop">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-nux-border)]">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <FileSpreadsheet className="text-[var(--color-nux-accent)]" />
                <span>Importar Estimación desde Excel</span>
              </h3>
              <button onClick={() => { setIsImportOpen(false); setImportFile(null); setImportData(null); }} className="text-[var(--color-nux-text-muted)] hover:text-white transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Drag and Drop Zone */}
              {!importData && (
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleExcelDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--color-nux-border)] hover:border-[var(--color-nux-primary)] bg-[var(--color-nux-bg)]/50 hover:bg-[var(--color-nux-surface-hover)] rounded-xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-4"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleExcelFileSelect}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  <div className="p-4 bg-[var(--color-nux-primary)]/10 rounded-full text-[var(--color-nux-primary)]">
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-white">Arrastra tu archivo aquí o haz clic para buscar</p>
                    <p className="text-xs text-[var(--color-nux-text-muted)] mt-1">Soporta plantillas estándar .xlsx de estimación</p>
                  </div>
                </div>
              )}

              {importLoading && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="animate-spin text-[var(--color-nux-primary)]" size={36} />
                  <span className="text-sm text-[var(--color-nux-text-muted)]">Parseando planilla Excel...</span>
                </div>
              )}

              {/* Preview & Warnings */}
              {importData && !importLoading && (
                <div className="space-y-4">
                  <div className="bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] rounded-xl p-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[var(--color-nux-text-muted)] block text-xs">Título Estimación</span>
                      <strong className="text-white">{importData.title}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-nux-text-muted)] block text-xs">Cliente</span>
                      <strong className="text-white">{importData.client}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-nux-text-muted)] block text-xs">Proyecto</span>
                      <strong className="text-white">{importData.project}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-nux-text-muted)] block text-xs">Responsable</span>
                      <strong className="text-white">{importData.responsible}</strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-nux-text-muted)] block text-xs">Total Horas</span>
                      <strong className="text-white">{importData.summary?.totalHours} h</strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-nux-text-muted)] block text-xs">Costo Estimado</span>
                      <strong className="text-white">{formatMoney(importData.summary?.estimatedCost || 0, importData.currency)}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[var(--color-nux-text-muted)] block text-xs">Total Actividades</span>
                      <strong className="text-white">{importData.activities?.length} filas cargadas</strong>
                    </div>
                  </div>

                  {/* Warnings banner */}
                  {importWarnings.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <AlertTriangle size={18} />
                        <span>Advertencias encontradas ({importWarnings.length})</span>
                      </div>
                      <ul className="text-xs list-disc list-inside space-y-1 opacity-90 max-h-32 overflow-y-auto custom-scrollbar">
                        {importWarnings.map((w, idx) => <li key={idx}>{w}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 flex items-start gap-3">
                    <Info size={20} className="shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      El mapeo de actividades, planes y paquetes de este Excel será importado y guardado automáticamente en el catálogo master de estimaciones.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-nux-border)] bg-[var(--color-nux-bg)]/40">
              <button 
                onClick={() => { setIsImportOpen(false); setImportFile(null); setImportData(null); }}
                className="px-4 py-2 border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-surface-hover)] rounded-xl text-sm transition text-white"
              >
                Cancelar
              </button>
              {importData && (
                <button 
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-gradient-to-r from-[var(--color-nux-primary)] to-[#a855f7] hover:brightness-110 text-white font-bold rounded-xl text-sm transition flex items-center gap-2"
                >
                  <Check size={16} />
                  <span>Confirmar Importación</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Create/Edit Form (Full Screen style) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-none md:rounded-2xl w-full h-full md:max-w-6xl md:h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-dribbble-pop">
            {/* Form Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-nux-border)] shrink-0">
              <div>
                <h3 className="font-bold text-white text-lg">
                  {formMode === 'create' ? 'Nueva Estimación desde Cero' : `Editar Estimación — ${formData.code}`}
                </h3>
                <p className="text-xs text-[var(--color-nux-text-muted)] mt-0.5">Calcula automáticamente el total de horas, colchón de riesgo y costos.</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-[var(--color-nux-text-muted)] hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-[var(--color-nux-border)] overflow-x-auto shrink-0 bg-[var(--color-nux-bg)]/30">
              {[
                { id: 'general', label: 'Info General', icon: <Info size={16} /> },
                { id: 'activities', label: 'Detalle de Actividades', icon: <FileSpreadsheet size={16} /> },
                { id: 'cost', label: 'Estimación Costos', icon: <DollarSign size={16} /> },
                { id: 'architecture', label: 'Arquitectura Propuesta', icon: <ImageIcon size={16} /> },
                { id: 'notes', label: 'Observaciones y Notas', icon: <BookOpen size={16} /> },
                { id: 'approval', label: 'Aprobación', icon: <CheckCircle size={16} /> }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveFormTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition ${
                    activeFormTab === t.id 
                      ? 'border-[var(--color-nux-primary)] text-white bg-[var(--color-nux-surface)]' 
                      : 'border-transparent text-[var(--color-nux-text-muted)] hover:text-white'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveEstimation} data-lenis-prevent="true" className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Tab 1: General */}
              {activeFormTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Título de la Estimación *</label>
                      <input 
                        type="text" 
                        required
                        name="title" 
                        value={formData.title} 
                        onChange={handleFormInputChange}
                        placeholder="Ej. Desarrollo de Plataforma E-commerce Fase 1"
                        className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)] transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Responsable Técnico *</label>
                      <input 
                        type="text" 
                        required
                        name="responsible" 
                        value={formData.responsible} 
                        onChange={handleFormInputChange}
                        placeholder="Ej. Santiago C."
                        className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)] transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Cliente *</label>
                    <input 
                      type="text" 
                      required
                      name="client" 
                      value={formData.client} 
                      onChange={handleFormInputChange}
                      placeholder="Ej. Coca Cola LATAM"
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)] transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Proyecto / Requerimiento *</label>
                    <input 
                      type="text" 
                      required
                      name="project" 
                      value={formData.project} 
                      onChange={handleFormInputChange}
                      placeholder="Ej. Portal de Clientes"
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)] transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Plan Base</label>
                    <select 
                      name="planBase" 
                      value={formData.planBase} 
                      onChange={(e) => handlePlanBaseChange(e.target.value)}
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)] transition"
                    >
                      <option value="">Seleccionar plan base (Auto-poblar)</option>
                      {catalog.plans?.map(p => (
                        <option key={p.name} value={p.name}>{p.name} ({p.type})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Tipo de Desarrollo</label>
                    <select 
                      name="projectType" 
                      value={formData.projectType} 
                      onChange={handleFormInputChange}
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)]"
                    >
                      {catalog.config?.developmentTypes?.map(t => <option key={t.code || t.name || t} value={t.name || t}>{t.name || t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Ambiente Destino</label>
                    <select 
                      name="environment" 
                      value={formData.environment} 
                      onChange={handleFormInputChange}
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)]"
                    >
                      {catalog.config?.environments?.map(t => <option key={t.code || t.name || t} value={t.name || t}>{t.name || t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Prioridad</label>
                    <select 
                      name="priority" 
                      value={formData.priority} 
                      onChange={handleFormInputChange}
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)]"
                    >
                      {catalog.config?.priorities?.map(t => <option key={t.code || t.name || t} value={t.name || t}>{t.name || t}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Horas de Trabajo por Día</label>
                    <input 
                      type="number" 
                      name="hoursPerDay" 
                      value={formData.hoursPerDay} 
                      onChange={handleFormInputChange}
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)] transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Colchón Riesgo Global (0 - 1)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="globalRisk" 
                      value={formData.globalRisk} 
                      onChange={handleFormInputChange}
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)] transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Moneda Base</label>
                    <select 
                      name="currency" 
                      value={formData.currency} 
                      onChange={handleFormInputChange}
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)]"
                    >
                      {catalog.config?.currencies?.map(t => <option key={t.code || t.name || t} value={t.code || t}>{t.name || t.code || t}</option>)}
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-3 space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Alcance (Scope)</label>
                    <textarea 
                      name="scope" 
                      rows="3"
                      value={formData.scope} 
                      onChange={handleFormInputChange}
                      placeholder="Describe los entregables principales del proyecto..."
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)] transition resize-none"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-3 space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Supuestos Clave (Assumptions)</label>
                    <textarea 
                      name="assumptions" 
                      rows="3"
                      value={formData.assumptions} 
                      onChange={handleFormInputChange}
                      placeholder="Consideraciones críticas tomadas en cuenta..."
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)] transition resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Activities */}
              {activeFormTab === 'activities' && (
                <div className="space-y-4">
                  {/* Package Selector checkboxes */}
                  <div className="bg-[var(--color-nux-bg)]/40 border border-[var(--color-nux-border)] rounded-xl p-4 space-y-3">
                    <span className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Paquetes Adicionales</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {catalog.packages?.map(pkg => (
                        <label key={pkg.name} className="flex items-center gap-2 text-sm text-white cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={formData.selectedPackages?.includes(pkg.name) || false}
                            onChange={() => handlePackageToggle(pkg.name)}
                            className="w-4 h-4 accent-[var(--color-nux-primary)]"
                          />
                          <span>{pkg.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Activities Table */}
                  <div className="border border-[var(--color-nux-border)] rounded-xl overflow-hidden bg-[var(--color-nux-surface)]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                          <tr className="border-b border-[var(--color-nux-border)] bg-[var(--color-nux-bg)]/60 text-[var(--color-nux-text-muted)] text-[10px] uppercase font-bold tracking-wider">
                            <th className="py-3 px-4 w-28">Origen</th>
                            <th className="py-3 px-4 w-36">Fase</th>
                            <th className="py-3 px-4">Actividad</th>
                            <th className="py-3 px-4 w-32">Rol</th>
                            <th className="py-3 px-4 w-24">Complejidad</th>
                            <th className="py-3 px-4 w-16 text-right">Cant.</th>
                            <th className="py-3 px-4 w-20 text-right">Base H.</th>
                            <th className="py-3 px-4 w-16 text-right">Riesgo%</th>
                            <th className="py-3 px-4 w-24 text-right">Horas Est.</th>
                            <th className="py-3 px-4 w-20 text-right">Días</th>
                            <th className="py-3 px-4 w-12 text-center"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-nux-border)] text-sm">
                          {formData.activities?.map((act, index) => (
                            <tr key={index} className="hover:bg-[var(--color-nux-bg)]/20 transition">
                              <td className="py-2 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  act.origin === 'Plan' ? 'bg-blue-500/10 text-blue-400' :
                                  act.origin === 'Paquete' ? 'bg-pink-500/10 text-pink-400' :
                                  'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {act.origin}
                                </span>
                              </td>
                              <td className="py-2 px-4">
                                <input 
                                  type="text" 
                                  value={act.phase}
                                  onChange={(e) => handleActivityRowChange(index, 'phase', e.target.value)}
                                  className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-xs px-2 py-1 rounded outline-none"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <input 
                                  type="text" 
                                  value={act.name}
                                  onChange={(e) => handleActivityRowChange(index, 'name', e.target.value)}
                                  placeholder="Nombre de la actividad"
                                  className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-xs px-2 py-1 rounded outline-none font-semibold"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <input 
                                  type="text" 
                                  value={act.role}
                                  onChange={(e) => handleActivityRowChange(index, 'role', e.target.value)}
                                  placeholder="Rol ejecutor"
                                  className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-xs px-2 py-1 rounded outline-none"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <select 
                                  value={act.complexity}
                                  onChange={(e) => handleActivityRowChange(index, 'complexity', e.target.value)}
                                  className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-xs px-1 py-1 rounded outline-none"
                                >
                                  {catalog.config?.complexities?.map(f => <option key={f.name} value={f.name}>{f.name}</option>)}
                                </select>
                              </td>
                              <td className="py-2 px-4 text-right">
                                <input 
                                  type="number" 
                                  value={act.quantity}
                                  onChange={(e) => handleActivityRowChange(index, 'quantity', Number(e.target.value))}
                                  className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-xs px-2 py-1 rounded outline-none text-right"
                                />
                              </td>
                              <td className="py-2 px-4 text-right">
                                <input 
                                  type="number" 
                                  value={act.baseHours}
                                  onChange={(e) => handleActivityRowChange(index, 'baseHours', Number(e.target.value))}
                                  className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-xs px-2 py-1 rounded outline-none text-right font-mono"
                                />
                              </td>
                              <td className="py-2 px-4 text-right">
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={act.riskPercent}
                                  onChange={(e) => handleActivityRowChange(index, 'riskPercent', Number(e.target.value))}
                                  className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-xs px-2 py-1 rounded outline-none text-right font-mono"
                                />
                              </td>
                              <td className="py-2 px-4 text-right font-bold text-white font-mono">
                                {act.estimatedHours} h
                              </td>
                              <td className="py-2 px-4 text-right font-bold text-white font-mono">
                                {act.days} d
                              </td>
                              <td className="py-2 px-4 text-center">
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveActivityRow(index)}
                                  className="text-red-500 hover:text-red-400 p-1"
                                >
                                  <Trash size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleAddActivityRow}
                    className="flex items-center gap-2 border border-dashed border-[var(--color-nux-border)] hover:border-[var(--color-nux-primary)] bg-[var(--color-nux-bg)]/30 text-[var(--color-nux-text-muted)] hover:text-white px-4 py-3 rounded-xl w-full justify-center transition text-sm font-semibold"
                  >
                    <PlusCircle size={16} />
                    <span>Agregar Actividad Adicional</span>
                  </button>

                  {/* Summary Bar */}
                  <div className="bg-[var(--color-nux-bg)]/50 border border-[var(--color-nux-border)] rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <span className="text-[var(--color-nux-text-muted)] block text-xs">Subtotal horas</span>
                      <strong className="text-white text-lg">{formData.summary.subtotalHours} h</strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-nux-text-muted)] block text-xs">Colchón riesgo</span>
                      <strong className="text-white text-lg">{formData.summary.riskHours} h</strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-nux-text-muted)] block text-xs">Total horas</span>
                      <strong className="text-[var(--color-nux-accent)] text-lg">{formData.summary.totalHours} h</strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-nux-text-muted)] block text-xs">Total días</span>
                      <strong className="text-white text-lg">{formData.summary.totalDays} d</strong>
                    </div>
                    <div>
                      <span className="text-[var(--color-nux-text-muted)] block text-xs">Semanas</span>
                      <strong className="text-white text-lg">{formData.summary.weeks} sem</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Cost */}
              {activeFormTab === 'cost' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="bg-[var(--color-nux-bg)]/40 border border-[var(--color-nux-border)] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">Habilitar módulo de Costos</h4>
                      <p className="text-xs text-[var(--color-nux-text-muted)] mt-0.5">Muestra tarifas por hora y montos totales en el PDF.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={formData.cost?.enabled || false}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            cost: { ...prev.cost, enabled }
                          }));
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[var(--color-nux-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-5 after:width-5 after:transition-all peer-checked:bg-[var(--color-nux-primary)]"></div>
                    </label>
                  </div>

                  {formData.cost?.enabled && (
                    <div className="space-y-4 animate-dribbble-pop">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Tarifa por Hora</label>
                          <input 
                            type="number"
                            name="cost.hourlyRate"
                            value={formData.cost.hourlyRate || formData.hourlyRate}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setFormData(prev => {
                                const subtotal = prev.summary.subtotalHours * val;
                                const total = prev.summary.totalHours * val;
                                return {
                                  ...prev,
                                  hourlyRate: val,
                                  cost: { ...prev.cost, hourlyRate: val, subtotal, total }
                                };
                              });
                            }}
                            className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Moneda</label>
                          <select 
                            name="cost.currency"
                            value={formData.cost.currency || formData.currency}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                currency: val,
                                cost: { ...prev.cost, currency: val }
                              }));
                            }}
                            className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)]"
                          >
                            {catalog.config?.currencies?.map(t => <option key={t.code || t.name || t} value={t.code || t}>{t.name || t.code || t}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 bg-[var(--color-nux-bg)]/40 border border-[var(--color-nux-border)] rounded-xl p-4">
                        <div>
                          <span className="text-[var(--color-nux-text-muted)] block text-xs">Subtotal (Sin riesgo)</span>
                          <strong className="text-white text-lg">
                            {formatMoney(formData.cost.subtotal || 0, formData.cost.currency)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[var(--color-nux-text-muted)] block text-xs">Costo Colchón</span>
                          <strong className="text-white text-lg">
                            {formatMoney((formData.cost.total || 0) - (formData.cost.subtotal || 0), formData.cost.currency)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[var(--color-nux-text-muted)] block text-xs font-bold">Total Costo Estimado</span>
                          <strong className="text-[var(--color-nux-accent)] text-xl font-black">
                            {formatMoney(formData.cost.total || 0, formData.cost.currency)}
                          </strong>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Notas de Costeo / Condiciones de Pago</label>
                        <textarea 
                          name="cost.notes"
                          rows="3"
                          value={formData.cost.notes || ''}
                          onChange={handleFormInputChange}
                          placeholder="Ej. Forma de pago: 50% de anticipo, 50% contra entrega..."
                          className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)] resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Architecture */}
              {activeFormTab === 'architecture' && (
                <div className="space-y-6">
                  {formMode === 'create' ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl p-4 flex items-start gap-3 max-w-xl">
                      <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                      <p className="text-xs leading-relaxed">
                        Para subir imágenes de arquitectura propuesta, primero debes guardar la estimación. Una vez guardada, edítala para poder asociar capturas al servidor local.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-white text-sm">Galería de Arquitectura Propuesta</h4>
                          <p className="text-xs text-[var(--color-nux-text-muted)] mt-0.5">Sube capturas de diagramas que se incorporarán al PDF.</p>
                        </div>
                        <label className="flex items-center gap-2 bg-[var(--color-nux-primary)] hover:bg-[var(--color-nux-primary-hover)] text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition shadow-lg">
                          <Upload size={14} />
                          <span>Subir Imagen</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleArchImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Image Grid */}
                      {formData.architectureImages?.length === 0 ? (
                        <div className="border border-dashed border-[var(--color-nux-border)] bg-[var(--color-nux-bg)]/20 p-12 text-center rounded-xl text-[var(--color-nux-text-muted)] flex flex-col items-center justify-center gap-2">
                          <ImageIcon size={32} />
                          <span className="text-xs font-semibold">No se han subido imágenes de arquitectura aún</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {formData.architectureImages?.map((img, index) => (
                            <div key={index} className="bg-[var(--color-nux-bg)]/40 border border-[var(--color-nux-border)] rounded-xl p-4 space-y-3 relative group">
                              <img 
                                src={img.url} 
                                alt={img.title} 
                                className="w-full h-44 object-contain bg-black rounded-lg border border-[var(--color-nux-border)]" 
                              />
                              <div className="grid grid-cols-1 gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Título de la imagen"
                                  value={img.title || ''}
                                  onChange={(e) => {
                                    const updated = [...formData.architectureImages];
                                    updated[index] = { ...updated[index], title: e.target.value };
                                    setFormData(prev => ({ ...prev, architectureImages: updated }));
                                  }}
                                  className="w-full bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-white text-xs px-2.5 py-1.5 rounded outline-none"
                                />
                                <input 
                                  type="text" 
                                  placeholder="Descripción corta"
                                  value={img.description || ''}
                                  onChange={(e) => {
                                    const updated = [...formData.architectureImages];
                                    updated[index] = { ...updated[index], description: e.target.value };
                                    setFormData(prev => ({ ...prev, architectureImages: updated }));
                                  }}
                                  className="w-full bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-white text-xs px-2.5 py-1.5 rounded outline-none"
                                />
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleArchImageDelete(index)}
                                className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Notes */}
              {activeFormTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-sm font-semibold">Observaciones, exclusiones y condiciones</h4>
                      <p className="text-xs text-[var(--color-nux-text-muted)] mt-0.5">Agrega cláusulas legales o de garantía para la estimación.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddNoteRow}
                      className="flex items-center gap-1.5 bg-[var(--color-nux-surface-hover)] border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-border)] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition"
                    >
                      <Plus size={14} />
                      <span>Agregar Fila</span>
                    </button>
                  </div>

                  {formData.notes?.length === 0 ? (
                    <div className="border border-dashed border-[var(--color-nux-border)] bg-[var(--color-nux-bg)]/20 p-12 text-center rounded-xl text-[var(--color-nux-text-muted)] flex flex-col items-center justify-center gap-2">
                      <BookOpen size={32} />
                      <span className="text-xs font-semibold">No se han registrado observaciones</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.notes?.map((n, index) => (
                        <div key={index} className="flex gap-4 items-start bg-[var(--color-nux-bg)]/20 border border-[var(--color-nux-border)] p-4 rounded-xl relative group">
                          <div className="w-1/4">
                            <input 
                              type="text" 
                              required
                              value={n.title || ''}
                              onChange={(e) => handleNoteRowChange(index, 'title', e.target.value)}
                              placeholder="Ej. Exclusiones"
                              className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-3 py-2 rounded-lg outline-none font-bold"
                            />
                          </div>
                          <div className="flex-1">
                            <textarea 
                              required
                              rows="2"
                              value={n.description || ''}
                              onChange={(e) => handleNoteRowChange(index, 'description', e.target.value)}
                              placeholder="Cláusula o texto descriptivo..."
                              className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-3 py-1.5 rounded-lg outline-none resize-none"
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveNoteRow(index)}
                            className="text-red-500 hover:text-red-400 p-2 self-center shrink-0"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 6: Approval */}
              {activeFormTab === 'approval' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Elaborado por (Firma)</label>
                    <input 
                      type="text"
                      name="approval.preparedBy"
                      value={formData.approval?.preparedBy || ''}
                      onChange={handleFormInputChange}
                      placeholder="Nombre del creador"
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Aprobado por (Firma)</label>
                    <input 
                      type="text"
                      name="approval.approvedBy"
                      value={formData.approval?.approvedBy || ''}
                      onChange={handleFormInputChange}
                      placeholder="Nombre del cliente o manager"
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)]"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider">Nota Ejecutiva (Executive Note)</label>
                    <textarea 
                      name="summary.executiveNote" 
                      rows="4"
                      value={formData.summary?.executiveNote || ''}
                      onChange={handleFormInputChange}
                      placeholder="Mensaje introductorio o nota general para el resumen ejecutivo..."
                      className="w-full bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] text-white text-sm px-4 py-2.5 rounded-xl outline-none focus:border-[var(--color-nux-primary)] resize-none"
                    />
                  </div>
                </div>
              )}
            </form>

            {/* Form Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-nux-border)] bg-[var(--color-nux-bg)]/40 shrink-0">
              <button 
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-surface-hover)] rounded-xl text-sm transition text-white"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEstimation}
                className="px-6 py-2 bg-gradient-to-r from-[var(--color-nux-primary)] to-[#a855f7] hover:brightness-110 text-white font-bold rounded-xl text-sm transition flex items-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                <span>{formMode === 'create' ? 'Crear Estimación' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Detail Viewer (Center Modal Style) */}
      {isDetailOpen && selectedEstimation && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-black/75 backdrop-blur-sm">
          <div className="bg-white text-black w-full max-w-4xl h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-dribbble-pop">
            {/* Viewer Header */}
            <div className="bg-[var(--color-nux-bg)] text-white flex items-center justify-between px-6 py-4 border-b border-[var(--color-nux-border)] shrink-0">
              <div>
                <span className="text-xs font-mono font-bold text-[var(--color-nux-accent)] uppercase">{selectedEstimation.code}</span>
                <h3 className="font-bold text-lg text-white">{selectedEstimation.title}</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] p-1 rounded-xl gap-1 shrink-0">
                  {['Pendiente', 'Aprobado', 'Rechazado', 'Modificado'].map(s => (
                    <button 
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                        selectedEstimation.status === s 
                          ? 'bg-[var(--color-nux-primary)] text-white shadow-md' 
                          : 'text-[var(--color-nux-text-muted)] hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => downloadPdf(selectedEstimation._id, selectedEstimation.title)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition flex items-center gap-2"
                >
                  <Download size={14} />
                  <span>PDF</span>
                </button>

                <button onClick={() => setIsDetailOpen(false)} className="text-[var(--color-nux-text-muted)] hover:text-white transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Viewer HTML Content */}
            <div data-lenis-prevent="true" className="flex-1 overflow-y-auto p-8 bg-[#f8fafc]">
              <div 
                className="max-w-[210mm] mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: Catalog Manager Modal */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-dribbble-pop">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-nux-border)]">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <BookOpen className="text-[var(--color-nux-primary)]" />
                  <span>Configuración de Catálogo Maestro</span>
                </h3>
                <p className="text-xs text-[var(--color-nux-text-muted)] mt-0.5">Parametrización global de actividades, planes, paquetes y factores de estimación.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-surface-hover)] text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer transition">
                  <Upload size={14} />
                  <span>Cargar Excel</span>
                  <input 
                    type="file" 
                    ref={catalogFileInputRef}
                    accept=".xlsx,.xls"
                    onChange={handleCatalogExcelUpload}
                    className="hidden"
                  />
                </label>
                <button onClick={() => setIsCatalogOpen(false)} className="text-[var(--color-nux-text-muted)] hover:text-white transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Catalog tab headers */}
            <div className="flex border-b border-[var(--color-nux-border)] shrink-0 bg-[var(--color-nux-bg)]/20">
              {[
                { id: 'activities', label: 'Actividades Master' },
                { id: 'plans', label: 'Planes Base' },
                { id: 'packages', label: 'Paquetes Especiales' },
                { id: 'config', label: 'Variables Config' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveCatalogTab(t.id)}
                  className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition ${
                    activeCatalogTab === t.id 
                      ? 'border-[var(--color-nux-primary)] text-white bg-[var(--color-nux-surface)]' 
                      : 'border-transparent text-[var(--color-nux-text-muted)] hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Catalog tab body */}
            <div data-lenis-prevent="true" className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeCatalogTab === 'activities' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[var(--color-nux-text-muted)]">Lista de Actividades ({catalog.activities?.length || 0})</span>
                    <button 
                      onClick={() => {
                        const activities = [...(catalog.activities || []), { code: `ACT-${Date.now()}`, name: '', phase: 'Desarrollo', description: '', type: 'Desarrollo', role: 'Fullstack Developer', complexity: 'Media', baseHours: 8, riskPercent: 0.10, dependency: '' }];
                        setCatalog(prev => ({ ...prev, activities }));
                      }}
                      className="flex items-center gap-1 bg-[var(--color-nux-bg)] border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-surface-hover)] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <div className="border border-[var(--color-nux-border)] rounded-xl overflow-hidden bg-[var(--color-nux-bg)]/30">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--color-nux-border)] bg-[var(--color-nux-bg)] text-[var(--color-nux-text-muted)] uppercase font-bold">
                          <th className="py-2.5 px-4 w-24">Código</th>
                          <th className="py-2.5 px-4">Actividad</th>
                          <th className="py-2.5 px-4 w-32">Fase</th>
                          <th className="py-2.5 px-4 w-32">Rol</th>
                          <th className="py-2.5 px-4 w-24">Complejidad</th>
                          <th className="py-2.5 px-4 w-20 text-right">Base H.</th>
                          <th className="py-2.5 px-4 w-16 text-right">Riesgo%</th>
                          <th className="py-2.5 px-4 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-nux-border)] text-white">
                        {catalog.activities?.map((act, index) => (
                          <tr key={index} className="hover:bg-[var(--color-nux-surface-hover)] transition">
                            <td className="py-2 px-4">
                              <input 
                                type="text"
                                value={act.code}
                                onChange={(e) => {
                                  const activities = [...catalog.activities];
                                  activities[index].code = e.target.value;
                                  setCatalog(prev => ({ ...prev, activities }));
                                }}
                                className="bg-transparent border border-[var(--color-nux-border)] w-full rounded px-1.5 py-0.5 text-xs text-cyan-400 font-mono outline-none"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input 
                                type="text"
                                value={act.name}
                                onChange={(e) => {
                                  const activities = [...catalog.activities];
                                  activities[index].name = e.target.value;
                                  setCatalog(prev => ({ ...prev, activities }));
                                }}
                                className="bg-transparent border border-[var(--color-nux-border)] w-full rounded px-1.5 py-0.5 text-xs font-bold outline-none"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input 
                                type="text"
                                value={act.phase}
                                onChange={(e) => {
                                  const activities = [...catalog.activities];
                                  activities[index].phase = e.target.value;
                                  setCatalog(prev => ({ ...prev, activities }));
                                }}
                                className="bg-transparent border border-[var(--color-nux-border)] w-full rounded px-1.5 py-0.5 text-xs outline-none"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input 
                                type="text"
                                value={act.role}
                                onChange={(e) => {
                                  const activities = [...catalog.activities];
                                  activities[index].role = e.target.value;
                                  setCatalog(prev => ({ ...prev, activities }));
                                }}
                                className="bg-transparent border border-[var(--color-nux-border)] w-full rounded px-1.5 py-0.5 text-xs outline-none"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input 
                                type="text"
                                value={act.complexity}
                                onChange={(e) => {
                                  const activities = [...catalog.activities];
                                  activities[index].complexity = e.target.value;
                                  setCatalog(prev => ({ ...prev, activities }));
                                }}
                                className="bg-transparent border border-[var(--color-nux-border)] w-full rounded px-1.5 py-0.5 text-xs outline-none"
                              />
                            </td>
                            <td className="py-2 px-4 text-right">
                              <input 
                                type="number"
                                value={act.baseHours}
                                onChange={(e) => {
                                  const activities = [...catalog.activities];
                                  activities[index].baseHours = Number(e.target.value);
                                  setCatalog(prev => ({ ...prev, activities }));
                                }}
                                className="bg-transparent border border-[var(--color-nux-border)] w-full rounded px-1.5 py-0.5 text-xs text-right outline-none"
                              />
                            </td>
                            <td className="py-2 px-4 text-right">
                              <input 
                                type="number"
                                step="0.01"
                                value={act.riskPercent}
                                onChange={(e) => {
                                  const activities = [...catalog.activities];
                                  activities[index].riskPercent = Number(e.target.value);
                                  setCatalog(prev => ({ ...prev, activities }));
                                }}
                                className="bg-transparent border border-[var(--color-nux-border)] w-full rounded px-1.5 py-0.5 text-xs text-right outline-none"
                              />
                            </td>
                            <td className="py-2 px-4 text-center">
                              <button 
                                onClick={() => {
                                  const activities = catalog.activities.filter((_, i) => i !== index);
                                  setCatalog(prev => ({ ...prev, activities }));
                                }}
                                className="text-red-500 hover:text-red-400 p-0.5"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeCatalogTab === 'plans' && (
                <div className="space-y-6">
                  {catalog.plans?.map((plan, pIdx) => (
                    <div key={pIdx} className="bg-[var(--color-nux-bg)]/40 border border-[var(--color-nux-border)] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <input 
                          type="text"
                          value={plan.name}
                          onChange={(e) => {
                            const plans = [...catalog.plans];
                            plans[pIdx].name = e.target.value;
                            setCatalog(prev => ({ ...prev, plans }));
                          }}
                          className="bg-transparent border border-[var(--color-nux-border)] rounded px-2.5 py-1 text-sm font-bold text-white outline-none"
                        />
                        <button 
                          onClick={() => {
                            const plans = catalog.plans.filter((_, i) => i !== pIdx);
                            setCatalog(prev => ({ ...prev, plans }));
                          }}
                          className="text-red-500 hover:text-red-400 text-xs font-bold"
                        >
                          Eliminar Plan
                        </button>
                      </div>

                      <table className="w-full text-left border-collapse text-[11px] text-white">
                        <thead>
                          <tr className="border-b border-[var(--color-nux-border)] text-[var(--color-nux-text-muted)]">
                            <th className="py-1.5">Actividad Asociada</th>
                            <th className="py-1.5 text-right w-24">Cantidad</th>
                            <th className="py-1.5 text-right w-24">Orden</th>
                            <th className="py-1.5 w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.activities?.map((pa, aIdx) => (
                            <tr key={aIdx} className="border-b border-[var(--color-nux-border)]/50">
                              <td className="py-1">
                                <select 
                                  value={pa.activityName}
                                  onChange={(e) => {
                                    const plans = [...catalog.plans];
                                    plans[pIdx].activities[aIdx].activityName = e.target.value;
                                    setCatalog(prev => ({ ...prev, plans }));
                                  }}
                                  className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2 py-1 outline-none w-full"
                                >
                                  {catalog.activities?.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                </select>
                              </td>
                              <td className="py-1 text-right">
                                <input 
                                  type="number"
                                  value={pa.quantity}
                                  onChange={(e) => {
                                    const plans = [...catalog.plans];
                                    plans[pIdx].activities[aIdx].quantity = Number(e.target.value);
                                    setCatalog(prev => ({ ...prev, plans }));
                                  }}
                                  className="bg-transparent border border-[var(--color-nux-border)] rounded text-right px-2 py-0.5 text-xs text-white outline-none w-16"
                                />
                              </td>
                              <td className="py-1 text-right">
                                <input 
                                  type="number"
                                  value={pa.order}
                                  onChange={(e) => {
                                    const plans = [...catalog.plans];
                                    plans[pIdx].activities[aIdx].order = Number(e.target.value);
                                    setCatalog(prev => ({ ...prev, plans }));
                                  }}
                                  className="bg-transparent border border-[var(--color-nux-border)] rounded text-right px-2 py-0.5 text-xs text-white outline-none w-16"
                                />
                              </td>
                              <td className="py-1 text-center">
                                <button 
                                  onClick={() => {
                                    const plans = [...catalog.plans];
                                    plans[pIdx].activities = plans[pIdx].activities.filter((_, i) => i !== aIdx);
                                    setCatalog(prev => ({ ...prev, plans }));
                                  }}
                                  className="text-red-500 hover:text-red-400"
                                >
                                  <X size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button 
                        onClick={() => {
                          const plans = [...catalog.plans];
                          plans[pIdx].activities.push({ activityName: catalog.activities?.[0]?.name || '', quantity: 1, order: plans[pIdx].activities.length });
                          setCatalog(prev => ({ ...prev, plans }));
                        }}
                        className="text-xs text-[var(--color-nux-accent)] hover:text-white font-bold flex items-center gap-1.5"
                      >
                        <Plus size={12} />
                        <span>Agregar Actividad</span>
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const plans = [...(catalog.plans || []), { name: `Nuevo Plan ${Date.now()}`, type: 'Desarrollo', idealFor: '', description: '', includes: '', observations: '', activities: [] }];
                      setCatalog(prev => ({ ...prev, plans }));
                    }}
                    className="w-full border border-dashed border-[var(--color-nux-border)] text-[var(--color-nux-text-muted)] hover:text-white text-xs font-bold py-3.5 rounded-xl transition"
                  >
                    + Crear Nuevo Plan
                  </button>
                </div>
              )}

              {activeCatalogTab === 'packages' && (
                <div className="space-y-6">
                  {catalog.packages?.map((pkg, pIdx) => (
                    <div key={pIdx} className="bg-[var(--color-nux-bg)]/40 border border-[var(--color-nux-border)] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <input 
                          type="text"
                          value={pkg.name}
                          onChange={(e) => {
                            const packages = [...catalog.packages];
                            packages[pIdx].name = e.target.value;
                            setCatalog(prev => ({ ...prev, packages }));
                          }}
                          className="bg-transparent border border-[var(--color-nux-border)] rounded px-2.5 py-1 text-sm font-bold text-white outline-none"
                        />
                        <button 
                          onClick={() => {
                            const packages = catalog.packages.filter((_, i) => i !== pIdx);
                            setCatalog(prev => ({ ...prev, packages }));
                          }}
                          className="text-red-500 hover:text-red-400 text-xs font-bold"
                        >
                          Eliminar Paquete
                        </button>
                      </div>

                      <table className="w-full text-left border-collapse text-[11px] text-white">
                        <thead>
                          <tr className="border-b border-[var(--color-nux-border)] text-[var(--color-nux-text-muted)]">
                            <th className="py-1.5">Actividad Asociada</th>
                            <th className="py-1.5 text-right w-24">Cantidad</th>
                            <th className="py-1.5 text-right w-24">Orden</th>
                            <th className="py-1.5 w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {pkg.activities?.map((pa, aIdx) => (
                            <tr key={aIdx} className="border-b border-[var(--color-nux-border)]/50">
                              <td className="py-1">
                                <select 
                                  value={pa.activityName}
                                  onChange={(e) => {
                                    const packages = [...catalog.packages];
                                    packages[pIdx].activities[aIdx].activityName = e.target.value;
                                    setCatalog(prev => ({ ...prev, packages }));
                                  }}
                                  className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2 py-1 outline-none w-full"
                                >
                                  {catalog.activities?.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                                </select>
                              </td>
                              <td className="py-1 text-right">
                                <input 
                                  type="number"
                                  value={pa.quantity}
                                  onChange={(e) => {
                                    const packages = [...catalog.packages];
                                    packages[pIdx].activities[aIdx].quantity = Number(e.target.value);
                                    setCatalog(prev => ({ ...prev, packages }));
                                  }}
                                  className="bg-transparent border border-[var(--color-nux-border)] rounded text-right px-2 py-0.5 text-xs text-white outline-none w-16"
                                />
                              </td>
                              <td className="py-1 text-right">
                                <input 
                                  type="number"
                                  value={pa.order}
                                  onChange={(e) => {
                                    const packages = [...catalog.packages];
                                    packages[pIdx].activities[aIdx].order = Number(e.target.value);
                                    setCatalog(prev => ({ ...prev, packages }));
                                  }}
                                  className="bg-transparent border border-[var(--color-nux-border)] rounded text-right px-2 py-0.5 text-xs text-white outline-none w-16"
                                />
                              </td>
                              <td className="py-1 text-center">
                                <button 
                                  onClick={() => {
                                    const packages = [...catalog.packages];
                                    packages[pIdx].activities = packages[pIdx].activities.filter((_, i) => i !== aIdx);
                                    setCatalog(prev => ({ ...prev, packages }));
                                  }}
                                  className="text-red-500 hover:text-red-400"
                                >
                                  <X size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button 
                        onClick={() => {
                          const packages = [...catalog.packages];
                          packages[pIdx].activities.push({ activityName: catalog.activities?.[0]?.name || '', quantity: 1, order: packages[pIdx].activities.length });
                          setCatalog(prev => ({ ...prev, packages }));
                        }}
                        className="text-xs text-[var(--color-nux-accent)] hover:text-white font-bold flex items-center gap-1.5"
                      >
                        <Plus size={12} />
                        <span>Agregar Actividad</span>
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const packages = [...(catalog.packages || []), { name: `Nuevo Paquete ${Date.now()}`, category: 'General', description: '', includes: '', activities: [] }];
                      setCatalog(prev => ({ ...prev, packages }));
                    }}
                    className="w-full border border-dashed border-[var(--color-nux-border)] text-[var(--color-nux-text-muted)] hover:text-white text-xs font-bold py-3.5 rounded-xl transition"
                  >
                    + Crear Nuevo Paquete
                  </button>
                </div>
              )}

              {activeCatalogTab === 'config' && catalog.config && (
                <div className="space-y-6 w-full text-sm">
                  {/* Complexity Factors */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider block">Factores de Complejidad</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {catalog.config.complexities?.map((cf, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5 border border-[var(--color-nux-border)] p-3 rounded-xl bg-[var(--color-nux-bg)]/40 justify-between">
                          <span className="text-white font-bold text-xs">{cf.name}</span>
                          <input 
                            type="number"
                            step="0.01"
                            value={cf.factor}
                            onChange={(e) => {
                              const complexities = [...catalog.config.complexities];
                              complexities[idx] = { ...complexities[idx], factor: Number(e.target.value) };
                              setCatalog(prev => ({ ...prev, config: { ...prev.config, complexities } }));
                            }}
                            className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2.5 py-1.5 outline-none w-full font-mono text-right"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* List Configuration Variables Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Priorities Editor */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider block">Prioridades</span>
                        <button 
                          type="button"
                          onClick={() => {
                            const priorities = [...(catalog.config.priorities || []), { code: '', name: '', factor: 1.0 }];
                            setCatalog(prev => ({ ...prev, config: { ...prev.config, priorities } }));
                          }}
                          className="flex items-center gap-1 bg-[var(--color-nux-surface-hover)] border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-border)] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition"
                        >
                          <Plus size={12} /> Agregar
                        </button>
                      </div>
                      <div className="border border-[var(--color-nux-border)] rounded-xl overflow-hidden bg-[var(--color-nux-bg)]/20 p-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {(catalog.config.priorities || []).length === 0 ? (
                          <div className="text-center text-xs text-[var(--color-nux-text-muted)] py-4">No hay prioridades configuradas.</div>
                        ) : (
                          (catalog.config.priorities || []).map((p, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input 
                                type="text"
                                placeholder="Código"
                                value={p.code || ''}
                                onChange={(e) => {
                                  const priorities = [...catalog.config.priorities];
                                  priorities[idx] = { ...priorities[idx], code: e.target.value.toUpperCase() };
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, priorities } }));
                                }}
                                className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2.5 py-1 outline-none w-1/4 font-mono"
                              />
                              <input 
                                type="text"
                                placeholder="Nombre"
                                value={p.name || ''}
                                onChange={(e) => {
                                  const priorities = [...catalog.config.priorities];
                                  priorities[idx] = { ...priorities[idx], name: e.target.value };
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, priorities } }));
                                }}
                                className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2.5 py-1 outline-none flex-1"
                              />
                              <input 
                                type="number"
                                step="0.01"
                                placeholder="Factor"
                                value={p.factor || 1.0}
                                onChange={(e) => {
                                  const priorities = [...catalog.config.priorities];
                                  priorities[idx] = { ...priorities[idx], factor: Number(e.target.value) };
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, priorities } }));
                                }}
                                className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2.5 py-1 outline-none w-20 text-right font-mono"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const priorities = catalog.config.priorities.filter((_, i) => i !== idx);
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, priorities } }));
                                }}
                                className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Environments Editor */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider block">Ambientes</span>
                        <button 
                          type="button"
                          onClick={() => {
                            const environments = [...(catalog.config.environments || []), { code: '', name: '' }];
                            setCatalog(prev => ({ ...prev, config: { ...prev.config, environments } }));
                          }}
                          className="flex items-center gap-1 bg-[var(--color-nux-surface-hover)] border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-border)] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition"
                        >
                          <Plus size={12} /> Agregar
                        </button>
                      </div>
                      <div className="border border-[var(--color-nux-border)] rounded-xl overflow-hidden bg-[var(--color-nux-bg)]/20 p-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {(catalog.config.environments || []).length === 0 ? (
                          <div className="text-center text-xs text-[var(--color-nux-text-muted)] py-4">No hay ambientes configurados.</div>
                        ) : (
                          (catalog.config.environments || []).map((e, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input 
                                type="text"
                                placeholder="Código"
                                value={e.code || ''}
                                onChange={(eVal) => {
                                  const environments = [...catalog.config.environments];
                                  environments[idx] = { ...environments[idx], code: eVal.target.value.toUpperCase() };
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, environments } }));
                                }}
                                className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2.5 py-1 outline-none w-1/3 font-mono"
                              />
                              <input 
                                type="text"
                                placeholder="Nombre"
                                value={e.name || ''}
                                onChange={(eVal) => {
                                  const environments = [...catalog.config.environments];
                                  environments[idx] = { ...environments[idx], name: eVal.target.value };
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, environments } }));
                                }}
                                className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2.5 py-1 outline-none flex-1"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const environments = catalog.config.environments.filter((_, i) => i !== idx);
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, environments } }));
                                }}
                                className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Currencies Editor */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider block">Monedas</span>
                        <button 
                          type="button"
                          onClick={() => {
                            const currencies = [...(catalog.config.currencies || []), { code: '', name: '', symbol: '', active: true }];
                            setCatalog(prev => ({ ...prev, config: { ...prev.config, currencies } }));
                          }}
                          className="flex items-center gap-1 bg-[var(--color-nux-surface-hover)] border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-border)] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition"
                        >
                          <Plus size={12} /> Agregar
                        </button>
                      </div>
                      <div className="border border-[var(--color-nux-border)] rounded-xl overflow-hidden bg-[var(--color-nux-bg)]/20 p-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {(catalog.config.currencies || []).length === 0 ? (
                          <div className="text-center text-xs text-[var(--color-nux-text-muted)] py-4">No hay monedas configuradas.</div>
                        ) : (
                          (catalog.config.currencies || []).map((c, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input 
                                type="text"
                                placeholder="Código"
                                value={c.code || ''}
                                onChange={(e) => {
                                  const currencies = [...catalog.config.currencies];
                                  currencies[idx] = { ...currencies[idx], code: e.target.value.toUpperCase() };
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, currencies } }));
                                }}
                                className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2.5 py-1 outline-none w-1/4 font-mono"
                              />
                              <input 
                                type="text"
                                placeholder="Nombre"
                                value={c.name || ''}
                                onChange={(e) => {
                                  const currencies = [...catalog.config.currencies];
                                  currencies[idx] = { ...currencies[idx], name: e.target.value };
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, currencies } }));
                                }}
                                className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2.5 py-1 outline-none flex-1"
                              />
                              <input 
                                type="text"
                                placeholder="Símbolo"
                                value={c.symbol || ''}
                                onChange={(e) => {
                                  const currencies = [...catalog.config.currencies];
                                  currencies[idx] = { ...currencies[idx], symbol: e.target.value };
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, currencies } }));
                                }}
                                className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2.5 py-1 outline-none w-16 text-center font-mono"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const currencies = catalog.config.currencies.filter((_, i) => i !== idx);
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, currencies } }));
                                }}
                                className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Development Types Editor */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[var(--color-nux-text-muted)] uppercase tracking-wider block">Tipos de Desarrollo</span>
                        <button 
                          type="button"
                          onClick={() => {
                            const developmentTypes = [...(catalog.config.developmentTypes || []), { code: '', name: '' }];
                            setCatalog(prev => ({ ...prev, config: { ...prev.config, developmentTypes } }));
                          }}
                          className="flex items-center gap-1 bg-[var(--color-nux-surface-hover)] border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-border)] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition"
                        >
                          <Plus size={12} /> Agregar
                        </button>
                      </div>
                      <div className="border border-[var(--color-nux-border)] rounded-xl overflow-hidden bg-[var(--color-nux-bg)]/20 p-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {(catalog.config.developmentTypes || []).length === 0 ? (
                          <div className="text-center text-xs text-[var(--color-nux-text-muted)] py-4">No hay tipos de desarrollo configurados.</div>
                        ) : (
                          (catalog.config.developmentTypes || []).map((t, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                              <input 
                                type="text"
                                placeholder="Código"
                                value={t.code || ''}
                                onChange={(e) => {
                                  const developmentTypes = [...catalog.config.developmentTypes];
                                  developmentTypes[idx] = { ...developmentTypes[idx], code: e.target.value.toUpperCase() };
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, developmentTypes } }));
                                }}
                                className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2.5 py-1 outline-none w-1/3 font-mono"
                              />
                              <input 
                                type="text"
                                placeholder="Nombre"
                                value={t.name || ''}
                                onChange={(e) => {
                                  const developmentTypes = [...catalog.config.developmentTypes];
                                  developmentTypes[idx] = { ...developmentTypes[idx], name: e.target.value };
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, developmentTypes } }));
                                }}
                                className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] text-xs text-white rounded px-2.5 py-1 outline-none flex-1"
                              />
                              <button 
                                type="button"
                                onClick={() => {
                                  const developmentTypes = catalog.config.developmentTypes.filter((_, i) => i !== idx);
                                  setCatalog(prev => ({ ...prev, config: { ...prev.config, developmentTypes } }));
                                }}
                                className="text-red-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Catalog footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-nux-border)] bg-[var(--color-nux-bg)]/40 shrink-0">
              <button 
                onClick={() => setIsCatalogOpen(false)}
                className="px-4 py-2 border border-[var(--color-nux-border)] hover:bg-[var(--color-nux-surface-hover)] rounded-xl text-sm transition text-white"
              >
                Cerrar sin guardar
              </button>
              <button 
                onClick={handleSaveCatalog}
                className="px-6 py-2 bg-gradient-to-r from-[var(--color-nux-primary)] to-[#a855f7] hover:brightness-110 text-white font-bold rounded-xl text-sm transition flex items-center gap-2"
              >
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Delete Confirmation */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-nux-surface)] border border-[var(--color-nux-border)] rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-dribbble-pop">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-lg">¿Eliminar estimación?</h3>
                <p className="text-xs text-[var(--color-nux-text-muted)] leading-relaxed">
                  Esta acción es irreversible y eliminará todos los registros e imágenes asociados de la base de datos.
                </p>
              </div>
            </div>
            <div className="flex border-t border-[var(--color-nux-border)]">
              <button 
                onClick={() => setIsDeleteOpen(false)}
                className="w-1/2 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--color-nux-bg)]/40 border-r border-[var(--color-nux-border)] transition"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDelete}
                className="w-1/2 py-3.5 text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-950/20 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
