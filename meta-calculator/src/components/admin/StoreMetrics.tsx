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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Métricas de Tienda</h2>
            <p className="text-sm text-gray-500">Seguimiento horario de indicadores clave</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF} title="Exportar PDF">
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportExcel} title="Exportar Excel">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button onClick={saveMetrics} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
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
