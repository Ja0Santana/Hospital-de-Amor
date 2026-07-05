import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface RestoreDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreDraft: () => void;
  onDiscardDraft: () => void;
}

export default function RestoreDraftModal({
  isOpen,
  onClose,
  onRestoreDraft,
  onDiscardDraft,
}: RestoreDraftModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5"
      >
        <div className="flex gap-4 items-start text-left">
          <div className="p-3 bg-primary/10 text-primary rounded-full shrink-0 border border-primary/20">
            <ClipboardCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-50 leading-tight">
              Recuperar rascunho pendente?
            </h3>
            <p className="text-xs text-zinc-505 dark:text-zinc-400 leading-relaxed">
              Você possui uma solicitação de agendamento não finalizada. Deseja retomar de onde parou ou iniciar um novo formulário?
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onDiscardDraft}
            className="h-10 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 font-bold rounded-xl text-xs"
          >
            Iniciar Novo
          </Button>
          <Button
            type="button"
            onClick={onRestoreDraft}
            className="h-10 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 transition-transform active:scale-95"
          >
            Recuperar Rascunho
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
