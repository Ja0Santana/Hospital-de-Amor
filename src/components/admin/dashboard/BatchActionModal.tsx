import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface BatchActionModalProps {
  modal: { action: 'Em análise' | 'Cancelado'; count: number } | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  renderFeedback: () => React.ReactNode;
}

export default function BatchActionModal({
  modal,
  onClose,
  onConfirm,
  renderFeedback,
}: BatchActionModalProps) {
  const [batchConfirmInput, setBatchConfirmInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!modal) {
    return null;
  }

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      setBatchConfirmInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const expectedInput = modal.action === 'Cancelado' ? 'CANCELAR' : 'CONFIRMAR';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-955/20 border border-red-200/40 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-655" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">
              Confirmar Ação em Lote
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Você está prestes a alterar o status de{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{modal.count} agendamento(s)</strong>{' '}
              para <strong className="text-zinc-800 dark:text-zinc-200">"{modal.action}"</strong>. Esta
              ação será registrada na auditoria.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Digite <span className="text-red-655 font-extrabold">{expectedInput}</span> para prosseguir
          </label>
          <input
            type="text"
            autoFocus
            value={batchConfirmInput}
            onChange={(e) => setBatchConfirmInput(e.target.value)}
            placeholder={expectedInput}
            className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-red-500 focus:outline-none dark:text-zinc-100"
          />
        </div>
        {renderFeedback()}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-955 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={batchConfirmInput !== expectedInput || isSubmitting}
            className="flex-1 h-10 rounded-xl text-xs font-bold text-white bg-red-655 hover:bg-red-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            Confirmar Ação em Lote
          </button>
        </div>
      </div>
    </div>
  );
}
