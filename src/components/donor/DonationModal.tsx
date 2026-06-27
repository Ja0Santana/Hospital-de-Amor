import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { Input } from '../ui/Input';
import { X } from 'lucide-react';
import type { Donation } from '../../types';
import { 
  createDonation, 
  updateDonation, 
  addDonorPoints, 
  saveSupportMessage, 
  getUserByCpf, 
  createRecurringSubscription, 
  getDonationsByCpf 
} from '../../services/db';

import DonationSuccessPanel from './DonationSuccessPanel';
import PixPaymentPanel from './PixPaymentPanel';
import CardPaymentForm from './CardPaymentForm';
import BoletoPaymentPanel from './BoletoPaymentPanel';
import CryptoPaymentPanel from './CryptoPaymentPanel';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  donorCpf: string;
  onDonationSuccess: () => void;
}

const PRESET_VALUES = [20, 50, 100, 200];

export default function DonationModal({ 
  isOpen, 
  onClose, 
  donorCpf, 
  onDonationSuccess 
}: DonationModalProps) {
  const [method, setMethod] = useState<'pix' | 'card' | 'boleto' | 'crypto'>('pix');
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ amount: number; points: number; method: string } | null>(null);

  const [supportMessage, setSupportMessage] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [projectDestiny, setProjectDestiny] = useState<string>('Geral');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      setMethod('pix');
      setAmount(50);
      setIsCustom(false);
      setCustomAmount('');
      setSuccessData(null);
      setSupportMessage('');
      setIsAuthorized(true);
      setProjectDestiny('Geral');
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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

  const handlePaymentSuccess = async (
    methodName: 'Pix' | 'Cartão de Crédito' | 'Boleto' | 'Criptomoedas',
    recurrence: 'single' | 'recurring' = 'single',
    hashTx?: string,
    pendingDonationId?: string
  ) => {
    setLoading(true);
    const donationAmount = getActiveAmount();
    if (donationAmount <= 0) {
      setLoading(false);
      return;
    }

    try {
      const points = donationAmount * 10;
      
      // 1. Save or Update Donation in Database
      if (pendingDonationId) {
        await updateDonation(pendingDonationId, {
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

      // 2. Grant Points
      await addDonorPoints(donorCpf, points);

      // 3. Handle Support Message
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

      // 4. Handle Referral Reward points
      const existingDonations = await getDonationsByCpf(donorCpf);
      const confirmedDonations = existingDonations.filter(d => d.status === 'Confirmada');
      const isFirstConfirmedDonation = confirmedDonations.length <= 1;

      if (isFirstConfirmedDonation) {
        const cleanDonorCpf = donorCpf.replace(/\D/g, "");
        const donorUser = await getUserByCpf(cleanDonorCpf);
        if (donorUser && donorUser.referredBy) {
          const referrerCpf = donorUser.referredBy.replace(/\D/g, "");
          await addDonorPoints(referrerCpf, 100);

          const key = `referred_users_${referrerCpf}`;
          const stored = localStorage.getItem(key);
          if (stored) {
            const list = JSON.parse(stored);
            const itemIndex = list.findIndex((item: any) => item.id === `ref-${cleanDonorCpf}`);
            if (itemIndex !== -1) {
              list[itemIndex].status = 'Doou (100 pts)';
              list[itemIndex].amount = donationAmount;
              list[itemIndex].date = new Date().toISOString();
              localStorage.setItem(key, JSON.stringify(list));
            }
          }
        }
      }

      // 5. Trigger Success View
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

  const handleCardPaymentSubmit = async (
    cardNumber: string,
    recurrence: 'single' | 'recurring'
  ) => {
    setLoading(true);
    try {
      const donationAmount = getActiveAmount();
      
      // Perform DB write for active subscription if recurring
      if (recurrence === 'recurring') {
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

      const txHash = 'TX-' + crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 12);
      await handlePaymentSuccess('Cartão de Crédito', recurrence, txHash);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeAmount = getActiveAmount();

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-lg border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
          <div>
            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Apoie o Hospital de Amor</h2>
            <p className="text-[10px] text-zinc-400">Escolha o valor e o método de contribuição seguro</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50">
            <X className="w-4 h-4 text-zinc-550" />
          </Button>
        </div>

        {successData ? (
          <DonationSuccessPanel
            amount={successData.amount}
            points={successData.points}
            method={successData.method}
            onClose={onClose}
          />
        ) : (
          <div className="p-6 overflow-y-auto space-y-6 text-left flex-1">
            {/* Amount Presets */}
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
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
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
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                  }`}
                >
                  Outro
                </Button>
              </div>

              {isCustom && (
                <div className="relative mt-2 animate-in slide-in-from-top-1.5 duration-100">
                  <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-xs">R$</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="pl-8 h-10 border-zinc-200 dark:border-zinc-800 focus-visible:ring-brand-pink rounded-xl text-xs bg-white dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              )}
            </div>

            {/* Destination Selection */}
            <div className="space-y-2">
              <Label htmlFor="projectDestiny" className="text-xs font-bold text-zinc-650 dark:text-zinc-350">Destinação dos Recursos</Label>
              <select
                id="projectDestiny"
                value={projectDestiny}
                onChange={(e) => setProjectDestiny(e.target.value)}
                className="w-full h-10 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-xs px-3 text-zinc-900 dark:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
              >
                <option value="Geral">Geral (Onde a necessidade for maior)</option>
                <option value="Ala Infantil">Ala Infantil</option>
                <option value="Prevenção Móvel">Prevenção Móvel</option>
                <option value="Pesquisa Científica">Pesquisa Científica</option>
              </select>
            </div>

            {/* Support Message */}
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
                className="w-full min-h-[64px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded-xl text-xs resize-none p-2.5 text-zinc-900 dark:text-zinc-100 leading-normal"
              />
              <div className="flex gap-2 items-start pt-0.5">
                <Checkbox
                  id="authMsg"
                  checked={isAuthorized}
                  onCheckedChange={(checked) => setIsAuthorized(checked === true)}
                  className="mt-0.5 border-zinc-300 dark:border-zinc-750 focus-visible:ring-brand-pink"
                />
                <Label htmlFor="authMsg" className="text-[10px] text-zinc-500 leading-normal cursor-pointer select-none">
                  Autorizo a exibição do meu primeiro nome junto à mensagem no painel do hospital.
                </Label>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-zinc-650 dark:text-zinc-350">Método de Pagamento</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['pix', 'card', 'boleto', 'crypto'] as const).map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={method === m ? 'default' : 'outline'}
                    onClick={() => setMethod(m)}
                    className={`h-11 rounded-xl text-xs font-bold gap-2 transition-all ${
                      method === m 
                        ? 'bg-primary hover:bg-primary/95 text-white shadow-sm' 
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                    }`}
                  >
                    {m === 'pix' && 'Pix'}
                    {m === 'card' && 'Cartão'}
                    {m === 'boleto' && 'Boleto'}
                    {m === 'crypto' && 'Cripto'}
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment Flow Rendering */}
            {method === 'pix' && (
              <PixPaymentPanel
                amount={activeAmount}
                donorCpf={donorCpf}
                projectDestiny={projectDestiny}
                onSuccess={(m, dId) => handlePaymentSuccess(m, 'single', undefined, dId)}
                loading={loading}
                setLoading={setLoading}
              />
            )}

            {method === 'card' && (
              <CardPaymentForm
                amount={activeAmount}
                onSubmitCard={handleCardPaymentSubmit}
                loading={loading}
              />
            )}

            {method === 'boleto' && (
              <BoletoPaymentPanel
                amount={activeAmount}
                donorCpf={donorCpf}
                projectDestiny={projectDestiny}
                onSuccess={(m, dId) => handlePaymentSuccess(m, 'single', undefined, dId)}
                loading={loading}
                setLoading={setLoading}
              />
            )}

            {method === 'crypto' && (
              <CryptoPaymentPanel
                amount={activeAmount}
                onSuccess={(m, tx) => handlePaymentSuccess(m, 'single', tx)}
                loading={loading}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
