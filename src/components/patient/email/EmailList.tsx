import { Card } from '../../ui/Card';
import { Inbox, Mail, MailOpen } from 'lucide-react';
import type { Email } from '../../../types';

interface EmailListProps {
  emails: Email[];
  selectedEmail: Email | null;
  loading: boolean;
  onSelectEmail: (email: Email) => void;
}

export default function EmailList({
  emails,
  selectedEmail,
  loading,
  onSelectEmail,
}: EmailListProps) {
  return (
    <div className="flex flex-col space-y-3 h-full">
      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 pl-1">
        Mensagens Recebidas
      </h2>

      <Card className="border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 overflow-hidden flex flex-col">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-y-auto flex-1 max-h-[520px]">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-500">Carregando e-mails...</div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center">
              <Inbox className="w-8 h-8 text-zinc-350" />
              <p className="text-xs font-semibold text-zinc-500">Caixa de entrada vazia</p>
            </div>
          ) : (
            emails.map((email) => {
              const isSelected = selectedEmail?.id === email.id;
              return (
                <div
                  key={email.id}
                  onClick={() => onSelectEmail(email)}
                  className={`p-4 cursor-pointer transition-colors text-left flex gap-3 items-start ${
                    isSelected
                      ? 'bg-zinc-50 dark:bg-zinc-900/60 border-l-4 border-l-primary'
                      : 'bg-white dark:bg-zinc-950 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20'
                  }`}
                >
                  <div className="mt-1 shrink-0">
                    {email.isRead ? (
                      <MailOpen className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <Mail className="w-4 h-4 text-primary font-bold" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <span
                        className={`text-[10px] truncate max-w-[130px] block ${
                          email.isRead ? 'text-zinc-500 font-medium' : 'text-zinc-900 dark:text-zinc-200 font-bold'
                        }`}
                      >
                        {email.sender.split(' ')[0]}
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono whitespace-nowrap shrink-0">
                        {email.date.split(' ')[0]}
                      </span>
                    </div>
                    <h4
                      className={`text-xs truncate block ${
                        email.isRead
                          ? 'text-zinc-700 dark:text-zinc-300 font-semibold'
                          : 'text-zinc-955 dark:text-zinc-50 font-black'
                      }`}
                    >
                      {email.subject}
                    </h4>
                    <p className="text-[10px] text-zinc-400 truncate">{email.preview}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
