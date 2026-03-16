import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScheduleResult } from '../types';

export const exportScheduleToPDF = (result: ScheduleResult, title: string, trimesterLabel: string) => {
  const doc = new jsPDF();
  const { schedule, slots } = result;

  // Header
  doc.setFontSize(18);
  doc.text('Horari de Recuperacions', 14, 22);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`${title} - ${trimesterLabel}`, 14, 30);

  // Prepare table data
  const tableData: any[] = [];

  // Sort slots to ensure chronological order
  const sortedSlots = [...slots].sort((a, b) => a.id - b.id);

  sortedSlots.forEach(slot => {
    const examsInSlot = schedule.filter(e => e.slotId === slot.id);
    if (examsInSlot.length === 0) return;

    examsInSlot.forEach((exam, idx) => {
      tableData.push([
        idx === 0 ? `Setmana ${slot.weekIndex + 1}` : '',
        idx === 0 ? slot.dayName : '',
        idx === 0 ? slot.timeRange : '',
        exam.subject,
        exam.students.length.toString(),
        exam.students.join(', ')
      ]);
    });
  });

  autoTable(doc, {
    startY: 40,
    head: [['Setmana', 'Dia', 'Franja', 'Matèria', 'Alumnes', 'Llista Alumnes']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] }, // slate-800
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 35 },
      4: { cellWidth: 15 },
      5: { cellWidth: 'auto' }
    },
    didParseCell: (data) => {
      // Add some grouping logic if needed
    }
  });

  // Save the PDF
  const fileName = `Horari_Recuperacions_${title.replace(/\s+/g, '_')}_${trimesterLabel.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};
