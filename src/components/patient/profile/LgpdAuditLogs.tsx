import { Card, CardContent } from '../../ui/Card';
import { History } from 'lucide-react';

export default function LgpdAuditLogs() {
  const auditLogs = [
    { date: 'Hoje', time: '20:15', action: 'Autenticação', desc: 'Login efetuado com sucesso no portal.' },
    { date: 'Hoje', time: '10:00', action: 'Leitura de Dados', desc: 'Consulta ao histórico de exames e agendamentos.' },
    { date: 'Ontem', time: '14:32', action: 'Consentimento LGPD', desc: 'Aceite de termos de privacidade no envio de exames.' }
  ];

  return (
    <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 text-left">
      <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <History className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="text-base font-bold text-zinc-805 dark:text-zinc-205">Log de Auditoria LGPD</h2>
      </div>
      <CardContent className="p-6">
        <p className="text-[11px] text-zinc-500 leading-normal mb-3">Histórico de ações de processamento sobre suas informações pessoais:</p>
        <ol className="space-y-3 list-none">
          {auditLogs.map((log, idx) => (
            <li key={idx} className="flex gap-2.5 text-xs">
              <time className="text-zinc-400 font-mono text-[10px] shrink-0 pt-0.5">{log.date} às {log.time}</time>
              <div className="space-y-0.5">
                <div className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px]">{log.action}</div>
                <div className="text-[10px] text-zinc-500 leading-normal">{log.desc}</div>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
