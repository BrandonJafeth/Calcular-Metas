import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Advisor, DailySession, StoreHourlyMetric, HourlyWeight } from '../types';
import { formatCRDate } from './dateUtils';

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

interface StoreMetricsReportData {
  session: DailySession;
  metrics: StoreHourlyMetric[];
  weights: HourlyWeight[];
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
  doc.text(`Fecha: ${formatCRDate(session.date)}`, 14, 30);
  doc.text(`Meta Global: ${formatCurrencyPDF(session.total_daily_goal)}`, 14, 36);

  // Calculate Difference
  const totalSales = advisors.reduce((a, b) => a + b.total_sales, 0);
  const difference = session.total_daily_goal - totalSales;
  const differenceLabel = difference > 0 ? 'Falta para Meta' : 'Meta Superada';
  
  doc.text(`Venta Total: ${formatCurrencyPDF(totalSales)}`, 14, 42);
  
  if (difference > 0) {
    doc.setTextColor(234, 88, 12); // Orange-600
  } else {
    doc.setTextColor(5, 150, 105); // Emerald-600
  }
  doc.text(`${differenceLabel}: ${formatCurrencyPDF(Math.abs(difference))}`, 14, 48);
  doc.setTextColor(0, 0, 0); // Reset color

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
  // totalSales already calculated above
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
    startY: 55,
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

