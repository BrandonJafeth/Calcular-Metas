import { useState, useEffect, useMemo } from 'react';
import type { MatrixState } from '../types';
import { generateTimeSlots } from '../utils/time';

const STORAGE_KEY = 'meta-calculator-data';

const INITIAL_STATE: MatrixState = {
  timeRange: { start: 9, end: 18 }, // 9 AM - 6 PM
  rows: Array.from({ length: 5 }).map(() => ({
    id: crypto.randomUUID(),
    name: '',
    values: {},
    breaks: [],
  })),
};

export const useMatrixData = () => {
  const [state, setState] = useState<MatrixState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure rows have breaks array if loading old data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parsed.rows = parsed.rows.map((r: any) => ({
        ...r,
        breaks: r.breaks || []
      }));
      return parsed;
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const timeSlots = useMemo(() => 
    generateTimeSlots(state.timeRange.start, state.timeRange.end),
    [state.timeRange]
  );

  const addRow = () => {
    setState(prev => ({
      ...prev,
      rows: [...prev.rows, { id: crypto.randomUUID(), name: '', values: {}, breaks: [] }]
    }));
  };

  const deleteRow = (id: string) => {
    setState(prev => ({
      ...prev,
      rows: prev.rows.filter(row => row.id !== id)
    }));
  };

  const updateRowName = (id: string, name: string) => {
    setState(prev => ({
      ...prev,
      rows: prev.rows.map(row => row.id === id ? { ...row, name } : row)
    }));
  };

  const updateValue = (rowId: string, slotId: string, value: number) => {
    setState(prev => ({
      ...prev,
      rows: prev.rows.map(row => 
        row.id === rowId 
          ? { ...row, values: { ...row.values, [slotId]: value } }
          : row
      )
    }));
  };

  const updateTimeRange = (start: number, end: number) => {
    setState(prev => ({
      ...prev,
      timeRange: { start, end }
    }));
  };

  const toggleBreakForColumn = (slotId: string) => {
    setState(prev => {
      // Check if all rows have this break
      const allHaveBreak = prev.rows.every(r => r.breaks.includes(slotId));
      
      return {
        ...prev,
        rows: prev.rows.map(row => {
          const hasBreak = row.breaks.includes(slotId);
          let newBreaks = row.breaks;
          
          if (allHaveBreak) {
            // Remove break from all
            newBreaks = row.breaks.filter(b => b !== slotId);
          } else {
            // Add break to all (if not present)
            if (!hasBreak) newBreaks = [...row.breaks, slotId];
          }
          
          return { ...row, breaks: newBreaks };
        })
      };
    });
  };

  const toggleCellBreak = (rowId: string, slotId: string) => {
    setState(prev => ({
      ...prev,
      rows: prev.rows.map(row => {
        if (row.id !== rowId) return row;
        const hasBreak = row.breaks.includes(slotId);
        return {
          ...row,
          breaks: hasBreak 
            ? row.breaks.filter(b => b !== slotId)
            : [...row.breaks, slotId]
        };
      })
    }));
  };

  // Calculations
  const totals = useMemo(() => {
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;

    // Initialize col totals
    timeSlots.forEach(slot => {
      colTotals[slot.id] = 0;
    });

    state.rows.forEach(row => {
      let rTotal = 0;
      timeSlots.forEach(slot => {
        const isBreak = row.breaks.includes(slot.id);
        if (!isBreak) {
          const val = row.values[slot.id] || 0;
          rTotal += val;
          colTotals[slot.id] = (colTotals[slot.id] || 0) + val;
        }
      });
      rowTotals[row.id] = rTotal;
      grandTotal += rTotal;
    });

    return { rowTotals, colTotals, grandTotal };
  }, [state.rows, timeSlots]);

  return {
    state,
    timeSlots,
    totals,
    actions: {
      addRow,
      deleteRow,
      updateRowName,
      updateValue,
      updateTimeRange,
      toggleBreakForColumn,
      toggleCellBreak
    }
  };
};
