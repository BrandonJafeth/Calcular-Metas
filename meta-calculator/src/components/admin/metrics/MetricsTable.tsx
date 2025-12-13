import React from 'react';
import { Input } from '../../ui/Input';
import { formatCurrency } from '../../../utils/currency';
import type { StoreHourlyMetric } from '../../../types';

interface MetricsTableProps {
  hours: number[];
  localMetrics: Record<number, Partial<StoreHourlyMetric>>;
  date: string;
  onMetricChange: (hour: number, field: keyof StoreHourlyMetric, value: string) => void;
  getStoreHourlyGoal: (hour: number) => number;
}

export const MetricsTable: React.FC<MetricsTableProps> = ({ 
  hours, 
  localMetrics, 
  date, 
  onMetricChange, 
  getStoreHourlyGoal 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left min-w-[1000px]">
        <thead className="bg-gray-50 text-gray-600 font-medium">
          <tr>
            <th className="p-3 rounded-tl-lg">Hora</th>
            <th className="p-3 text-right">Meta Global Hora</th>
            <th className="p-3 text-center">Entradas</th>
            <th className="p-3 text-center">Tickets</th>
            <th className="p-3 text-center">Tasa Conv.</th>
            <th className="p-3 text-right">Venta {parseInt(date.split('-')[0]) - 1}</th>
            <th className="p-3 text-right">Venta Actual</th>
            <th className="p-3 text-right">Crecimiento</th>
            <th className="p-3 text-right rounded-tr-lg">Ticket Prom.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {hours.map(hour => {
            const m = localMetrics[hour] || {};
            const traffic = m.traffic || 0;
            const tickets = m.tickets || 0;
            const lastYear = m.last_year_sales || 0;
            const current = m.current_sales || 0;
            
            // Calculate cumulative goal up to this hour
            let cumulativeGoal = 0;
            for (const h of hours) {
              if (h <= hour) {
                cumulativeGoal += getStoreHourlyGoal(h);
              }
            }
            
            const conversion = traffic > 0 ? (tickets / traffic) * 100 : 0;
            const growth = lastYear > 0 ? ((current / lastYear) - 1) * 100 : 0;
            const avgTicket = tickets > 0 ? current / tickets : 0;

            return (
              <tr key={hour} className="hover:bg-gray-50">
                <td className="p-3 font-medium">
                  {hour > 12 ? `${hour - 12} PM` : `${hour} ${hour === 12 ? 'PM' : 'AM'}`}
                </td>
                <td className="p-3 text-right font-medium text-blue-600">
                  {formatCurrency(cumulativeGoal)}
                </td>
                <td className="p-2">
                  <Input 
                    type="number" 
                    value={m.traffic || ''} 
                    onChange={e => onMetricChange(hour, 'traffic', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    className="text-center h-8 w-20 mx-auto"
                    placeholder="0"
                    min="0"
                  />
                </td>
                <td className="p-2">
                  <Input 
                    type="number" 
                    value={m.tickets || ''} 
                    onChange={e => onMetricChange(hour, 'tickets', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    className="text-center h-8 w-20 mx-auto"
                    placeholder="0"
                    min="0"
                  />
                </td>
                <td className="p-3 text-center font-medium text-gray-600">
                  {conversion.toFixed(1)}%
                </td>
                <td className="p-2">
                  <Input 
                    type="number" 
                    value={m.last_year_sales || ''} 
                    onChange={e => onMetricChange(hour, 'last_year_sales', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    className="text-right h-8 w-28 ml-auto"
                    placeholder="0"
                    min="0"
                  />
                </td>
                <td className="p-2">
                  <Input 
                    type="number" 
                    value={m.current_sales || ''} 
                    onChange={e => onMetricChange(hour, 'current_sales', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    className="text-right h-8 w-28 ml-auto font-medium text-blue-600"
                    placeholder="0"
                    min="0"
                  />
                </td>
                <td className={`p-3 text-right font-bold ${growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                </td>
                <td className="p-3 text-right font-medium text-gray-600">
                  {formatCurrency(avgTicket)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
