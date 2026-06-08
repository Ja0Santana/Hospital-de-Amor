import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { createDonation, addDonorPoints, saveSupportMessage, getUserByCpf, createRecurringSubscription } from '../../services/db';
import { X, CheckCircle2, AlertTriangle, CreditCard, QrCode, FileText, Copy, Check, Download, RefreshCw, AlertCircle } from 'lucide-react';
import type { Donation } from '../../types';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  donorCpf: string;
  onDonationSuccess: () => void;
}

const PRESET_VALUES = [20, 50, 100, 200];

export default function DonationModal({ isOpen, onClose, donorCpf, onDonationSuccess }: DonationModalProps) {
  const [method, setMethod] = useState<'pix' | 'card' | 'boleto'>('pix');
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const [supportMessage, setSupportMessage] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [projectDestiny, setProjectDestiny] = useState<string>('Geral');

  useEffect(() => {
    if (isOpen) {
      setMethod('pix');
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
      setCardRecurrence('single');
      setCardError('');
      setDownloadProgress(null);
      setSupportMessage('');
      setIsAuthorized(true);
      setProjectDestiny('Geral');
      
      startPixTimer();
    } else {
      stopPixTimer();
    }
    return () => stopPixTimer();
  }, [isOpen]);

  useEffect(() => {
    if (method === 'pix' && !pixExpired && isOpen) {
      startPixTimer();
    } else {
      stopPixTimer();
    }
  }, [method, pixExpired]);

  const startPixTimer = () => {
    stopPixTimer();
    setPixTimeLeft(300);
    setPixExpired(false);
    pixTimerRef.current = setInterval(() => {
      setPixTimeLeft((prev) => {
        if (prev <= 1) {
          setPixExpired(true);
          stopPixTimer();
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

  const getActiveAmount = () => {
    if (isCustom) {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) || parsed <= 0 ? 0 : parsed;
    }
    return amount;
  };

  const handleCopy = () => {
    setCopied(true);
    navigator.clipboard.writeText('00020126580014br.gov.bcb.pix0136ha-doacao-hospital-de-amor-3450520400005303986540550.005802BR5916Hospital de Amor6009Barretos62070503***6304abcd');
    setTimeout(() => setCopied(false), 2000);
  };

  const processSuccess = async (methodName: 'Pix' | 'Cartão de Crédito' | 'Boleto', recurrence: 'single' | 'recurring' = 'single') => {
    setLoading(true);
    const donationAmount = getActiveAmount();
    if (donationAmount <= 0) {
      setLoading(false);
      return;
    }

    try {
      const points = donationAmount * 10;
      const donationId = 'don-' + crypto.randomUUID().slice(0, 8);
      const newDonation: Donation = {
        id: donationId,
        donorCpf,
        amount: donationAmount,
        method: methodName,
        status: 'Confirmada',
        date: new Date().toISOString(),
        type: recurrence,
        hash: 'TX-' + crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 12),
        projectDestiny
      };

      await createDonation(newDonation);
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

  const simulateBoletoDownload = () => {
    if (downloadProgress !== null) return;
    setDownloadProgress(0);
    
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setDownloadProgress(null), 800);
          
          const textContent = `HOSPITAL DE AMOR\nComprovante de Emissão de Boleto Bancário\nDoador CPF: ${donorCpf}\nValor: R$ ${getActiveAmount().toFixed(2)}\nVencimento: 3 dias úteis\nLinha Digitável: 34191.79001 01043.513184 91020.150008 7 98760000005000\nAgradecemos sua contribuição!`;
          const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `boleto_hospital_amor_${getActiveAmount()}reais.txt`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          return 100;
        }
        return prev + 10;
      });
    }, 150);
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl flex flex-col max-h-[90vh]">
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
              <div className="grid grid-cols-4 gap-2">
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
              </div>
              <div className="pt-1">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsCustom(!isCustom)}
                  className="text-primary text-xs font-bold p-0 h-auto"
                >
                  {isCustom ? '← Escolher valores pré-definidos' : 'Ou doar outro valor customizado...'}
                </Button>
              </div>

              {isCustom && (
                <div className="relative mt-2">
                  <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-xs">R$</span>
                  <Input
                    type="number"
                    placeholder="Digite o valor"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
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
              <div className="grid grid-cols-3 gap-2">
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
              </div>
            </div>

            {method === 'pix' && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm w-36 h-36 flex items-center justify-center relative">
                    {pixExpired ? (
                      <div className="absolute inset-0 bg-white/90 dark:bg-zinc-950/90 flex flex-col items-center justify-center p-2 text-center">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mb-1" />
                        <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase">QR Code Expirado</span>
                        <Button variant="link" onClick={startPixTimer} className="text-primary text-[10px] font-bold p-0 h-auto mt-1">
                          Gerar Novo QR Code
                        </Button>
                      </div>
                    ) : null}
                    {/* SVG simplificado de QR code */}
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
                      value="00020126580014br.gov.bcb.pix0136ha-doacao-hospital-de-amor-345052..."
                      className="h-10 text-xs border-zinc-200 bg-zinc-100/30 font-mono text-zinc-500 rounded-xl flex-1 select-all"
                    />
                    <Button onClick={handleCopy} variant="outline" className="h-10 w-10 shrink-0 border-zinc-200 rounded-xl hover:bg-zinc-200/50 flex items-center justify-center p-0">
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-zinc-500" />}
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
                <div className="flex flex-col items-center justify-center p-3 text-center space-y-1.5 border border-dashed border-zinc-200 rounded-xl bg-white dark:bg-zinc-950">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Boleto Bancário Hospital de Amor</h4>
                    <p className="text-[10px] text-zinc-400">Vencimento: 3 dias úteis. Compensação em até 24h.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Linha Digitável (Código de Barras)</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value="34191.79001 01043.513184 91020.150008 7 98760000005000"
                      className="h-10 text-xs border-zinc-200 bg-zinc-100/30 font-mono text-zinc-500 rounded-xl flex-1 select-all"
                    />
                    <Button onClick={handleCopy} variant="outline" className="h-10 w-10 shrink-0 border-zinc-200 rounded-xl hover:bg-zinc-200/50 flex items-center justify-center p-0">
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                    </Button>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex flex-col gap-2">
                  <Button
                    onClick={simulateBoletoDownload}
                    variant="outline"
                    className="w-full border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-2 relative overflow-hidden"
                  >
                    {downloadProgress !== null ? (
                      <>
                        <div className="absolute inset-y-0 left-0 bg-brand-pink/10 transition-all duration-150" style={{ width: `${downloadProgress}%` }} />
                        <RefreshCw className="w-4 h-4 animate-spin text-brand-pink" />
                        <span>Baixando Boleto ({downloadProgress}%)</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-zinc-500" />
                        <span>Baixar Boleto em PDF</span>
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => processSuccess('Boleto')}
                    className="w-full bg-green-600 hover:bg-green-600/95 text-white font-bold h-11 rounded-xl shadow-md text-xs"
                  >
                    Simular Compensação do Boleto (Sucesso)
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
