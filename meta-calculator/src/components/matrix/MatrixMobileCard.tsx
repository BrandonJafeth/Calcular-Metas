import React from 'react';
import type { MatrixRow, TimeSlot } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { formatCurrency, parseCurrency } from '../../utils/currency';
import { cn } from '../../lib/utils';
import { Coffee, Trash2, Calculator, RotateCcw } from 'lucide-react';

interface MatrixMobileCardProps {
  row: MatrixRow;
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

export const MatrixMobileCard: React.FC<MatrixMobileCardProps> = ({
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

      <div className={cn("grid grid-cols-1 gap-3", isManual && "opacity-50 pointer-events-none")}>
        {timeSlots.map(slot => {
          const isBreak = row.breaks.includes(slot.id);
          return (
            <div key={slot.id} className={cn(
              "rounded-md border p-3 relative",
              isBreak ? "bg-muted/50 border-dashed" : "bg-background"
            )}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm text-muted-foreground">{slot.label}</span>
                <Button
                  variant={isBreak ? "default" : "ghost"}
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onToggleBreak(slot.id)}
                >
                  <Coffee className="h-3 w-3" />
                </Button>
              </div>
              
              {isBreak ? (
                <div className="text-center py-2 text-muted-foreground font-medium">
                  PAUSA
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Meta</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={row.values[slot.id] ? formatCurrency(row.values[slot.id]) : ''}
                      onChange={(e) => {
                        const val = parseCurrency(e.target.value);
                        onUpdateValue(slot.id, val);
                      }}
                      placeholder="$0"
                      className="h-9 text-right"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Venta</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={row.sales[slot.id] ? formatCurrency(row.sales[slot.id]) : ''}
                      onChange={(e) => {
                        const val = parseCurrency(e.target.value);
                        onUpdateSale(slot.id, val);
                      }}
                      placeholder="$0"
                      className="h-9 text-right border-green-200 focus-visible:ring-green-500"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-muted/30 rounded-lg p-3 space-y-2 border">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Meta:</span>
          <span className="font-bold">{formatCurrency(totalGoal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Venta:</span>
          <div className="flex items-center gap-2">
            {isManual ? (
              <>
                <Input 
                   type="number" 
                   className="h-8 w-24 text-right px-2 py-1 text-sm"
                   value={row.manualTotalSale || 0}
                   onChange={(e) => onUpdateManualTotalSale(Number(e.target.value))}
                 />
                 <Button
                   variant="ghost"
                   size="icon"
                   className="h-8 w-8"
                   onClick={() => onUpdateManualTotalSale(undefined)}
                 >
                   <RotateCcw className="h-4 w-4" />
                 </Button>
              </>
            ) : (
              <>
                <span className="font-bold text-green-600">{formatCurrency(totalSale)}</span>
                <Button
                   variant="ghost"
                   size="icon"
                   className="h-8 w-8"
                   onClick={() => onUpdateManualTotalSale(totalSale)}
                 >
                   <Calculator className="h-4 w-4" />
                 </Button>
              </>
            )}
          </div>
        </div>
        <div className={cn(
          "flex justify-between items-center pt-2 border-t font-bold text-lg",
          isMet ? "text-green-600" : "text-red-500"
        )}>
          <span>{isMet ? "Superávit:" : "Falta:"}</span>
          <span>{formatCurrency(Math.abs(remaining))}</span>
        </div>
      </div>
    </div>
  );
};
