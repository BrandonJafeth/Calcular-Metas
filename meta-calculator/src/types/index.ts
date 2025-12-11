export interface TimeSlot {
  id: string;
  label: string; // "10:00 AM"
  hour: number; // 10
  // isBreak removed from here, now managed per row
}

export interface MatrixRow {
  id: string;
  name: string;
  values: Record<string, number>; // timeSlotId -> amount
  sales: Record<string, number>; // timeSlotId -> sale amount
  manualTotalSale?: number; // Optional manual override for total sales
  breaks: string[]; // IDs of time slots that are breaks for this row
}

export interface MatrixState {
  timeRange: {
    start: number; // 0-23
    end: number; // 0-23
  };
  // breakHours removed from global state
  rows: MatrixRow[];
}
