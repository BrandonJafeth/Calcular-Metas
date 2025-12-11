import React from 'react';
import type { MatrixRow as IMatrixRow, TimeSlot } from '../../types';
import { MatrixCell } from './MatrixCell';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/currency';
import { cn } from '../../lib/utils';
import { Calculator, RotateCcw } from 'lucide-react';

interface MatrixRowProps {
  row: IMatrixRow;
  timeSlots: TimeSlot[];
  totalGoal: number;
  totalSale: number;
  onUpdateName: (name: string) => void;
  onUpdateValue: (slotId: string, value: number) => void;
  onUpdateSale: (slotId: string, value: number) => void;
  onUpdateManualTotalSale: (value: number | undefined) => void;
  onToggleBreak: (slotId: string) => void;
  onDelete: () => void;
}

export const MatrixRow: React.FC<MatrixRowProps> = ({ 
  row, 
  timeSlots, 
  totalGoal,
  totalSale,
  onUpdateName, 
  onUpdateValue, 
  onUpdateSale,
  onUpdateManualTotalSale,
  onToggleBreak,
  onDelete 
}) => {
  const remaining = totalGoal - totalSale;
  const isMet = remaining <= 0;
  const isManual = row.manualTotalSale !== undefined;

  return (
    <div className="flex gap-4 mb-2 items-stretch min-w-max group">
      {/* Name Column */}
      <div className="w-64 flex gap-2 shrink-0 sticky left-0 bg-card z-10 pr-2 group-hover:bg-accent/5 transition-colors shadow-[5px_0_10px_-5px_rgba(0,0,0,0.1)] items-center">
        <Button 
          variant="destructive" 
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={onDelete}
          title="Eliminar fila"
        >
          ×
        </Button>
        <Input
          value={row.name}
          onChange={(e) => onUpdateName(e.target.value)}
          placeholder="Nombre / Meta"
          className="h-10"
        />
      </div>

      {/* Time Slots */}
      {timeSlots.map(slot => {
        const isBreak = row.breaks.includes(slot.id);
        return (
          <div key={slot.id} className="w-32 shrink-0 flex flex-col gap-1 justify-center">
            {isBreak ? (
              <MatrixCell
                value={0}
                onChange={() => {}}
                onToggleBreak={() => onToggleBreak(slot.id)}
                isBreak={true}
              />
            ) : (
              <>
                <div className="relative">
                  <span className="absolute -top-2 left-1 text-[10px] text-muted-foreground bg-card px-1 z-10">Meta</span>
                  <MatrixCell
                    value={row.values[slot.id] || 0}
                    onChange={(val) => onUpdateValue(slot.id, val)}
                    onToggleBreak={() => onToggleBreak(slot.id)}
                  />
                </div>
                <div className={cn("relative", isManual && "opacity-50 pointer-events-none")}>
                  <span className="absolute -top-2 left-1 text-[10px] text-muted-foreground bg-card px-1 z-10">Venta</span>
                  <MatrixCell
                    value={row.sales[slot.id] || 0}
                    onChange={(val) => onUpdateSale(slot.id, val)}
                    onToggleBreak={() => onToggleBreak(slot.id)}
                  />
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Row Total */}
      <div className={cn(
        "w-40 shrink-0 sticky right-0 z-10 pl-2 border-l flex flex-col justify-center px-4 rounded-md shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)] gap-1 py-1",
        "bg-card"
      )}>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Meta:</span>
          <span className="font-medium">{formatCurrency(totalGoal)}</span>
        </div>
        <div className="flex justify-between text-xs items-center">
          <span className="text-muted-foreground">Venta:</span>
          <div className="flex items-center gap-1">
            {isManual ? (
               <div className="flex items-center gap-1">
                 <Input 
                   type="number" 
                   className="h-6 w-20 text-right px-1 py-0 text-xs"
                   value={row.manualTotalSale || 0}
                   onChange={(e) => onUpdateManualTotalSale(Number(e.target.value))}
                 />
                 <Button
                   variant="ghost"
                   size="icon"
                   className="h-6 w-6"
                   onClick={() => onUpdateManualTotalSale(undefined)}
                   title="Volver a cálculo automático"
                 >
                   <RotateCcw className="h-3 w-3" />
                 </Button>
               </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-medium text-green-600">{formatCurrency(totalSale)}</span>
                <Button
                   variant="ghost"
                   size="icon"
                   className="h-6 w-6"
                   onClick={() => onUpdateManualTotalSale(totalSale)}
                   title="Ingresar total manualmente"
                 >
                   <Calculator className="h-3 w-3" />
                 </Button>
              </div>
            )}
          </div>
        </div>
        <div className={cn(
          "flex justify-between text-sm font-bold border-t pt-1",
          isMet ? "text-green-600" : "text-red-500"
        )}>
          <span>{isMet ? "Superávit:" : "Falta:"}</span>
          <span>{formatCurrency(Math.abs(remaining))}</span>
        </div>
      </div>
    </div>
  );
};
