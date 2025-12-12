import { createContext } from 'react';
import type { ToastType } from '../components/ui/Toast';

export interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);
