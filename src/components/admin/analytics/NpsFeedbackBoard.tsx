import React from 'react';
import {
  MessageSquare,
  AlertTriangle,
  Check,
  RefreshCw,
  Zap,
  Send,
  FileText,
  Download,
  Settings,
  Mail
} from 'lucide-react';
import type { Appointment, Specialty, PatientUser, FeedbackResponse } from '../../../types';

interface NpsFeedbackBoardProps {
  feedbacks: FeedbackResponse[];
  appointments: Appointment[];
  specialties: Specialty[];
  loggedEmployee: PatientUser;
  npsSearch: string;
  onNpsSearchChange: (val: string) => void;
  selectedNpsSpecialty: string;
  onSelectedNpsSpecialtyChange: (val: string) => void;
  selectedNpsRegion: string;
  onSelectedNpsRegionChange: (val: string) => void;
  npsStatusFilter: 'Todos' | 'Pendentes' | 'Em andamento' | 'Resolvidos';
  onNpsStatusFilterChange: (val: 'Todos' | 'Pendentes' | 'Em andamento' | 'Resolvidos') => void;
  replyTextMap: Record<string, string>;
  onReplyTextChange: (id: string, text: string) => void;
  onSendReply: (feedbackId: string) => Promise<void>;
  replySuccessMsgMap: Record<string, string>;
  onSetResolutionStatus: (feedbackId: string, status: 'Pendente' | 'Em andamento' | 'Resolvido') => Promise<void>;
  npsExportFormat: 'pdf' | 'csv' | 'excel';
  onNpsExportFormatChange: (val: 'pdf' | 'csv' | 'excel') => void;
  isExporting: boolean;
  onExportNpsReport: () => Promise<void>;
  npsRecipients: string;
  onNpsRecipientsChange: (val: string) => void;
  isNpsReportScheduled: boolean;
  onIsNpsReportScheduledChange: (val: boolean) => void;
  onSaveNpsSchedule: (e: React.FormEvent) => Promise<void>;
  npsReportSuccessMsg: string;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
}

