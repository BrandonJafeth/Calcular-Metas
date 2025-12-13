import { useState,  useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { useToast } from './useToast';
import { exportStoreMetricsPDF, exportStoreMetricsExcel } from '../utils/exportUtils';
import type { StoreHourlyMetric } from '../types';

export const useStoreMetrics = (date: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // State for local edits only
  const [edits, setEdits] = useState<Record<number, Partial<StoreHourlyMetric>>>({});
  const [prevSessionId, setPrevSessionId] = useState<string | undefined>(undefined);

  // 1. Session Query
  const { data: session } = useQuery({
    queryKey: ['session', date],
    queryFn: () => adminService.getOrCreateSession(date)
  });

  // Reset edits when session changes (Pattern to emulate getDerivedStateFromProps)
  if (session?.id !== prevSessionId) {
    setPrevSessionId(session?.id);
    setEdits({});
  }

  // 2. Weights Query
  const { data: weights } = useQuery({
    queryKey: ['weights', session?.id],
    queryFn: () => adminService.getHourlyWeights(session!.id),
    enabled: !!session?.id
  });

  // 3. Metrics Query
  const { data: metrics } = useQuery({
    queryKey: ['store_metrics', session?.id],
    queryFn: () => adminService.getStoreHourlyMetrics(session!.id),
    enabled: !!session?.id
  });

  // 4. Advisors Query
  const { data: advisors } = useQuery({
    queryKey: ['advisors', session?.id],
    queryFn: () => adminService.getAdvisors(session!.id),
    enabled: !!session?.id
  });

  // Merge server metrics with local edits
  const mergedMetrics = useMemo(() => {
    const map: Record<number, Partial<StoreHourlyMetric>> = {};
    
    // Start with server data
    if (metrics) {
      metrics.forEach(m => {
        map[m.hour] = m;
      });
    }

    // Apply edits
    Object.entries(edits).forEach(([hourStr, edit]) => {
      const hour = parseInt(hourStr);
      map[hour] = {
        ...map[hour],
        ...edit,
        hour // Ensure hour is set
      };
    });

    return map;
  }, [metrics, edits]);

  const updateMetricsMutation = useMutation({
    mutationFn: (newMetrics: Partial<StoreHourlyMetric>[]) => adminService.upsertStoreHourlyMetrics(newMetrics),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store_metrics', session?.id] });
      setEdits({}); // Clear edits on successful save
      showToast('Métricas actualizadas', 'success');
    }
  });

  const handleMetricChange = (hour: number, field: keyof StoreHourlyMetric, value: string) => {
    if (value.includes('-')) return;
    const num = parseFloat(value) || 0;
    
    setEdits(prev => ({
      ...prev,
      [hour]: {
        ...prev[hour],
        session_id: session?.id,
        hour,
        [field]: num
      }
    }));
  };

  const saveMetrics = () => {
    if (!session) return;
    // Use mergedMetrics for saving
    const payload = Object.values(mergedMetrics).map(m => ({
      session_id: session.id,
      hour: m.hour!,
      traffic: m.traffic || 0,
      last_year_sales: m.last_year_sales || 0,
      current_sales: m.current_sales || 0,
      tickets: m.tickets || 0
    }));
    updateMetricsMutation.mutate(payload);
  };

  const getWeight = (hour: number) => {
    return weights?.find(w => w.hour_start === hour)?.percentage || 0;
  };

  const getStoreHourlyGoal = (hour: number) => {
    const weight = getWeight(hour);
    const dailyGoal = session?.total_daily_goal || 0;
    return (dailyGoal * weight) / 100;
  };

  // Calculations using mergedMetrics
  const totalStoreSales = Object.values(mergedMetrics).reduce((sum, m) => sum + (m.current_sales || 0), 0);
  const totalAdvisorSales = advisors?.reduce((sum, a) => sum + (a.total_sales || 0), 0) || 0;
  const salesDifference = totalStoreSales - totalAdvisorSales;
  const totalLastYearSales = Object.values(mergedMetrics).reduce((sum, m) => sum + (m.last_year_sales || 0), 0);
  const totalGrowth = totalLastYearSales > 0 ? ((totalStoreSales / totalLastYearSales) - 1) * 100 : 0;

  const startHour = session?.start_hour ?? 9;
  const endHour = session?.end_hour ?? 21;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);

  const handleExportPDF = () => {
    if (!session || !metrics || !weights) return;
    exportStoreMetricsPDF({
      session,
      metrics: Object.values(mergedMetrics) as StoreHourlyMetric[],
      weights
    });
  };

  const handleExportExcel = () => {
    if (!session || !metrics || !weights) return;
    exportStoreMetricsExcel({
      session,
      metrics: Object.values(mergedMetrics) as StoreHourlyMetric[],
      weights
    });
  };

  return {
    session,
    weights,
    localMetrics: mergedMetrics,
    hours,
    isSaving: updateMetricsMutation.isPending,
    totals: {
      storeSales: totalStoreSales,
      advisorSales: totalAdvisorSales,
      difference: salesDifference,
      lastYearSales: totalLastYearSales,
      growth: totalGrowth
    },
    actions: {
      handleMetricChange,
      saveMetrics,
      getStoreHourlyGoal,
      handleExportPDF,
      handleExportExcel
    }
  };
};
