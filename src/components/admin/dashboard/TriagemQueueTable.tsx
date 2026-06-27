import React from 'react';
import { FileText, Eye, AlertCircle, Zap, AlertTriangle, Pause, Calendar, Check } from 'lucide-react';
import type { Appointment } from '../../../types';

interface TriagemQueueTableProps {
  selectedApps: string[];
  setSelectedApps: React.Dispatch<React.SetStateAction<string[]>>;
  permissions: string[];
  filteredAppointments: Appointment[];
  appointments: Appointment[];
  isInitialLoading: boolean;
  sortedAppointments: Appointment[];
  paginatedAppointments: Appointment[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  handleSort: (key: string) => void;
  getSortIcon: (key: string) => React.ReactNode;
  handleSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectOne: (id: string, checked: boolean) => void;
  handleLoteStatusChange: (status: 'Em análise' | 'Cancelado') => void;
  getSlaStatus: (createdAt: string) => 'ok' | 'warning' | 'critical';
  getRemainingTime: (expiresAtStr: string) => string;
  hasMailBounce: (app: Appointment) => boolean;
  examRequiresEncaminhamento: (examId: string) => boolean;
  onCheckIn: (id: string) => Promise<void>;
  openTriagemPanel: (app: Appointment) => void;
}

export default function TriagemQueueTable({
  selectedApps,
  setSelectedApps,
  permissions,
  filteredAppointments,
  appointments,
  isInitialLoading,
  sortedAppointments,
  paginatedAppointments,
  currentPage,
  setCurrentPage,
  totalPages,
  handleSort,
  getSortIcon,
  handleSelectAll,
  handleSelectOne,
  handleLoteStatusChange,
  getSlaStatus,
  getRemainingTime,
  hasMailBounce,
  examRequiresEncaminhamento,
  onCheckIn,
  openTriagemPanel
}: TriagemQueueTableProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm space-y-6 mt-6">
      {selectedApps.length > 0 && permissions.includes('confirm_appointments') && (
        <div className="bg-pink-50 border border-pink-200/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-2 dark:bg-pink-955/10 dark:border-pink-900/30">
          <span className="text-xs font-bold text-pink-700 dark:text-pink-400">
            {selectedApps.length} item(s) selecionado(s)
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleLoteStatusChange('Em análise')}
              className="flex-1 sm:flex-none h-9 px-4 rounded-xl text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
            >
              Colocar Em Análise
            </button>
            <button
              onClick={() => handleLoteStatusChange('Cancelado')}
              className="flex-1 sm:flex-none h-9 px-4 rounded-xl text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs"
            >
              Cancelar Agendamentos
            </button>
            <button
              onClick={() => setSelectedApps([])}
              className="flex-1 sm:flex-none h-9 px-4 rounded-xl text-[11px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all"
            >
              Desmarcar Todos
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold px-1 py-2">
        <span>
          Exibindo <strong className="text-zinc-800 dark:text-zinc-200">{filteredAppointments.length}</strong> de <strong className="text-zinc-800 dark:text-zinc-200">{appointments.length}</strong> solicitações na fila.
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={filteredAppointments.length > 0 && selectedApps.length === filteredAppointments.length}
                  onChange={handleSelectAll}
                  className="rounded text-pink-600 focus:ring-pink-500"
                />
              </th>
              <th className="py-3 px-4 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-350" onClick={() => handleSort('protocol')}>
                Protocolo{getSortIcon('protocol')}
              </th>
              <th className="py-3 px-4 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-350" onClick={() => handleSort('patientName')}>
                Paciente{getSortIcon('patientName')}
              </th>
              <th className="py-3 px-4 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-350" onClick={() => handleSort('city')}>
                Cidade{getSortIcon('city')}
              </th>
              <th className="py-3 px-4 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-350" onClick={() => handleSort('createdAt')}>
                Solicitação / Exame{getSortIcon('createdAt')}
              </th>
              <th className="py-3 px-4 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-350" onClick={() => handleSort('priority')}>
                Prioridade{getSortIcon('priority')}
              </th>
              <th className="py-3 px-4">SLA</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Falta Anexo?</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
            {isInitialLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-zinc-100 dark:border-zinc-800">
                  {Array.from({ length: 10 }).map((__, j) => (
                    <td key={j} className="py-4 px-4">
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full" style={{ width: j === 0 ? 16 : j === 1 ? 80 : j === 2 ? 120 : j === 3 ? 90 : 60 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedAppointments.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-zinc-500 text-xs font-semibold">
                  Nenhuma solicitação encontrada na fila de triagem.
                </td>
              </tr>
            ) : (
              paginatedAppointments.map(app => {
                const isHighPriority = app.priority === 'Alta';
                const slaStatus = getSlaStatus(app.createdAt);
                const slaDays = Math.floor((Date.now() - new Date(app.createdAt).getTime()) / 86400000);
                const todayStr = new Date().toISOString().split('T')[0];
                const isOverdue = 
                  app.status === 'Aguardando Follow-up' && 
                  app.followUpDate && 
                  !app.followUpSuspended && 
                  app.followUpDate < todayStr;

                const isOfferActive = !!(app.waitingListOfferExpiresAt && new Date(app.waitingListOfferExpiresAt) > new Date() && (app.status === 'Pendente' || app.status === 'Em análise'));
                return (
                  <tr 
                    key={app.id} 
                    className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-xs text-zinc-700 dark:text-zinc-355 transition-colors ${
                      isHighPriority 
                        ? 'bg-red-50/20 dark:bg-red-950/10 border-l-2 border-l-red-500' 
                        : app.priority === 'Média' 
                        ? 'bg-amber-50/5 dark:bg-amber-950/5' 
                        : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedApps.includes(app.id)}
                        onChange={(e) => handleSelectOne(app.id, e.target.checked)}
                        disabled={isOfferActive}
                        className="rounded text-pink-600 focus:ring-pink-500"
                      />
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-zinc-955 dark:text-zinc-50">{app.protocol}</td>
                    <td className="py-4 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <span>{app.patientName}</span>
                        {app.internalNotes && app.internalNotes.length > 0 && (
                          <span 
                            title={`${app.internalNotes.length} observações internas`}
                            className={`cursor-pointer ${
                              app.internalNotes.some(note => note.isUrgent)
                                ? 'text-red-500 animate-pulse font-black'
                                : 'text-zinc-400'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0 inline" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">{app.city}</td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">{app.examName}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Solicitado em {new Date(app.createdAt).toLocaleDateString('pt-BR')} • {app.specialtyName}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        app.priority === 'Alta' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-955/30 dark:text-red-400' :
                        app.priority === 'Média' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-955/30 dark:text-amber-400' :
                        (app.priority === 'Baixa' || !app.priority) ? 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-350' :
                        'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-955/30 dark:text-blue-400'
                      }`}>
                        {app.priority || 'Baixa'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {isOfferActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-pink-100 text-pink-700 dark:bg-pink-955/20 dark:text-pink-400 border border-pink-200/20 animate-pulse block w-max">
                            <Zap className="w-3 h-3 text-pink-500" />
                            <span>Oferta Ativa: {getRemainingTime(app.waitingListOfferExpiresAt!)}</span>
                          </span>
                        ) : (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOverdue 
                              ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-955/20 dark:text-red-400 border animate-pulse'
                              : app.status === 'Confirmado' ? 'bg-green-50 text-green-700 dark:bg-green-955/20 dark:text-green-400 border border-green-200/20' :
                              app.status === 'Cancelado' ? 'bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400 border border-red-200/20' :
                              app.status === 'Em análise' ? 'bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400 border border-blue-200/20' :
                              app.status === 'Reagendamento Pendente' ? 'bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-200/20' :
                              app.status === 'Aguardando Follow-up' ? 'bg-purple-50 text-purple-700 dark:bg-purple-955/20 dark:text-purple-400 border border-purple-200/20' :
                              'bg-yellow-50 text-yellow-700 dark:bg-yellow-955/20 dark:text-yellow-400 border border-yellow-200/20'
                          }`}>
                            {isOverdue ? 'Aguardando Acompanhamento (Vencido)' : app.status === 'Aguardando Follow-up' ? 'Aguardando Acompanhamento' : app.status}
                          </span>
                        )}
                        {hasMailBounce(app) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-955/20 dark:text-red-400 border border-red-200/20 animate-pulse block w-max">
                            <AlertTriangle className="w-3 h-3 text-red-650" />
                            <span>Falha de Envio (E-mail)</span>
                          </span>
                        )}
                        {app.status === 'Aguardando Follow-up' && (
                          <div className="text-[9px] font-bold tracking-tight block">
                            {app.followUpSuspended ? (
                              <span className="inline-flex items-center gap-1 text-zinc-400">
                                <Pause className="w-3 h-3 text-zinc-405" />
                                <span>Acompanhamento Suspenso</span>
                              </span>
                            ) : (
                              <span className={isOverdue ? "text-red-500 font-extrabold animate-pulse inline-flex items-center gap-1" : "text-purple-505 inline-flex items-center gap-1"}>
                                <Calendar className="w-3 h-3" />
                                <span>Limite: {app.followUpDate ? new Date(app.followUpDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {app.status !== 'Cancelado' && app.status !== 'Concluído' && (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-lg border ${
                          slaStatus === 'critical'
                            ? 'bg-red-50 border-red-200/40 text-red-700 dark:bg-red-955/20 dark:border-red-900/30 dark:text-red-400 animate-pulse'
                            : slaStatus === 'warning'
                            ? 'bg-amber-50 border-amber-200/40 text-amber-700 dark:bg-amber-955/20 dark:border-amber-900/30 dark:text-amber-400'
                            : 'bg-zinc-50 border-zinc-200/40 text-zinc-500 dark:bg-zinc-900/20 dark:border-zinc-800'
                        }`}>
                          {slaStatus === 'critical' ? (
                            <AlertCircle className="w-3.5 h-3.5 text-red-650 animate-pulse shrink-0" />
                          ) : slaStatus === 'warning' ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
                          )}
                          <span className="ml-1">{slaDays}d</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {!app.fileAttachment ? (
                        examRequiresEncaminhamento(app.examId) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-650 bg-red-50 dark:bg-red-955/20 px-2 py-0.5 rounded-md border border-red-205/20">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Falta Anexo!
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-200/20">
                            Não exigido
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-semibold">OK</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {app.status === 'Confirmado' && !app.checkInAt && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await onCheckIn(app.id);
                            }}
                            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-955/10 font-bold transition-all bg-white dark:bg-zinc-950 text-emerald-700 dark:text-emerald-400 text-[10px]"
                            title="Registrar check-in do paciente"
                          >
                            <Check className="w-3 h-3" />
                            <span>Check-in</span>
                          </button>
                        )}
                        <button
                          onClick={() => openTriagemPanel(app)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-650 dark:hover:bg-pink-955/10 font-bold transition-all bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Triar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-400 font-semibold">
            Página <strong className="text-zinc-700 dark:text-zinc-300">{currentPage}</strong> de <strong className="text-zinc-700 dark:text-zinc-300">{totalPages}</strong> &nbsp;·&nbsp; {sortedAppointments.length} registros
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 rounded-xl text-[11px] font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-955 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-xl text-[11px] font-bold border transition-all ${
                    page === currentPage
                      ? 'bg-pink-600 border-pink-600 text-white shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-955 hover:bg-zinc-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3 rounded-xl text-[11px] font-bold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-955 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
