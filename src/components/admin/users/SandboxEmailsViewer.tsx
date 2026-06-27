import { Mail } from 'lucide-react';

interface SandboxEmailsViewerProps {
  simulatedEmails: any[];
  onOpenEmail: (email: any) => void;
}

export default function SandboxEmailsViewer({
  simulatedEmails,
  onOpenEmail,
}: SandboxEmailsViewerProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
        <Mail className="w-4 h-4 text-pink-600" />
        Sandbox Inbox - E-mails de Convite Enviados
      </h2>
      {simulatedEmails.length === 0 ? (
        <p className="text-xs text-zinc-550 italic">
          Nenhum e-mail de convite enviado nesta sessão de testes.
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {simulatedEmails.map((email) => (
            <div
              key={email.id}
              className="p-3 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 flex items-center justify-between text-xs cursor-pointer hover:bg-zinc-100/30 dark:hover:bg-zinc-900/40 transition-colors"
              onClick={() => onOpenEmail(email)}
            >
              <div>
                <div className="font-bold text-zinc-900 dark:text-zinc-100">{email.subject}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  Para: {email.recipient} | Enviado em: {email.date}
                </div>
              </div>
              <button className="px-2.5 py-1 bg-pink-50 text-pink-600 hover:bg-pink-100 dark:bg-pink-955/20 dark:text-pink-400 rounded-lg text-[10px] font-bold transition-all">
                Abrir E-mail
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
