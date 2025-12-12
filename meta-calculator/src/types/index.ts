export interface DailySession {
  id: string;
  date: string;
  total_daily_goal: number;
  start_hour: number;
  end_hour: number;
}

export interface HourlyWeight {
  id: string;
  session_id: string;
  hour_start: number;
  percentage: number;
}

export interface Advisor {
  id: string;
  session_id: string;
  name: string;
  access_token: string;
  total_sales: number;
  tickets_count: number;
}

export interface AdvisorAvailability {
  id: string;
  advisor_id: string;
  hour_start: number;
  is_active: boolean;
}

export interface SessionTemplate {
  id: string;
  name: string;
  start_hour: number;
  end_hour: number;
  weights: { hour_start: number; percentage: number }[];
}

// Legacy types kept for reference if needed, but likely to be replaced
export interface TimeSlot {
  id: string;
  label: string; 
  hour: number; 
}
