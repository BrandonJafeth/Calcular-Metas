import React from 'react';
import type { MatrixRow, TimeSlot } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/currency';
import { cn } from '../../lib/utils';
import { Coffee, Trash2 } from 'lucide-react';

interface MatrixMobileCardProps {
  row: MatrixRow;
  timeSlots: TimeSlot[];
  total: number;
  onUpdateName: (name: string) => void;
  onUpdateValue: (slotId: string, value: number) => void;
  onToggleBreak: (slotId: string) => void;
  onDelete: () => void;
}

export const MatrixMobileCard: React.FC<MatrixMobileCardProps> = ({
  row,
  timeSlots,
  total,
  onUpdateName,
  onUpdateValue,
  onToggleBreak,
  onDelete
}) => {
  return (
    <div className="bg-card rounded-lg border shadow-sm p-4 space-y-4">
      <div className="flex gap-2 items-center">
        <Input
          value={row.name}
          onChange={(e) => onUpdateName(e.target.value)}
          placeholder="Nombre / Meta"
          className="font-medium text-lg h-12"
        />
        <Button 
          variant="destructive" 
          size="icon"
          className="h-12 w-12 shrink-0"
          onClick={onDelete}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {timeSlots.map(slot => {
          const isBreak = row.breaks.includes(slot.id);
          return (
            <div key={slot.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-muted-foreground">{slot.label}</label>
                <button 
                  onClick={() => onToggleBreak(slot.id)}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full border transition-colors",
                    isBreak 
                      ? "bg-destructive/10 text-destructive border-destructive/20" 
                      : "bg-secondary text-muted-foreground border-transparent hover:bg-secondary/80"
                  )}
                >
                  {isBreak ? 'Pausa' : 'Trabajo'}
                </button>
              </div>
              
              {isBreak ? (
                <div 
                  className="h-10 rounded-md bg-muted/50 border border-dashed border-muted-foreground/20 flex items-center justify-center cursor-pointer hover:bg-muted"
                  onClick={() => onToggleBreak(slot.id)}
                >
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : (
                <Input
                  type="number"
                  value={row.values[slot.id] || ''}
                  onChange={(e) => onUpdateValue(slot.id, Number(e.target.value))}
                  placeholder="0"
                  className="text-right"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t flex justify-between items-center">
        <span className="font-semibold text-muted-foreground">Total</span>
        <span className="font-bold text-xl text-primary">{formatCurrency(total)}</span>
      </div>
    </div>
  );
};
