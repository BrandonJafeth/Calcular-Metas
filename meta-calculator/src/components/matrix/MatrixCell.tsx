import React from 'react';
import { Input } from '../ui/Input';
import { formatCurrency, parseCurrency } from '../../utils/currency';
import { cn } from '../../lib/utils';
import { Coffee, X } from 'lucide-react';

interface MatrixCellProps {
  value: number;
  onChange: (value: number) => void;
  onToggleBreak: () => void;
  isDisabled?: boolean;
  isBreak?: boolean;
}

export const MatrixCell: React.FC<MatrixCellProps> = ({ value, onChange, onToggleBreak, isDisabled, isBreak }) => {
  const [inputValue, setInputValue] = React.useState(value === 0 ? '' : value.toString());
  const [isEditing, setIsEditing] = React.useState(false);

  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(value === 0 ? '' : formatCurrency(value));
    }
  }, [value, isEditing]);

  const handleFocus = () => {
    setIsEditing(true);
    setInputValue(value === 0 ? '' : value.toString());
  };

  const handleBlur = () => {
    setIsEditing(false);
    const num = parseCurrency(inputValue);
    onChange(num);
    setInputValue(num === 0 ? '' : formatCurrency(num));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(val)) {
      setInputValue(val);
    }
  };

  if (isBreak) {
    return (
      <div className="h-10 bg-muted/50 border border-dashed border-muted-foreground/30 rounded-md flex items-center justify-between px-2 group/cell relative">
        <div className="flex items-center gap-2 text-muted-foreground mx-auto">
          <Coffee className="h-3 w-3" />
          <span className="text-xs font-medium">PAUSA</span>
        </div>
        <button 
          onClick={onToggleBreak}
          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded-full transition-all"
          title="Quitar pausa"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative group/input">
      <Input
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={isDisabled}
        placeholder="0"
        className={cn(
          "text-right h-10 font-mono text-sm pr-2 transition-all",
          isDisabled && "bg-muted text-muted-foreground"
        )}
      />
      {/* Quick Break Toggle (visible on hover if empty or 0) */}
      <button
        onClick={onToggleBreak}
        className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-muted-foreground/50 hover:text-primary hover:bg-primary/10 transition-all",
          "opacity-0 group-hover/input:opacity-100",
          value > 0 && "hidden" // Only show if empty/zero to avoid clutter
        )}
        title="Marcar como pausa"
        tabIndex={-1}
      >
        <Coffee className="h-3 w-3" />
      </button>
    </div>
  );
};
