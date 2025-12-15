import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { cn } from '../../../lib/utils';
import { Info } from 'lucide-react';

interface MetricsSummaryCardsProps {
  totals: {
    storeSales: number;
    advisorSales: number;
    difference: number;
    lastYearSales: number;
    growth: number;
  };
}

export const MetricsSummaryCards: React.FC<MetricsSummaryCardsProps> = ({ totals }) => {
  const { storeSales, advisorSales, difference, lastYearSales, growth } = totals;

  const isArtificialGrowth = lastYearSales === 0 && storeSales > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500 font-medium">Venta Total Tienda</p>
        <p className="text-2xl font-bold text-blue-600">{formatCurrency(storeSales)}</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500 font-medium">Venta Año Anterior</p>
        <p className="text-2xl font-bold text-gray-600">{formatCurrency(lastYearSales)}</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative group">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 font-medium">Crecimiento</p>
          {isArtificialGrowth && (
            <div className="relative">
              <Info className="w-4 h-4 text-blue-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                Crecimiento asignado al 100% porque la venta del año anterior fue 0.
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          )}
        </div>
        <p className={cn("text-2xl font-bold", growth >= 0 ? "text-green-600" : "text-red-600")}>
          {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
        </p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500 font-medium">Venta Asesores</p>
        <p className="text-2xl font-bold text-purple-600">{formatCurrency(advisorSales)}</p>
      </div>
      <div className={cn("bg-white p-4 rounded-xl border border-gray-100 shadow-sm", difference !== 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50")}>
        <p className="text-sm text-gray-500 font-medium">Diferencia</p>
        <p className={cn("text-2xl font-bold", difference !== 0 ? "text-red-600" : "text-green-600")}>
          {formatCurrency(difference)}
        </p>
      </div>
    </div>
  );
};