  const rows: Record<string, string | number>[] = advisors.map(adv => {
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

  // Add Summary Rows
  const difference = session.total_daily_goal - totalSales;
  rows.push({}); // Empty row
  rows.push({
    'Asesor': 'RESUMEN GLOBAL',
    'Meta Asignada': session.total_daily_goal,
    'Venta Real': totalSales,
    'Tickets': difference > 0 ? 'FALTA' : 'SUPERÁVIT',
    '% Cumplimiento': Math.abs(difference)
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
    
    // Check if it's the summary row (last row)
    if (R === rows.length - 1) {
       // Format the difference value (column E in this specific row structure)
       const cellE = worksheet[XLSX.utils.encode_cell({ r: R, c: 4 })];
       if (cellE) cellE.z = '"$"#,##0.00';
    } else {
       // Percent Format for E (normal rows)
       const cellE = worksheet[XLSX.utils.encode_cell({ r: R, c: 4 })];
       if (cellE) cellE.z = '0.0%';
    }
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
  doc.text(`Fecha: ${formatCRDate(session.date)}`, 14, 30);

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

export const exportStoreMetricsPDF = (data: StoreMetricsReportData) => {
  const doc = new jsPDF('l'); // Landscape for wider table
  const { session, metrics, weights } = data;

  // Title
  doc.setFontSize(18);
  doc.text('Reporte de Métricas de Tienda', 14, 20);
  
  // Session Info
  doc.setFontSize(12);
  doc.text(`Fecha: ${formatCRDate(session.date)}`, 14, 30);
  doc.text(`Meta Global del Día: ${formatCurrencyPDF(session.total_daily_goal)}`, 14, 36);

  // Prepare Data
  const startHour = session.start_hour ?? 9;
  const endHour = session.end_hour ?? 21;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
  
  const metricsMap: Record<number, StoreHourlyMetric> = {};
  metrics.forEach(m => metricsMap[m.hour] = m);

  const tableData = hours.map(hour => {
    const m = metricsMap[hour] || {};
    const weight = weights.find(w => w.hour_start === hour)?.percentage || 0;
    const storeHourlyGoal = (session.total_daily_goal * weight) / 100;
    
    const traffic = m.traffic || 0;
    const tickets = m.tickets || 0;
    const lastYear = m.last_year_sales || 0;
    const current = m.current_sales || 0;
    
    const conversion = traffic > 0 ? (tickets / traffic) * 100 : 0;
    const growth = lastYear > 0 ? ((current / lastYear) - 1) * 100 : 0;
    const avgTicket = tickets > 0 ? current / tickets : 0;

    return [
      hour > 12 ? `${hour - 12} PM` : `${hour} ${hour === 12 ? 'PM' : 'AM'}`,
      formatCurrencyPDF(storeHourlyGoal),
      traffic.toString(),
      tickets.toString(),
      `${conversion.toFixed(1)}%`,
      formatCurrencyPDF(lastYear),
      formatCurrencyPDF(current),
      `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
      formatCurrencyPDF(avgTicket)
    ];
  });

  // Totals Row
  const totalGoal = session.total_daily_goal;
  const totalTraffic = metrics.reduce((sum, m) => sum + (m.traffic || 0), 0);
  const totalTickets = metrics.reduce((sum, m) => sum + (m.tickets || 0), 0);
  const totalLastYear = metrics.reduce((sum, m) => sum + (m.last_year_sales || 0), 0);
  const totalCurrent = metrics.reduce((sum, m) => sum + (m.current_sales || 0), 0);
  
  const totalConversion = totalTraffic > 0 ? (totalTickets / totalTraffic) * 100 : 0;
  const totalGrowth = totalLastYear > 0 ? ((totalCurrent / totalLastYear) - 1) * 100 : 0;
  const totalAvgTicket = totalTickets > 0 ? totalCurrent / totalTickets : 0;

  tableData.push([
    'TOTALES',
    formatCurrencyPDF(totalGoal),
    totalTraffic.toString(),
    totalTickets.toString(),
    `${totalConversion.toFixed(1)}%`,
    formatCurrencyPDF(totalLastYear),
    formatCurrencyPDF(totalCurrent),
    `${totalGrowth > 0 ? '+' : ''}${totalGrowth.toFixed(1)}%`,
    formatCurrencyPDF(totalAvgTicket)
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Hora', 'Meta Hora', 'Entradas', 'Tickets', 'Conv.', 'Venta 2024', 'Venta Actual', 'Crecimiento', 'Ticket Prom.']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], halign: 'center' },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' }
    },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
  });

  doc.save(`Metricas_Tienda_${session.date}.pdf`);
};

export const exportStoreMetricsExcel = (data: StoreMetricsReportData) => {
  const { session, metrics, weights } = data;
  
  const startHour = session.start_hour ?? 9;
  const endHour = session.end_hour ?? 21;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour);
  
  const metricsMap: Record<number, StoreHourlyMetric> = {};
  metrics.forEach(m => metricsMap[m.hour] = m);

  const rows = hours.map(hour => {
    const m = metricsMap[hour] || {};
    const weight = weights.find(w => w.hour_start === hour)?.percentage || 0;
    const storeHourlyGoal = (session.total_daily_goal * weight) / 100;
    
    const traffic = m.traffic || 0;
    const tickets = m.tickets || 0;
    const lastYear = m.last_year_sales || 0;
    const current = m.current_sales || 0;
    
    const conversion = traffic > 0 ? (tickets / traffic) : 0;
    const growth = lastYear > 0 ? ((current / lastYear) - 1) : 0;
    const avgTicket = tickets > 0 ? current / tickets : 0;

    return {
      'Hora': hour > 12 ? `${hour - 12} PM` : `${hour} ${hour === 12 ? 'PM' : 'AM'}`,
      'Meta Hora': storeHourlyGoal,
      'Entradas': traffic,
      'Tickets': tickets,
      'Tasa Conv.': conversion,
      'Venta 2024': lastYear,
      'Venta Actual': current,
      'Crecimiento': growth,
      'Ticket Prom.': avgTicket
    };
  });

  // Totals
  const totalGoal = session.total_daily_goal;
  const totalTraffic = metrics.reduce((sum, m) => sum + (m.traffic || 0), 0);
  const totalTickets = metrics.reduce((sum, m) => sum + (m.tickets || 0), 0);
  const totalLastYear = metrics.reduce((sum, m) => sum + (m.last_year_sales || 0), 0);
  const totalCurrent = metrics.reduce((sum, m) => sum + (m.current_sales || 0), 0);
  
  const totalConversion = totalTraffic > 0 ? (totalTickets / totalTraffic) : 0;
  const totalGrowth = totalLastYear > 0 ? ((totalCurrent / totalLastYear) - 1) : 0;
  const totalAvgTicket = totalTickets > 0 ? totalCurrent / totalTickets : 0;

  rows.push({
    'Hora': 'TOTALES',
    'Meta Hora': totalGoal,
    'Entradas': totalTraffic,
    'Tickets': totalTickets,
    'Tasa Conv.': totalConversion,
    'Venta 2024': totalLastYear,
    'Venta Actual': totalCurrent,
    'Crecimiento': totalGrowth,
    'Ticket Prom.': totalAvgTicket
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Format columns
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:I1');
  for (let R = range.s.r + 1; R <= range.e.r; ++R) {
    // Currency: B, F, G, I (Indices 1, 5, 6, 8)
    [1, 5, 6, 8].forEach(c => {
      const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: c })];
      if (cell) cell.z = '"$"#,##0.00';
    });
    
    // Percent: E, H (Indices 4, 7)
    [4, 7].forEach(c => {
      const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: c })];
      if (cell) cell.z = '0.0%';
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Metricas Tienda");
  XLSX.writeFile(workbook, `Metricas_Tienda_${session.date}.xlsx`);
};
