import autoTable from 'jspdf-autotable';
import { drawLetterheadFooter, drawLetterheadHeader } from './documentLetterhead.js';

export const PDF_LAYOUT = Object.freeze({
  header: { x: 10, y: 3, width: 190, height: 35.9 },
  footer: { x: 10, y: 263, width: 190, height: 32.1 },
  titleY: 46,
  contentTop: 53,
  contentBottom: 250,
  left: 14,
  right: 196,
  width: 182
});

export const pdfDate = value => {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('en-GB');
};

export const pdfMoney = value => Number(value || 0).toLocaleString('en-PK', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export const drawProfessionalFrame = (doc, letterhead, { title, draft = false, accent = [15, 23, 42], note } = {}) => {
  drawLetterheadHeader(doc, letterhead, { title, draft });
  drawLetterheadFooter(doc, letterhead, { draft, note });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...accent);
  doc.text(String(title || 'DOCUMENT').toUpperCase(), 105, PDF_LAYOUT.titleY, { align: 'center' });
};

export const drawDetailsBox = (doc, {
  y = PDF_LAYOUT.contentTop,
  height = 34,
  leftTitle = 'CUSTOMER',
  rightTitle = 'DOCUMENT DETAILS',
  leftLines = [],
  rightRows = [],
  accent = [15, 23, 42]
} = {}) => {
  const x = PDF_LAYOUT.left;
  const dividerX = 112;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(x, y, PDF_LAYOUT.width, height);
  doc.line(dividerX, y, dividerX, y + height);
  doc.setFillColor(230, 230, 230);
  doc.rect(x, y, dividerX - x, 6, 'F');
  doc.rect(dividerX, y, PDF_LAYOUT.right - dividerX, 6, 'F');
  doc.line(x, y + 6, PDF_LAYOUT.right, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.7);
  doc.setTextColor(...accent);
  doc.text(leftTitle, x + 2, y + 4.5);
  doc.text(rightTitle, dividerX + 2, y + 4.5);

  let leftY = y + 11;
  leftLines.filter(Boolean).forEach((line, index) => {
    doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
    doc.setFontSize(index === 0 ? 9.2 : 8.1);
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(String(line), 92).slice(0, 2);
    doc.text(lines, x + 2, leftY);
    leftY += Math.max(4.2, lines.length * 3.7);
  });

  let rightY = y + 11;
  rightRows.filter(Boolean).forEach(row => {
    const [label, value] = row;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.1);
    doc.setTextColor(15, 23, 42);
    doc.text(`${label}:`, dividerX + 2, rightY);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(String(value || '-'), 52).slice(0, 2);
    doc.text(lines, dividerX + 30, rightY);
    rightY += Math.max(5, lines.length * 3.8);
  });
  return y + height;
};

export const drawProfessionalTable = (doc, {
  startY,
  head,
  body,
  columnStyles,
  drawFrame,
  headFill = [230, 230, 230],
  headText = [0, 0, 0]
}) => {
  autoTable(doc, {
    startY,
    margin: { left: PDF_LAYOUT.left, right: 14, top: 51, bottom: 49 },
    tableWidth: PDF_LAYOUT.width,
    head: [head],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: headFill,
      textColor: headText,
      fontStyle: 'bold',
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.35
    },
    styles: {
      fontSize: 8.2,
      cellPadding: 2.3,
      valign: 'middle',
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      overflow: 'linebreak'
    },
    columnStyles,
    rowPageBreak: 'avoid',
    willDrawPage: data => {
      const absolutePageNumber = doc.internal.getCurrentPageInfo().pageNumber;
      if (absolutePageNumber > 1) drawFrame();
      else if (drawFrame) {
        // Page one was framed before the table; keep the footer above table output.
      }
    }
  });
  return doc.lastAutoTable.finalY;
};

export const ensurePdfSpace = (doc, y, height, drawFrame) => {
  if (y + height <= PDF_LAYOUT.contentBottom) return y;
  doc.addPage();
  drawFrame();
  return 55;
};

export const repeatProfessionalFrame = (doc, drawFrame) => {
  const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
  for (let page = 2; page <= doc.getNumberOfPages(); page += 1) {
    doc.setPage(page);
    drawFrame();
  }
  doc.setPage(currentPage);
};

export const drawSummaryBox = (doc, {
  y,
  title = 'SUMMARY',
  rows = [],
  x = 105,
  width = 91
}) => {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.setFillColor(230, 230, 230);
  doc.rect(x, y, width, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(15, 23, 42);
  doc.text(title, x + width / 2, y + 4.3, { align: 'center' });
  let rowY = y + 6;
  rows.forEach((row, index) => {
    const [label, value, strong = false] = row;
    doc.setFillColor(strong ? 230 : 255, strong ? 230 : 255, strong ? 230 : 255);
    doc.rect(x, rowY, width, 6, 'FD');
    doc.setFont('helvetica', strong ? 'bold' : 'normal');
    doc.setFontSize(strong ? 9 : 8.4);
    doc.text(String(label), x + 2, rowY + 4.2);
    doc.text(String(value), x + width - 2, rowY + 4.2, { align: 'right' });
    rowY += 6;
    if (index === rows.length - 1) doc.setFont('helvetica', 'normal');
  });
  return rowY;
};
