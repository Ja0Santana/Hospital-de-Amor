import React from 'react';
import { 
  X, AlertCircle, AlertTriangle, FileText, 
  Calendar, Check, Clock, Tv 
} from 'lucide-react';
import type { Appointment, PatientUser, CapacityLimit, SymptomLog, AppointmentStatus } from '../../../types';

interface TriagemDetailsSidebarProps {
  activeApp: Appointment;
  isClosing: boolean;
  handleCloseTriagem: () => void;
  isActiveAppOfferActive: boolean;
  hasMailBounce: (app: Appointment) => boolean;
  examRequiresEncaminhamento: (examId: string) => boolean;
  renderFeedback: () => React.ReactNode;
  statusInput: AppointmentStatus;
  setStatusInput: (val: AppointmentStatus) => void;
  priorityInput: 'Baixa' | 'Média' | 'Alta';
  setPriorityInput: (val: 'Baixa' | 'Média' | 'Alta') => void;
  handleSaveTriagem: (e: React.FormEvent) => void;
  handleCallTV: () => void;
  newNoteText: string;
  setNewNoteText: (val: string) => void;
  isUrgentNote: boolean;
  setIsUrgentNote: (val: boolean) => void;
  handleAddNote: (e: React.FormEvent) => void;
  isSettingFollowUp: boolean;
  setIsSettingFollowUp: (val: boolean) => void;
  followUpDate: string;
  setFollowUpDate: (val: string) => void;
  followUpIsSuspended: boolean;
  setFollowUpIsSuspended: (val: boolean) => void;
  followUpReason: string;
  setFollowUpReason: (val: string) => void;
  handleSaveFollowUp: (e: React.FormEvent) => void;
  isScheduling: boolean;
  setIsScheduling: (val: boolean) => void;
  scheduleDate: string;
  setScheduleDate: (val: string) => void;
  scheduleTime: string;
  setScheduleTime: (val: string) => void;
  scheduleRoom: string;
  setScheduleRoom: (val: string) => void;
  scheduleDoctor: string;
  setScheduleDoctor: (val: string) => void;
  handleConfirmSchedule: (e: React.FormEvent) => void;
  capacityLimits: CapacityLimit[];
  loggedEmployee: PatientUser;
  symptomLogs: SymptomLog[];
  schedulingErrors: string[];
  setShowOverrideModal: (val: boolean) => void;
  setOverrideReasonInput: (val: string) => void;
  onCheckIn: (id: string) => Promise<void>;
  appointments: Appointment[];
  scheduleSuccess: string;
}

const GRAVE_KEYWORDS = ['febre', 'falta de ar', 'dispneia', 'dor forte', 'dor intensa', 'sangramento', 'convulsão'];

const isSymptomGrave = (symptom: string) => {
  return GRAVE_KEYWORDS.some(kw => symptom.toLowerCase().includes(kw));
};

