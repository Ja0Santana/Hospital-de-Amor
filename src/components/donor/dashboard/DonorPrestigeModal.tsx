import { createPortal } from 'react-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Sparkles } from 'lucide-react';

interface DonorPrestigeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DonorPrestigeModal({ isOpen, onClose, onConfirm }: DonorPrestigeModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl p-6 space-y-5 text-left">
        <div className="flex gap-4 items-start animate-in zoom-in-95 duration-200">
          <div className="p-3 bg-brand-pink/10 text-brand-pink rounded-full shrink-0 border border-brand-pink/20 animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 leading-tight">
              Ativar Modo de Prestígio?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Parabéns por alcançar o nível Diamante! Ao ativar o prestígio:
            </p>
            <ul className="list-disc pl-4 text-[0.6875rem] text-zinc-505 dark:text-zinc-400 space-y-1 leading-normal">
              <li>Seu saldo de pontos atual será redefinido para <strong>0</strong>.</li>
              <li>Seu nível voltará para o rank <strong>Bronze</strong>, permitindo que você resgate novamente os selos do catálogo.</li>
              <li>Você ganhará <strong>1 Ponto de Prestígio</strong> permanente.</li>
              <li>A progressão de dificuldade para passar de nível e o custo dos selos aumentarão em <strong>10%</strong> cumulativamente.</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl text-xs font-bold">
            Cancelar
          </Button>
          <Button type="button" onClick={onConfirm} className="h-10 bg-brand-pink hover:bg-brand-pink/90 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-pink/20">
            Ativar Prestígio
          </Button>
        </div>
      </Card>
    </div>,
    document.body
  );
}
