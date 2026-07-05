import type { Appointment } from '../../../types';

interface StatusHistoryTimelineProps {
  appointment: Appointment;
}

export default function StatusHistoryTimeline({ appointment }: StatusHistoryTimelineProps) {
  const history =
    appointment.statusHistory && appointment.statusHistory.length > 0
      ? appointment.statusHistory
      : [{ status: 'Pendente' as const, changedAt: appointment.createdAt, note: undefined }];

  return (
    <div className="space-y-3 pt-2">
      <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Histórico de Atualizações</h4>
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="relative pl-6 space-y-4 border-l border-zinc-150 dark:border-zinc-800">
          {history.map((h, index) => {
            const isLast = index === history.length - 1;
            return (
              <div key={index} className="relative">
                <div
                  className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white dark:border-zinc-950 flex items-center justify-center ${
                    isLast ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold ${
                        isLast ? 'text-primary' : 'text-zinc-750 dark:text-zinc-350'
                      }`}
                    >
                      {h.status}
                    </span>
                    <span className="text-[10px] text-zinc-405">
                      {new Date(h.changedAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {h.note && (
                    <p className="text-[11px] text-zinc-500 leading-relaxed bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg mt-1 border border-zinc-100 dark:border-zinc-900">
                      {h.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
