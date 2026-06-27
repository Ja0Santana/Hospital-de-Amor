import { useState } from 'react';
import { CheckCircle2, Copy, Check, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { createDonation, getUserByCpf } from '../../services/db';
import type { Donation } from '../../types';
import jsPDF from 'jspdf';

interface BoletoPaymentPanelProps {
  amount: number;
  donorCpf: string;
  projectDestiny: string;
  onSuccess: (method: 'Boleto', donationId?: string) => Promise<void>;
  loading: boolean;
  setLoading: (val: boolean) => void;
}

export default function BoletoPaymentPanel({
  amount,
  donorCpf,
  projectDestiny,
  onSuccess,
  loading,
  setLoading,
}: BoletoPaymentPanelProps) {
  const [boletoGenerated, setBoletoGenerated] = useState(false);
  const [currentDonationId, setCurrentDonationId] = useState<string | null>(null);
  const [copiedBoletoLine, setCopiedBoletoLine] = useState(false);

  const handleGenerateBoleto = async () => {
    setLoading(true);
    try {
      if (amount <= 0) {
        setLoading(false);
        return;
      }
      const donationId = 'don-bol-' + crypto.randomUUID().slice(0, 8);
      const bolHash = 'BOL-' + crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 12);
      const newDonation: Donation = {
        id: donationId,
        donorCpf,
        amount,
        method: 'Boleto',
        status: 'Aguardando Pagamento',
        date: new Date().toISOString(),
        type: 'single',
        hash: bolHash,
        projectDestiny,
      };
      await createDonation(newDonation);
      setCurrentDonationId(donationId);
      setBoletoGenerated(true);

      // PDF Date calculation
      let count = 0;
      const dueDate = new Date();
      while (count < 3) {
        dueDate.setDate(dueDate.getDate() + 1);
        const day = dueDate.getDay();
        if (day !== 0 && day !== 6) {
          count++;
        }
      }

      const cleanCpf = donorCpf.replace(/\D/g, '');
      const donorObj = await getUserByCpf(cleanCpf);
      const dName = donorObj ? donorObj.name : 'Doador';

      // jsPDF premium generation with brand colors
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginLeft = 20;
      const marginRight = pageWidth - 20;
      const contentWidth = marginRight - marginLeft;
      let cursorY = 25;

      // 1. Brand Logo & Title Banner
      doc.setFillColor(219, 39, 119); // Brand Pink (#db2777)
      doc.rect(marginLeft, cursorY, contentWidth, 18, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('HOSPITAL DE AMOR', marginLeft + 6, cursorY + 9.5);
      
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text('GUIA DE DOAÇÃO VOLUNTÁRIA  |  HA-BANK (001-9)', marginLeft + 6, cursorY + 14.5);
      
      const lineDigitabel = `00191.00009 01234.567894 01000.123456 1 987600000${amount.toFixed(0).padStart(4, '0')}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(lineDigitabel, marginRight - 6, cursorY + 11, { align: 'right' });

      cursorY += 18;

      // Draw Field utility function with styled text and boxes
      const drawField = (label: string, value: string, x: number, y: number, w: number, h: number, align = 'left', highlight = false) => {
        if (highlight) {
          doc.setFillColor(252, 231, 243); // Light pink background
          doc.rect(x, y, w, h, 'F');
        }
        doc.setDrawColor(219, 39, 119); // Pink border color
        doc.setLineWidth(0.2);
        doc.rect(x, y, w, h);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(190, 24, 74); // Darker pink label
        doc.text(label, x + 2, y + 4);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 30, 30);
        if (align === 'right') {
          doc.text(value, x + w - 2, y + 9.5, { align: 'right' });
        } else {
          doc.text(value, x + 2, y + 9.5);
        }
      };

      // 2. Slip form fields
      drawField('Local de Pagamento', 'Qualquer banco ou internet banking até o vencimento', marginLeft, cursorY, contentWidth - 40, 12);
      drawField('Vencimento', dueDate.toLocaleDateString('pt-BR'), marginRight - 40, cursorY, 40, 12, 'right', true);

      cursorY += 12;
      drawField('Beneficiário', 'Fundação Pio XII - Hospital de Amor (CNPJ: 60.102.102/0001-10)', marginLeft, cursorY, contentWidth - 40, 12);
      drawField('Agência/Código Beneficiário', '1234-5 / 987654-3', marginRight - 40, cursorY, 40, 12, 'right');

      cursorY += 12;
      drawField('Data do Documento', new Date().toLocaleDateString('pt-BR'), marginLeft, cursorY, 30, 12);
      drawField('Número do Documento', 'HA-' + Math.floor(Math.random() * 1000000), marginLeft + 30, cursorY, 35, 12);
      drawField('Espécie Doc.', 'DM', marginLeft + 65, cursorY, 20, 12);
      drawField('Aceite', 'N', marginLeft + 85, cursorY, 15, 12);
      drawField('Valor do Documento', `R$ ${amount.toFixed(2)}`, marginRight - 40, cursorY, 40, 12, 'right', true);

      cursorY += 12;
      drawField('Uso do Banco', '', marginLeft, cursorY, 35, 12);
      drawField('Carteira', '17', marginLeft + 35, cursorY, 20, 12);
      drawField('Espécie', 'R$', marginLeft + 55, cursorY, 20, 12);
      drawField('Quantidade', '1', marginLeft + 75, cursorY, 25, 12);
      drawField('Nosso Número', '17/987654321-0', marginRight - 40, cursorY, 40, 12, 'right');

      cursorY += 12;
      // Instructions Block
      doc.setDrawColor(219, 39, 119);
      doc.setLineWidth(0.2);
      doc.rect(marginLeft, cursorY, contentWidth, 26);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(190, 24, 74);
      doc.text('Instruções (Todas as informações deste boleto são de exclusiva responsabilidade do beneficiário)', marginLeft + 2, cursorY + 4);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(60, 60, 60);
      doc.text('- Boleto bancário gerado para fins de doação voluntária ao Hospital de Amor.', marginLeft + 4, cursorY + 9.5);
      doc.text('- Agradecemos imensamente a sua contribuição para o tratamento de nossos pacientes.', marginLeft + 4, cursorY + 14.5);
      doc.text('- O boleto pode ser pago em qualquer lotérica ou internet banking.', marginLeft + 4, cursorY + 19.5);

      cursorY += 26;
      // Payor Block
      doc.rect(marginLeft, cursorY, contentWidth, 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(190, 24, 74);
      doc.text('Pagador', marginLeft + 2, cursorY + 4);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 30, 30);
      doc.text(`${dName} — CPF: ${donorCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`, marginLeft + 4, cursorY + 9);
      doc.text('Rua do Pagador, 123 — Cidade do Pagador/SP', marginLeft + 4, cursorY + 13.5);

      cursorY += 18;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(120, 120, 120);
      doc.text('Ficha de Compensação — Autenticação Mecânica', marginLeft, cursorY + 5);

      cursorY += 8;
      // Simulated Barcode (Alternating black and white bars with narrow and wide widths)
      const codePattern = [
        1, 1, 1, 1,
        2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2,
        1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1,
        2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2,
        1, 2, 1, 2, 2, 1, 1, 2, 1, 2, 2, 1, 1, 2, 1, 2,
        2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1,
        2, 1, 2, 2, 1, 1, 1, 2, 1, 2, 2, 1, 1, 1, 2, 1,
        2, 1, 1, 1
      ];
      
      doc.setFillColor(30, 30, 30);
      let barX = marginLeft + 2;
      for (let i = 0; i < codePattern.length; i++) {
        const isBlack = (i % 2 === 0);
        const isWide = (codePattern[i] === 2);
        const w = isWide ? 1.0 : 0.4;
        if (isBlack) {
          doc.rect(barX, cursorY, w, 14, 'F');
        }
        barX += w;
      }

      doc.save(`boleto_hospital_amor_R$${amount.toFixed(2)}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBoletoLine = () => {
    setCopiedBoletoLine(true);
    const line = `00191.00009 01234.567894 01000.123456 1 987600000${amount.toFixed(0).padStart(4, '0')}`;
    navigator.clipboard.writeText(line);
    setTimeout(() => setCopiedBoletoLine(false), 2000);
  };

  const handleConfirmSimulation = async () => {
    await onSuccess('Boleto', currentDonationId || undefined);
  };

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-4 animate-in fade-in">
      {!boletoGenerated ? (
        <div className="text-center py-6 space-y-3">
          <p className="text-xs text-zinc-550 leading-normal">
            Gere o Boleto Bancário personalizado de <strong>R$ {amount.toFixed(2)}</strong> com vencimento de 3 dias úteis.
          </p>
          <Button
            onClick={handleGenerateBoleto}
            disabled={loading || amount <= 0}
            className="bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 px-8 rounded-xl shadow-md text-xs w-full transition-all"
          >
            Gerar Boleto Bancário
          </Button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col items-center justify-center p-3 text-center space-y-1.5 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950">
            <CheckCircle2 className="w-8 h-8 text-green-650" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Boleto Emitido com Sucesso!</h4>
              <p className="text-[10px] text-zinc-450 dark:text-zinc-550 leading-relaxed">
                Vencimento em 3 dias úteis. O PDF estilizado seguindo o design do portal foi gerado e baixado.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Linha Digitável (Código de Barras)</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`00191.00009 01234.567894 01000.123456 1 987600000${amount.toFixed(0).padStart(4, '0')}`}
                className="h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-zinc-100/30 dark:bg-zinc-955/30 font-mono text-zinc-500 rounded-xl flex-1 select-all focus-visible:ring-brand-pink"
              />
              <Button
                onClick={handleCopyBoletoLine}
                variant="outline"
                className="h-10 w-10 shrink-0 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 flex items-center justify-center p-0"
              >
                {copiedBoletoLine ? <Check className="w-4 h-4 text-green-650" /> : <Copy className="w-4 h-4 text-zinc-550" />}
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex flex-col gap-2">
            <Button
              onClick={handleGenerateBoleto}
              variant="outline"
              className="w-full border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-zinc-500" />
              <span>Baixar Boleto Novamente</span>
            </Button>

            <Button
              onClick={handleConfirmSimulation}
              className="w-full bg-green-600 hover:bg-green-600/95 text-white font-bold h-11 rounded-xl shadow-md text-xs transition-all"
            >
              Simular Compensação do Boleto (Sucesso)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
