import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { History } from 'lucide-react';
import { getAuditLogs } from '../../../services/db';
import type { AuditLog } from '../../../types';

interface LgpdAuditLogsProps {
  patientCpf: string;
}

export default function LgpdAuditLogs({ patientCpf }: LgpdAuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const allLogs = await getAuditLogs();
        const cleanCpf = patientCpf.replace(/\D/g, '');
        const filtered = allLogs
          .filter((log) => {
            const hasDetailsCpf = log.details && log.details.includes(cleanCpf);
            const isOwner = log.userCpf && log.userCpf.replace(/\D/g, '') === cleanCpf;
            return isOwner || hasDetailsCpf;
          })
          .slice(0, 5); // Exibir os 5 mais recentes
        setLogs(filtered);
      } catch (e) {
        console.error('Erro ao buscar logs de auditoria:', e);
      }
    };
    fetchLogs();
  }, [patientCpf]);

  return (
    <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-955 text-left">
      <div className="bg-zinc-50 dark:bg-zinc-900/40 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <History className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="text-base font-bold text-zinc-805 dark:text-zinc-205">Log de Auditoria LGPD</h2>
      </div>
      <CardContent className="p-6">
        <p className="text-[11px] text-zinc-500 leading-normal mb-3">Histórico real de processamento e acessos sobre suas informações clínicas/pessoais:</p>
        {logs.length === 0 ? (
          <p className="text-[10px] text-zinc-400">Nenhuma ação recente registrada.</p>
        ) : (
          <ol className="space-y-3 list-none">
            {logs.map((log) => {
              const timeStr = new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const dateStr = new Date(log.timestamp).toLocaleDateString('pt-BR');
              return (
                <li key={log.id} className="flex gap-2.5 text-xs border-b border-zinc-100 dark:border-zinc-900 pb-2 last:border-b-0 last:pb-0">
                  <time className="text-zinc-400 font-mono text-[9px] shrink-0 pt-0.5 w-20">{dateStr} {timeStr}</time>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="font-bold text-zinc-850 dark:text-zinc-200 text-[10px] uppercase tracking-wide">{log.module || 'Ação'}</div>
                    <div className="text-[10px] text-zinc-500 leading-snug break-words">{log.action}</div>
                    {log.details && (
                      <div className="text-[9px] text-zinc-400 italic font-mono truncate">{log.details}</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
