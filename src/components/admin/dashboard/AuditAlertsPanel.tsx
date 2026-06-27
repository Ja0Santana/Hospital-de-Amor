
import { AlertTriangle } from 'lucide-react';
import type { AuditLog } from '../../../types';

interface AuditAlertsPanelProps {
  auditLogs: AuditLog[];
  isAlertsOpen: boolean;
  setIsAlertsOpen: (open: boolean) => void;
}

export default function AuditAlertsPanel({
  auditLogs,
  isAlertsOpen,
  setIsAlertsOpen,
}: AuditAlertsPanelProps) {
  const criticalAlerts = auditLogs.filter((log) => {
    const actionLower = log.action.toLowerCase();
    return (
      actionLower.includes('edição do usuário') ||
      actionLower.includes('desativação') ||
      actionLower.includes('override crítico') ||
      actionLower.includes('desativado') ||
      actionLower.includes('edição de permissões')
    );
  });

  if (criticalAlerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 dark:bg-red-955/20 dark:border-red-900/30 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-red-200/50 dark:border-red-900/30 pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-655 animate-pulse" />
          <h3 className="text-sm font-extrabold text-red-900 dark:text-red-400">
            Alertas de Auditoria de Ações Críticas (Real-time)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsAlertsOpen(!isAlertsOpen)}
          className="text-xs font-extrabold text-red-700 dark:text-red-400 hover:underline"
        >
          {isAlertsOpen ? 'Ocultar Detalhes' : 'Expandir Detalhes'}
        </button>
      </div>

      {isAlertsOpen && (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {criticalAlerts.map((log) => (
            <div
              key={log.id}
              className="p-4 bg-white dark:bg-zinc-900 border border-red-200/40 dark:border-red-900/20 rounded-2xl flex flex-col sm:flex-row justify-between text-xs gap-3 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-red-900 dark:text-red-400">
                    {log.action}
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 font-semibold">
                  Usuário: <strong>{log.userName}</strong> (CPF: {log.userCpf})
                </p>
                {log.details && (
                  <p className="text-[10px] text-zinc-450 italic mt-1 bg-zinc-50 dark:bg-zinc-955 p-2 rounded-xl">
                    {log.details}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Data / Hora
                </span>
                <span className="font-mono text-[11px] font-semibold text-zinc-655 dark:text-zinc-350">
                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
