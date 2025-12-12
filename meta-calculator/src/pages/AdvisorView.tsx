import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { advisorService } from '../services/advisorService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../utils/currency';
import { useToast } from '../hooks/useToast';
import { TrendingUp, Ticket, DollarSign, AlertCircle, CheckCircle2, FileText, FileSpreadsheet } from 'lucide-react';
import { cn } from '../lib/utils';
import { exportAdvisorReportPDF, exportAdvisorReportExcel } from '../utils/exportUtils';

export const AdvisorView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['advisor', token],
    queryFn: () => advisorService.getAdvisorByToken(token || ''),
    enabled: !!token,
    refetchInterval: 30000 // Refresh every 30s to get updated global goals/weights
  });

  const updateSalesMutation = useMutation({
    mutationFn: (vals: { sales: number, tickets: number }) => 
      advisorService.updateSales(data!.advisor.id, vals.sales, vals.tickets),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisor', token] });
      showToast('Datos actualizados correctamente', 'success');
    }
  });

  const [salesInput, setSalesInput] = useState('');
  const [ticketsInput, setTicketsInput] = useState('');
  const initializedRef = useRef(false);

  useEffect(() => {
    if (data?.advisor && !initializedRef.current) {
      setTimeout(() => {
        setSalesInput(data.advisor.total_sales.toString());
        setTicketsInput(data.advisor.tickets_count.toString());
        initializedRef.current = true;
      }, 0);
    }
  }, [data?.advisor]);

  const handleSave = () => {
    const sales = parseFloat(salesInput) || 0;
    const tickets = parseInt(ticketsInput) || 0;
    updateSalesMutation.mutate({ sales, tickets });
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (error || !data) return <div className="flex h-screen items-center justify-center text-red-500 gap-2"><AlertCircle /> Enlace inválido o expirado</div>;

  const { advisor, session, weights, allAdvisors, allAvailability } = data;

  // Calculate Personal Goal
  // Logic: Distribute hourly goal among active advisors
  let personalGoal = 0;
  const startHour = session.start_hour ?? 9;
  const endHour = session.end_hour ?? 21;

  weights.forEach(w => {
    // Only consider weights within the configured session hours
    if (w.hour_start < startHour || w.hour_start > endHour) return;

    const hourlyGoal = (session.total_daily_goal * w.percentage) / 100;
    
    // Count active advisors for this hour
    let activeCount = 0;
    let isCurrentAdvisorActive = true; // Default to true

    allAdvisors.forEach(adv => {
      const avail = allAvailability.find(a => a.advisor_id === adv.id && a.hour_start === w.hour_start);
      const isActive = avail ? avail.is_active : true; // Default active
      
      if (isActive) activeCount++;
      if (adv.id === advisor.id) isCurrentAdvisorActive = isActive;
    });

    if (activeCount > 0 && isCurrentAdvisorActive) {
      personalGoal += hourlyGoal / activeCount;
    }
  });

  const handleExport = (type: 'pdf' | 'excel') => {
    const reportData = { advisor, session, personalGoal };
    if (type === 'pdf') exportAdvisorReportPDF(reportData);
    else exportAdvisorReportExcel(reportData);
  };

  const progress = personalGoal > 0 ? (advisor.total_sales / personalGoal) * 100 : 0;
  const progressStyle = { '--progress-width': `${Math.min(progress, 100)}%` } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 text-center relative">
          <div className="absolute top-4 right-4 flex gap-1">
            <button 
              onClick={() => handleExport('pdf')}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Descargar PDF"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleExport('excel')}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
              title="Descargar Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Hola, {advisor.name} 👋</h1>
          <p className="text-gray-500 text-sm">{new Date(session.date).toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Goal Progress Card */}
        <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={100} />
          </div>
          
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium mb-1">Tu Meta de Hoy</p>
            <div className="text-4xl font-bold mb-4 tracking-tight">
              {formatCurrency(personalGoal)}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-blue-100">
                <span>Progreso</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-blue-900/30 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out w-(--progress-width)"
                  style={progressStyle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="text-green-500 w-5 h-5" />
            Reporte de Ventas
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                Venta Total Acumulada
              </label>
              <Input 
                type="number" 
                value={salesInput}
                onChange={(e) => setSalesInput(e.target.value)}
                className="text-lg font-semibold h-12"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gray-400" />
                Cantidad de Tickets
              </label>
              <Input 
                type="number" 
                value={ticketsInput}
                onChange={(e) => setTicketsInput(e.target.value)}
                className="text-lg font-semibold h-12"
                placeholder="0"
              />
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
              disabled={updateSalesMutation.isPending}
            >
              {updateSalesMutation.isPending ? 'Guardando...' : 'Actualizar Reporte'}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Faltante</p>
            <p className={cn("text-lg font-bold mt-1", personalGoal - advisor.total_sales > 0 ? "text-orange-500" : "text-green-500")}>
              {formatCurrency(Math.max(0, personalGoal - advisor.total_sales))}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Ticket Promedio</p>
            <p className="text-lg font-bold text-gray-700 mt-1">
              {advisor.tickets_count > 0 ? formatCurrency(advisor.total_sales / advisor.tickets_count) : formatCurrency(0)}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
