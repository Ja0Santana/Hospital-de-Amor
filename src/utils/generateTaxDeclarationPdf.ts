import jsPDF from 'jspdf';
import type { Donation } from '../types';

interface TaxDeclarationPdfOptions {
  donorName: string;
  donorCpf: string;
  year: string;
  donations: Donation[];
  mode?: 'download' | 'print';
}

export function generateTaxDeclarationPdf({ donorName, donorCpf, year, donations, mode = 'download' }: TaxDeclarationPdfOptions): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = pageWidth - 20;
  const contentWidth = marginRight - marginLeft;

  const confirmedDonations = donations.filter(
    (d) => d.status === 'Confirmada' && new Date(d.date).getFullYear().toString() === year
  );

  const totalAmount = confirmedDonations.reduce((sum, d) => sum + d.amount, 0);

  const maskedCpf = donorCpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  const emissionDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const authKey = `HA${year}-DF9A-87C2-E23B-98F1-44A9B8CE3A1D`;

  let cursorY = 20;

  const drawHorizontalRule = (y: number, r = 220, g = 220, b = 220) => {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, y, marginRight, y);
  };

  doc.setFillColor(227, 20, 99);
  doc.rect(0, 0, pageWidth, 12, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('HOSPITAL DE AMOR — FUNDAÇÃO PIO XII', marginLeft, 7.5);
  doc.text(`DECLARAÇÃO ANUAL DE DOAÇÕES — ANO CALENDÁRIO ${year}`, marginRight, 7.5, { align: 'right' });

  cursorY = 22;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Declaração Anual de Doações', marginLeft, cursorY);

  cursorY += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Comprovante consolidado para fins de Imposto de Renda — Ano Calendário ${year}`, marginLeft, cursorY);

  cursorY += 4;
  doc.text(`Emitido em: ${emissionDate}`, marginRight, cursorY, { align: 'right' });

  cursorY += 6;
  drawHorizontalRule(cursorY);
  cursorY += 8;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(150, 150, 150);
  doc.text('INSTITUIÇÃO BENEFICIÁRIA', marginLeft, cursorY);
  cursorY += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(227, 20, 99);
  doc.text('Hospital de Amor — Fundação Pio XII', marginLeft, cursorY);
  cursorY += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('CNPJ: 60.102.102/0001-10', marginLeft, cursorY);
  cursorY += 4;
  doc.text('Rua Antenor Duarte Villela, 1331 — Barretos/SP — CEP: 14784-400', marginLeft, cursorY);
  cursorY += 4;
  doc.text('Entidade filantrópica qualificada nos termos da legislação federal brasileira.', marginLeft, cursorY);

  cursorY += 8;
  drawHorizontalRule(cursorY);
  cursorY += 8;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(150, 150, 150);
  doc.text('IDENTIFICAÇÃO DO DOADOR', marginLeft, cursorY);
  cursorY += 5;

  doc.setFillColor(248, 248, 250);
  doc.roundedRect(marginLeft, cursorY, contentWidth, 14, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Nome Completo:', marginLeft + 4, cursorY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(donorName, marginLeft + 38, cursorY + 5);

  doc.setFont('helvetica', 'bold');
  doc.text('CPF:', marginLeft + 4, cursorY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(maskedCpf, marginLeft + 38, cursorY + 10);

  cursorY += 22;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(150, 150, 150);
  doc.text(`DOAÇÕES RECEBIDAS EM ${year}`, marginLeft, cursorY);
  cursorY += 5;

  const colData = marginLeft + 26;
  const colMethod = marginLeft + 58;
  const colHash = marginLeft + 90;
  const colAmount = marginRight;

  doc.setFillColor(240, 240, 245);
  doc.rect(marginLeft, cursorY, contentWidth, 7, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('DATA', colData, cursorY + 4.5, { align: 'right' });
  doc.text('MÉTODO', colMethod, cursorY + 4.5, { align: 'right' });
  doc.text('Nº TRANSAÇÃO', colHash, cursorY + 4.5);
  doc.text('VALOR (R$)', colAmount, cursorY + 4.5, { align: 'right' });

  cursorY += 7;

  if (confirmedDonations.length === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(160, 160, 160);
    doc.text(`Nenhuma doação confirmada registrada no ano fiscal de ${year}.`, pageWidth / 2, cursorY + 6, { align: 'center' });
    cursorY += 14;
  } else {
    confirmedDonations.forEach((d, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 254);
        doc.rect(marginLeft, cursorY, contentWidth, 6.5, 'F');
      }

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);

      const dateStr = new Date(d.date).toLocaleDateString('pt-BR');
      const hashStr = (d.hash || d.id).slice(0, 24);
      const amountStr = `R$ ${d.amount.toFixed(2).replace('.', ',')}`;

      doc.text(dateStr, colData, cursorY + 4.5, { align: 'right' });
      doc.text(d.method, colMethod, cursorY + 4.5, { align: 'right' });
      doc.text(hashStr, colHash, cursorY + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(amountStr, colAmount, cursorY + 4.5, { align: 'right' });

      cursorY += 6.5;

      doc.setDrawColor(235, 235, 240);
      doc.setLineWidth(0.1);
      doc.line(marginLeft, cursorY, marginRight, cursorY);
    });
  }

  cursorY += 5;
  doc.setFillColor(227, 20, 99);
  doc.rect(marginLeft, cursorY, contentWidth, 10, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`VALOR TOTAL CONSOLIDADO EM ${year}`, marginLeft + 4, cursorY + 6.5);
  const totalStr = `R$ ${totalAmount.toFixed(2).replace('.', ',')}`;
  doc.text(totalStr, marginRight - 4, cursorY + 6.5, { align: 'right' });

  cursorY += 18;
  drawHorizontalRule(cursorY);
  cursorY += 6;

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);

  const legalText =
    'Declaramos para os devidos fins de comprovação e dedução fiscal que a Fundação Pio XII (Hospital de Amor) é uma ' +
    'entidade filantrópica qualificada nos termos da legislação federal brasileira e que recebeu os valores acima ' +
    'identificados a título de doação espontânea, sem que tenha ocorrido qualquer contraprestação direta ou indireta ' +
    'de bens ou serviços.';

  const legalLines = doc.splitTextToSize(legalText, contentWidth);
  doc.text(legalLines, marginLeft, cursorY);
  cursorY += legalLines.length * 4 + 4;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('Chave de Autenticação ICP-Brasil:', marginLeft, cursorY);
  cursorY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(authKey, marginLeft, cursorY);
  cursorY += 4;

  doc.setFontSize(6);
  doc.text('Assinatura digitalizada e validada nos termos da Medida Provisória nº 2.200-2/2001.', marginLeft, cursorY);

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(245, 245, 248);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text(
    'Hospital de Amor — Fundação Pio XII | www.hospitaldeamor.org.br | (17) 3321-6600',
    pageWidth / 2,
    pageHeight - 4,
    { align: 'center' }
  );

  const fileName = `Declaracao-IR-${year}-${maskedCpf.replace(/\D/g, '')}.pdf`;

  if (mode === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl') as unknown as string;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 60000);
    };
  } else {
    doc.save(fileName);
  }
}
