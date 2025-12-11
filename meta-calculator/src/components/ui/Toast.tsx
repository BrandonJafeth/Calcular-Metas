import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
  duration?: number;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const variants = {
  success: "bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-100 dark:border-green-900",
  error: "bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-900",
  info: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-900",
};

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose, duration = 3000 }) => {
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-md min-w-[300px] animate-in slide-in-from-right-full duration-300",
      variants[type]
    )}>
      <Icon className="h-5 w-5 shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button 
        onClick={() => onClose(id)}
        className="opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
