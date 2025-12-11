import React, { useState } from 'react';
import { useMatrixData } from '../../hooks/useMatrixData';
import { MatrixRow } from './MatrixRow';
import { MatrixMobileCard } from './MatrixMobileCard';
import { TimeConfig } from './TimeConfig';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/currency';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileSpreadsheet, FileText, Plus, Coffee } from 'lucide-react';

export const MatrixGrid: React.FC = () => {
  const { state, timeSlots, totals, actions } = useMatrixData();
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleDeleteRequest = (id: string) => {
    setRowToDelete(id);
  };

  const confirmDelete = () => {
    if (rowToDelete) {
      actions.deleteRow(rowToDelete);
      showToast('Fila eliminada correctamente', 'success');
      setRowToDelete(null);
    }
  };

  const handleExportExcel = () => {
    const headers = ['Nombre', ...timeSlots.map(s => s.label), 'Total'];
    const data = state.rows.map(row => [
      row.name,
      ...timeSlots.map(s => {
        const isBreak = row.breaks.includes(s.id);
        return isBreak ? 'PAUSA' : (row.values[s.id] || 0);
      }),
      totals.rowTotals[row.id]
    ]);
    
    // Add totals row
    const totalsRow = [
      'TOTALES',
      ...timeSlots.map(s => totals.colTotals[s.id]),
      totals.grandTotal
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data, totalsRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Metas");
    XLSX.writeFile(wb, "metas-diarias.xlsx");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape
    
    const formatForPDF = (val: number) => {
      return val.toLocaleString('es-CR', { minimumFractionDigits: 0 }) + ' CRC';
    };

    const head = [['Nombre', ...timeSlots.map(s => s.label), 'Total']];
    const body = [
      ...state.rows.map(row => [
        row.name,
        ...timeSlots.map(s => {
          const isBreak = row.breaks.includes(s.id);
          return isBreak ? 'PAUSA' : formatForPDF(row.values[s.id] || 0);
        }),
        formatForPDF(totals.rowTotals[row.id])
      ]),
      [
        'TOTALES',
        ...timeSlots.map(s => formatForPDF(totals.colTotals[s.id])),
        formatForPDF(totals.grandTotal)
      ]
    ];

    autoTable(doc, {
      head,
      body,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [25, 118, 210] }, // Primary color
    });

    doc.save('metas-diarias.pdf');
  };

  return (
    <div className="flex flex-col h-screen p-4 md:p-6 bg-background text-foreground overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Daily Goals Tracker</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gestiona tus metas diarias y monitorea el progreso.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="gap-2 flex-1 md:flex-none">
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-2 flex-1 md:flex-none">
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="mb-6 shrink-0">
        <TimeConfig 
          start={state.timeRange.start} 
          end={state.timeRange.end} 
          onUpdate={actions.updateTimeRange}
        />
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden flex-1 overflow-auto space-y-4 pb-20">
        {state.rows.map(row => (
          <MatrixMobileCard
            key={row.id}
            row={row}
            timeSlots={timeSlots}
            total={totals.rowTotals[row.id] || 0}
            onUpdateName={(name) => actions.updateRowName(row.id, name)}
            onUpdateValue={(slotId, val) => actions.updateValue(row.id, slotId, val)}
            onToggleBreak={(slotId) => actions.toggleCellBreak(row.id, slotId)}
            onDelete={() => handleDeleteRequest(row.id)}
          />
        ))}
        <Button onClick={actions.addRow} variant="secondary" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Agregar Fila
        </Button>
        
        {/* Mobile Totals Summary */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 shadow-lg z-50">
          <div className="flex justify-between items-center">
            <span className="font-bold text-muted-foreground">GRAN TOTAL</span>
            <span className="font-bold text-xl text-primary">{formatCurrency(totals.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Desktop View (Matrix) */}
      <div className="hidden md:flex flex-1 overflow-hidden border rounded-lg bg-card shadow-sm relative flex-col">
        <div className="overflow-auto flex-1 matrix-scroll">
          <div className="min-w-max p-1">
            {/* Header Row */}
            <div className="flex gap-4 mb-2 sticky top-0 bg-card z-40 pb-2 border-b border-border pt-2 px-2 shadow-sm">
              <div className="w-64 shrink-0 font-semibold text-muted-foreground sticky left-0 bg-card z-50 pl-2 flex items-center shadow-[5px_0_10px_-5px_rgba(0,0,0,0.1)]">
                Nombre / Meta
              </div>
              {timeSlots.map(slot => (
                <div key={slot.id} className="w-32 shrink-0 text-center flex flex-col items-center justify-center gap-1">
                  <div className="font-medium text-sm">{slot.label}</div>
                  <Button 
                    onClick={() => actions.toggleBreakForColumn(slot.id)}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-50 hover:opacity-100"
                    title="Alternar pausa para todos"
                  >
                    <Coffee className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="w-40 shrink-0 font-bold text-primary text-right sticky right-0 bg-card z-50 pr-4 flex items-center justify-end border-l border-border/50 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.1)]">
                Total Fila
              </div>
            </div>

            {/* Rows */}
            <div className="space-y-1 px-2">
              {state.rows.map(row => (
                <MatrixRow
                  key={row.id}
                  row={row}
                  timeSlots={timeSlots}
                  total={totals.rowTotals[row.id] || 0}
                  onUpdateName={(name) => actions.updateRowName(row.id, name)}
                  onUpdateValue={(slotId, val) => actions.updateValue(row.id, slotId, val)}
                  onToggleBreak={(slotId) => actions.toggleCellBreak(row.id, slotId)}
                  onDelete={() => handleDeleteRequest(row.id)}
                />
              ))}
            </div>

            {/* Add Row Button */}
            <div className="mt-4 px-2 sticky left-0 z-30">
              <Button onClick={actions.addRow} variant="secondary" className="w-64 gap-2">
                <Plus className="h-4 w-4" />
                Agregar Fila
              </Button>
            </div>

            {/* Totals Footer */}
            <div className="flex gap-4 mt-6 pt-4 border-t border-primary sticky bottom-0 bg-card z-40 pb-4 px-2 shadow-[0_-5px_10px_-5px_rgba(0,0,0,0.05)]">
              <div className="w-64 shrink-0 font-bold text-right pr-4 sticky left-0 bg-card z-50 flex items-center justify-end">
                TOTALES POR HORA
              </div>
              {timeSlots.map(slot => (
                <div key={slot.id} className={cn(
                  "w-32 shrink-0 text-right font-bold flex items-center justify-end text-foreground"
                )}>
                  {formatCurrency(totals.colTotals[slot.id] || 0)}
                </div>
              ))}
              <div className="w-40 shrink-0 text-right sticky right-0 z-50 pl-4 bg-card">
                 <div className="bg-primary text-primary-foreground font-bold rounded-md px-4 py-2 shadow-md inline-block w-full">
                    {formatCurrency(totals.grandTotal)}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!rowToDelete}
        onClose={() => setRowToDelete(null)}
        title="Confirmar eliminación"
        footer={
          <>
            <Button variant="outline" onClick={() => setRowToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </>
        }
      >
        <p>¿Estás seguro de que deseas eliminar esta fila? Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
};
