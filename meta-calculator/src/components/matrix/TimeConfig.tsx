import React from 'react';
import { cn } from '../../lib/utils';

interface TimeConfigProps {
  start: number;
  end: number;
  onUpdate: (start: number, end: number) => void;
}

export const TimeConfig: React.FC<TimeConfigProps> = ({ start, end, onUpdate }) => {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}`
  }));

  const selectClass = cn(
    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    "w-[140px]"
  );

  return (
    <div className="flex flex-wrap items-center gap-6 p-4 bg-card rounded-lg border shadow-sm">
      <h3 className="font-semibold text-lg tracking-tight">Configuración Horaria</h3>
      
      <div className="flex items-center gap-3">
        <label htmlFor="start-time" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Inicio
        </label>
        <select 
          id="start-time"
          value={start} 
          onChange={(e) => onUpdate(Number(e.target.value), end)}
          className={selectClass}
          title="Hora de inicio"
        >
          {hours.map(h => (
            <option key={`start-${h.value}`} value={h.value} disabled={h.value >= end}>
              {h.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="end-time" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Fin
        </label>
        <select 
          id="end-time"
          value={end} 
          onChange={(e) => onUpdate(start, Number(e.target.value))}
          className={selectClass}
          title="Hora de fin"
        >
          {hours.map(h => (
            <option key={`end-${h.value}`} value={h.value} disabled={h.value <= start}>
              {h.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
