import { useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface CardPaymentFormProps {
  amount: number;
  onSubmitCard: (cardNumber: string, recurrence: 'single' | 'recurring', simulateFail?: boolean) => Promise<void>;
  loading: boolean;
}

export default function CardPaymentForm({
  amount,
  onSubmitCard,
  loading,
}: CardPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardRecurrence, setCardRecurrence] = useState<'single' | 'recurring'>('single');
  const [cardError, setCardError] = useState('');

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
  };

  const formatCardExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + '/' + digits.slice(2, 4);
  };

  // Real-time structural validation
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const cleanExpiry = cardExpiry.replace(/\D/g, '');
  const isFormValid =
    cleanNumber.length === 16 &&
    cardName.trim().length >= 3 &&
    cleanExpiry.length === 4 &&
    cardExpiry.includes('/') &&
    cardCvv.replace(/\D/g, '').length >= 3;

  const handleSubmit = (simulateFail = false) => {
    setCardError('');
    if (amount <= 0) {
      setCardError('Por favor, informe um valor válido para doação.');
      return;
    }

    if (cleanNumber.length < 16) {
      setCardError('Por favor, informe um número de cartão válido.');
      return;
    }

    if (!cardName.trim()) {
      setCardError('Por favor, informe o nome impresso no cartão.');
      return;
    }

    if (cleanExpiry.length < 4 || !cardExpiry.includes('/')) {
      setCardError('Por favor, informe a data de validade (MM/AA).');
      return;
    }

    if (cardCvv.replace(/\D/g, '').length < 3) {
      setCardError('Por favor, informe o CVV.');
      return;
    }

    if (simulateFail) {
      setCardError('Erro na transação: Saldo insuficiente ou limite excedido no cartão de crédito.');
      return;
    }

    onSubmitCard(cardNumber, cardRecurrence);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (isFormValid) handleSubmit(false);
        }}
        className="space-y-4"
      >
        {cardError && (
          <div className="p-3 bg-red-50/10 dark:bg-red-950/10 border border-red-200/80 dark:border-red-800/30 text-red-555 dark:text-red-400 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{cardError}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cardNumber" className="text-xs font-semibold text-zinc-750 dark:text-zinc-300">
              Número do Cartão
            </Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className="h-10 border-zinc-200 dark:border-zinc-800 focus-visible:ring-brand-pink rounded-xl text-xs bg-white dark:bg-zinc-950 dark:text-zinc-100"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cardName" className="text-xs font-semibold text-zinc-750 dark:text-zinc-300">
              Nome Impresso no Cartão
            </Label>
            <Input
              id="cardName"
              type="text"
              placeholder="NOME COMPLETO"
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              className="h-10 border-zinc-200 dark:border-zinc-800 focus-visible:ring-brand-pink rounded-xl text-xs bg-white dark:bg-zinc-950 dark:text-zinc-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cardExpiry" className="text-xs font-semibold text-zinc-750 dark:text-zinc-300">
                Validade
              </Label>
              <Input
                id="cardExpiry"
                type="text"
                placeholder="MM/AA"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatCardExpiry(e.target.value))}
                maxLength={5}
                className="h-10 border-zinc-200 dark:border-zinc-800 focus-visible:ring-brand-pink rounded-xl text-xs text-center bg-white dark:bg-zinc-950 dark:text-zinc-100"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cardCvv" className="text-xs font-semibold text-zinc-750 dark:text-zinc-300">
                CVV
              </Label>
              <Input
                id="cardCvv"
                type="text"
                placeholder="000"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                className="h-10 border-zinc-200 dark:border-zinc-800 focus-visible:ring-brand-pink rounded-xl text-xs text-center bg-white dark:bg-zinc-950 dark:text-zinc-100"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold text-zinc-750 dark:text-zinc-300">
              Recorrência da Doação
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={cardRecurrence === 'single' ? 'default' : 'outline'}
                onClick={() => setCardRecurrence('single')}
                className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all ${
                  cardRecurrence === 'single'
                    ? 'bg-primary hover:bg-primary/95 text-white shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                }`}
              >
                Única
              </Button>
              <Button
                type="button"
                variant={cardRecurrence === 'recurring' ? 'default' : 'outline'}
                onClick={() => setCardRecurrence('recurring')}
                className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all ${
                  cardRecurrence === 'recurring'
                    ? 'bg-primary hover:bg-primary/95 text-white shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
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
            disabled={loading || !isFormValid}
            className={`font-bold h-11 rounded-xl text-xs w-full transition-all ${
              isFormValid
                ? 'bg-brand-pink hover:bg-brand-pink/95 text-white shadow-md'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-650 cursor-not-allowed'
            }`}
          >
            {loading ? 'Processando...' : 'Efetuar Doação (Simular Sucesso)'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleSubmit(true)}
            className="text-red-500 hover:bg-red-500/10 hover:text-red-650 font-bold h-10 rounded-xl text-xs w-full transition-colors"
          >
            Simular Erro de Transação (Saldo Insuficiente)
          </Button>
        </div>
      </form>
    </div>
  );
}
