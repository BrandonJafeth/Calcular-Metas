import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { toZonedTime } from 'date-fns-tz';
import { CR_TIMEZONE, formatCRDateLong } from '../utils/dateUtils';
import { SalesCalculator } from '../components/advisor/SalesCalculator';
import confetti from 'canvas-confetti';

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
  const celebratedRef = useRef(false);

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

  const handleApplyCalculatorTotal = (total: number) => {
    setSalesInput(total.toString());
    showToast('Monto aplicado al reporte', 'success');
  };

  // Calculate Personal Goal
  const personalGoal = useMemo(() => {
    if (!data) return 0;
    const { session, weights, allAdvisors, allAvailability, advisor } = data;
    
    let goal = 0;
    const startHour = session.start_hour ?? 9;
    const endHour = session.end_hour ?? 21;

    weights.forEach(w => {
      if (w.hour_start < startHour || w.hour_start > endHour) return;
      const hourlyGoal = (session.total_daily_goal * w.percentage) / 100;
      
      let activeCount = 0;
      let isCurrentAdvisorActive = true;

      allAdvisors.forEach(adv => {
        const avail = allAvailability.find(a => a.advisor_id === adv.id && a.hour_start === w.hour_start);
        const isActive = avail ? avail.is_active : true;
        if (isActive) activeCount++;
        if (adv.id === advisor.id) isCurrentAdvisorActive = isActive;
      });

      if (activeCount > 0 && isCurrentAdvisorActive) {
        goal += hourlyGoal / activeCount;
      }
    });
    return goal;
  }, [data]);

  // Confetti Effect
  useEffect(() => {
    if (!data) return;
    const { advisor } = data;

    if (personalGoal > 0 && advisor.total_sales >= personalGoal) {
      if (!celebratedRef.current) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });
        celebratedRef.current = true;
      }
    } else {
      celebratedRef.current = false;
    }
  }, [data?.advisor.total_sales, personalGoal, data]);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (error || !data) return <div className="flex h-screen items-center justify-center text-red-500 gap-2"><AlertCircle /> Enlace inválido o expirado</div>;

  const { advisor, session } = data;

  const handleExport = (type: 'pdf' | 'excel') => {
    const reportData = { advisor, session, personalGoal };
    if (type === 'pdf') exportAdvisorReportPDF(reportData);
    else exportAdvisorReportExcel(reportData);
  };

  const getGreeting = () => {
    const zonedDate = toZonedTime(new Date(), CR_TIMEZONE);
    const hour = zonedDate.getHours();
    
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const progress = personalGoal > 0 ? (advisor.total_sales / personalGoal) * 100 : 0;
  const progressStyle = { '--progress-width': `${Math.min(progress, 100)}%` } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{getGreeting()}, {advisor.name} </h1>
          <p className="text-gray-500 text-sm mb-4">
            {formatCRDateLong(session.date)}
          </p>
          
          <div className="flex justify-center gap-3">
            <button 
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium border border-gray-200"
              title="Descargar PDF"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button 
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-green-50 hover:text-green-600 transition-colors text-sm font-medium border border-gray-200"
              title="Descargar Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
          </div>
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
                onChange={(e) => {
                  if (e.target.value.includes('-')) return;
                  setSalesInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                className="text-lg font-semibold h-12"
                placeholder="0.00"
                min="0"
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
                onChange={(e) => {
                  if (e.target.value.includes('-')) return;
                  setTicketsInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                  }
                }}
                className="text-lg font-semibold h-12"
                placeholder="0"
                min="0"
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
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
              {advisor.total_sales >= personalGoal ? 'Superávit' : 'Faltante'}
            </p>
            <p className={cn("text-lg font-bold mt-1", advisor.total_sales >= personalGoal ? "text-green-600" : "text-orange-500")}>
              {advisor.total_sales >= personalGoal 
                ? `+${formatCurrency(advisor.total_sales - personalGoal)}`
                : formatCurrency(Math.max(0, personalGoal - advisor.total_sales))
              }
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Ticket Promedio</p>
            <p className="text-lg font-bold text-gray-700 mt-1">
              {advisor.tickets_count > 0 ? formatCurrency(advisor.total_sales / advisor.tickets_count) : formatCurrency(0)}
            </p>
          </div>
        </div>

        {/* Calculator */}
        <SalesCalculator onApplyTotal={handleApplyCalculatorTotal} />

      </div>
    </div>
  );
};
