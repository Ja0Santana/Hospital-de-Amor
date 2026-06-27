import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface TriagemScheduleModalProps {
  showOverrideModal: boolean;
  setShowOverrideModal: (val: boolean) => void;
  overrideReasonInput: string;
  setOverrideReasonInput: (val: string) => void;
  handleConfirmOverride: (e: React.FormEvent) => void;
  renderFeedback: () => React.ReactNode;
}

export default function TriagemScheduleModal({
  showOverrideModal,
  setShowOverrideModal,
  overrideReasonInput,
  setOverrideReasonInput,
  handleConfirmOverride,
  renderFeedback
}: TriagemScheduleModalProps) {
  if (!showOverrideModal) return null;

  return (
    <div
      onClick={() => setShowOverrideModal(false)}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-in fade-in"
    >
      <form
        onSubmit={handleConfirmOverride}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-955/20 border border-amber-200/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Justificativa de Override</h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Você está prestes a forçar a confirmação de agendamento por override de gestor. Forneça uma justificativa obrigatória.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="override-reason-textarea" className="text-[11px] font-bold text-zinc-550 uppercase tracking-wider">
            Justificativa
          </label>
          <textarea
            id="override-reason-textarea"
            rows={3}
            required
            autoFocus
            value={overrideReasonInput}
            onChange={(e) => setOverrideReasonInput(e.target.value)}
            placeholder="Descreva o motivo clínico/administrativo para forçar este agendamento..."
            className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-amber-500 focus:outline-none dark:text-zinc-100"
          />
        </div>
        {renderFeedback()}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowOverrideModal(false)}
            className="flex-1 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-955 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!overrideReasonInput.trim()}
            className="flex-1 h-10 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            Confirmar Override
          </button>
        </div>
      </form>
    </div>
  );
}
