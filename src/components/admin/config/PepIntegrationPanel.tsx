import { RefreshCw } from 'lucide-react';
import type { Appointment, AuditLog } from '../../../types';

interface PepIntegrationPanelProps {
  appointments: Appointment[];
  logs: AuditLog[];
  onReprocessPepBatch: () => Promise<void>;
  onSinglePepSync: (appId: string) => Promise<void>;
  isProcessingPepBatch: boolean;
  pepBatchResult: string;
}

export default function PepIntegrationPanel({
  appointments,
  logs,
  onReprocessPepBatch,
  onSinglePepSync,
  isProcessingPepBatch,
  pepBatchResult
}: PepIntegrationPanelProps) {
  const pepAppointments = appointments.filter(app => app.pepSyncStatus !== undefined);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs">
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Fila de Mensagens & Integração PEP</h3>
          <p className="text-zinc-550 text-[0.625rem]">Reprocesse falhas de comunicação ou envie solicitações pendentes ao Prontuário Eletrônico.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {pepBatchResult && (
            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl font-bold text-zinc-650 dark:text-zinc-350">
              {pepBatchResult}
            </span>
          )}
          <button
            type="button"
            onClick={onReprocessPepBatch}
            disabled={isProcessingPepBatch}
            className="bg-brand-pink hover:bg-brand-pink/90 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-pink/10 flex items-center gap-2 disabled:opacity-55"
          >
            {isProcessingPepBatch ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Processando...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reprocessar Fila Pendente</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-800 pb-3">Mensagens de Transmissão do PEP</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-405 font-bold">
                  <th className="py-2.5">Protocolo</th>
                  <th className="py-2.5">Paciente</th>
                  <th className="py-2.5">CPF</th>
                  <th className="py-2.5">Status PEP</th>
                  <th className="py-2.5">Tentativas</th>
                  <th className="py-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {pepAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400 italic">Nenhum agendamento na fila de integração do PEP.</td>
                  </tr>
                ) : (
                  pepAppointments.map(app => (
                    <tr key={app.id} className="border-b border-zinc-100 dark:border-zinc-850 last:border-0 animate-in fade-in">
                      <td className="py-3 font-mono font-bold text-zinc-800 dark:text-zinc-200">{app.protocol}</td>
                      <td className="py-3 font-semibold">{app.patientName}</td>
                      <td className="py-3 font-mono">{app.patientCpf}</td>
                      <td className="py-3">
                        {app.pepSyncStatus === 'synchronized' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 dark:bg-green-955/20 dark:text-green-400 border border-green-200/20">
                            Sincronizado
                          </span>
                        ) : app.pepSyncStatus === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-850 dark:bg-red-955/20 dark:text-red-400 border border-red-200/20 animate-pulse">
                            Falhou
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-200/20">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-semibold text-center">{app.pepSyncAttempts || 0}</td>
                      <td className="py-3 text-right">
                        {app.pepSyncStatus !== 'synchronized' && (
                          <button
                            type="button"
                            onClick={() => onSinglePepSync(app.id)}
                            className="px-2.5 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg text-[10px] font-bold hover:bg-zinc-800 transition-all shadow-sm"
                          >
                            Sincronizar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
          <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50 border-b border-zinc-100 dark:border-zinc-800 pb-3">Logs de Erro & Auditoria PEP</h4>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <p className="text-zinc-400 text-xs italic text-center py-8">Nenhum log de integração do PEP registrado.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850 rounded-xl space-y-1.5 text-[10px] animate-in fade-in">
                  <div className="flex justify-between font-bold text-zinc-400">
                    <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                    <span className={log.action.includes('Sucesso') ? 'text-green-600' : 'text-red-500'}>
                      {log.action.includes('Sucesso') ? 'Sucesso' : 'Falha'}
                    </span>
                  </div>
                  <p className="font-semibold text-zinc-850 dark:text-zinc-250">{log.action}</p>
                  <p className="text-zinc-500 leading-normal">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
