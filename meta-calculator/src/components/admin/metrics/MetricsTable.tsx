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
    <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 pb-2">
      <table className="w-full text-sm text-left min-w-[1000px] border-separate border-spacing-0">
        <thead className="bg-gray-50 text-gray-600 font-medium">
          <tr>
            <th className="sticky left-0 bg-white z-10 p-3 rounded-tl-lg border-b border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Hora</th>
            <th className="p-3 text-right border-b border-gray-100">Meta Global Hora</th>
            <th className="p-3 text-center border-b border-gray-100">Entradas</th>
            <th className="p-3 text-center border-b border-gray-100">Tickets</th>
            <th className="p-3 text-center border-b border-gray-100">Tasa Conv.</th>
            <th className="p-3 text-right border-b border-gray-100">Venta {parseInt(date.split('-')[0]) - 1}</th>
            <th className="p-3 text-right border-b border-gray-100">Venta Actual</th>
            <th className="p-3 text-right border-b border-gray-100">Crecimiento</th>
            <th className="p-3 text-right rounded-tr-lg border-b border-gray-100">Ticket Prom.</th>
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
                <td className="sticky left-0 bg-white z-10 p-3 font-medium border-b border-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  {hour > 12 ? `${hour - 12} PM` : `${hour} ${hour === 12 ? 'PM' : 'AM'}`}
                </td>
                <td className="p-3 text-right font-medium text-blue-600 border-b border-gray-50">
                  {formatCurrency(cumulativeGoal)}
                </td>
                <td className="p-2 border-b border-gray-50">
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
                <td className="p-2 border-b border-gray-50">
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
                <td className="p-3 text-center font-medium text-gray-600 border-b border-gray-50">
                  {conversion.toFixed(1)}%
                </td>
                <td className="p-2 border-b border-gray-50">
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
                <td className="p-2 border-b border-gray-50">
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
                <td className={`p-3 text-right font-bold border-b border-gray-50 ${growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                </td>
                <td className="p-3 text-right font-medium text-gray-600 border-b border-gray-50">
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