export default function TriagemDetailsSidebar({
  activeApp,
  isClosing,
  handleCloseTriagem,
  isActiveAppOfferActive,
  hasMailBounce,
  examRequiresEncaminhamento,
  renderFeedback,
  statusInput,
  setStatusInput,
  priorityInput,
  setPriorityInput,
  handleSaveTriagem,
  handleCallTV,
  newNoteText,
  setNewNoteText,
  isUrgentNote,
  setIsUrgentNote,
  handleAddNote,
  isSettingFollowUp,
  setIsSettingFollowUp,
  followUpDate,
  setFollowUpDate,
  followUpIsSuspended,
  setFollowUpIsSuspended,
  followUpReason,
  setFollowUpReason,
  handleSaveFollowUp,
  isScheduling,
  setIsScheduling,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  scheduleRoom,
  setScheduleRoom,
  scheduleDoctor,
  setScheduleDoctor,
  handleConfirmSchedule,
  capacityLimits,
  loggedEmployee,
  symptomLogs,
  schedulingErrors,
  setShowOverrideModal,
  setOverrideReasonInput,
  onCheckIn,
  appointments,
  scheduleSuccess
}: TriagemDetailsSidebarProps) {
  const [visibleLogsCount, setVisibleLogsCount] = React.useState(3);

  const sortedLogs = React.useMemo(() => {
    return [...symptomLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [symptomLogs]);

  const getSymptomBadgeColor = (severity?: string) => {
    switch (severity) {
      case 'Alta': return 'bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400 border border-red-200/20';
      case 'Média': return 'bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-200/20';
      default: return 'bg-zinc-50 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400 border border-zinc-200/20';
    }
  };

  const getSymptomGraveStatus = (logs: SymptomLog[]) => {
    if (logs.length === 0) return null;
    const latest = logs[0];
    const graveItems = latest.symptoms.filter((s: string) => isSymptomGrave(s));
    if (graveItems.length > 0) {
      return (
        <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200/40 rounded-2xl flex items-start gap-2.5 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="text-[11px] font-bold text-red-800 dark:text-red-400 leading-relaxed">
            Atenção: Paciente relatou sintomas graves na triagem móvel!
            <ul className="list-disc list-inside mt-1 font-semibold text-[10px]">
              {graveItems.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderAdminSymptomChart = () => {
    const chartLogs = symptomLogs.slice(-7);
    if (chartLogs.length === 0) return null;

    const width = 360;
    const height = 130;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const pointsCount = chartLogs.length;
    const getX = (index: number) => {
      if (pointsCount <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + (index / (pointsCount - 1)) * chartWidth;
    };

    const getMoodValue = (moodName: string): number => {
      const vals: Record<string, number> = { 'Péssimo': 1, 'Ruim': 2, 'Razoável': 3, 'Bem': 4, 'Ótimo': 5 };
      return vals[moodName] || 3;
    };

    const getY = (val: number) => {
      return paddingTop + chartHeight - ((val - 1) / 4) * chartHeight;
    };

    const pointCoords = chartLogs.map((log, idx) => ({
      x: getX(idx),
      y: getY(getMoodValue(log.mood)),
      log,
    }));

    let pathD = '';
    let areaD = '';

    if (pointCoords.length > 0) {
      pathD = `M ${pointCoords[0].x} ${pointCoords[0].y}`;
      areaD = `M ${pointCoords[0].x} ${paddingTop + chartHeight} L ${pointCoords[0].x} ${pointCoords[0].y}`;

      for (let i = 1; i < pointCoords.length; i++) {
        pathD += ` L ${pointCoords[i].x} ${pointCoords[i].y}`;
        areaD += ` L ${pointCoords[i].x} ${pointCoords[i].y}`;
      }

      areaD += ` L ${pointCoords[pointCoords.length - 1].x} ${paddingTop + chartHeight} Z`;
    }

    const emojis: Record<string, string> = { 'Péssimo': '😠', 'Ruim': '🙁', 'Razoável': '😐', 'Bem': '🙂', 'Ótimo': '😀' };

    return (
      <div className="relative bg-white dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-sm">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="adminChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e31463" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#e31463" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[1, 2, 3, 4, 5].map((val) => (
            <line
              key={val}
              x1={paddingLeft}
              y1={getY(val)}
              x2={width - paddingRight}
              y2={getY(val)}
              className="stroke-zinc-100 dark:stroke-zinc-850"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          ))}

          {Object.entries(emojis).map(([, emoji], idx) => {
            const val = idx + 1;
            return (
              <text
                key={val}
                x={paddingLeft - 8}
                y={getY(val) + 3}
                textAnchor="end"
                className="fill-zinc-400 dark:fill-zinc-500 font-bold text-[8px]"
              >
                {emoji}
              </text>
            );
          })}

          {pointCoords.length > 0 && (
            <>
              <path d={areaD} fill="url(#adminChartGradient)" />
              <path d={pathD} fill="none" stroke="#e31463" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {pointCoords.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                className="fill-white stroke-brand-pink stroke-2"
              />
              <text
                x={pt.x}
                y={height - 5}
                textAnchor="middle"
                className="fill-zinc-400 dark:fill-zinc-500 font-bold text-[7px]"
              >
                {new Date(pt.log.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div 
      onClick={handleCloseTriagem}
      className={`fixed inset-0 bg-black/45 z-50 flex justify-end animate-in fade-in ${
        isClosing ? 'animate-out fade-out duration-300' : ''
      }`}
      style={isClosing ? { animationFillMode: 'forwards' } : undefined}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl bg-white dark:bg-zinc-900 h-full flex flex-col shadow-2xl border-l border-zinc-250 dark:border-zinc-800 animate-in slide-in-from-right duration-300 ${
          isClosing ? 'animate-out slide-out-to-right' : ''
        }`}
        style={isClosing ? { animationFillMode: 'forwards' } : undefined}
      >
        <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-zinc-955 dark:text-zinc-50">Ficha de Triagem</h3>
            <span className="text-[10px] font-mono text-zinc-400 font-bold block mt-1">{activeApp.protocol}</span>
          </div>
          <button
            onClick={handleCloseTriagem}
            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-550 flex items-center justify-center transition-transform hover:rotate-90 duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isActiveAppOfferActive && (
            <div className="p-4 bg-pink-50 dark:bg-pink-955/15 border border-pink-200/40 dark:border-pink-900/20 text-pink-850 dark:text-pink-400 rounded-2xl flex flex-col gap-1.5 animate-in slide-in-from-top-3">
              <div className="flex items-center gap-2 font-black text-xs text-pink-700 dark:text-pink-400">
                <AlertCircle className="w-4 h-4 shrink-0 text-pink-600" />
                <span>Fila Inteligente: Oferta de Vaga Ativa</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Esta solicitação possui uma oferta de vaga automática ativa. As ações manuais de triagem, alteração de status e agendamento estão bloqueadas até o desfecho da oferta (aceite, recusa ou expiração do prazo).
              </p>
            </div>
          )}
          {hasMailBounce(activeApp) && (
            <div className="p-4 bg-red-50 dark:bg-red-955/20 border border-red-205/50 dark:border-red-900/30 text-red-800 dark:text-red-400 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-top-3">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-655" />
                <span>Falha de Comunicação: E-mail não entregue (Bounce)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                A última tentativa de envio de notificação por e-mail para este paciente falhou. 
                <strong> Por favor, entre em contato via telefone ou WhatsApp para prosseguir com a triagem.</strong>
              </p>
              <div className="flex flex-col gap-1 text-[11px] bg-red-100/50 dark:bg-red-955/40 p-2.5 rounded-xl mt-1">
                <div><strong>Telefone do Paciente:</strong> {activeApp.patientPhone || 'Não cadastrado'}</div>
              </div>
            </div>
          )}

          <div className="bg-zinc-50 dark:bg-zinc-955 border border-zinc-200/60 dark:border-zinc-850 p-5 rounded-3xl space-y-4">
            <h4 className="font-extrabold text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Identificação do Paciente</h4>
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="text-[10px] text-zinc-450 block mb-0.5">Nome Completo</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-150">{activeApp.patientName}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-455 block mb-0.5">CPF</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-150">{activeApp.patientCpf}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-455 block mb-0.5">Telefone</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{activeApp.patientPhone}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-455 block mb-0.5">E-mail</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">{activeApp.patientEmail}</span>
              </div>
              <div className="col-span-2 border-t border-zinc-200/50 dark:border-zinc-800 pt-3">
                <span className="text-[10px] text-zinc-455 block mb-0.5">Cidade de Origem</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{activeApp.city}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-955 border border-zinc-200/60 dark:border-zinc-850 p-5 rounded-3xl space-y-4">
            <h4 className="font-extrabold text-xs text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Dados Clínicos / Solicitação</h4>
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="text-[10px] text-zinc-455 block mb-0.5">Especialidade Médica</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-150">{activeApp.specialtyName}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-455 block mb-0.5">Procedimento / Exame</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-150">{activeApp.examName}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-zinc-455 block mb-0.5">Anexo de Encaminhamento Clínico</span>
                {activeApp.fileAttachment ? (
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl mt-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-pink-600" />
                      <div className="text-[11px]">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 block truncate max-w-[280px]">{activeApp.fileAttachment.name}</span>
                        <span className="text-[10px] text-zinc-400">{(activeApp.fileAttachment.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <a
                      href={activeApp.fileAttachment.base64}
                      download={activeApp.fileAttachment.name}
                      className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-xs"
                    >
                      Visualizar
                    </a>
                  </div>
                ) : (
                  <div className="mt-1.5 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 flex items-center gap-2">
                    {examRequiresEncaminhamento(activeApp.examId) ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-655 shrink-0" />
                        <span className="text-[11px] font-bold text-red-700 dark:text-red-400">Documento de encaminhamento obrigatório ausente!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">Este procedimento dispensa documento anexo.</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-955 border border-zinc-200/60 dark:border-zinc-850 p-5 rounded-3xl space-y-4">
            <h4 className="font-extrabold text-xs text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Histórico de Sintomas (Auto-relato Móvel)</h4>
            {getSymptomGraveStatus(symptomLogs)}
            {renderAdminSymptomChart()}
            {symptomLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">Nenhum sintoma reportado pelo paciente via aplicativo.</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {sortedLogs.slice(0, visibleLogsCount).map((log, idx) => (
                    <div key={log.id || idx} className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                        <span className="text-[10px] font-bold text-zinc-400">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                        <span className="text-[10px] font-bold text-zinc-550">Humor: <strong className="text-zinc-800 dark:text-zinc-100">{log.mood}</strong></span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {log.symptoms.map((symptomStr: string, sIdx: number) => (
                          <span 
                            key={sIdx} 
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getSymptomBadgeColor(isSymptomGrave(symptomStr) ? 'Alta' : 'Normal')}`}
                          >
                            {symptomStr}
                          </span>
                        ))}
                      </div>
                      {log.notes && (
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-955 p-2 rounded-xl border border-zinc-100 dark:border-zinc-850">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {symptomLogs.length > 3 && (
                  <div className="flex justify-center pt-2">
                    {visibleLogsCount < symptomLogs.length ? (
                      <button
                        type="button"
                        onClick={() => setVisibleLogsCount(prev => Math.min(prev + 5, symptomLogs.length))}
                        className="text-[11px] font-bold text-pink-650 hover:text-pink-700 hover:underline transition-all"
                      >
                        Ver mais histórico (+5)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setVisibleLogsCount(3)}
                        className="text-[11px] font-bold text-zinc-500 hover:text-zinc-650 hover:underline transition-all"
                      >
                        Recolher histórico
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-955 border border-zinc-200/60 dark:border-zinc-850 p-5 rounded-3xl space-y-4">
            <h4 className="font-extrabold text-xs text-zinc-400 dark:text-zinc-555 uppercase tracking-wider">Anotações Internas de Auditoria</h4>
            <div className="space-y-3">
              {!activeApp.internalNotes || activeApp.internalNotes.length === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">Nenhuma observação interna cadastrada para este caso.</p>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {activeApp.internalNotes.map((note, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-2xl text-xs border ${
                        note.isUrgent 
                          ? 'bg-red-50/50 border-red-200/50 text-red-900 dark:bg-red-955/15 dark:border-red-900/30 dark:text-red-400' 
                          : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mb-1">
                        <span>{note.authorName}</span>
                        <span>{new Date(note.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="font-semibold leading-relaxed">{note.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Inserir nota técnica, observação de triagem ou pendência..."
                  rows={2}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2.5 text-xs bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  required
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="urgent-note-check"
                      checked={isUrgentNote}
                      onChange={(e) => setIsUrgentNote(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-zinc-350 text-red-650 focus:ring-red-500 dark:border-zinc-800 dark:bg-zinc-900"
                    />
                    <label htmlFor="urgent-note-check" className="text-[10px] font-bold text-red-750 dark:text-red-400 uppercase tracking-wider cursor-pointer">
                      Sinalizar como Urgente
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-extrabold text-[10px] rounded-xl transition-all shadow-xs"
                  >
                    Adicionar Nota
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-955 border border-zinc-200/60 dark:border-zinc-850 p-5 rounded-3xl space-y-4">
            <h4 className="font-extrabold text-xs text-zinc-400 dark:text-zinc-555 uppercase tracking-wider">Ações Administrativas / Decisão</h4>
            
            {renderFeedback()}
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCallTV}
                className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-800 hover:bg-pink-50 dark:hover:bg-pink-955/20 text-zinc-700 dark:text-zinc-300 hover:text-pink-600 font-bold rounded-2xl text-[11px] flex items-center justify-center gap-1.5 bg-white dark:bg-zinc-900 transition-all shadow-xs active:scale-97"
              >
                <Tv className="w-4 h-4 text-pink-600" />
                Painel da TV (Chamar)
              </button>
              {activeApp.status === 'Confirmado' && !activeApp.checkInAt && (
                <button
                  type="button"
                  onClick={() => onCheckIn(activeApp.id)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Check className="w-4 h-4 text-white" />
                  Registrar Check-in
                </button>
              )}
            </div>

            <form onSubmit={handleSaveTriagem} className="space-y-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="modal-priority-select" className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">Classificar Prioridade</label>
                  <select
                    id="modal-priority-select"
                    value={priorityInput}
                    onChange={(e) => setPriorityInput(e.target.value as any)}
                    disabled={isActiveAppOfferActive}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer disabled:opacity-50"
                  >
                    <option value="Baixa">Baixa (Padrão)</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="modal-status-select" className="text-[10px] font-bold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider">Alterar Status</label>
                  <select
                    id="modal-status-select"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as any)}
                    disabled={isActiveAppOfferActive}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer disabled:opacity-50"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em análise">Em análise</option>
                    <option value="Reagendamento Pendente">Reagendamento Pendente</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Cancelado">Cancelado</option>
                    <option value="Aguardando Follow-up">Aguardando Acompanhamento</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isActiveAppOfferActive}
                  className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-extrabold rounded-2xl text-[11px] transition-all disabled:opacity-40"
                >
                  Salvar Classificação
                </button>
              </div>
            </form>

            <div className="pt-2 flex flex-col gap-2">
              {!isSettingFollowUp && (
                <button
                  type="button"
                  onClick={() => setIsSettingFollowUp(true)}
                  disabled={isActiveAppOfferActive}
                  className="w-full py-2.5 bg-purple-50 text-purple-750 hover:bg-purple-100 border border-purple-200/50 dark:bg-purple-955/15 dark:text-purple-400 dark:border-purple-900/30 text-xs font-bold rounded-2xl transition-all disabled:opacity-45"
                >
                  Configurar Acompanhamento Clínico (Follow-up)
                </button>
              )}
              {!isScheduling && (
                <button
                  type="button"
                  onClick={() => setIsScheduling(true)}
                  disabled={isActiveAppOfferActive}
                  className="w-full py-2.5 bg-green-50 text-green-755 hover:bg-green-100 border border-green-200/50 dark:bg-green-955/15 dark:text-green-400 dark:border-green-900/30 text-xs font-bold rounded-2xl transition-all disabled:opacity-45"
                >
                  Agendar Consulta Clínico-Exame (Alocar Recurso)
                </button>
              )}
            </div>

            {isSettingFollowUp && (
              <form onSubmit={handleSaveFollowUp} className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 animate-in slide-in-from-bottom-2">
                <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  Configurar Acompanhamento (Follow-up)
                </h4>

                <div className="space-y-1.5">
                  <label htmlFor="f-date" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Data Limite para Acompanhamento</label>
                  <input
                    id="f-date"
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                    required={!followUpIsSuspended}
                    disabled={followUpIsSuspended}
                  />
                </div>

                <div className="space-y-3 bg-zinc-100 dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-850">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="f-suspend"
                      checked={followUpIsSuspended}
                      onChange={(e) => setFollowUpIsSuspended(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-350 text-purple-600 focus:ring-purple-500 dark:border-zinc-800 dark:bg-zinc-955"
                    />
                    <label htmlFor="f-suspend" className="text-xs font-bold text-purple-900 dark:text-purple-400 cursor-pointer">
                      Suspender/Pausar Acompanhamento Clínico
                    </label>
                  </div>

                  {followUpIsSuspended && (
                    <div className="space-y-1.5 animate-in fade-in">
                      <label htmlFor="f-reason" className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">Justificativa da Pausa (Obrigatório)</label>
                      <textarea
                        id="f-reason"
                        rows={2}
                        value={followUpReason}
                        onChange={(e) => setFollowUpReason(e.target.value)}
                        placeholder="Informe o motivo para pausar o acompanhamento deste paciente..."
                        className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                        required={followUpIsSuspended}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingFollowUp(false)}
                    className="flex-1 h-10 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-955 dark:text-zinc-300 text-zinc-700 rounded-xl text-[11px] font-bold transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm"
                  >
                    Confirmar Acompanhamento
                  </button>
                </div>
              </form>
            )}

            {isScheduling && (
              <form onSubmit={handleConfirmSchedule} className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 animate-in slide-in-from-bottom-2">
                <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-pink-600" />
                  Alocação de Recurso & Horário (Confirmar Agendamento)
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="sch-date" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Data da Consulta</label>
                    <input
                      id="sch-date"
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="sch-time" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Horário</label>
                    <select
                      id="sch-time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer"
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="07:00">07:00</option>
                      <option value="07:30">07:30</option>
                      <option value="08:00">08:00</option>
                      <option value="08:30">08:30</option>
                      <option value="09:00">09:00</option>
                      <option value="09:30">09:30</option>
                      <option value="10:00">10:00</option>
                      <option value="10:30">10:30</option>
                      <option value="11:00">11:00</option>
                      <option value="11:30">11:30</option>
                      <option value="13:00">13:00</option>
                      <option value="13:30">13:30</option>
                      <option value="14:00">14:00</option>
                      <option value="14:30">14:30</option>
                      <option value="15:00">15:00</option>
                      <option value="15:30">15:30</option>
                      <option value="16:00">16:00</option>
                      <option value="16:30">16:30</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="sch-room" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Sala do Atendimento</label>
                    {activeApp.statusHistory ? (
                      <select
                        id="sch-room"
                        value={scheduleRoom}
                        onChange={(e) => setScheduleRoom(e.target.value)}
                        className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer"
                        required
                      >
                        <option value="">Selecione a Sala...</option>
                        <option value="Consultório 1">Consultório 1 - Oncologia Geral</option>
                        <option value="Consultório 2">Consultório 2 - Mastologia</option>
                        <option value="Consultório 3">Consultório 3 - Ginecologia</option>
                        <option value="Consultório 4">Consultório 4 - Triagem Geral</option>
                        <option value="Sala de Exames 1">Sala de Exames 1 - Ultrassom</option>
                        <option value="Sala de Exames 2">Sala de Exames 2 - Mamografia</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        id="sch-room"
                        value={scheduleRoom}
                        onChange={(e) => setScheduleRoom(e.target.value)}
                        placeholder="Digite o nome da sala..."
                        className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                        required
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="sch-doctor" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Profissional / Médico Responsável</label>
                    <select
                      id="sch-doctor"
                      value={scheduleDoctor}
                      onChange={(e) => setScheduleDoctor(e.target.value)}
                      className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer"
                      required
                    >
                      <option value="">Selecione o Profissional...</option>
                      <option value="Dr. Carlos Silva (CRM 12345)">Dr. Carlos Silva - Mastologia</option>
                      <option value="Dra. Ana Costa (CRM 67890)">Dra. Ana Costa - Ginecologia</option>
                      <option value="Dr. Marcos Souza (CRM 54321)">Dr. Marcos Souza - Oncologia Geral</option>
                      <option value="Enf. Beatriz Pires (COREN 98765)">Enf. Beatriz Pires - Triagem Clínica</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1.5">
                  {(() => {
                    if (!scheduleDate) return null;
                    const limitObj = capacityLimits.find(l => l.examId === activeApp.examId);
                    if (limitObj) {
                      const dailyLimit = limitObj.dailyLimit;
                      const count = appointments.filter(app => {
                        if (app.id === activeApp.id) return false;
                        if (app.examId !== activeApp.examId) return false;
                        const appDate = app.rescheduledDate || '';
                        return (app.status === 'Confirmado' || app.status === 'Reagendamento Pendente') && appDate === scheduleDate;
                      }).length;
                      const usageRatio = (count + 1) / dailyLimit;
                      const isNearLimit = usageRatio >= 0.8;
                      const isExceeded = count >= dailyLimit;

                      return (
                        <div className={`col-span-2 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                          isExceeded
                            ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                            : isNearLimit
                              ? 'bg-amber-50 border-amber-250 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30 animate-pulse'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30'
                        }`}>
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <div>
                            <span>Vagas preenchidas: <strong>{count} de {dailyLimit}</strong> para este exame na data.</span>
                            {isExceeded && <p className="text-[10px] font-bold text-red-655 dark:text-red-400 mt-0.5">Capacidade esgotada! O agendamento será rejeitado.</p>}
                            {!isExceeded && isNearLimit && <p className="text-[10px] font-bold text-amber-655 dark:text-amber-400 mt-0.5">Atenção: Data com 80% ou mais da capacidade máxima preenchida!</p>}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {schedulingErrors.length > 0 && (
                  <div className="p-3.5 rounded-2xl text-xs font-semibold bg-red-50 border border-red-200 text-red-800 dark:bg-red-955/20 dark:text-red-400 dark:border-red-900/30 space-y-1.5 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-655" />
                      <span>Impedimentos de Agendamento Detectados:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] font-medium">
                      {schedulingErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                    {loggedEmployee.role === 'gestor' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowOverrideModal(true);
                          setOverrideReasonInput('');
                        }}
                        className="w-full mt-2 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-white animate-pulse" />
                        <span>Forçar Agendamento (Override de Gestor)</span>
                      </button>
                    )}
                  </div>
                )}

                {scheduleSuccess && (
                  <div className="p-3.5 rounded-2xl text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30 flex items-center gap-2 animate-in slide-in-from-top-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{scheduleSuccess}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsScheduling(false)}
                    className="flex-1 h-10 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-955 dark:text-zinc-300 text-zinc-700 rounded-xl text-[11px] font-bold transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm shadow-green-600/15"
                  >
                    Confirmar e Salvar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
