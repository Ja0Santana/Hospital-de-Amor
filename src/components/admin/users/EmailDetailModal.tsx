import { X } from 'lucide-react';

interface EmailDetailModalProps {
  email: any | null;
  onClose: () => void;
}

export default function EmailDetailModal({ email, onClose }: EmailDetailModalProps) {
  if (!email) {
    return null;
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in scale-in"
      >
        <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-955/40">
          <div>
            <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-xs">
              Visualização de Sandbox Inbox
            </h3>
            <span className="text-[10px] text-zinc-400 mt-0.5">
              Simulação de e-mail transacional do sistema
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-455 dark:text-zinc-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-left">
          <div className="text-xs space-y-1.5 text-zinc-500 border-b border-zinc-150 dark:border-zinc-800 pb-3">
            <div>
              <strong>Destinatário:</strong> {email.recipient}
            </div>
            <div>
              <strong>Assunto:</strong> {email.subject}
            </div>
            <div>
              <strong>Data:</strong> {email.date}
            </div>
          </div>
          <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850">
            {email.body}
          </div>
        </div>
        <div className="px-6 py-3.5 bg-zinc-50 dark:bg-zinc-955/40 border-t border-zinc-150 dark:border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="h-9 px-4 bg-zinc-200 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
          >
            Fechar Leitor
          </button>
        </div>
      </div>
    </div>
  );
}
