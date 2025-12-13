import { toZonedTime, format } from 'date-fns-tz';
import { es } from 'date-fns/locale';

export const CR_TIMEZONE = 'America/Costa_Rica';

export const getTodayInCR = (): string => {
  const now = new Date();
  const zonedDate = toZonedTime(now, CR_TIMEZONE);
  return format(zonedDate, 'yyyy-MM-dd', { timeZone: CR_TIMEZONE });
};

export const formatCRDate = (dateStr: string): string => {
  // Assuming dateStr is YYYY-MM-DD
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatCRDateLong = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
};