export default function NpsFeedbackBoard({
  feedbacks,
  appointments,
  specialties,
  npsSearch,
  onNpsSearchChange,
  selectedNpsSpecialty,
  onSelectedNpsSpecialtyChange,
  selectedNpsRegion,
  onSelectedNpsRegionChange,
  npsStatusFilter,
  onNpsStatusFilterChange,
  replyTextMap,
  onReplyTextChange,
  onSendReply,
  replySuccessMsgMap,
  onSetResolutionStatus,
  npsExportFormat,
  onNpsExportFormatChange,
  isExporting,
  onExportNpsReport,
  npsRecipients,
  onNpsRecipientsChange,
  isNpsReportScheduled,
  onIsNpsReportScheduledChange,
  onSaveNpsSchedule,
  npsReportSuccessMsg,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange
}: NpsFeedbackBoardProps) {
  const today = new Date().toISOString().split('T')[0];

  const filteredFeedbacks = feedbacks.filter(fb => {
    const app = appointments.find(a => a.protocol.toUpperCase() === fb.appointmentProtocol.toUpperCase());
    if (selectedNpsSpecialty && app?.specialtyId !== selectedNpsSpecialty) return false;
    if (selectedNpsRegion && app?.city !== selectedNpsRegion) return false;

    const resolutionStatus = fb.resolutionStatus || (fb.isResolved ? 'Resolvido' : 'Pendente');
    if (npsStatusFilter === 'Pendentes' && resolutionStatus !== 'Pendente') return false;
    if (npsStatusFilter === 'Em andamento' && resolutionStatus !== 'Em andamento') return false;
    if (npsStatusFilter === 'Resolvidos' && resolutionStatus !== 'Resolvido') return false;

    if (npsSearch) {
      const query = npsSearch.toLowerCase();
      const matchComment = fb.comment.toLowerCase().includes(query);
      const matchProtocol = fb.appointmentProtocol.toLowerCase().includes(query);
      const matchPatient = app?.patientName.toLowerCase().includes(query) || false;
      if (!matchComment && !matchProtocol && !matchPatient) return false;
    }
    return true;
  });

  const npsMetrics = (() => {
    const total = filteredFeedbacks.length;
    const promoters = filteredFeedbacks.filter(f => f.npsScore >= 9).length;
    const passives = filteredFeedbacks.filter(f => f.npsScore >= 7 && f.npsScore <= 8).length;
    const detractors = filteredFeedbacks.filter(f => f.npsScore <= 6).length;
    const promotersPctReal = total > 0 ? (promoters / total) * 100 : 0;
    const passivesPctReal = total > 0 ? (passives / total) * 100 : 0;
    const detractorsPctReal = total > 0 ? (detractors / total) * 100 : 0;
    const npsScore = total > 0 ? Math.round(promotersPctReal - detractorsPctReal) : 0;
    return { total, promoters, passives, detractors, promotersPct: promotersPctReal, passivesPct: passivesPctReal, detractorsPct: detractorsPctReal, npsScore };
  })();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Score NPS Consolidado</span>
            <h2 className="text-4xl font-black mt-2 text-zinc-900 dark:text-zinc-50 font-sans tracking-tight">
              {npsMetrics.npsScore}
            </h2>
          </div>
          <div className="mt-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${npsMetrics.npsScore >= 70
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30'
              : npsMetrics.npsScore >= 50
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-955/20 dark:border-yellow-900/30'
                : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-955/20 dark:border-red-900/30'
              }`}>
              {npsMetrics.npsScore >= 70 ? 'Zona de Excelência' : npsMetrics.npsScore >= 50 ? 'Zona de Qualidade' : 'Zona de Atenção'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Promotores (9-10)</span>
            <h2 className="text-3xl font-black mt-2 text-green-600 dark:text-green-400 font-sans tracking-tight">
              {npsMetrics.promoters}
            </h2>
          </div>
          <div className="mt-4 text-xs font-semibold text-zinc-550 dark:text-zinc-450">
            Representa {npsMetrics.promotersPct.toFixed(1)}% do total
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-855 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Passivos (7-8)</span>
            <h2 className="text-3xl font-black mt-2 text-yellow-600 dark:text-yellow-400 font-sans tracking-tight">
              {npsMetrics.passives}
            </h2>
          </div>
          <div className="mt-4 text-xs font-semibold text-zinc-550 dark:text-zinc-450">
            Representa {npsMetrics.passivesPct.toFixed(1)}% do total
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Detratores (0-6)</span>
            <h2 className="text-3xl font-black mt-2 text-red-600 dark:text-red-400 font-sans tracking-tight">
              {npsMetrics.detractors}
            </h2>
          </div>
          <div className="mt-4 text-xs font-semibold text-zinc-550 dark:text-zinc-450">
            Representa {npsMetrics.detractorsPct.toFixed(1)}% do total
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-pink-600" />
            Mural de Feedbacks Operacionais ({filteredFeedbacks.length})
          </h3>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar por comentário, protocolo..."
              value={npsSearch}
              onChange={(e) => onNpsSearchChange(e.target.value)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 w-full md:w-60"
            />

            <select
              value={selectedNpsSpecialty}
              onChange={(e) => onSelectedNpsSpecialtyChange(e.target.value)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
            >
              <option value="">Todas Especialidades</option>
              {specialties.map(spec => (
                <option key={spec.id} value={spec.id}>{spec.name}</option>
              ))}
            </select>

            <select
              value={selectedNpsRegion}
              onChange={(e) => onSelectedNpsRegionChange(e.target.value)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
            >
              <option value="">Todas Cidades</option>
              {Array.from(new Set(appointments.map(a => a.city).filter(Boolean))).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <select
              value={npsStatusFilter}
              onChange={(e) => onNpsStatusFilterChange(e.target.value as any)}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 font-semibold"
            >
              <option value="Todos">Todos</option>
              <option value="Pendentes">Pendentes</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Resolvidos">Resolvidos</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {filteredFeedbacks.length === 0 ? (
            <div className="p-8 text-center text-zinc-450 dark:text-zinc-500 text-xs">
              Nenhum feedback encontrado com os filtros aplicados.
            </div>
          ) : (
            filteredFeedbacks.map((fb) => {
              const app = appointments.find(a => a.protocol.toUpperCase() === fb.appointmentProtocol.toUpperCase());
              const resolutionStatus = fb.resolutionStatus || (fb.isResolved ? 'Resolvido' : 'Pendente');
              const isResolved = resolutionStatus === 'Resolvido';
              const isInProgress = resolutionStatus === 'Em andamento';
              const isCritical = fb.npsScore <= 6 || /erro|negligência|ruim|péssimo|atraso/i.test(fb.comment);
              const formattedDate = fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
              const successMsg = replySuccessMsgMap[fb.id];
              const cardBgClass = isResolved
                ? 'bg-zinc-50/20 border-zinc-200/30 dark:bg-zinc-955/5 dark:border-zinc-850/50 opacity-75'
                : isInProgress
                ? 'bg-amber-50/30 border-amber-200/50 dark:bg-amber-955/5 dark:border-amber-900/20'
                : isCritical
                ? 'bg-red-50/20 border-red-200/40 dark:bg-red-955/5 dark:border-red-900/20'
                : 'bg-zinc-50/50 border-zinc-200/50 dark:bg-zinc-955/10 dark:border-zinc-850';

              return (
                <div
                  key={fb.id}
                  className={`p-4 rounded-2xl border text-xs space-y-3 transition-all ${cardBgClass}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                        {app?.patientName || 'Paciente Anônimo'}
                      </span>
                      <span className="font-mono bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-650 dark:text-zinc-400">
                        {fb.appointmentProtocol}
                      </span>
                      <span className="text-[10px] text-zinc-450">{formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCritical && !isResolved && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-lg border border-red-200/30 dark:border-red-900/30 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          Alerta Crítico
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 ${
                        isResolved
                          ? 'bg-emerald-50 border border-emerald-250 text-emerald-700 dark:bg-emerald-955/20 dark:border-emerald-900/30'
                          : isInProgress
                          ? 'bg-amber-50 border border-amber-250 text-amber-700 dark:bg-amber-955/20 dark:border-amber-900/30'
                          : 'bg-rose-50 border border-rose-255 text-rose-700 dark:bg-rose-955/20 dark:border-rose-900/30 animate-pulse'
                      }`}>
                        {isResolved ? (
                          <>
                            <Check className="w-2.5 h-2.5" />
                            <span>Resolvido</span>
                          </>
                        ) : isInProgress ? (
                          <>
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '3s' }} />
                            <span>Em andamento</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-2.5 h-2.5 animate-pulse" />
                            <span>Pendente</span>
                          </>
                        )}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                        fb.npsScore >= 9
                          ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-955/20 dark:text-green-900/30'
                          : fb.npsScore >= 7
                          ? 'bg-yellow-50 border border-yellow-200 text-yellow-700 dark:bg-yellow-955/20 dark:text-yellow-900/30'
                          : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-955/20 dark:text-red-400'
                      }`}>
                        Nota: {fb.npsScore}/10
                      </span>
                    </div>
                  </div>

                  <p className="text-zinc-700 dark:text-zinc-355 italic pl-3 border-l-2 border-zinc-200 dark:border-zinc-800">
                    "{fb.comment}"
                  </p>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex-1 min-w-0">
                      {fb.adminResponse && (
                        <div className="p-3 bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-850 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-450">
                            <span>Retorno da Ouvidoria Administrativa (Respondido por: {fb.adminResponseAuthor})</span>
                            <span>{fb.adminResponseAt ? new Date(fb.adminResponseAt).toLocaleDateString('pt-BR') : ''}</span>
                          </div>
                          <p className="text-zinc-655 dark:text-zinc-400 font-semibold">{fb.adminResponse}</p>
                        </div>
                      )}
                      {!fb.adminResponse && (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Escreva uma resposta oficial ao paciente..."
                            value={replyTextMap[fb.id] || ''}
                            onChange={(e) => onReplyTextChange(fb.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                          />
                          <button
                            onClick={() => onSendReply(fb.id)}
                            className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-150 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Enviar
                          </button>
                        </div>
                      )}
                    </div>

                    {(fb.adminResponse || fb.npsScore <= 6) && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {fb.resolutionStatusChangedAt && (
                          <span className="text-[9px] text-zinc-400 text-right">
                            Atualizado em {new Date(fb.resolutionStatusChangedAt).toLocaleString('pt-BR')}
                          </span>
                        )}
                        <div className="flex gap-1.5">
                          {!isInProgress && !isResolved && (
                            <button
                              onClick={() => onSetResolutionStatus(fb.id, 'Em andamento')}
                              className="px-2.5 py-1.5 rounded-xl font-bold text-[10px] bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:border-amber-900/30 dark:text-amber-400 transition-all"
                            >
                              Em andamento
                            </button>
                          )}
                          {!isResolved && (
                            <button
                              onClick={() => onSetResolutionStatus(fb.id, 'Resolvido')}
                              className="px-2.5 py-1.5 rounded-xl font-bold text-[10px] bg-emerald-605 border border-emerald-605 hover:bg-emerald-700 text-white shadow-xs transition-all"
                            >
                              Resolvido
                            </button>
                          )}
                          {(isInProgress || isResolved) && (
                            <button
                              onClick={() => onSetResolutionStatus(fb.id, 'Pendente')}
                              className="px-2.5 py-1.5 rounded-xl font-bold text-[10px] bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 text-zinc-700 transition-all"
                            >
                              Reabrir
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {successMsg && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 animate-pulse">
                      {successMsg}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs flex flex-col gap-6 h-full">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <FileText className="w-5 h-5 text-pink-600" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Exportar Relatórios NPS</h3>
          </div>

          <div className="flex flex-col justify-between flex-1 pt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Data de Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  max={today}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Data de Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  min={startDate}
                  max={today}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-350">Formato:</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="npsFormat"
                    value="pdf"
                    checked={npsExportFormat === 'pdf'}
                    onChange={() => onNpsExportFormatChange('pdf')}
                    className="text-pink-600 focus:ring-pink-500"
                  />
                  PDF
                </label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="npsFormat"
                    value="csv"
                    checked={npsExportFormat === 'csv'}
                    onChange={() => onNpsExportFormatChange('csv')}
                    className="text-pink-600 focus:ring-pink-500"
                  />
                  CSV
                </label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="npsFormat"
                    value="excel"
                    checked={npsExportFormat === 'excel'}
                    onChange={() => onNpsExportFormatChange('excel')}
                    className="text-pink-600 focus:ring-pink-500"
                  />
                  Excel
                </label>
              </div>
            </div>

            <button
              onClick={onExportNpsReport}
              disabled={isExporting}
              className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exportando...' : 'Exportar Relatório NPS'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs flex flex-col gap-6 h-full">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <Mail className="w-5 h-5 text-pink-600" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Agendar Relatórios de NPS</h3>
          </div>

          <form onSubmit={onSaveNpsSchedule} className="flex flex-col justify-between text-xs flex-1 pt-2 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Destinatários (Separados por vírgula)</label>
              <input
                type="text"
                placeholder="diretoria@hospitaldeamor.org.br"
                value={npsRecipients}
                onChange={(e) => onNpsRecipientsChange(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                required
              />
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="npsSchedulerActive"
                checked={isNpsReportScheduled}
                onChange={(e) => onIsNpsReportScheduledChange(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-350 text-pink-600 focus:ring-pink-500 dark:border-zinc-800 dark:bg-zinc-955"
              />
              <label htmlFor="npsSchedulerActive" className="font-semibold text-zinc-700 dark:text-zinc-350 cursor-pointer select-none">
                Habilitar envio trimestral automático
              </label>
            </div>

            <button
              type="submit"
              className="w-full h-11 border border-pink-500 hover:bg-pink-50 text-pink-600 dark:border-pink-400 dark:text-pink-400 dark:hover:bg-pink-955/15 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Settings className="w-4 h-4" />
              Salvar Configurações NPS
            </button>
            {npsReportSuccessMsg && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 text-center animate-pulse">
                {npsReportSuccessMsg}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
