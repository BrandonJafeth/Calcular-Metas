import React from 'react';
import { Button } from '../../components/ui/Button';
import { Save, FileDown, FileSpreadsheet } from 'lucide-react';
import { useStoreMetrics } from '../../hooks/useStoreMetrics';
import { MetricsSummaryCards } from './metrics/MetricsSummaryCards';
import { MetricsTable } from './metrics/MetricsTable';

interface StoreMetricsProps {
  date: string;
}

export const StoreMetrics: React.FC<StoreMetricsProps> = ({ date }) => {
  const {
    totals,
    hours,
    localMetrics,
    isSaving,
    actions
  } = useStoreMetrics(date);

  const {
    handleMetricChange,
    saveMetrics,
    getStoreHourlyGoal,
    handleExportPDF,
    handleExportExcel
  } = actions;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <MetricsSummaryCards totals={totals} />

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Métricas de Tienda</h2>
            <p className="text-sm text-gray-500">Seguimiento horario de indicadores clave</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button variant="outline" onClick={handleExportPDF} title="Exportar PDF" className="flex-1 md:flex-none">
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel} title="Exportar Excel" className="flex-1 md:flex-none">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button onClick={saveMetrics} disabled={isSaving} className="flex-1 md:flex-none whitespace-nowrap">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>

        <MetricsTable 
          hours={hours}
          localMetrics={localMetrics}
          date={date}
          onMetricChange={handleMetricChange}
          getStoreHourlyGoal={getStoreHourlyGoal}
        />
      </div>
    </div>
  );
};
