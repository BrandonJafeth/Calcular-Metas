import React from 'react';
import { formatCurrency } from '../../../utils/currency';
import { cn } from '../../../lib/utils';

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
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-500 font-medium">Crecimiento</p>
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
