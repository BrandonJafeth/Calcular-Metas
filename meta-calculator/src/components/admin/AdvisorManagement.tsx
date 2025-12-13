import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/currency';
import { Plus, Trash2, Copy, User, Calendar, DollarSign, Clock, X, Eye, FileText, FileSpreadsheet, Save, LayoutTemplate } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../lib/utils';
import { exportAdminReportPDF, exportAdminReportExcel } from '../../utils/exportUtils';
import type { Advisor, DailySession, HourlyWeight, AdvisorAvailability, SessionTemplate } from '../../types';

interface AdvisorManagementProps {
  date: string;
}

export const AdvisorManagement: React.FC<AdvisorManagementProps> = ({ date }) => {
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // 1. Session Query
  const { data: session } = useQuery({
    queryKey: ['session', date],
    queryFn: () => adminService.getOrCreateSession(date)
  });

  // 2. Weights Query
  const { data: weights } = useQuery({
    queryKey: ['weights', session?.id],
    queryFn: () => adminService.getHourlyWeights(session!.id),
    enabled: !!session?.id
  });

  // 3. Advisors Query
  const { data: advisors } = useQuery({
    queryKey: ['advisors', session?.id],
    queryFn: () => adminService.getAdvisors(session!.id),
    enabled: !!session?.id
  });

  // 4. Availability Query
  const { data: availability } = useQuery({
    queryKey: ['availability', session?.id],
    queryFn: () => adminService.getAllSessionAvailability(session!.id),
    enabled: !!session?.id
  });

  // 5. Templates Query
  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: adminService.getTemplates
  });

  // Mutations
  const updateGoalMutation = useMutation({
    mutationFn: (goal: number) => adminService.updateSessionGoal(session!.id, goal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session', date] })
  });

  const createTemplateMutation = useMutation({
    mutationFn: (name: string) => {
      if (!session || !weights) throw new Error("No session data");
      const start = session.start_hour ?? 9;
      const end = session.end_hour ?? 21;
      return adminService.createTemplate(name, start, end, weights);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      showToast('Plantilla guardada', 'success');
    }
  });

  const applyTemplateMutation = useMutation({
    mutationFn: (templateId: string) => adminService.applyTemplate(session!.id, templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', date] });
      queryClient.invalidateQueries({ queryKey: ['weights', session?.id] });
      showToast('Plantilla aplicada', 'success');
      setShowTemplatesModal(false);
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      showToast('Plantilla eliminada', 'success');
    }
  });

  const updateHoursMutation = useMutation({
    mutationFn: (vars: { start: number, end: number }) => 
      adminService.updateSessionHours(session!.id, vars.start, vars.end),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session', date] })
  });

  const updateWeightsMutation = useMutation({
    mutationFn: (newWeights: { session_id: string, hour_start: number, percentage: number }[]) => 
      adminService.upsertHourlyWeights(newWeights),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['weights', session?.id] })
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: (vars: { advisorId: string, hour: number, isActive: boolean }) => 
      adminService.updateAvailability(vars.advisorId, vars.hour, vars.isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['availability', session?.id] })
  });

  const addAdvisorMutation = useMutation({
    mutationFn: (name: string) => adminService.createAdvisor(session!.id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisors', session?.id] });
      setNewAdvisorName('');
    }
  });

  const deleteAdvisorMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteAdvisor(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['advisors', session?.id] })
  });

  // Local State
  const [newAdvisorName, setNewAdvisorName] = useState('');
  const [localWeights, setLocalWeights] = useState<Record<number, number>>({});
  const [localGoal, setLocalGoal] = useState<string>('');
  const goalDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync session goal to local state
  useEffect(() => {
    if (session?.total_daily_goal !== undefined) {
      setLocalGoal(session.total_daily_goal.toString());
    }
  }, [session?.total_daily_goal]);

  const handleGoalChange = (val: string) => {
    // Prevent negative numbers
    if (val.includes('-')) return;
    
    setLocalGoal(val);

    if (goalDebounceRef.current) clearTimeout(goalDebounceRef.current);
    
    goalDebounceRef.current = setTimeout(() => {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0) {
        updateGoalMutation.mutate(num);
      }
    }, 800);
  };

  // Sync weights to local state
  useEffect(() => {
    if (weights) {
      const map: Record<number, number> = {};
      weights.forEach(w => map[w.hour_start] = w.percentage);
      
      setTimeout(() => {
        setLocalWeights(prev => {
          const isDifferent = Object.keys(map).some(k => map[Number(k)] !== prev[Number(k)]) || 
                              Object.keys(prev).length !== Object.keys(map).length;
          return isDifferent ? map : prev;
        });
      }, 0);
    }
  }, [weights]);

  const handleWeightChange = (hour: number, val: string) => {
    if (val.includes('-')) return;
    const num = parseFloat(val) || 0;
    setLocalWeights(prev => ({ ...prev, [hour]: num }));
  };

  const saveWeights = () => {
    if (!session) return;
    const payload = Object.entries(localWeights).map(([h, p]) => ({
      session_id: session.id,
      hour_start: parseInt(h),
      percentage: p
    }));
    updateWeightsMutation.mutate(payload);
    showToast('Pesos horarios actualizados', 'success');
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/advisor/${token}`;
    navigator.clipboard.writeText(url);
    showToast('Link copiado al portapapeles', 'success');
  };

  const calculateAdvisorGoal = (advisorId: string) => {
    if (!session || !weights || !advisors) return 0;
    
    let totalGoal = 0;
    const start = session.start_hour ?? 9;
    const end = session.end_hour ?? 21;
    
    weights.forEach(w => {
      if (w.hour_start < start || w.hour_start > end) return;

      const hourlyGoal = (session.total_daily_goal * w.percentage) / 100;
      
      // Count active advisors for this hour
      let activeCount = 0;
      let isCurrentAdvisorActive = true;

      advisors.forEach(adv => {
        const avail = availability?.find(a => a.advisor_id === adv.id && a.hour_start === w.hour_start);
        const isActive = avail ? avail.is_active : true; // Default active
        
        if (isActive) activeCount++;
        if (adv.id === advisorId) isCurrentAdvisorActive = isActive;
      });

      if (activeCount > 0 && isCurrentAdvisorActive) {
        totalGoal += hourlyGoal / activeCount;
      }
    });
    
    return totalGoal;
  };

  const startHour = session?.start_hour ?? 9;
  const endHour = session?.end_hour ?? 21;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

  const handleExport = (type: 'pdf' | 'excel') => {
    if (!session || !advisors) return;
    
    const calculatedGoals: Record<string, number> = {};
    advisors.forEach(adv => {
      calculatedGoals[adv.id] = calculateAdvisorGoal(adv.id);
    });

    const data = { session, advisors, calculatedGoals };
    
    if (type === 'pdf') exportAdminReportPDF(data);
    else exportAdminReportExcel(data);
  };

  // Calculate Totals for Difference
  const totalAdvisorSales = advisors?.reduce((acc, curr) => acc + (curr.total_sales || 0), 0) || 0;
  const currentGoal = parseFloat(localGoal) || 0;
  const salesDifference = currentGoal - totalAdvisorSales;

  return (
    <div className="space-y-6">
      
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gestión de Asesores</h2>
            <p className="text-sm text-gray-500">Configura la meta diaria y los asesores</p>
          </div>
          
          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-1 border border-gray-200">
            <button 
              onClick={() => handleExport('pdf')}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded-md transition-all"
              title="Exportar a PDF"
            >
              <FileText className="w-5 h-5" />
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button 
              onClick={() => handleExport('excel')}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-white rounded-md transition-all"
              title="Exportar a Excel"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Time Configuration & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Time Range Selector */}
            <div className="lg:col-span-4 bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col justify-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horario de Sesión
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <select 
                    aria-label="Hora de inicio"
                    value={startHour}
                    onChange={(e) => updateHoursMutation.mutate({ start: parseInt(e.target.value), end: endHour })}
                    className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i} disabled={i >= endHour}>{i}:00</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
                
                <span className="text-gray-400 font-medium">a</span>
                
                <div className="relative flex-1">
                  <select 
                    aria-label="Hora de fin"
                    value={endHour}
                    onChange={(e) => updateHoursMutation.mutate({ start: startHour, end: parseInt(e.target.value) })}
                    className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer font-medium"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i} disabled={i <= startHour}>{i}:00</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                <label className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 block">Meta Global</label>
                <div className="flex items-center gap-2">
                  <DollarSign className="text-blue-500 w-5 h-5" />
                  <Input 
                    type="number" 
                    value={localGoal}
                    onChange={(e) => handleGoalChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    className="bg-white/50 border-blue-200 text-xl font-bold text-blue-900 h-10 w-full"
                    placeholder="0.00"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl border border-green-100 hover:shadow-md transition-shadow">
                <label className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1 block">Venta Total</label>
                <div className="text-2xl lg:text-3xl font-bold text-green-900 mt-1 truncate" title={formatCurrency(totalAdvisorSales)}>
                  {formatCurrency(totalAdvisorSales)}
                </div>
              </div>

              <div className={cn("p-4 rounded-xl border hover:shadow-md transition-shadow", salesDifference > 0 ? "bg-orange-50 border-orange-100" : "bg-emerald-50 border-emerald-100")}>
                <label className={cn("text-xs font-bold uppercase tracking-wider mb-1 block", salesDifference > 0 ? "text-orange-600" : "text-emerald-600")}>
                  {salesDifference > 0 ? "Falta para Meta" : "Meta Superada"}
                </label>
                <div className={cn("text-2xl lg:text-3xl font-bold mt-1 truncate", salesDifference > 0 ? "text-orange-900" : "text-emerald-900")} title={formatCurrency(Math.abs(salesDifference))}>
                  {formatCurrency(Math.abs(salesDifference))}
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
                <label className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1 block">Tickets</label>
                <div className="text-2xl lg:text-3xl font-bold text-purple-900 mt-1">
                  {advisors?.reduce((acc, curr) => acc + (curr.tickets_count || 0), 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Weights Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Distribución por Hora (%)
            </h2>
            <div className="flex w-full sm:w-auto gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowTemplatesModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2"
              >
                <LayoutTemplate className="w-4 h-4" />
                Plantillas
              </Button>
              <Button 
                size="sm" 
                onClick={saveWeights} 
                disabled={updateWeightsMutation.isPending || Math.abs(Object.values(localWeights).reduce((a, b) => a + b, 0) - 100) > 0.1}
                title={Math.abs(Object.values(localWeights).reduce((a, b) => a + b, 0) - 100) > 0.1 ? "La suma de los pesos debe ser 100%" : "Guardar distribución"}
                className="flex-1 sm:flex-none"
              >
                {updateWeightsMutation.isPending ? 'Guardando...' : 'Guardar Pesos'}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-13 gap-2 pb-2">
            {hours.map(hour => (
              <div key={hour} className="flex flex-col gap-1">
                <span className="text-xs text-center text-gray-500 font-medium">
                  {hour > 12 ? `${hour - 12} PM` : `${hour} ${hour === 12 ? 'PM' : 'AM'}`}
                </span>
                <input
                  type="number"
                  value={localWeights[hour] || ''}
                  onChange={(e) => handleWeightChange(hour, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  className="w-full text-center border rounded-md py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation"
                  placeholder="0"
                  min="0"
                />
              </div>
            ))}
          </div>
          <div className="mt-2 text-right text-sm text-gray-500">
            Total: <span className={cn("font-bold", Object.values(localWeights).reduce((a, b) => a + b, 0) === 100 ? "text-green-600" : "text-orange-500")}>
              {Object.values(localWeights).reduce((a, b) => a + b, 0).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Availability / Schedule Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 overflow-hidden">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-500" />
            Disponibilidad / Almuerzos
          </h2>
          
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 pb-2">
            <table className="w-full min-w-[600px] text-sm border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white z-10 text-left p-2 text-gray-500 font-medium border-b border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Hora</th>
                  {advisors?.map(adv => (
                    <th key={adv.id} className="p-2 text-center text-gray-900 font-medium border-b border-gray-100 min-w-[100px]">{adv.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map(hour => (
                  <tr key={hour} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white z-10 p-2 text-gray-500 font-medium border-b border-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {hour > 12 ? `${hour - 12} PM` : `${hour} ${hour === 12 ? 'PM' : 'AM'}`}
                    </td>
                    {advisors?.map(adv => {
                      const avail = availability?.find(a => a.advisor_id === adv.id && a.hour_start === hour);
                      const isActive = avail ? avail.is_active : true; // Default active
                      
                      return (
                        <td key={`${adv.id}-${hour}`} className="p-2 text-center border-b border-gray-50">
                          <button
                            onClick={() => updateAvailabilityMutation.mutate({ advisorId: adv.id, hour, isActive: !isActive })}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center transition-colors mx-auto",
                              isActive ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-red-100 text-red-600 hover:bg-red-200"
                            )}
                            title={isActive ? "Activo" : "Inactivo / Almuerzo"}
                          >
                            {isActive ? "✓" : "✕"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Advisors Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-500" />
            Asesores
          </h2>

          <div className="flex flex-col gap-1 mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input 
                placeholder="Nombre del nuevo asesor..." 
                value={newAdvisorName}
                onChange={(e) => setNewAdvisorName(e.target.value)}
                className={cn("w-full sm:max-w-md", 
                  advisors?.some(a => a.name.toLowerCase() === newAdvisorName.trim().toLowerCase()) && "border-red-300 focus:ring-red-200"
                )}
              />
              <Button 
                onClick={() => addAdvisorMutation.mutate(newAdvisorName)} 
                disabled={!newAdvisorName.trim() || advisors?.some(a => a.name.toLowerCase() === newAdvisorName.trim().toLowerCase())}
                title={advisors?.some(a => a.name.toLowerCase() === newAdvisorName.trim().toLowerCase()) ? "Este nombre ya existe" : "Agregar asesor"}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>
            {advisors?.some(a => a.name.toLowerCase() === newAdvisorName.trim().toLowerCase()) && (
              <span className="text-xs text-red-500 font-medium ml-1">
                Este nombre ya está registrado en la sesión actual.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advisors?.map(advisor => (
              <AdvisorCard 
                key={advisor.id} 
                advisor={advisor} 
                calculatedGoal={calculateAdvisorGoal(advisor.id)}
                onDelete={() => deleteAdvisorMutation.mutate(advisor.id)}
                onCopyLink={() => copyLink(advisor.access_token)}
                onViewDetails={() => setSelectedAdvisor(advisor)}
              />
            ))}
          </div>
        </div>

        {/* Details Modal */}
        {selectedAdvisor && session && weights && advisors && (
          <AdvisorDetailsModal
            advisor={selectedAdvisor}
            session={session}
            weights={weights}
            advisors={advisors}
            availability={availability || []}
            onClose={() => setSelectedAdvisor(null)}
          />
        )}

        {/* Templates Modal */}
        {showTemplatesModal && (
          <TemplatesModal
            templates={templates || []}
            onClose={() => setShowTemplatesModal(false)}
            onApply={(id) => applyTemplateMutation.mutate(id)}
            onSave={(name) => createTemplateMutation.mutate(name)}
            onDelete={(id) => deleteTemplateMutation.mutate(id)}
          />
        )}

    </div>
  );
};

const TemplatesModal: React.FC<{
  templates: SessionTemplate[];
  onClose: () => void;
  onApply: (id: string) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}> = ({ templates, onClose, onApply, onSave, onDelete }) => {
  const [newTemplateName, setNewTemplateName] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-blue-600" />
            Gestionar Plantillas
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors" title="Cerrar">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Save New */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Guardar configuración actual como:</label>
            <div className="flex gap-2">
              <Input 
                placeholder="Ej: Lunes Standard, Cierre de Mes..." 
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
              <Button 
                onClick={() => {
                  if (newTemplateName.trim()) {
                    onSave(newTemplateName);
                    setNewTemplateName('');
                  }
                }}
                disabled={!newTemplateName.trim()}
              >
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="text-sm font-medium text-gray-700 mb-3 block">Plantillas Guardadas:</label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {templates.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No hay plantillas guardadas</p>
              ) : (
                templates.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:border-blue-200 transition-colors group">
                    <div>
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.start_hour}:00 - {t.end_hour}:00</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="outline" onClick={() => onApply(t.id)} title="Aplicar esta plantilla">
                        Aplicar
                      </Button>
                      <button 
                        onClick={() => onDelete(t.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdvisorCard: React.FC<{ 
  advisor: Advisor, 
  calculatedGoal: number, 
  onDelete: () => void, 
  onCopyLink: () => void,
  onViewDetails: () => void 
}> = ({ advisor, calculatedGoal, onDelete, onCopyLink, onViewDetails }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white group relative">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-800">{advisor.name}</h3>
        <div className="flex gap-1">
          <button onClick={onViewDetails} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Ver Detalles">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={onCopyLink} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Copiar Link">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Eliminar">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 mt-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Meta Calculada:</span>
          <span className="font-bold text-blue-600">{formatCurrency(calculatedGoal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Venta:</span>
          <span className="font-medium">{formatCurrency(advisor.total_sales)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tickets:</span>
          <span className="font-medium">{advisor.tickets_count}</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t">
          <span className="text-gray-500">% Cumplimiento:</span>
          <span className={cn("font-bold", (advisor.total_sales / calculatedGoal) >= 1 ? "text-green-600" : "text-orange-500")}>
            {calculatedGoal > 0 ? ((advisor.total_sales / calculatedGoal) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>
    </div>
  );
};

const AdvisorDetailsModal: React.FC<{
  advisor: Advisor;
  session: DailySession;
  weights: HourlyWeight[];
  advisors: Advisor[];
  availability: AdvisorAvailability[];
  onClose: () => void;
}> = ({ advisor, session, weights, advisors, availability, onClose }) => {
  const startHour = session.start_hour ?? 9;
  const endHour = session.end_hour ?? 21;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Detalle de Meta: {advisor.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors" title="Cerrar">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="overflow-x-auto -mx-6 px-6 pb-2">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-gray-50 text-gray-600 font-medium">
                <tr>
                  <th className="p-3 rounded-tl-lg whitespace-nowrap">Hora</th>
                  <th className="p-3 whitespace-nowrap">Meta Global Hora</th>
                  <th className="p-3 whitespace-nowrap">Peso %</th>
                  <th className="p-3 text-center whitespace-nowrap">Asesores Activos</th>
                  <th className="p-3 text-center whitespace-nowrap">Estado</th>
                  <th className="p-3 text-right rounded-tr-lg whitespace-nowrap">Meta Asignada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
              {hours.map(hour => {
                const weight = weights.find(w => w.hour_start === hour);
                const percentage = weight?.percentage || 0;
                const hourlyGlobalGoal = (session.total_daily_goal * percentage) / 100;
                
                // Calculate active advisors count
                let activeCount = 0;
                advisors.forEach(adv => {
                  const avail = availability.find(a => a.advisor_id === adv.id && a.hour_start === hour);
                  if (avail ? avail.is_active : true) activeCount++;
                });

                // Check if THIS advisor is active
                const myAvail = availability.find(a => a.advisor_id === advisor.id && a.hour_start === hour);
                const isMeActive = myAvail ? myAvail.is_active : true;

                const myShare = (activeCount > 0 && isMeActive) ? (hourlyGlobalGoal / activeCount) : 0;

                return (
                  <tr key={hour} className={cn("hover:bg-gray-50 transition-colors", !isMeActive && "bg-gray-50/50 text-gray-400")}>
                    <td className="p-3 font-medium">
                      {hour > 12 ? `${hour - 12} PM` : `${hour} ${hour === 12 ? 'PM' : 'AM'}`}
                    </td>
                    <td className="p-3 text-gray-600">{formatCurrency(hourlyGlobalGoal)}</td>
                    <td className="p-3 text-gray-600">{percentage}%</td>
                    <td className="p-3 text-center">{activeCount}</td>
                    <td className="p-3 text-center">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", isMeActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        {isMeActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-blue-600">
                      {formatCurrency(myShare)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-200">
              <tr>
                <td colSpan={5} className="p-3 text-right">Total Meta Asignada:</td>
                <td className="p-3 text-right text-blue-700 text-lg">
                  {formatCurrency(
                    hours.reduce((acc, hour) => {
                      const weight = weights.find(w => w.hour_start === hour);
                      const percentage = weight?.percentage || 0;
                      const hourlyGlobalGoal = (session.total_daily_goal * percentage) / 100;
                      
                      let activeCount = 0;
                      advisors.forEach(adv => {
                        const avail = availability.find(a => a.advisor_id === adv.id && a.hour_start === hour);
                        if (avail ? avail.is_active : true) activeCount++;
                      });

                      const myAvail = availability.find(a => a.advisor_id === advisor.id && a.hour_start === hour);
                      const isMeActive = myAvail ? myAvail.is_active : true;

                      return acc + ((activeCount > 0 && isMeActive) ? (hourlyGlobalGoal / activeCount) : 0);
                    }, 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};
