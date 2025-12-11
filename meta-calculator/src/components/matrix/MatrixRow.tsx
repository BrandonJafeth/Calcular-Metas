import React from 'react';
import type { MatrixRow as IMatrixRow, TimeSlot } from '../../types';
import { MatrixCell } from './MatrixCell';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/currency';
import { cn } from '../../lib/utils';

interface MatrixRowProps {
  row: IMatrixRow;
  timeSlots: TimeSlot[];
  total: number;
  onUpdateName: (name: string) => void;
  onUpdateValue: (slotId: string, value: number) => void;
  onToggleBreak: (slotId: string) => void;
  onDelete: () => void;
}

export const MatrixRow: React.FC<MatrixRowProps> = ({ 
  row, 
  timeSlots, 
  total, 
  onUpdateName, 
  onUpdateValue, 
  onToggleBreak,
  onDelete 
}) => {
  return (
    <div className="flex gap-4 mb-2 items-center min-w-max group">
      {/* Name Column */}
      <div className="w-64 flex gap-2 shrink-0 sticky left-0 bg-card z-10 pr-2 group-hover:bg-accent/5 transition-colors shadow-[5px_0_10px_-5px_rgba(0,0,0,0.1)]">
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
      {timeSlots.map(slot => (
        <div key={slot.id} className="w-32 shrink-0">
          <MatrixCell
            value={row.values[slot.id] || 0}
            onChange={(val) => onUpdateValue(slot.id, val)}
            onToggleBreak={() => onToggleBreak(slot.id)}
            isBreak={row.breaks.includes(slot.id)}
          />
        </div>
      ))}

      {/* Row Total */}
      <div className={cn(
        "w-40 shrink-0 sticky right-0 z-10 pl-2 border-l flex items-center px-4 rounded-md font-semibold justify-end h-10 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]",
        "bg-card text-primary border-primary/20"
      )}>
        {formatCurrency(total)}
      </div>
    </div>
  );
};
