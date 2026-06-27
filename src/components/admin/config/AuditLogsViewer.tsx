import { RefreshCw } from 'lucide-react';
import type { AuditLog } from '../../../types';

interface AuditLogsViewerProps {
  logs: AuditLog[];
  onRefresh: () => void;
}

export default function AuditLogsViewer({ logs, onRefresh }: AuditLogsViewerProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Histórico de Alterações</h3>
          <p className="text-zinc-550 text-[0.625rem] mt-0.5">Logs específicos sobre políticas, exames e capacidade.</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[0.5625rem] font-bold uppercase tracking-wider text-zinc-400">
              <th className="py-2.5 px-3">Data / Hora</th>
              <th className="py-2.5 px-3">Operador</th>
              <th className="py-2.5 px-3">Ação</th>
              <th className="py-2.5 px-3">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-zinc-500 text-xs font-semibold">
                  Nenhum log de alteração de configuração registrado.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr
                  key={log.id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-xs text-zinc-700 dark:text-zinc-350 transition-colors"
                >
                  <td className="py-3.5 px-3 font-semibold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : ''}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-zinc-950 dark:text-zinc-50">{log.userName || 'Sistema'}</td>
                  <td className="py-3.5 px-3 font-medium text-pink-600 dark:text-pink-400">{log.action || ''}</td>
                  <td className="py-3.5 px-3 text-zinc-550 dark:text-zinc-400 italic font-mono text-[0.625rem] whitespace-normal leading-relaxed">
                    {log.details || ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
