import type { SymptomLog } from '../../../types';

export async function exportSymptomsToPDF(logs: SymptomLog[], patientCpf: string) {
  if (logs.length === 0) return;

  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = pageWidth - 20;
  const contentWidth = marginRight - marginLeft;

  const drawHeader = () => {
    doc.setFillColor(227, 20, 99);
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('HOSPITAL DE AMOR — PORTAL DO PACIENTE', marginLeft, 7.5);
    doc.text('RELATÓRIO DO DIÁRIO DE SINTOMAS', marginRight, 7.5, { align: 'right' });
  };

  const drawFooter = (pageNum: number) => {
    doc.setFillColor(245, 245, 248);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 160, 160);
    doc.text(
      `Hospital de Amor — Fundação Pio XII | www.hospitaldeamor.org.br | Página ${pageNum}`,
      pageWidth / 2,
      pageHeight - 4,
      { align: 'center' }
    );
  };

  const maskedCpf = patientCpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  const emissionDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  drawHeader();

  let cursorY = 22;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Histórico de Acompanhamento', marginLeft, cursorY);

  cursorY += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(
    'Registros diários de humor, sintomas relatados e observações do diário de saúde.',
    marginLeft,
    cursorY
  );
  doc.text(`Emitido em: ${emissionDate}`, marginRight, cursorY, { align: 'right' });

  cursorY += 6;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, cursorY, marginRight, cursorY);

  cursorY += 6;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(150, 150, 150);
  doc.text('IDENTIFICAÇÃO DO PACIENTE', marginLeft, cursorY);

  cursorY += 4;
  doc.setFillColor(248, 248, 250);
  doc.roundedRect(marginLeft, cursorY, contentWidth, 10, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('CPF do Paciente:', marginLeft + 4, cursorY + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(maskedCpf, marginLeft + 32, cursorY + 6.5);

  cursorY += 16;

  const colDataX = marginLeft + 2;
  const colMoodX = colDataX + 32;
  const colSymptomsX = colMoodX + 22;
  const colNotesX = colSymptomsX + 42;

  const colSymptomsWidth = 40;
  const colNotesWidth = marginRight - colNotesX - 2;

  const drawTableHeaders = (y: number) => {
    doc.setFillColor(240, 240, 245);
    doc.rect(marginLeft, y, contentWidth, 7, 'F');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('DATA / HORA', colDataX, y + 4.5);
    doc.text('HUMOR GERAL', colMoodX, y + 4.5);
    doc.text('SINTOMAS RELATADOS', colSymptomsX, y + 4.5);
    doc.text('OBSERVAÇÕES ADICIONAIS', colNotesX, y + 4.5);
  };

  drawTableHeaders(cursorY);
  let pageNum = 1;
  drawFooter(pageNum);

  cursorY += 7;

  logs.forEach((log) => {
    const formattedDate = new Date(log.createdAt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const symptomsText = log.symptoms.length > 0 ? log.symptoms.join(', ') : 'Nenhum sintoma';
    const notesText = log.notes ? log.notes : 'Sem observações.';

    const notesLines = doc.splitTextToSize(notesText, colNotesWidth);
    const symptomsLines = doc.splitTextToSize(symptomsText, colSymptomsWidth);

    const textHeight = Math.max(notesLines.length, symptomsLines.length) * 3.5 + 4;
    const rowHeight = Math.max(8, textHeight);

    if (cursorY + rowHeight > pageHeight - 15) {
      doc.addPage();
      pageNum += 1;
      drawHeader();
      cursorY = 20;
      drawTableHeaders(cursorY);
      drawFooter(pageNum);
      cursorY += 7;
    }

    doc.setFillColor(252, 252, 253);
    doc.rect(marginLeft, cursorY, contentWidth, rowHeight, 'F');
    doc.setDrawColor(240, 240, 243);
    doc.rect(marginLeft, cursorY, contentWidth, rowHeight, 'S');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(formattedDate, colDataX, cursorY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.text(log.mood, colMoodX, cursorY + 4.5);

    symptomsLines.forEach((line: string, index: number) => {
      doc.text(line, colSymptomsX, cursorY + 4.5 + index * 3.5);
    });

    notesLines.forEach((line: string, index: number) => {
      doc.text(line, colNotesX, cursorY + 4.5 + index * 3.5);
    });

    cursorY += rowHeight;
  });

  doc.save(`Diario_Sintomas_${new Date().toISOString().split('T')[0]}.pdf`);
}
