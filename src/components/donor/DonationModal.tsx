import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { createDonation, updateDonation, addDonorPoints, saveSupportMessage, getUserByCpf, createRecurringSubscription } from '../../services/db';
import { X, CheckCircle2, AlertTriangle, CreditCard, QrCode, FileText, Copy, Check, Download, AlertCircle, Coins } from 'lucide-react';
import type { Donation } from '../../types';
import jsPDF from 'jspdf';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  donorCpf: string;
  onDonationSuccess: () => void;
}

const PRESET_VALUES = [20, 50, 100, 200];

const CRYPTO_WALLETS = {
  btc: 'bc1qxy2kg3k4g7kkqfzv7lmv400xp3v22tt965ff0',
  eth: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  usdt: 'TX5b1A1zP1eP5QGefi2DMPTfTL5SLmv7Div'
};

export default function DonationModal({ isOpen, onClose, donorCpf, onDonationSuccess }: DonationModalProps) {
  const [method, setMethod] = useState<'pix' | 'card' | 'boleto' | 'crypto'>('pix');
  const [selectedCrypto, setSelectedCrypto] = useState<'btc' | 'eth' | 'usdt'>('btc');
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ amount: number; points: number; method: string } | null>(null);
  
  const [pixTimeLeft, setPixTimeLeft] = useState(300);
  const [pixExpired, setPixExpired] = useState(false);
  const pixTimerRef = useRef<any | null>(null);

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardRecurrence, setCardRecurrence] = useState<'single' | 'recurring'>('single');
  const [cardError, setCardError] = useState('');

  const [supportMessage, setSupportMessage] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [projectDestiny, setProjectDestiny] = useState<string>('Geral');

  const [currentDonationId, setCurrentDonationId] = useState<string | null>(null);
  const [pixGenerated, setPixGenerated] = useState(false);
  const [boletoGenerated, setBoletoGenerated] = useState(false);
  
  const [btcRate, setBtcRate] = useState(375240);
  const [ethRate, setEthRate] = useState(19820);
  const [usdtRate, setUsdtRate] = useState(5.45);
  const [cryptoTimeLeft, setCryptoTimeLeft] = useState(900);
  const cryptoTimerRef = useRef<any | null>(null);

  const [copiedCopiaCola, setCopiedCopiaCola] = useState(false);
  const [copiedBoletoLine, setCopiedBoletoLine] = useState(false);
  const [copiedCryptoWallet, setCopiedCryptoWallet] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      setMethod('pix');
      setSelectedCrypto('btc');
      setAmount(50);
      setIsCustom(false);
      setCustomAmount('');
      setSuccessData(null);
      setPixExpired(false);
      setPixTimeLeft(300);
      setCardNumber('');
      setCardName('');
      setCardExpiry('');
      setCardCvv('');
      setCardError('');
      setCardRecurrence('single');
      setSupportMessage('');
      setIsAuthorized(true);
      setProjectDestiny('Geral');
      setCurrentDonationId(null);
      setPixGenerated(false);
      setBoletoGenerated(false);
      setCryptoTimeLeft(900);
      setCopiedCopiaCola(false);
      setCopiedBoletoLine(false);
      setCopiedCryptoWallet(false);
      
      window.addEventListener('keydown', handleKeyDown);
    } else {
      stopPixTimer();
      stopCryptoTimer();
    }
    return () => {
      stopPixTimer();
      stopCryptoTimer();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (method === 'pix' && pixGenerated && !pixExpired && isOpen) {
      startPixTimer();
    } else {
      stopPixTimer();
    }
  }, [method, pixGenerated, pixExpired]);

  useEffect(() => {
    if (method === 'crypto' && isOpen) {
      startCryptoTimer();
    } else {
      stopCryptoTimer();
    }
  }, [method, isOpen]);

  const startPixTimer = () => {
    stopPixTimer();
    setPixTimeLeft(300);
    setPixExpired(false);
    pixTimerRef.current = setInterval(() => {
      setPixTimeLeft((prev) => {
        if (prev <= 1) {
          setPixExpired(true);
          stopPixTimer();
          if (currentDonationId) {
            updateDonation(currentDonationId, { status: 'Expirado' }).catch(console.error);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopPixTimer = () => {
    if (pixTimerRef.current) {
      clearInterval(pixTimerRef.current);
      pixTimerRef.current = null;
    }
  };

  const updateCryptoRates = () => {
    setBtcRate(375000 + Math.random() * 800 - 400);
    setEthRate(19500 + Math.random() * 100 - 50);
    setUsdtRate(5.45 + Math.random() * 0.1 - 0.05);
  };

  const startCryptoTimer = () => {
    stopCryptoTimer();
    setCryptoTimeLeft(900);
    cryptoTimerRef.current = setInterval(() => {
      setCryptoTimeLeft((prev) => {
        if (prev <= 1) {
          updateCryptoRates();
          return 900;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCryptoTimer = () => {
    if (cryptoTimerRef.current) {
      clearInterval(cryptoTimerRef.current);
      cryptoTimerRef.current = null;
    }
  };

  const handleCustomAmountChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) {
      setCustomAmount('');
      return;
    }
    const cents = parseInt(digits, 10);
    const formatted = (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    setCustomAmount(formatted);
  };

  const getActiveAmount = () => {
    if (isCustom) {
      const cleanVal = customAmount.replace(/\./g, '').replace(',', '.');
      const parsed = parseFloat(cleanVal);
      return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
    }
    return amount;
  };



  const processSuccess = async (methodName: 'Pix' | 'Cartão de Crédito' | 'Boleto' | 'Criptomoedas', recurrence: 'single' | 'recurring' = 'single', hashTx?: string) => {
    setLoading(true);
    const donationAmount = getActiveAmount();
    if (donationAmount <= 0) {
      setLoading(false);
      return;
    }

    try {
      const points = donationAmount * 10;
      
      if (currentDonationId && (methodName === 'Pix' || methodName === 'Boleto')) {
        await updateDonation(currentDonationId, {
          status: 'Confirmada',
          date: new Date().toISOString()
        });
      } else {
        const donationId = 'don-' + crypto.randomUUID().slice(0, 8);
        const newDonation: Donation = {
          id: donationId,
          donorCpf,
          amount: donationAmount,
          method: methodName,
          status: 'Confirmada',
          date: new Date().toISOString(),
          type: recurrence,
          hash: hashTx || 'TX-' + crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 12),
          projectDestiny
        };
        await createDonation(newDonation);
      }

      await addDonorPoints(donorCpf, points);

      if (methodName === 'Cartão de Crédito' && recurrence === 'recurring') {
        const last4 = cardNumber.replace(/\D/g, '').slice(-4);
        const cardMaskedNumber = `•••• •••• •••• ${last4 || '1234'}`;
        await createRecurringSubscription({
          id: 'sub-' + crypto.randomUUID().slice(0, 8),
          donorCpf,
          amount: donationAmount,
          projectDestiny,
          status: 'Ativa',
          cardMaskedNumber,
          createdAt: new Date().toISOString()
        });
      }

      if (supportMessage.trim()) {
        const cleanCpf = donorCpf.replace(/\D/g, "");
        const donor = await getUserByCpf(cleanCpf);
        const donorName = donor ? donor.name.split(' ')[0] : 'Doador';
        await saveSupportMessage({
          id: crypto.randomUUID(),
          donorName,
          message: supportMessage.trim(),
          date: new Date().toISOString(),
          isAuthorized
        });
      }
      
      setSuccessData({
        amount: donationAmount,
        points,
        method: methodName
      });
      onDonationSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePix = async () => {
    setLoading(true);
    try {
      const donationAmount = getActiveAmount();
      if (donationAmount <= 0) {
        setLoading(false);
        return;
      }
      const donationId = 'don-pix-' + crypto.randomUUID().slice(0, 8);
      const e2eId = 'E2E-' + crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 16);
      const newDonation: Donation = {
        id: donationId,
        donorCpf,
        amount: donationAmount,
        method: 'Pix',
        status: 'Aguardando Pagamento',
        date: new Date().toISOString(),
        type: 'single',
        hash: e2eId,
        projectDestiny
      };
      await createDonation(newDonation);
      setCurrentDonationId(donationId);
      setPixGenerated(true);
      setPixExpired(false);
      setPixTimeLeft(300);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBoleto = async () => {
    setLoading(true);
    try {
      const donationAmount = getActiveAmount();
      if (donationAmount <= 0) {
        setLoading(false);
        return;
      }
      const donationId = 'don-bol-' + crypto.randomUUID().slice(0, 8);
      const bolHash = 'BOL-' + crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 12);
      const newDonation: Donation = {
        id: donationId,
        donorCpf,
        amount: donationAmount,
        method: 'Boleto',
        status: 'Aguardando Pagamento',
        date: new Date().toISOString(),
        type: 'single',
        hash: bolHash,
        projectDestiny
      };
      await createDonation(newDonation);
      setCurrentDonationId(donationId);
      setBoletoGenerated(true);

      let count = 0;
      const dueDate = new Date();
      while (count < 3) {
        dueDate.setDate(dueDate.getDate() + 1);
        const day = dueDate.getDay();
        if (day !== 0 && day !== 6) {
          count++;
        }
      }

      const cleanCpf = donorCpf.replace(/\D/g, "");
      const donorObj = await getUserByCpf(cleanCpf);
      const dName = donorObj ? donorObj.name : 'Doador';

      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginLeft = 20;
      const marginRight = pageWidth - 20;
      const contentWidth = marginRight - marginLeft;
      let cursorY = 20;

      doc.setFillColor(240, 240, 240);
      doc.rect(marginLeft, cursorY, contentWidth, 15, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text('HA-BANK  |  001-9', marginLeft + 5, cursorY + 9.5);
      
      doc.setFontSize(8);
      const lineDigitabel = `00191.00009 01234.567894 01000.123456 1 987600000${donationAmount.toFixed(0).padStart(4, '0')}`;
      doc.text(lineDigitabel, marginRight - 5, cursorY + 9.5, { align: 'right' });

      cursorY += 15;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(marginLeft, cursorY, marginRight, cursorY);

      const drawField = (label: string, value: string, x: number, y: number, w: number, h: number, align = 'left') => {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        doc.rect(x, y, w, h);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text(label, x + 2, y + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 30, 30);
        if (align === 'right') {
          doc.text(value, x + w - 2, y + 10, { align: 'right' });
        } else {
          doc.text(value, x + 2, y + 10);
        }
      };

      drawField('Local de Pagamento', 'Qualquer banco até o vencimento', marginLeft, cursorY, contentWidth - 40, 13);
      drawField('Vencimento', dueDate.toLocaleDateString('pt-BR'), marginRight - 40, cursorY, 40, 13, 'right');

      cursorY += 13;
      drawField('Beneficiário', 'Fundação Pio XII - Hospital de Amor (CNPJ: 60.102.102/0001-10)', marginLeft, cursorY, contentWidth - 40, 13);
      drawField('Agência/Código Beneficiário', '1234-5 / 987654-3', marginRight - 40, cursorY, 40, 13, 'right');

      cursorY += 13;
      drawField('Data do Documento', new Date().toLocaleDateString('pt-BR'), marginLeft, cursorY, 30, 13);
      drawField('Número do Documento', 'HA-' + Math.floor(Math.random() * 1000000), marginLeft + 30, cursorY, 35, 13);
      drawField('Espécie Doc.', 'DM', marginLeft + 65, cursorY, 20, 13);
      drawField('Aceite', 'N', marginLeft + 85, cursorY, 15, 13);
      drawField('Valor do Documento', `R$ ${donationAmount.toFixed(2)}`, marginRight - 40, cursorY, 40, 13, 'right');

      cursorY += 13;
      drawField('Uso do Banco', '', marginLeft, cursorY, 35, 13);
      drawField('Carteira', '17', marginLeft + 35, cursorY, 20, 13);
      drawField('Espécie', 'R$', marginLeft + 55, cursorY, 20, 13);
      drawField('Quantidade', '1', marginLeft + 75, cursorY, 25, 13);
      drawField('Nosso Número', '17/987654321-0', marginRight - 40, cursorY, 40, 13, 'right');

      cursorY += 13;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(marginLeft, cursorY, contentWidth, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text('Instruções (Todas as informações deste boleto são de exclusiva responsabilidade do beneficiário)', marginLeft + 2, cursorY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.text('- Boleto bancário gerado para fins de doação voluntária ao Hospital de Amor.', marginLeft + 4, cursorY + 12);
      doc.text('- Agradecemos imensamente a sua contribuição para o tratamento de nossos pacientes.', marginLeft + 4, cursorY + 18);
      doc.text('- O boleto pode ser pago em qualquer lotérica ou internet banking.', marginLeft + 4, cursorY + 24);

      cursorY += 30;
      doc.rect(marginLeft, cursorY, contentWidth, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text('Pagador', marginLeft + 2, cursorY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text(`${dName} — CPF: ${donorCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}`, marginLeft + 4, cursorY + 10);
      doc.text('Rua do Pagador, 123 — Cidade do Pagador/SP', marginLeft + 4, cursorY + 15);

      cursorY += 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(120, 120, 120);
      doc.text('Ficha de Compensação — Autenticação Mecânica', marginLeft, cursorY + 5);

      cursorY += 8;
      doc.setFillColor(0, 0, 0);
      let barX = marginLeft + 10;
      const barWidths = [1, 2, 0.5, 3, 1, 0.5, 2, 1, 3, 0.5, 1, 2, 0.5, 3, 1, 0.5, 2, 1, 3, 0.5, 1, 2, 0.5, 3, 1, 0.5, 2, 1, 3, 0.5];
      for (let i = 0; i < 4; i++) {
        barWidths.forEach((w) => {
          doc.rect(barX, cursorY, w, 12, 'F');
          barX += w + 0.8;
        });
        barX += 2;
      }

      doc.save(`boleto_hospital_amor_R$${donationAmount.toFixed(2)}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardDonation = (simulateFail = false) => {
    setCardError('');
    const donationAmount = getActiveAmount();
    if (donationAmount <= 0) {
      setCardError('Por favor, informe um valor válido para doação.');
      return;
    }

    if (!cardNumber.replace(/\D/g, '') || cardNumber.replace(/\D/g, '').length < 16) {
      setCardError('Por favor, informe um número de cartão válido.');
      return;
    }

    if (!cardName.trim()) {
      setCardError('Por favor, informe o nome impresso no cartão.');
      return;
    }

    if (!cardExpiry || !cardExpiry.includes('/')) {
      setCardError('Por favor, informe a data de validade (MM/AA).');
      return;
    }

    if (!cardCvv || cardCvv.length < 3) {
      setCardError('Por favor, informe o CVV.');
      return;
    }

    if (simulateFail) {
      setCardError('Erro na transação: Saldo insuficiente ou limite excedido no cartão de crédito.');
      return;
    }

    processSuccess('Cartão de Crédito', cardRecurrence);
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
  };

  const formatCardExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + '/' + digits.slice(2, 4);
  };

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-lg border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
          <div>
            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Apoie o Hospital de Amor</h2>
            <p className="text-[10px] text-zinc-400">Escolha o valor e o método de contribuição seguro</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50">
            <X className="w-4 h-4 text-zinc-500" />
          </Button>
        </div>

        {successData ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-5 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Doação Confirmada!</h3>
              <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                Seu pagamento simulado de <strong>R$ {successData.amount.toFixed(2)}</strong> via {successData.method} foi processado com sucesso.
              </p>
            </div>
            <div className="p-4 bg-brand-pink/5 border border-brand-pink/20 rounded-2xl max-w-xs w-full text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-pink block">Pontos Acumulados</span>
              <span className="text-2xl font-black text-brand-pink">+{successData.points} pts</span>
              <span className="text-[9px] text-zinc-400 block mt-1">Parabéns! Você subiu na pontuação de doador.</span>
            </div>
            <Button onClick={onClose} className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-8 rounded-2xl shadow-lg shadow-primary/25 text-xs">
              Concluir
            </Button>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 text-left flex-1">
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-zinc-650 dark:text-zinc-350">Selecione o valor da doação</Label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_VALUES.map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant={!isCustom && amount === val ? 'default' : 'outline'}
                    onClick={() => {
                      setIsCustom(false);
                      setAmount(val);
                    }}
                    className={`h-10 text-xs font-bold rounded-xl transition-all ${
                      !isCustom && amount === val 
                        ? 'bg-brand-pink hover:bg-brand-pink/95 text-white shadow-md shadow-brand-pink/10' 
                        : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    R$ {val}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={isCustom ? 'default' : 'outline'}
                  onClick={() => setIsCustom(true)}
                  className={`h-10 text-xs font-bold rounded-xl transition-all ${
                    isCustom
                      ? 'bg-brand-pink hover:bg-brand-pink/95 text-white shadow-md shadow-brand-pink/10'
                      : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  Outro
                </Button>
              </div>

              {isCustom && (
                <div className="relative mt-2">
                  <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-xs">R$</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="pl-8 h-10 border-zinc-200 focus-visible:ring-brand-pink rounded-xl text-xs"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDestiny" className="text-xs font-bold text-zinc-650 dark:text-zinc-350">Destinação dos Recursos</Label>
              <select
                id="projectDestiny"
                value={projectDestiny}
                onChange={(e) => setProjectDestiny(e.target.value)}
                className="w-full h-10 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-xs px-3 text-zinc-900 dark:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
              >
                <option value="Geral">Geral (Onde a necessidade for maior)</option>
                <option value="Ala Infantil">Ala Infantil</option>
                <option value="Prevenção Móvel">Prevenção Móvel</option>
                <option value="Pesquisa Científica">Pesquisa Científica</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportMsg" className="text-xs font-bold text-zinc-650 dark:text-zinc-350 flex justify-between items-center">
                <span>Mensagem de Apoio (Opcional)</span>
                <span className="text-[10px] text-zinc-400 font-mono">{supportMessage.length}/300</span>
              </Label>
              <textarea
                id="supportMsg"
                placeholder="Deixe uma mensagem de incentivo para os pacientes em tratamento..."
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value.slice(0, 300))}
                maxLength={300}
                className="w-full min-h-[64px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded-xl text-xs resize-none p-2.5 text-zinc-900 dark:text-zinc-50 leading-normal"
              />
              <div className="flex gap-2 items-start pt-0.5">
                <Checkbox
                  id="authMsg"
                  checked={isAuthorized}
                  onCheckedChange={(checked) => setIsAuthorized(checked === true)}
                  className="mt-0.5 border-zinc-300 focus-visible:ring-brand-pink"
                />
                <Label htmlFor="authMsg" className="text-[10px] text-zinc-500 leading-normal cursor-pointer select-none">
                  Autorizo a exibição do meu primeiro nome junto à mensagem no painel do hospital.
                </Label>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold text-zinc-650 dark:text-zinc-350">Método de Pagamento</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  type="button"
                  variant={method === 'pix' ? 'default' : 'outline'}
                  onClick={() => setMethod('pix')}
                  className={`h-11 rounded-xl text-xs font-bold gap-2 ${method === 'pix' ? 'bg-primary text-white shadow-sm' : 'border-zinc-200 text-zinc-700'}`}
                >
                  <QrCode className="w-4 h-4 shrink-0" />
                  Pix
                </Button>
                <Button
                  type="button"
                  variant={method === 'card' ? 'default' : 'outline'}
                  onClick={() => setMethod('card')}
                  className={`h-11 rounded-xl text-xs font-bold gap-2 ${method === 'card' ? 'bg-primary text-white shadow-sm' : 'border-zinc-200 text-zinc-700'}`}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  Cartão
                </Button>
                <Button
                  type="button"
                  variant={method === 'boleto' ? 'default' : 'outline'}
                  onClick={() => setMethod('boleto')}
                  className={`h-11 rounded-xl text-xs font-bold gap-2 ${method === 'boleto' ? 'bg-primary text-white shadow-sm' : 'border-zinc-200 text-zinc-700'}`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  Boleto
                </Button>
                <Button
                  type="button"
                  variant={method === 'crypto' ? 'default' : 'outline'}
                  onClick={() => setMethod('crypto')}
                  className={`h-11 rounded-xl text-xs font-bold gap-2 ${method === 'crypto' ? 'bg-primary text-white shadow-sm' : 'border-zinc-200 text-zinc-700'}`}
                >
                  <Coins className="w-4 h-4 shrink-0" />
                  Cripto
                </Button>
              </div>
            </div>

            {method === 'pix' && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-4">
                {!pixGenerated ? (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-xs text-zinc-500 leading-normal">
                      Clique no botão abaixo para gerar o QR Code de pagamento Pix de <strong>R$ {getActiveAmount().toFixed(2)}</strong>.
                    </p>
                    <Button
                      onClick={handleGeneratePix}
                      disabled={loading || getActiveAmount() <= 0}
                      className="bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 px-8 rounded-xl shadow-md text-xs w-full"
                    >
                      Gerar QR Code Pix
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm w-36 h-36 flex items-center justify-center relative">
                        {pixExpired ? (
                          <div className="absolute inset-0 bg-white/95 dark:bg-zinc-950/95 flex flex-col items-center justify-center p-2 text-center rounded-2xl">
                            <AlertTriangle className="w-8 h-8 text-amber-500 mb-1" />
                            <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase">QR Code Expirado</span>
                            <Button variant="link" onClick={handleGeneratePix} className="text-primary text-[10px] font-bold p-0 h-auto mt-1">
                              Gerar Novo QR Code
                            </Button>
                          </div>
                        ) : null}
                        <svg className="w-full h-full text-zinc-900 dark:text-white" viewBox="0 0 100 100">
                          <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                          <rect x="12" y="12" width="11" height="11" fill="currentColor" />
                          <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                          <rect x="77" y="12" width="11" height="11" fill="currentColor" />
                          <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                          <rect x="12" y="77" width="11" height="11" fill="currentColor" />
                          <path d="M40,10 h15 M40,20 h20 M50,40 h10 M70,70 h25 M80,80 h10 M40,80 h15 M90,40 h5" stroke="currentColor" strokeWidth="6" strokeLinecap="square" />
                        </svg>
                      </div>
                      
                      {!pixExpired && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">O QR Code expira em</p>
                          <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 font-mono">
                            {Math.floor(pixTimeLeft / 60)}:{(pixTimeLeft % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Chave Pix (Copia e Cola)</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={`00020126580014br.gov.bcb.pix0136ha-doacao-hospital-de-amor-34505204000053039865405${getActiveAmount().toFixed(2)}5802BR5916Hospital de Amor6009Barretos62070503***6304abcd`}
                          className="h-10 text-xs border-zinc-200 bg-zinc-100/30 font-mono text-zinc-500 rounded-xl flex-1 select-all"
                        />
                        <Button 
                          onClick={() => {
                            setCopiedCopiaCola(true);
                            navigator.clipboard.writeText(`00020126580014br.gov.bcb.pix0136ha-doacao-hospital-de-amor-34505204000053039865405${getActiveAmount().toFixed(2)}5802BR5916Hospital de Amor6009Barretos62070503***6304abcd`);
                            setTimeout(() => setCopiedCopiaCola(false), 2000);
                          }} 
                          variant="outline" 
                          className="h-10 w-10 shrink-0 border-zinc-200 rounded-xl hover:bg-zinc-200/50 flex items-center justify-center p-0"
                        >
                          {copiedCopiaCola ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex gap-2">
                      <Button
                        onClick={() => processSuccess('Pix')}
                        disabled={pixExpired || loading}
                        className="flex-1 bg-green-600 hover:bg-green-600/95 text-white font-bold h-11 rounded-xl shadow-md text-xs"
                      >
                        Simular Confirmação Bancária (Sucesso)
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {method === 'card' && (
              <div className="space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); handleCardDonation(); }} className="space-y-4">
                  {cardError && (
                    <div className="p-3 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{cardError}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cardNumber" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Número do Cartão</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        className="h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cardName" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nome Impresso no Cartão</Label>
                      <Input
                        id="cardName"
                        type="text"
                        placeholder="NOME COMPLETO"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        className="h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="cardExpiry" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Validade</Label>
                        <Input
                          id="cardExpiry"
                          type="text"
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                          maxLength={5}
                          className="h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs text-center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cardCvv" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">CVV</Label>
                        <Input
                          id="cardCvv"
                          type="text"
                          placeholder="000"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          maxLength={4}
                          className="h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs text-center"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Recorrência da Doação</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={cardRecurrence === 'single' ? 'default' : 'outline'}
                          onClick={() => setCardRecurrence('single')}
                          className={`flex-1 h-9 rounded-xl text-xs font-bold ${
                            cardRecurrence === 'single'
                              ? 'bg-primary text-white shadow-sm'
                              : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          Única
                        </Button>
                        <Button
                          type="button"
                          variant={cardRecurrence === 'recurring' ? 'default' : 'outline'}
                          onClick={() => setCardRecurrence('recurring')}
                          className={`flex-1 h-9 rounded-xl text-xs font-bold ${
                            cardRecurrence === 'recurring'
                              ? 'bg-primary text-white shadow-sm'
                              : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          Mensal (Recorrente)
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex flex-col gap-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 rounded-xl shadow-md text-xs w-full"
                    >
                      {loading ? 'Processando...' : 'Efetuar Doação (Simular Sucesso)'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleCardDonation(true)}
                      className="text-red-500 hover:bg-red-500/10 hover:text-red-600 font-bold h-10 rounded-xl text-xs w-full"
                    >
                      Simular Erro de Transação (Saldo Insuficiente)
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {method === 'boleto' && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-4">
                {!boletoGenerated ? (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-xs text-zinc-500 leading-normal">
                      Gere o Boleto Bancário fictício de <strong>R$ {getActiveAmount().toFixed(2)}</strong> com vencimento de 3 dias úteis.
                    </p>
                    <Button
                      onClick={handleGenerateBoleto}
                      disabled={loading || getActiveAmount() <= 0}
                      className="bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 px-8 rounded-xl shadow-md text-xs w-full"
                    >
                      Gerar Boleto Bancário
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center p-3 text-center space-y-1.5 border border-dashed border-zinc-200 rounded-xl bg-white dark:bg-zinc-950">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Boleto Emitido e Enviado por E-mail!</h4>
                        <p className="text-[10px] text-zinc-400">Vencimento em 3 dias úteis. O PDF foi baixado no seu navegador.</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Linha Digitável (Código de Barras)</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={`00191.00009 01234.567894 01000.123456 1 987600000${getActiveAmount().toFixed(0).padStart(4, '0')}`}
                          className="h-10 text-xs border-zinc-200 bg-zinc-100/30 font-mono text-zinc-500 rounded-xl flex-1 select-all"
                        />
                        <Button 
                          onClick={() => {
                            setCopiedBoletoLine(true);
                            navigator.clipboard.writeText(`00191.00009 01234.567894 01000.123456 1 987600000${getActiveAmount().toFixed(0).padStart(4, '0')}`);
                            setTimeout(() => setCopiedBoletoLine(false), 2000);
                          }} 
                          variant="outline" 
                          className="h-10 w-10 shrink-0 border-zinc-200 rounded-xl hover:bg-zinc-200/50 flex items-center justify-center p-0"
                        >
                          {copiedBoletoLine ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex flex-col gap-2">
                      <Button
                        onClick={handleGenerateBoleto}
                        variant="outline"
                        className="w-full border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4 text-zinc-500" />
                        <span>Baixar Boleto Novamente</span>
                      </Button>

                      <Button
                        onClick={() => processSuccess('Boleto')}
                        className="w-full bg-green-600 hover:bg-green-600/95 text-white font-bold h-11 rounded-xl shadow-md text-xs"
                      >
                        Simular Compensação do Boleto (Sucesso)
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {method === 'crypto' && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Selecione a Criptomoeda</Label>
                  <select
                    value={selectedCrypto}
                    onChange={(e) => setSelectedCrypto(e.target.value as 'btc' | 'eth' | 'usdt')}
                    className="w-full h-10 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-xs px-3 text-zinc-900 dark:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                  >
                    <option value="btc">Bitcoin (BTC)</option>
                    <option value="eth">Ethereum (ETH)</option>
                    <option value="usdt">Tether (USDT TRC20)</option>
                  </select>
                </div>

                <div className="p-3 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-bold uppercase">Valor a Transferir</span>
                    <span className="text-sm font-black text-zinc-800 dark:text-zinc-100 font-mono">
                      {selectedCrypto === 'btc' && `${(getActiveAmount() / btcRate).toFixed(8)} BTC`}
                      {selectedCrypto === 'eth' && `${(getActiveAmount() / ethRate).toFixed(6)} ETH`}
                      {selectedCrypto === 'usdt' && `${(getActiveAmount() / usdtRate).toFixed(2)} USDT`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block font-bold uppercase">Rede Recomendada</span>
                    <span className="text-xs font-black text-brand-pink uppercase tracking-wide">
                      {selectedCrypto === 'btc' && 'Rede Bitcoin'}
                      {selectedCrypto === 'eth' && 'Rede Ethereum ERC-20'}
                      {selectedCrypto === 'usdt' && 'Rede Tron TRC-20'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center text-center space-y-2 pt-1">
                  <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm w-36 h-36 flex items-center justify-center relative">
                    <svg className="w-full h-full text-zinc-900" viewBox="0 0 100 100">
                      <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="12" y="12" width="11" height="11" fill="currentColor" />
                      <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="77" y="12" width="11" height="11" fill="currentColor" />
                      <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="12" y="77" width="11" height="11" fill="currentColor" />
                      <path d="M40,10 h15 M40,20 h20 M50,40 h10 M70,70 h25 M80,80 h10 M40,80 h15 M90,40 h5" stroke="currentColor" strokeWidth="6" strokeLinecap="square" />
                    </svg>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Garantia de Cotação</span>
                    <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 font-mono">
                      Cotação expira em {Math.floor(cryptoTimeLeft / 60)}:{(cryptoTimeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Endereço da Carteira ({selectedCrypto.toUpperCase()})</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={CRYPTO_WALLETS[selectedCrypto]}
                      className="h-10 text-xs border-zinc-200 bg-zinc-100/30 font-mono text-zinc-500 rounded-xl flex-1 select-all"
                    />
                    <Button 
                      onClick={() => {
                        setCopiedCryptoWallet(true);
                        navigator.clipboard.writeText(CRYPTO_WALLETS[selectedCrypto]);
                        setTimeout(() => setCopiedCryptoWallet(false), 2000);
                      }} 
                      variant="outline" 
                      className="h-10 w-10 shrink-0 border-zinc-200 rounded-xl hover:bg-zinc-200/50 flex items-center justify-center p-0"
                    >
                      {copiedCryptoWallet ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                    </Button>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex flex-col gap-2">
                  <span className="text-[9px] text-zinc-450 dark:text-zinc-550 leading-normal text-center">
                    Atenção: envie apenas {selectedCrypto.toUpperCase()} para o endereço acima utilizando a rede indicada. O envio de outro ativo resultará em perda permanente.
                  </span>
                  <Button
                    onClick={() => {
                      const randHash = 'TX-' + crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 24);
                      processSuccess('Criptomoedas', 'single', randHash);
                    }}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-600/95 text-white font-bold h-11 rounded-xl shadow-md text-xs mt-1"
                  >
                    Simular Confirmação Blockchain (Sucesso)
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
