import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { createDonation, updateDonation } from '../../services/db';
import type { Donation } from '../../types';

interface PixPaymentPanelProps {
  amount: number;
  donorCpf: string;
  projectDestiny: string;
  onSuccess: (method: 'Pix', donationId?: string) => Promise<void>;
  loading: boolean;
  setLoading: (val: boolean) => void;
}

export default function PixPaymentPanel({
  amount,
  donorCpf,
  projectDestiny,
  onSuccess,
  loading,
  setLoading,
}: PixPaymentPanelProps) {
  const [pixGenerated, setPixGenerated] = useState(false);
  const [pixExpired, setPixExpired] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(300);
  const [currentDonationId, setCurrentDonationId] = useState<string | null>(null);
  const [copiedCopiaCola, setCopiedCopiaCola] = useState(false);
  const pixTimerRef = useRef<any | null>(null);

  useEffect(() => {
    if (pixGenerated && !pixExpired) {
      startPixTimer();
    } else {
      stopPixTimer();
    }
    return () => stopPixTimer();
  }, [pixGenerated, pixExpired]);

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

  const handleGeneratePix = async () => {
    setLoading(true);
    try {
      if (amount <= 0) {
        setLoading(false);
        return;
      }
      const donationId = 'don-pix-' + crypto.randomUUID().slice(0, 8);
      const e2eId = 'E2E-' + crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 16);
      const newDonation: Donation = {
        id: donationId,
        donorCpf,
        amount,
        method: 'Pix',
        status: 'Aguardando Pagamento',
        date: new Date().toISOString(),
        type: 'single',
        hash: e2eId,
        projectDestiny,
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

  const handleCopyCode = () => {
    setCopiedCopiaCola(true);
    const code = `00020126580014br.gov.bcb.pix0136ha-doacao-hospital-de-amor-34505204000053039865405${amount.toFixed(2)}5802BR5916Hospital de Amor6009Barretos62070503***6304abcd`;
    navigator.clipboard.writeText(code);
    setTimeout(() => setCopiedCopiaCola(false), 2000);
  };

  const handleConfirmSimulation = async () => {
    await onSuccess('Pix', currentDonationId || undefined);
  };

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-4">
      {!pixGenerated ? (
        <div className="text-center py-6 space-y-3">
          <p className="text-xs text-zinc-500 leading-normal">
            Clique no botão abaixo para gerar o QR Code de pagamento Pix de <strong>R$ {amount.toFixed(2)}</strong>.
          </p>
          <Button
            onClick={handleGeneratePix}
            disabled={loading || amount <= 0}
            className="bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 px-8 rounded-xl shadow-md text-xs w-full animate-in fade-in"
          >
            Gerar QR Code Pix
          </Button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm w-36 h-36 flex items-center justify-center relative">
              {pixExpired ? (
                <div className="absolute inset-0 bg-white/95 dark:bg-zinc-950/95 flex flex-col items-center justify-center p-2 text-center rounded-2xl">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mb-1" />
                  <span className="text-[10px] font-black text-zinc-850 dark:text-zinc-200 uppercase">QR Code Expirado</span>
                  <Button
                    variant="link"
                    onClick={handleGeneratePix}
                    className="text-primary text-[10px] font-bold p-0 h-auto mt-1"
                  >
                    Gerar Novo QR Code
                  </Button>
                </div>
              ) : null}
              <svg className="w-full h-full text-zinc-900" viewBox="0 0 100 100">
                <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="12" y="12" width="11" height="11" fill="currentColor" />
                <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="77" y="12" width="11" height="11" fill="currentColor" />
                <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="12" y="77" width="11" height="11" fill="currentColor" />
                <path
                  d="M40,10 h15 M40,20 h20 M50,40 h10 M70,70 h25 M80,80 h10 M40,80 h15 M90,40 h5"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="square"
                />
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
                value={`00020126580014br.gov.bcb.pix0136ha-doacao-hospital-de-amor-34505204000053039865405${amount.toFixed(2)}5802BR5916Hospital de Amor6009Barretos62070503***6304abcd`}
                className="h-10 text-xs border-zinc-200 dark:border-zinc-800 bg-zinc-100/30 dark:bg-zinc-950/30 font-mono text-zinc-500 rounded-xl flex-1 select-all focus-visible:ring-brand-pink"
              />
              <Button
                onClick={handleCopyCode}
                variant="outline"
                className="h-10 w-10 shrink-0 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-900/50 flex items-center justify-center p-0"
              >
                {copiedCopiaCola ? <Check className="w-4 h-4 text-green-650" /> : <Copy className="w-4 h-4 text-zinc-550" />}
              </Button>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex gap-2">
            <Button
              onClick={handleConfirmSimulation}
              disabled={pixExpired || loading}
              className="flex-1 bg-green-600 hover:bg-green-600/95 text-white font-bold h-11 rounded-xl shadow-md text-xs transition-all"
            >
              Simular Confirmação Bancária (Sucesso)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
