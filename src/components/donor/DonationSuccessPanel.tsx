import { CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface DonationSuccessPanelProps {
  amount: number;
  points: number;
  method: string;
  onClose: () => void;
}

export default function DonationSuccessPanel({
  amount,
  points,
  method,
  onClose,
}: DonationSuccessPanelProps) {
  return (
    <div className="p-8 text-center flex flex-col items-center justify-center space-y-5 overflow-y-auto">
      <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 flex items-center justify-center text-green-600 dark:text-green-400">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Doação Confirmada!</h3>
        <p className="text-xs text-zinc-550 max-w-sm leading-relaxed">
          Seu pagamento simulado de <strong>R$ {amount.toFixed(2)}</strong> via {method} foi processado com sucesso.
        </p>
      </div>
      <div className="p-4 bg-brand-pink/5 border border-brand-pink/20 rounded-2xl max-w-xs w-full text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-pink block">Pontos Acumulados</span>
        <span className="text-2xl font-black text-brand-pink">+{points} pts</span>
        <span className="text-[9px] text-zinc-400 block mt-1">Parabéns! Você subiu na pontuação de doador.</span>
      </div>
      <Button
        onClick={onClose}
        className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-8 rounded-2xl shadow-lg shadow-primary/25 text-xs"
      >
        Concluir
      </Button>
    </div>
  );
}
