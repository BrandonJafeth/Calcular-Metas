import type { TimeSlot } from '../types';

export const generateTimeSlots = (start: number, end: number): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let i = start; i <= end; i++) {
    const id = `hour-${i}`;
    const hour12 = i > 12 ? i - 12 : i === 0 ? 12 : i;
    const ampm = i >= 12 ? 'PM' : 'AM';
    const label = `${hour12}:00 ${ampm}`;
    
    slots.push({
      id,
      label,
      hour: i,
    });
  }
  return slots;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CR', { // Assuming Costa Rica based on context, or generic USD
    style: 'currency',
    currency: 'CRC', // Or USD
    minimumFractionDigits: 0,
  }).format(amount);
};
