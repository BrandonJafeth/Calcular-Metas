import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Advisor, DailySession } from '../types';

interface AdminReportData {
  session: DailySession;
  advisors: Advisor[];
  calculatedGoals: Record<string, number>; // advisorId -> goal
}

interface AdvisorReportData {
  advisor: Advisor;
  session: DailySession;
  personalGoal: number;
}

const formatCurrencyPDF = (amount: number): string => {
  return 'CRC ' + new Intl.NumberFormat('es-CR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const exportAdminReportPDF = (data: AdminReportData) => {
  const doc = new jsPDF();
  const { session, advisors, calculatedGoals } = data;

  // Title
  doc.setFontSize(18);
  doc.text('Reporte de Metas y Ventas', 14, 20);
  
  // Session Info
  doc.setFontSize(12);
  doc.text(`Fecha: ${new Date(session.date).toLocaleDateString()}`, 14, 30);
  doc.text(`Meta Global: ${formatCurrencyPDF(session.total_daily_goal)}`, 14, 36);

  // Table Data
  const tableData = advisors.map(adv => {
    const goal = calculatedGoals[adv.id] || 0;
    const compliance = goal > 0 ? (adv.total_sales / goal) * 100 : 0;
    return [
      adv.name,
      formatCurrencyPDF(goal),
      formatCurrencyPDF(adv.total_sales),
      adv.tickets_count,
      `${compliance.toFixed(1)}%`
    ];
  });

  // Totals
  const totalGoal = Object.values(calculatedGoals).reduce((a, b) => a + b, 0);
  const totalSales = advisors.reduce((a, b) => a + b.total_sales, 0);
  const totalTickets = advisors.reduce((a, b) => a + b.tickets_count, 0);
  const totalCompliance = totalGoal > 0 ? (totalSales / totalGoal) * 100 : 0;

  tableData.push([
    'TOTALES',
    formatCurrencyPDF(totalGoal),
    formatCurrencyPDF(totalSales),
    totalTickets.toString(),
    `${totalCompliance.toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Asesor', 'Meta Asignada', 'Venta Real', 'Tickets', '% Cumplimiento']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });

  doc.save(`Reporte_Admin_${session.date}.pdf`);
};

export const exportAdminReportExcel = (data: AdminReportData) => {
  const { session, advisors, calculatedGoals } = data;

  const rows = advisors.map(adv => {
    const goal = calculatedGoals[adv.id] || 0;
    const compliance = goal > 0 ? (adv.total_sales / goal) : 0;
    return {
      'Asesor': adv.name,
      'Meta Asignada': goal,
      'Venta Real': adv.total_sales,
      'Tickets': adv.tickets_count,
      '% Cumplimiento': compliance
    };
  });

  // Add Totals Row
  const totalGoal = Object.values(calculatedGoals).reduce((a, b) => a + b, 0);
  const totalSales = advisors.reduce((a, b) => a + b.total_sales, 0);
  const totalTickets = advisors.reduce((a, b) => a + b.tickets_count, 0);
  const totalCompliance = totalGoal > 0 ? (totalSales / totalGoal) : 0;

  rows.push({
    'Asesor': 'TOTALES',
    'Meta Asignada': totalGoal,
    'Venta Real': totalSales,
    'Tickets': totalTickets,
    '% Cumplimiento': totalCompliance
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Format columns
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:E1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    // Currency Format for B and C
    const cellB = worksheet[XLSX.utils.encode_cell({ r: R, c: 1 })];
    if (cellB) cellB.z = '"$"#,##0.00';
    const cellC = worksheet[XLSX.utils.encode_cell({ r: R, c: 2 })];
    if (cellC) cellC.z = '"$"#,##0.00';
    // Percent Format for E
    const cellE = worksheet[XLSX.utils.encode_cell({ r: R, c: 4 })];
    if (cellE) cellE.z = '0.0%';
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  XLSX.writeFile(workbook, `Reporte_Admin_${session.date}.xlsx`);
};

export const exportAdvisorReportPDF = (data: AdvisorReportData) => {
  const doc = new jsPDF();
  const { advisor, session, personalGoal } = data;
  const compliance = personalGoal > 0 ? (advisor.total_sales / personalGoal) * 100 : 0;

  doc.setFontSize(18);
  doc.text(`Reporte Individual: ${advisor.name}`, 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Fecha: ${new Date(session.date).toLocaleDateString()}`, 14, 30);

  autoTable(doc, {
    startY: 40,
    head: [['Concepto', 'Valor']],
    body: [
      ['Meta Asignada', formatCurrencyPDF(personalGoal)],
      ['Venta Real', formatCurrencyPDF(advisor.total_sales)],
      ['Tickets', advisor.tickets_count.toString()],
      ['% Cumplimiento', `${compliance.toFixed(1)}%`],
      ['Faltante', formatCurrencyPDF(Math.max(0, personalGoal - advisor.total_sales))]
    ],
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] }
  });

  doc.save(`Reporte_${advisor.name}_${session.date}.pdf`);
};

export const exportAdvisorReportExcel = (data: AdvisorReportData) => {
  const { advisor, session, personalGoal } = data;
  const compliance = personalGoal > 0 ? (advisor.total_sales / personalGoal) : 0;

  const rows = [
    { Concepto: 'Fecha', Valor: session.date },
    { Concepto: 'Asesor', Valor: advisor.name },
    { Concepto: 'Meta Asignada', Valor: personalGoal },
    { Concepto: 'Venta Real', Valor: advisor.total_sales },
    { Concepto: 'Tickets', Valor: advisor.tickets_count },
    { Concepto: '% Cumplimiento', Valor: compliance },
    { Concepto: 'Faltante', Valor: Math.max(0, personalGoal - advisor.total_sales) }
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Individual");
  XLSX.writeFile(workbook, `Reporte_${advisor.name}_${session.date}.xlsx`);
};
