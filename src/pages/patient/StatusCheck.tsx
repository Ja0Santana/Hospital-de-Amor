import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Label } from '../../components/ui/Label';
import { 
  getAppointmentByCpf, 
  getSpecialties, 
  updateAppointment, 
  getAverageTriageTime, 
  createAuditLog, 
  saveFeedback, 
  triggerConfirmationEmail, 
  getFeedbacks, 
  acceptWaitlistOffer, 
  rejectWaitlistOffer, 
  checkAndProcessExpiredOffers 
} from '../../services/db';
import type { Appointment, Specialty, FeedbackResponse } from '../../types';
import { formatCpf } from '../../lib/sanitizer';
import { 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

import RescheduleModal from '../../components/patient/status/RescheduleModal';
import WaitlistOfferWidget from '../../components/patient/status/WaitlistOfferWidget';
import CredentialCard from '../../components/patient/status/CredentialCard';
import DocumentCorrectionForm from '../../components/patient/status/DocumentCorrectionForm';
import NpsFeedbackForm from '../../components/patient/status/NpsFeedbackForm';
import AppointmentListFilter from '../../components/patient/status/AppointmentListFilter';

interface StatusCheckProps {
  initialProtocol?: string;
  onNavigate: (page: string) => void;
  patientCpf: string;
}

export default function StatusCheck({ initialProtocol = '', onNavigate, patientCpf }: StatusCheckProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState(initialProtocol);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | Appointment['status']>('Todos');
  const [averageTriageTime, setAverageTriageTime] = useState<string>('');
  
  const [presenceSuccess, setPresenceSuccess] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const appointment = appointments.find((app) => app.protocol === selectedProtocol) || null;

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndProcessExpiredOffers().then(() => {
        getAppointmentByCpf(patientCpf).then((results) => {
          const sorted = results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAppointments(sorted);
        }).catch(console.error);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [patientCpf]);

  useEffect(() => {
    if (appointment && appointment.status === 'Confirmado') {
      QRCode.toDataURL(`HA-QR|${appointment.protocol}|${appointment.id}`, { margin: 1, width: 250 }, (err, url) => {
        if (!err) {
          setQrCodeUrl(url);
        }
      });
    } else {
      setQrCodeUrl('');
    }
  }, [appointment]);

  useEffect(() => {
    getSpecialties().then(setSpecialties).catch(console.error);
    getAverageTriageTime().then(setAverageTriageTime).catch(console.error);
    loadAppointments();
    const handleReactiveAppointment = () => {
      loadAppointments();
    };
    window.addEventListener('appointment-created-reactively', handleReactiveAppointment);
    return () => {
      window.removeEventListener('appointment-created-reactively', handleReactiveAppointment);
    };
  }, [patientCpf]);

  useEffect(() => {
    if (initialProtocol) {
      setSelectedProtocol(initialProtocol);
    }
  }, [initialProtocol]);

  useEffect(() => {
    setPresenceSuccess(false);
    setRescheduleSuccess(false);
    setIsCancelOpen(false);
    setCancelReason('');
    setCancelSuccess(false);
  }, [selectedProtocol]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      await checkAndProcessExpiredOffers();
      const results = await getAppointmentByCpf(patientCpf);
      const sorted = results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAppointments(sorted);
      
      const allFeedbacks = await getFeedbacks();
      setFeedbacks(allFeedbacks);

      if (initialProtocol) {
        setSelectedProtocol(initialProtocol);
      } else if (!selectedProtocol && sorted.length > 0) {
        setSelectedProtocol(sorted[0].protocol);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === 'Pendente').length;
  const analysisCount = appointments.filter((a) => a.status === 'Em análise').length;
  const confirmedCount = appointments.filter((a) => a.status === 'Confirmado').length;
  const cancelledCount = appointments.filter((a) => a.status === 'Cancelado').length;
  const reschedulePendingCount = appointments.filter((a) => a.status === 'Reagendamento Pendente').length;

  const filteredAppointments = appointments.filter((app) => {
    const matchesText = app.examName.toLowerCase().includes(filterText.toLowerCase()) ||
                        app.protocol.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || app.status === statusFilter;
    return matchesText && matchesStatus;
  });

  useEffect(() => {
    if (selectedProtocol) {
      const isStillVisible = filteredAppointments.some((app) => app.protocol === selectedProtocol);
      if (!isStillVisible) {
        setSelectedProtocol('');
      }
    }
  }, [filteredAppointments, selectedProtocol]);

  const handleFeedbackSubmit = async (score: number, comment: string) => {
    if (!appointment) return;
    const sessionId = sessionStorage.getItem('patient_session_id') || 'session-unknown';
    await saveFeedback({
      appointmentProtocol: appointment.protocol,
      npsScore: score,
      comment: comment,
      userCpf: appointment.patientCpf,
      originSessionId: sessionId,
      originIp: '127.0.0.1'
    });
    await loadAppointments();
  };

  const handleConfirmPresence = async () => {
    if (!appointment) return;
    try {
      const updatedApp: Appointment = {
        ...appointment,
        presenceConfirmed: true,
        presenceConfirmedAt: new Date().toISOString()
      };
      await updateAppointment(updatedApp);
      await loadAppointments();
      setPresenceSuccess(true);
      setTimeout(() => setPresenceSuccess(false), 5000);
      window.dispatchEvent(new CustomEvent('appointment-updated'));
    } catch (error) {
      console.error(error);
    }
  };

  const canCancelPresence = () => {
    if (!appointment || !appointment.rescheduledDate) return false;
    const appointmentDateTime = new Date(`${appointment.rescheduledDate}T${appointment.rescheduledTime || '08:00'}:00`);
    const now = new Date();
    const diffMs = appointmentDateTime.getTime() - now.getTime();
    return diffMs > 24 * 60 * 60 * 1000;
  };

  const handleCancelPresence = async () => {
    if (!appointment) return;
    try {
      const updatedApp: Appointment = {
        ...appointment,
        presenceConfirmed: false,
        presenceConfirmedAt: undefined
      };
      await updateAppointment(updatedApp);
      await loadAppointments();
      alert('Confirmação de presença cancelada com sucesso!');
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendEmail = async () => {
    if (!appointment) return;
    try {
      await triggerConfirmationEmail(appointment);
      alert('Comprovante enviado por e-mail com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar o comprovante por e-mail.');
    }
  };

  const handleSendWhatsapp = () => {
    if (!appointment) return;
    const dateStr = appointment.rescheduledDate ? new Date(appointment.rescheduledDate + 'T12:00:00').toLocaleDateString('pt-BR') : '';
    const text = `Olá! Segue o comprovante do meu agendamento no Hospital de Amor:\n\nProtocolo: ${appointment.protocol}\nExame: ${appointment.examName}\nEspecialidade: ${appointment.specialtyName}\nData: ${dateStr}\nHora: ${appointment.rescheduledTime || ''}\nSala: ${appointment.scheduledRoom || ''}\nMédico: ${appointment.scheduledDoctor || ''}\n\nPara instruções de preparo e acesso ao comprovante completo, utilize o link:\n${window.location.origin}?page=status-check&protocol=${appointment.protocol}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRescheduleSubmit = async (date: Date, time: string, reason: string) => {
    if (!appointment) return;
    const formattedDate = date.toISOString().split('T')[0];
    const updatedApp: Appointment = {
      ...appointment,
      status: 'Reagendamento Pendente',
      rescheduledDate: formattedDate,
      rescheduledTime: time,
      rescheduleReason: reason
    };
    await updateAppointment(updatedApp);
    await loadAppointments();
    setRescheduleSuccess(true);
    setTimeout(() => setRescheduleSuccess(false), 5000);
    window.dispatchEvent(new CustomEvent('appointment-updated'));
  };

  const handleSubstituteDocument = async (file: { name: string; type: string; size: number; base64: string }) => {
    if (!appointment) return;
    const history = appointment.rejectedFilesHistory ? [...appointment.rejectedFilesHistory] : [];
    if (appointment.fileAttachment) {
      history.push({
        ...appointment.fileAttachment
      });
    }

    const updatedApp: Appointment = {
      ...appointment,
      status: 'Em análise',
      fileAttachment: {
        ...file,
        status: 'Pendente'
      },
      rejectedFilesHistory: history,
      observations: 'Documento substituído pelo paciente.'
    };

    await updateAppointment(updatedApp);
    await loadAppointments();
    window.dispatchEvent(new CustomEvent('appointment-updated'));
  };

  const handleCancelSubmit = async () => {
    if (!appointment) return;
    try {
      const updatedApp: Appointment = {
        ...appointment,
        status: 'Cancelado',
        observations: cancelReason.trim() ? `Cancelado pelo paciente: ${cancelReason.trim()}` : 'Cancelado pelo paciente.'
      };
      await updateAppointment(updatedApp);
      await createAuditLog({
        userCpf: appointment.patientCpf,
        userName: appointment.patientName,
        action: `Cancelamento da solicitação de agendamento ${appointment.protocol}`,
        module: 'Paciente',
        ipAddress: '127.0.0.1',
        details: `Justificativa do paciente: ${cancelReason.trim() || 'Nenhuma justificativa fornecida.'}`
      });
      await loadAppointments();
      setIsCancelOpen(false);
      setCancelReason('');
      setCancelSuccess(true);
      setTimeout(() => setCancelSuccess(false), 5000);
      window.dispatchEvent(new CustomEvent('appointment-updated'));
    } catch (error) {
      console.error(error);
    }
  };

  const getNext5BusinessDays = () => {
    const dates: Date[] = [];
    const current = new Date();
    let loops = 0;
    while (dates.length < 5 && loops < 15) {
      current.setDate(current.getDate() + 1);
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        dates.push(new Date(current));
      }
      loops++;
    }
    return dates;
  };

  const getStatusConfig = (status: Appointment['status']) => {
    const config: Record<Appointment['status'], { color: string; icon: any; desc: React.ReactNode }> = {
      'Pendente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock, desc: 'Sua solicitação está na fila de espera e será revisada por nossa equipe médica em até 48 horas úteis.' },
      'Em análise': {
        color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
        icon: Clock,
        desc: (
          <span>
            Nossos recepcionistas estão revisando o documento e o encaminhamento enviado. Estimativa de resposta:{' '}
            {averageTriageTime ? (
              <span className="font-semibold">{averageTriageTime}</span>
            ) : (
              <span className="inline-block w-20 h-3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded align-middle" />
            )}
            .
          </span>
        )
      },
      'Confirmado': { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2, desc: 'Parabéns! Sua triagem foi concluída e sua consulta/exame está agendado e confirmado.' },
      'Cancelado': { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, desc: 'Sua solicitação de agendamento foi cancelada pela triagem administrativa.' },
      'Reagendamento Pendente': { color: 'bg-amber-100 text-amber-800 border-amber-250 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock, desc: 'Sua solicitação de alteração de horário foi enviada para a triagem e está sob análise administrativa.' },
      'Aguardando Follow-up': { color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400', icon: Clock, desc: 'Sua solicitação possui pendências sob acompanhamento. Aguarde contato da nossa equipe.' },
      'Concluído': { color: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800/30 dark:text-zinc-400', icon: CheckCircle2, desc: 'Seu atendimento foi concluído com sucesso. Agradecemos pela sua confiança!' },
      'Arquivado por Documentação Pendente': { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400', icon: XCircle, desc: 'Sua solicitação foi arquivada por falta de envio dos documentos solicitados dentro do prazo.' }
    };
    return config[status] || config['Pendente'];
  };

  const getExamInstructions = () => {
    if (!appointment) return '';
    const spec = specialties.find((s) => s.id === appointment.specialtyId);
    const exam = spec?.exams.find((e) => e.id === appointment.examId);
    return exam?.defaultPrepInstructions || '';
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-4 py-6 text-left">
      <div>
        <Button variant="link" onClick={() => onNavigate('dashboard')} className="text-primary p-0 h-auto font-semibold mb-2">
          ← Voltar ao Início
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-55 font-sans">Meus Agendamentos</h1>
        <p className="text-zinc-500 mt-1">Acompanhe e gerencie as suas solicitações de consultas e exames.</p>
      </div>

      {loading && appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50/50 dark:bg-zinc-900/10 rounded-3xl border border-zinc-150 dark:border-zinc-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-zinc-500 mt-4 font-semibold text-sm">Carregando seus agendamentos...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-50/50 dark:bg-zinc-900/10 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 animate-in fade-in">
          <AlertCircle className="w-12 h-12 text-zinc-400 mb-3" />
          <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-lg">Nenhum agendamento encontrado</h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            Você não possui nenhuma solicitação de agendamento realizada até o momento.
          </p>
          <Button 
            onClick={() => onNavigate('new-request')}
            className="mt-6 bg-primary hover:bg-primary/95 text-white font-bold h-10 px-5 rounded-xl text-xs transition-transform active:scale-95 shadow-sm"
          >
            Solicitar Novo Agendamento
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <AppointmentListFilter
            filterText={filterText}
            setFilterText={setFilterText}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            totalCount={totalCount}
            pendingCount={pendingCount}
            analysisCount={analysisCount}
            confirmedCount={confirmedCount}
            cancelledCount={cancelledCount}
            reschedulePendingCount={reschedulePendingCount}
          />

          {filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-50/50 dark:bg-zinc-900/10 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 animate-in fade-in">
              <AlertCircle className="w-12 h-12 text-zinc-400 mb-3" />
              <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-lg">Nenhum resultado encontrado</h3>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                Não encontramos agendamentos correspondentes aos filtros selecionados.
              </p>
              <Button 
                onClick={() => {
                  setFilterText('');
                  setStatusFilter('Todos');
                }}
                className="mt-6 bg-primary hover:bg-primary/95 text-white font-bold h-10 px-5 rounded-xl text-xs transition-transform active:scale-95 shadow-sm"
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((app) => {
                const isExpanded = selectedProtocol === app.protocol;
                return (
                  <Card key={app.id} className={`border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 transition-all ${isExpanded ? 'ring-1 ring-primary/20 shadow-md' : 'hover:border-primary/20'}`}>
                    <button 
                      type="button"
                      onClick={() => setSelectedProtocol(isExpanded ? '' : app.protocol)}
                      className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors focus:outline-none"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 truncate">{app.examName}</h3>
                          <Badge variant="outline" className="font-mono text-[9px] font-semibold text-zinc-400 border-zinc-200 dark:border-zinc-800 py-0 px-1.5 shrink-0 select-none">
                            {app.protocol}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-zinc-400 block select-none">
                          Solicitado em {new Date(app.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={`${getStatusConfig(app.status).color} px-2 py-0.5 border text-[10px] font-semibold`}>
                          {app.status}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-zinc-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && appointment && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800 p-6 space-y-6 bg-zinc-50/20 dark:bg-zinc-900/10 animate-in slide-in-from-top-2 duration-200">
                        {appointment.waitingListOfferExpiresAt && new Date(appointment.waitingListOfferExpiresAt) > new Date() && (
                          <WaitlistOfferWidget
                            expiresAt={appointment.waitingListOfferExpiresAt}
                            date={appointment.rescheduledDate || ''}
                            time={appointment.rescheduledTime || ''}
                            doctor={appointment.scheduledDoctor || ''}
                            room={appointment.scheduledRoom || ''}
                            onAccept={async () => {
                              try {
                                await acceptWaitlistOffer(appointment.id);
                                await loadAppointments();
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            onReject={async () => {
                              if (window.confirm('Tem certeza de que deseja recusar esta vaga? Ela será ofertada para o próximo da fila.')) {
                                try {
                                  await rejectWaitlistOffer(appointment.id);
                                  await loadAppointments();
                                } catch (e) {
                                  console.error(e);
                                }
                              }
                            }}
                          />
                        )}

                        <div className="p-4 bg-white dark:bg-zinc-955 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex gap-3 items-start shadow-xs">
                          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-300">Resumo da Triagem</h4>
                            <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">
                              {getStatusConfig(appointment.status).desc}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Histórico de Atualizações</h4>
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800 p-5 rounded-2xl shadow-xs space-y-4">
                            {(() => {
                              const history = appointment.statusHistory && appointment.statusHistory.length > 0
                                ? appointment.statusHistory
                                : [{ status: 'Pendente' as const, changedAt: appointment.createdAt }];
                              
                              return (
                                <div className="relative pl-6 space-y-4 border-l border-zinc-150 dark:border-zinc-800">
                                  {history.map((h, index) => {
                                    const isLast = index === history.length - 1;
                                    return (
                                      <div key={index} className="relative">
                                        <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white dark:border-zinc-950 flex items-center justify-center ${
                                          isLast ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700'
                                        }`} />
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-xs font-bold ${isLast ? 'text-primary' : 'text-zinc-750 dark:text-zinc-350'}`}>
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
                              );
                            })()}
                          </div>
                        </div>

                        {appointment.status === 'Confirmado' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            <div className="md:col-span-2 space-y-5">
                              <div className="bg-green-50/20 dark:bg-green-955/10 border border-green-200/30 dark:border-green-800/20 p-5 rounded-2xl space-y-4">
                                <h3 className="font-extrabold text-sm text-green-800 dark:text-green-400 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Dados da Agenda Confirmada
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                                  <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Data e Horário</span>
                                    <p className="font-semibold text-zinc-805 dark:text-zinc-200 flex items-center gap-1.5">
                                      <Calendar className="w-4 h-4 text-primary" />
                                      {appointment.rescheduledDate && appointment.rescheduledTime ? (
                                        <span>
                                          {new Date(appointment.rescheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')} às {appointment.rescheduledTime}h <span className="text-[10px] text-primary font-bold ml-1">(Reagendado)</span>
                                        </span>
                                      ) : (
                                        <span>15/06/2026 às 08:30h</span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Profissional Responsável</span>
                                    <p className="font-semibold text-zinc-805 dark:text-zinc-200 flex items-center gap-1.5">
                                      <User className="w-4 h-4 text-primary" />
                                      {appointment.scheduledDoctor || 'Dra. Patrícia Arantes (Mastologista)'}
                                    </p>
                                  </div>
                                  <div className="space-y-1 sm:col-span-2">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Local do Atendimento</span>
                                    <p className="font-semibold text-zinc-805 dark:text-zinc-200 flex items-center gap-1.5">
                                      <MapPin className="w-4 h-4 text-primary" />
                                      {appointment.scheduledRoom || 'Unidade Principal - Bloco B, Sala de Exames 03 (Mamógrafo 01)'}
                                    </p>
                                  </div>
                                </div>

                                {presenceSuccess && (
                                  <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-805 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Presença confirmada com sucesso!
                                  </div>
                                )}
                                {rescheduleSuccess && (
                                  <div className="p-3 bg-blue-50 dark:bg-blue-955/20 border border-blue-200 dark:border-blue-800/30 text-blue-805 dark:text-blue-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                                    <Info className="w-4 h-4" />
                                    Atendimento reagendado com sucesso!
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-2.5 pt-3 border-t border-zinc-150 dark:border-zinc-800/50">
                                  {appointment.presenceConfirmed ? (
                                    <div className="flex items-center gap-2">
                                      <div className="bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40 font-bold px-3 py-1.5 text-[11px] rounded-xl flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100 dark:fill-emerald-950" />
                                        Presença Confirmada
                                      </div>
                                      {canCancelPresence() && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={handleCancelPresence}
                                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-955/20 h-9 px-3 rounded-xl text-xs flex items-center gap-1 transition-all active:scale-95"
                                        >
                                          Cancelar Confirmação
                                        </Button>
                                      )}
                                    </div>
                                  ) : (
                                    <Button
                                      type="button"
                                      onClick={handleConfirmPresence}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      Confirmar Presença
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setIsRescheduleOpen(true);
                                    }}
                                    className="border-zinc-200/80 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 bg-white dark:bg-zinc-950"
                                  >
                                    <Calendar className="w-4 h-4 text-primary" />
                                    Reagendar Atendimento
                                  </Button>
                                </div>
                              </div>

                              {getExamInstructions() && (
                                <div className="space-y-2">
                                  <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Instruções de Preparo para o Dia</h4>
                                  <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/80 p-4 rounded-xl text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed shadow-xs">
                                    {getExamInstructions()}
                                  </div>
                                </div>
                              )}
                            </div>

                            <CredentialCard
                              qrCodeUrl={qrCodeUrl}
                              onPrint={() => window.print()}
                              onSendEmail={handleSendEmail}
                              onSendWhatsapp={handleSendWhatsapp}
                            />
                          </div>
                        )}

                        {(appointment.status !== 'Confirmado' && appointment.status !== 'Cancelado' && appointment.status !== 'Concluído') && (
                          <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800/50 space-y-4">
                            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Ações da Solicitação</h4>
                            {cancelSuccess ? (
                              <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                                <Info className="w-4 h-4" />
                                Solicitação cancelada com sucesso!
                              </div>
                            ) : isCancelOpen ? (
                              <div className="bg-red-50/10 dark:bg-red-950/5 border border-red-200/30 dark:border-red-800/20 p-4 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-200">
                                <Label htmlFor="cancelReason" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                  Por favor, informe o motivo do cancelamento:
                                </Label>
                                <textarea
                                  id="cancelReason"
                                  rows={2}
                                  value={cancelReason}
                                  onChange={(e) => setCancelReason(e.target.value)}
                                  placeholder="Digite o motivo..."
                                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-primary focus:outline-none dark:text-zinc-100"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsCancelOpen(false);
                                      setCancelReason('');
                                    }}
                                    className="text-xs h-8 px-3 rounded-lg"
                                  >
                                    Desistir
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleCancelSubmit}
                                    className="text-xs h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                                  >
                                    Confirmar Cancelamento
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setIsCancelOpen(true)}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                              >
                                <XCircle className="w-4 h-4" />
                                Cancelar Solicitação
                              </Button>
                            )}
                          </div>
                        )}

                        {(appointment.status === 'Cancelado' || (appointment.fileAttachment && (appointment.fileAttachment.status === 'Ilegível' || appointment.fileAttachment.status === 'Pendente de Correção'))) && (
                          <DocumentCorrectionForm
                            appointment={appointment}
                            onSubstituteDocument={handleSubstituteDocument}
                          />
                        )}

                        <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Dados Gerais da Solicitação</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                            <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">Paciente:</strong> {appointment.patientName}</p>
                            <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">CPF:</strong> {formatCpf(appointment.patientCpf)}</p>
                            <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">Especialidade:</strong> {appointment.specialtyName}</p>
                            <p><strong className="text-zinc-800 dark:text-zinc-300 font-medium">Exame Solicitado:</strong> {appointment.examName}</p>
                            <p className="sm:col-span-2">
                              <strong className="text-zinc-800 dark:text-zinc-300 font-medium">Localidade:</strong> {appointment.city} ({appointment.state})
                            </p>
                          </div>
                        </div>

                        {(appointment.status === 'Confirmado' || appointment.status === 'Concluído') && (
                          <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850">
                            <NpsFeedbackForm
                              appointmentProtocol={appointment.protocol}
                              appointmentFeedbackNps={appointment.feedbackNps}
                              appointmentCreatedAt={appointment.createdAt}
                              appointmentStatusHistory={appointment.statusHistory}
                              feedbacks={feedbacks}
                              onSubmitNps={handleFeedbackSubmit}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      <RescheduleModal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onSubmit={handleRescheduleSubmit}
        nextBusinessDays={getNext5BusinessDays()}
      />
    </div>
  );
}
