import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
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
import { 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  Info
} from 'lucide-react';

import RescheduleModal from '../../components/patient/status/RescheduleModal';
import WaitlistOfferWidget from '../../components/patient/status/WaitlistOfferWidget';
import CredentialCard from '../../components/patient/status/CredentialCard';
import DocumentCorrectionForm from '../../components/patient/status/DocumentCorrectionForm';
import NpsFeedbackForm from '../../components/patient/status/NpsFeedbackForm';
import AppointmentListFilter from '../../components/patient/status/AppointmentListFilter';

import { getStatusConfig } from '../../components/patient/status/statusUtils';
import StatusHistoryTimeline from '../../components/patient/status/StatusHistoryTimeline';
import ConfirmedSchedulePanel from '../../components/patient/status/ConfirmedSchedulePanel';
import CancelRequestWidget from '../../components/patient/status/CancelRequestWidget';
import AppointmentGeneralDetails from '../../components/patient/status/AppointmentGeneralDetails';

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

  const handleCancelSubmit = async (reason: string) => {
    if (!appointment) return;
    try {
      const updatedApp: Appointment = {
        ...appointment,
        status: 'Cancelado',
        observations: reason.trim() ? `Cancelado pelo paciente: ${reason.trim()}` : 'Cancelado pelo paciente.'
      };
      await updateAppointment(updatedApp);
      await createAuditLog({
        userCpf: appointment.patientCpf,
        userName: appointment.patientName,
        action: `Cancelamento da solicitação de agendamento ${appointment.protocol}`,
        module: 'Paciente',
        ipAddress: '127.0.0.1',
        details: `Justificativa do paciente: ${reason.trim() || 'Nenhuma justificativa fornecida.'}`
      });
      await loadAppointments();
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
                const statusConfig = getStatusConfig(app.status, averageTriageTime);
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
                        <span className="text-[10px] text-zinc-405 block select-none">
                          Solicitado em {new Date(app.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={`${statusConfig.color} px-2 py-0.5 border text-[10px] font-semibold`}>
                          {app.status}
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-zinc-404" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-zinc-404" />
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
                            <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-350">Resumo da Triagem</h4>
                            <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed">
                              {statusConfig.desc}
                            </p>
                          </div>
                        </div>

                        <StatusHistoryTimeline appointment={appointment} />

                        {appointment.status === 'Confirmado' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            <div className="md:col-span-2 space-y-5">
                              <ConfirmedSchedulePanel
                                appointment={appointment}
                                presenceSuccess={presenceSuccess}
                                rescheduleSuccess={rescheduleSuccess}
                                onConfirmPresence={handleConfirmPresence}
                                onCancelPresence={handleCancelPresence}
                                onOpenReschedule={() => setIsRescheduleOpen(true)}
                              />

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
                          <CancelRequestWidget
                            cancelSuccess={cancelSuccess}
                            onCancelSubmit={handleCancelSubmit}
                          />
                        )}

                        {(appointment.status === 'Cancelado' || (appointment.fileAttachment && (appointment.fileAttachment.status === 'Ilegível' || appointment.fileAttachment.status === 'Pendente de Correção'))) && (
                          <DocumentCorrectionForm
                            appointment={appointment}
                            onSubstituteDocument={handleSubstituteDocument}
                          />
                        )}

                        <AppointmentGeneralDetails appointment={appointment} />

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
