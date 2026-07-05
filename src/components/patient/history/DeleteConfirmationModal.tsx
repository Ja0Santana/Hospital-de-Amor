import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../ui/Button';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmationModal({
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  return createPortal(
    <div
      onClick={onCancel}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 text-left"
      >
        <div className="flex gap-3.5 items-start">
          <div className="p-2.5 bg-red-100 text-red-600 rounded-full shrink-0 border border-red-200">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Excluir documento?</h3>
            <p className="text-xs text-zinc-500 leading-normal">
              Tem certeza que deseja remover este documento do seu histórico clínico? Esta ação não poderá ser desfeita.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-9 px-4 text-xs font-semibold rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="h-9 px-5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs"
          >
            Confirmar Exclusão
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
