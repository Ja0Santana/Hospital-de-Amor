import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface SponsorshipSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SponsorshipSuccessModal({ isOpen, onClose }: SponsorshipSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 flex items-center justify-center text-green-600 dark:text-green-400 mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Intenção de Patrocínio Registrada!</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
            Agradecemos o interesse da sua corporação em apoiar os pacientes oncológicos. Nossa equipe de Captação de Recursos entrará em contato pelo e-mail informado em até 2 dias úteis.
          </p>
        </div>
        <div className="p-3.5 bg-brand-pink/5 border border-brand-pink/20 rounded-2xl max-w-xs mx-auto text-center flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-brand-pink fill-brand-pink" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-pink">Selo Empresa Parceira Confirmado</span>
        </div>
        <Button onClick={onClose} className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-8 rounded-xl text-xs w-full shadow-md shadow-primary/20">
          Concluir
        </Button>
      </Card>
    </div>
  );
}
