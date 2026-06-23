import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportSingleResultPDF(record: any) {
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.setTextColor(13, 76, 46); // #0D4C2E
  doc.text('zero2v', 14, 22);

  doc.setFontSize(14);
  doc.setTextColor(26, 26, 26);
  doc.text('Verification Report', 14, 32);

  doc.setFontSize(10);
  doc.setTextColor(112, 121, 113);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);
  if (record.reportId) doc.text(`Report ID: ${record.reportId}`, 14, 46);

  doc.setLineWidth(0.5);
  doc.setDrawColor(229, 231, 235);
  doc.line(14, 52, 196, 52);

  doc.setFontSize(16);
  doc.setTextColor(26, 26, 26);
  doc.text(record.fullName || 'Unknown', 14, 62);

  const dataRows = [
    ['NIN', record.nin || 'N/A'],
    ['Date of Birth', record.dob || 'N/A'],
    ['Gender', record.gender || 'N/A'],
    ['Phone', record.phone || 'N/A'],
    ['State', record.state || 'N/A'],
    ['LGA', record.lga || 'N/A'],
    ['Residence', record.residence || 'N/A'],
  ];

  autoTable(doc, {
    startY: 70,
    head: [['Field', 'Value']],
    body: dataRows,
    theme: 'grid',
    headStyles: { fillColor: [13, 76, 46], textColor: [255, 255, 255] },
    styles: { fontSize: 10, cellPadding: 5 },
  });

  doc.save(`zero2v_report_${record.nin || Date.now()}.pdf`);
}
