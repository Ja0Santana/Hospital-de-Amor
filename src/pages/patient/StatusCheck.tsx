import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { getAppointmentByCpf, getSpecialties, updateAppointment, getAverageTriageTime, createAuditLog, saveFeedback, triggerConfirmationEmail, getFeedbacks, acceptWaitlistOffer, rejectWaitlistOffer, checkAndProcessExpiredOffers } from '../../services/db';
import type { Appointment, Specialty, FeedbackResponse } from '../../types';
import { formatCpf } from '../../lib/sanitizer';
import { Calendar, MapPin, User, Clock, AlertCircle, CheckCircle2, XCircle, Info, Star, MessageSquare, X, Upload, FileText, Eye, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';

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
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      checkAndProcessExpiredOffers().then(() => {
        getAppointmentByCpf(patientCpf).then((results) => {
          const sorted = results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAppointments(sorted);
        }).catch(console.error);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [patientCpf]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | Appointment['status']>('Todos');
  const [averageTriageTime, setAverageTriageTime] = useState<string>('');
  
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [npsComment, setNpsComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [simulatedHours, setSimulatedHours] = useState(0);

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [presenceSuccess, setPresenceSuccess] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [submittingFile, setSubmittingFile] = useState(false);
  const [fileError, setFileError] = useState('');
  const [substituteSuccess, setSubstituteSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const appointment = appointments.find((app) => app.protocol === selectedProtocol) || null;

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
  }, [patientCpf]);

  useEffect(() => {
    if (initialProtocol) {
      setSelectedProtocol(initialProtocol);
    }
  }, [initialProtocol]);

  useEffect(() => {
    setFeedbackSuccess(false);
    setFeedbackError('');
    setNpsScore(null);
    setNpsComment('');
    setPresenceSuccess(false);
    setRescheduleSuccess(false);
    setSubstituteSuccess(false);
    setSelectedFile(null);
    setFileError('');
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRescheduleOpen(false);
      }
    };
    if (isRescheduleOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRescheduleOpen]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;
    if (npsScore === null) {
      setFeedbackError('Por favor, selecione uma nota de 0 a 10.');
      return;
    }
    if (!npsComment.trim()) {
      setFeedbackError('Por favor, escreva um comentário sobre o seu atendimento.');
      return;
    }
    if (!window.confirm(`Confirma o envio da sua avaliação com a nota ${npsScore}?`)) {
      return;
    }
    try {
      const sessionId = sessionStorage.getItem('patient_session_id') || 'session-unknown';
      await saveFeedback({
        appointmentProtocol: appointment.protocol,
        npsScore: npsScore,
        comment: npsComment.trim(),
        userCpf: appointment.patientCpf,
        originSessionId: sessionId,
        originIp: '127.0.0.1'
      });
      await loadAppointments();
      setFeedbackSuccess(true);
      setFeedbackError('');
    } catch (error) {
      console.error(error);
      setFeedbackError('Ocorreu um erro ao enviar o feedback. Tente novamente.');
    }
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

  const getFeedbackStatus = () => {
    if (!appointment) return { visible: false, reason: 'none' };
    const historyItem = [...(appointment.statusHistory || [])]
      .reverse()
      .find(h => h.status === 'Confirmado' || h.status === 'Concluído');
    const baseDate = historyItem ? new Date(historyItem.changedAt) : new Date(appointment.createdAt);
    const changeTime = baseDate.getTime();
    const simulatedNow = new Date().getTime() + simulatedHours * 60 * 60 * 1000;
    const hoursElapsed = (simulatedNow - changeTime) / (1000 * 60 * 60);
    if (hoursElapsed < 24) {
      const availableDate = new Date(changeTime + 24 * 60 * 60 * 1000);
      return {
        visible: false,
        reason: 'pending_24h',
        availableAt: availableDate.toLocaleString('pt-BR')
      };
    }
    if (hoursElapsed > 24 + (7 * 24)) {
      return { visible: false, reason: 'expired' };
    }
    return { visible: true };
  };

  const handleRescheduleSubmit = async () => {
    if (!appointment || !selectedDate || !selectedTime) return;
    if (!rescheduleReason.trim()) {
      setRescheduleError('Por favor, informe o motivo da solicitação de reagendamento.');
      return;
    }
    setRescheduleError('');
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const updatedApp: Appointment = {
        ...appointment,
        status: 'Reagendamento Pendente',
        rescheduledDate: formattedDate,
        rescheduledTime: selectedTime,
        rescheduleReason: rescheduleReason.trim()
      };
      await updateAppointment(updatedApp);
      await loadAppointments();
      setIsRescheduleOpen(false);
      setRescheduleSuccess(true);
      setTimeout(() => setRescheduleSuccess(false), 5000);
      window.dispatchEvent(new CustomEvent('appointment-updated'));
    } catch (error: any) {
      console.error(error);
      setRescheduleError(error.message || 'Erro ao solicitar reagendamento.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const forbiddenExtensions = ['.exe', '.bat', '.sh', '.msi', '.cmd', '.js', '.vbs'];
    const fileName = file.name.toLowerCase();
    const isForbidden = forbiddenExtensions.some((ext) => fileName.endsWith(ext));

    if (isForbidden) {
      setFileError('Arquivo não permitido. Selecione apenas imagens (JPG, PNG) ou PDF.');
      setSelectedFile(null);
      return;
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.type)) {
      setFileError('Tipo de arquivo inválido. Apenas imagens (JPG/PNG) ou PDF são aceitos.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('O arquivo excede o limite máximo de 5MB.');
      setSelectedFile(null);
      return;
    }

    setFileError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment || !selectedFile) return;

    setSubmittingFile(true);
    setFileError('');

    try {
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
          ...selectedFile,
          status: 'Pendente'
        },
        rejectedFilesHistory: history,
        observations: 'Documento substituído pelo paciente.'
      };

      await updateAppointment(updatedApp);
      await loadAppointments();
      setSubstituteSuccess(true);
      setSelectedFile(null);
      window.dispatchEvent(new CustomEvent('appointment-updated'));
    } catch (error) {
      console.error(error);
      setFileError('Erro ao atualizar o documento. Tente novamente.');
    } finally {
      setSubmittingFile(false);
    }
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
      if (day !== 0 && day !== 6) { // Pula Domingo (0) e Sábado (6)
        dates.push(new Date(current));
      }
      loops++;
    }
    return dates;
  };

  const getStatusConfig = (status: Appointment['status']) => {
    const config: Record<Appointment['status'], { color: string; icon: React.ComponentType<any>; desc: React.ReactNode }> = {
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
    <div className="space-y-8 max-w-3xl mx-auto px-4 py-6">
      <div>
        <Button variant="link" onClick={() => onNavigate('dashboard')} className="text-primary p-0 h-auto font-semibold mb-2">
          ← Voltar ao Início
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Meus Agendamentos</h1>
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
          <div className="space-y-4 bg-zinc-50/30 dark:bg-zinc-900/20 p-4 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/80">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por nome do exame ou protocolo..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-primary focus:outline-none dark:text-zinc-100 transition-all shadow-xs"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('Todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === 'Todos' ? 'bg-primary border-primary text-white scale-[1.02] shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:border-primary/20 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400'}`}
              >
                Todos ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Pendente')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === 'Pendente' ? 'bg-primary border-primary text-white scale-[1.02] shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:border-primary/20 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400'}`}
              >
                Pendente ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Em análise')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === 'Em análise' ? 'bg-primary border-primary text-white scale-[1.02] shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:border-primary/20 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400'}`}
              >
                Em análise ({analysisCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Confirmado')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === 'Confirmado' ? 'bg-primary border-primary text-white scale-[1.02] shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:border-primary/20 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400'}`}
              >
                Confirmado ({confirmedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('Cancelado')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === 'Cancelado' ? 'bg-primary border-primary text-white scale-[1.02] shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:border-primary/20 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400'}`}
              >
                Cancelado ({cancelledCount})
              </button>
              {reschedulePendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('Reagendamento Pendente')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === 'Reagendamento Pendente' ? 'bg-primary border-primary text-white scale-[1.02] shadow-sm' : 'bg-white border-zinc-200 text-zinc-600 hover:border-primary/20 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400'}`}
                >
                  Reagendamento ({reschedulePendingCount})
                </button>
              )}
            </div>
          </div>

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
                      <div className="p-5 bg-pink-50 dark:bg-pink-955/20 border border-pink-200/40 dark:border-pink-900/30 rounded-2xl space-y-4 animate-in slide-in-from-top-3">
                        <div className="flex gap-3 items-start">
                          <Clock className="w-5 h-5 text-pink-650 shrink-0 mt-0.5 animate-pulse" />
                          <div className="space-y-1 flex-1">
                            <h4 className="font-extrabold text-sm text-pink-700 dark:text-pink-400">Oferta de Vaga Liberada! (Fila de Espera)</h4>
                            <p className="text-xs text-zinc-650 dark:text-zinc-355 leading-relaxed">
                              Uma vaga foi liberada para o seu exame/consulta por cancelamento de outro paciente!
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-zinc-600 dark:text-zinc-400">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Data e Horário</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  {appointment.rescheduledDate ? new Date(appointment.rescheduledDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''} às {appointment.rescheduledTime}h
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Profissional</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  {appointment.scheduledDoctor}
                                </span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Consultório / Sala</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                  {appointment.scheduledRoom}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Tempo Restante</span>
                            <span className="font-mono text-base font-black text-pink-600 bg-white dark:bg-zinc-950 px-3 py-1 rounded-xl border border-pink-200/20">
                              {(() => {
                                const diff = new Date(appointment.waitingListOfferExpiresAt!).getTime() - Date.now();
                                if (diff <= 0) return '00:00:00';
                                const hours = Math.floor(diff / (1000 * 60 * 60));
                                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                              })()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2.5 pt-2 border-t border-pink-100 dark:border-pink-900/20 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              if (window.confirm('Tem certeza de que deseja recusar esta vaga? Ela será ofertada para o próximo da fila.')) {
                                try {
                                  await rejectWaitlistOffer(appointment.id);
                                  await loadAppointments();
                                } catch (e) {
                                  console.error(e);
                                }
                              }
                            }}
                            className="h-9 px-4 rounded-xl text-xs font-bold border-red-200 text-red-650 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400"
                          >
                            Recusar Vaga
                          </Button>
                          <Button
                            type="button"
                            onClick={async () => {
                              try {
                                await acceptWaitlistOffer(appointment.id);
                                await loadAppointments();
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black shadow-sm"
                          >
                            Aceitar Vaga
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl flex gap-3 items-start shadow-xs">
                      <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-zinc-700 dark:text-zinc-300">Resumo da Triagem</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
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
                            <div className="relative pl-6 space-y-4 border-l border-zinc-150 dark:border-zinc-805">
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
                                        <span className="text-[10px] text-zinc-400">
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
                          <div className="bg-green-50/20 dark:bg-green-950/10 border border-green-200/30 dark:border-green-800/20 p-5 rounded-2xl space-y-4">
                            <h3 className="font-extrabold text-sm text-green-800 dark:text-green-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              Dados da Agenda Confirmada
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Data e Horário</span>
                                <p className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
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
                                <p className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                  <User className="w-4 h-4 text-primary" />
                                  {appointment.scheduledDoctor || 'Dra. Patrícia Arantes (Mastologista)'}
                                </p>
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Local do Atendimento</span>
                                <p className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-primary" />
                                  {appointment.scheduledRoom || 'Unidade Principal - Bloco B, Sala de Exames 03 (Mamógrafo 01)'}
                                </p>
                              </div>
                            </div>

                            {presenceSuccess && (
                              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                                <CheckCircle2 className="w-4 h-4" />
                                Presença confirmada com sucesso!
                              </div>
                            )}
                            {rescheduleSuccess && (
                              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 text-blue-800 dark:text-blue-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
                                <Info className="w-4 h-4" />
                                Atendimento reagendado com sucesso!
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2.5 pt-3 border-t border-zinc-150 dark:border-zinc-800/50">
                              {appointment.presenceConfirmed ? (
                                <div className="flex items-center gap-2">
                                  <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/40 font-bold px-3 py-1.5 text-[11px] rounded-xl flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100 dark:fill-emerald-950" />
                                    Presença Confirmada
                                  </div>
                                  {canCancelPresence() && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handleCancelPresence}
                                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20 h-9 px-3 rounded-xl text-xs flex items-center gap-1 transition-all active:scale-95"
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
                                  setSelectedDate(getNext5BusinessDays()[0]);
                                  setSelectedTime('08:30');
                                  setRescheduleReason('');
                                  setRescheduleError('');
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

                        <div className="flex flex-col items-center justify-center p-5 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 text-center space-y-4 shadow-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Credencial de Acesso</span>
                          <div className="bg-white p-3 rounded-2xl shadow-md border border-zinc-100 flex items-center justify-center">
                            {qrCodeUrl ? (
                              <img src={qrCodeUrl} alt="QR Code da Credencial" className="w-32 h-32" />
                            ) : (
                              <div className="w-32 h-32 bg-zinc-150 animate-pulse rounded-lg" />
                            )}
                          </div>
                          <div className="space-y-1 w-full">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50 block">QR Code para Recepção</span>
                            <span className="text-[10px] text-zinc-400 block mb-2">Apresente na entrada da recepção.</span>
                            <div className="flex flex-col gap-2 w-full">
                              <Button type="button" variant="outline" onClick={() => window.print()} className="w-full text-xs font-semibold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                Imprimir Credencial
                              </Button>
                              <Button type="button" variant="outline" onClick={handleSendEmail} className="w-full text-xs font-semibold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                Enviar por E-mail
                              </Button>
                              <Button type="button" variant="outline" onClick={handleSendWhatsapp} className="w-full text-xs font-semibold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                Enviar WhatsApp
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(appointment.status !== 'Confirmado' && appointment.status !== 'Cancelado' && appointment.status !== 'Concluído') && (
                      <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800/50 space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Ações da Solicitação</h4>
                        {cancelSuccess ? (
                          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
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
                      <div className="space-y-4">
                        <div className="bg-red-50/20 dark:bg-red-950/10 border border-red-200/30 dark:border-red-800/20 p-5 rounded-2xl space-y-2">
                          <h4 className="font-extrabold text-sm text-red-800 dark:text-red-400 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" />
                            Documentação Pendente de Correção
                          </h4>
                          <p className="text-xs text-red-900 dark:text-red-400 font-medium">
                            {appointment.fileAttachment?.feedback || appointment.observations || 'Documentação Ilegível: A foto do encaminhamento médico anexada está borrada e impossibilita a leitura do carimbo do profissional de saúde.'}
                          </p>
                          <p className="text-[11px] text-zinc-500 pt-2 border-t border-red-200/50 dark:border-red-800/20 mt-2">
                            <strong>O que fazer agora?</strong> Você pode anexar um novo documento legível abaixo para reabrir sua solicitação para análise.
                          </p>
                        </div>

                        {appointment.fileAttachment && (
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Documento Atual Recusado</span>
                            <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs">
                              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[250px]">
                                {appointment.fileAttachment.name}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newWindow = window.open();
                                  if (newWindow && appointment.fileAttachment) {
                                    newWindow.document.write(
                                      `<iframe src="${appointment.fileAttachment.base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                                    );
                                  }
                                }}
                                className="h-8 text-xs font-semibold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                              >
                                Ver Documento
                              </Button>
                            </div>
                          </div>
                        )}

                        {appointment.rejectedFilesHistory && appointment.rejectedFilesHistory.length > 0 && (
                          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mt-3">
                            <button
                              type="button"
                              onClick={() => setShowHistory(!showHistory)}
                              className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                Histórico de Arquivos Recusados ({appointment.rejectedFilesHistory.length})
                              </span>
                              {showHistory ? (
                                <ChevronUp className="w-4 h-4 text-zinc-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                              )}
                            </button>
                            {showHistory && (
                              <div className="p-4 bg-white dark:bg-zinc-950 divide-y divide-zinc-100 dark:divide-zinc-800">
                                {appointment.rejectedFilesHistory.map((hist, index) => (
                                  <div key={index} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-250 truncate max-w-[220px]">
                                        {hist.name}
                                      </span>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newWindow = window.open();
                                          if (newWindow) {
                                            newWindow.document.write(
                                              `<iframe src="${hist.base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                                            );
                                          }
                                        }}
                                        className="h-7 px-2 text-[10px] font-semibold border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                                      >
                                        Visualizar
                                      </Button>
                                    </div>
                                    {hist.feedback && (
                                      <div className="bg-red-50/10 dark:bg-red-950/5 border border-red-200/20 dark:border-red-800/10 p-2 rounded-lg text-[10px] text-red-800 dark:text-red-400 leading-normal font-medium">
                                        Motivo: {hist.feedback}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {substituteSuccess ? (
                          <div className="p-4 bg-green-50 dark:bg-green-950/10 border border-green-200/30 dark:border-green-800/20 rounded-2xl flex gap-2.5 items-center">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-green-800 dark:text-green-400">
                              Documento substituído com sucesso! O agendamento foi reaberto e está em análise.
                            </span>
                          </div>
                        ) : (
                          <form onSubmit={handleFileSubmit} className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Enviar Novo Documento Legível</span>
                              {!selectedFile ? (
                                <div className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 transition-colors bg-white dark:bg-zinc-950 ${fileError ? 'border-red-400 bg-red-50/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
                                  <input
                                    type="file"
                                    id="substitute-file-upload"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    disabled={submittingFile}
                                  />
                                  <Label htmlFor="substitute-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-full shadow-xs">
                                      <Upload className="w-5 h-5 text-zinc-500" />
                                    </div>
                                    <div>
                                      <span className="font-semibold text-primary hover:text-primary/95 text-xs block">Clique para selecionar novo arquivo</span>
                                      <span className="text-[10px] text-zinc-400 mt-0.5 block">PDF, JPG ou PNG de até 5MB</span>
                                    </div>
                                  </Label>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between p-3 bg-green-50/20 dark:bg-green-950/10 border border-green-200/60 dark:border-green-800/20 rounded-xl shadow-xs gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400 shrink-0">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate block">{selectedFile.name}</span>
                                      <span className="text-[10px] text-zinc-400 block">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-1.5">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        const newWindow = window.open();
                                        if (newWindow && selectedFile) {
                                          newWindow.document.write(
                                            `<iframe src="${selectedFile.base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                                          );
                                        }
                                      }}
                                      className="h-8 w-8 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 bg-white dark:bg-zinc-950"
                                      disabled={submittingFile}
                                    >
                                      <Eye className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                                    </Button>
                                    <Button type="button" variant="outline" size="icon" onClick={() => setSelectedFile(null)} className="h-8 w-8 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:hover:bg-red-950/20 bg-white dark:bg-zinc-950" disabled={submittingFile}>
                                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {fileError && (
                                <p className="text-red-500 text-[10px] flex items-center gap-1 font-medium mt-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {fileError}
                                </p>
                              )}
                            </div>
                            <Button
                              type="submit"
                              disabled={submittingFile || !selectedFile}
                              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold h-10 text-xs rounded-xl transition-all shadow-xs"
                            >
                              {submittingFile ? 'Processando e criptografando documento...' : 'Substituir Documento'}
                            </Button>
                          </form>
                        )}
                      </div>
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
                        <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                              <Star className="w-5 h-5 text-yellow-500" />
                              Sua opinião é muito importante!
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Por favor, reserve 30 segundos para avaliar o nosso fluxo de agendamento online.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {feedbackSuccess || (appointment.feedbackNps !== undefined && appointment.feedbackNps !== null) ? (
                              <div className="space-y-4">
                                <div className="p-4 bg-green-50 dark:bg-green-955/10 border border-green-200/30 dark:border-green-800/20 rounded-2xl flex gap-2.5 items-center">
                                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                                  <span className="text-sm font-semibold text-green-800 dark:text-green-400">Obrigado! Seu feedback (NPS) foi registrado com sucesso.</span>
                                </div>
                                {(() => {
                                  const matchingFeedback = feedbacks.find(
                                    (f) => f.appointmentProtocol.toUpperCase() === appointment.protocol.toUpperCase()
                                  );
                                  if (matchingFeedback && matchingFeedback.adminResponse) {
                                    return (
                                      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 text-xs text-left animate-in fade-in">
                                        <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                                          <span>Resposta da Ouvidoria Administrativa ({matchingFeedback.adminResponseAuthor})</span>
                                          <span>{matchingFeedback.adminResponseAt ? new Date(matchingFeedback.adminResponseAt).toLocaleDateString('pt-BR') : ''}</span>
                                        </div>
                                        <p className="text-zinc-700 dark:text-zinc-350 italic font-semibold leading-relaxed">
                                          "{matchingFeedback.adminResponse}"
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            ) : getFeedbackStatus().visible ? (
                              <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                                {feedbackError && (
                                  <div className="p-3 bg-red-50/10 border border-red-200 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4" />
                                    {feedbackError}
                                  </div>
                                )}
                                
                                <div className="space-y-3">
                                  <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-normal block">
                                    Em uma escala de 0 a 10, qual a probabilidade de você recomendar o nosso sistema de agendamento para um amigo ou familiar?
                                  </Label>
                                  <div className="flex flex-wrap gap-1 pt-1 justify-between">
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                      <button
                                        key={score}
                                        type="button"
                                        onClick={() => setNpsScore(score)}
                                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all border ${npsScore === score ? 'bg-primary border-primary text-white scale-105' : 'bg-white border-zinc-250 text-zinc-600 hover:border-primary/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'}`}
                                      >
                                        {score}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex justify-between text-[10px] text-zinc-400 px-1">
                                    <span>0 - Muito Improvável</span>
                                    <span>10 - Extremamente Provável</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="npsComment" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    Deixe um comentário explicando sua nota: *
                                  </Label>
                                  <textarea
                                    id="npsComment"
                                    rows={3}
                                    value={npsComment}
                                    onChange={(e) => setNpsComment(e.target.value)}
                                    placeholder="Escreva sua sugestão ou elogio..."
                                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-primary focus:outline-none dark:text-zinc-100"
                                  />
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                  <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-semibold h-10 px-5 shadow-sm text-xs rounded-xl">
                                    <MessageSquare className="w-4 h-4 mr-1.5" />
                                    Enviar Avaliação
                                  </Button>
                                  <Button type="button" variant="ghost" onClick={() => setSimulatedHours(h => h + 168)} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 h-8 px-2.5">
                                    Simular +7 Dias (Expirar Link)
                                  </Button>
                                </div>
                              </form>
                            ) : getFeedbackStatus().reason === 'pending_24h' ? (
                              <div className="space-y-3">
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/10 border border-amber-200/30 dark:border-amber-800/20 rounded-2xl flex flex-col gap-2">
                                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    Pesquisa pendente: A avaliação estará disponível a partir de {getFeedbackStatus().availableAt} (24 horas pós-confirmação).
                                  </span>
                                </div>
                                <Button type="button" variant="outline" onClick={() => setSimulatedHours(25)} className="text-xs font-bold border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-400">
                                  Simular +24 horas (Liberar Pesquisa)
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="p-4 bg-red-50 dark:bg-red-950/10 border border-red-200/30 dark:border-red-800/20 rounded-2xl flex flex-col gap-2">
                                  <span className="text-xs font-semibold text-red-800 dark:text-red-400 flex items-center gap-1.5">
                                    <AlertCircle className="w-4 h-4" />
                                    O link desta pesquisa de feedback expirou (validade máxima de 7 dias após o envio).
                                  </span>
                                </div>
                                <Button type="button" variant="outline" onClick={() => setSimulatedHours(0)} className="text-xs font-bold border-zinc-200 text-zinc-650 bg-white dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400">
                                  Resetar Simulação de Tempo
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
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

      {isRescheduleOpen && createPortal(
        <div onClick={() => setIsRescheduleOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <Card onClick={(e) => e.stopPropagation()} className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 p-5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">Reagendar Atendimento</CardTitle>
                <CardDescription className="text-xs">Selecione uma nova data e horário abaixo.</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsRescheduleOpen(false)}
                className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/30 text-amber-850 dark:text-amber-400 rounded-2xl text-[11px] font-semibold flex items-start gap-1.5 animate-in fade-in leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Atenção: A alteração de data/horário está sujeita à aprovação da triagem clínica do hospital.</span>
              </div>
              {rescheduleError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 text-red-850 dark:text-red-400 rounded-2xl text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{rescheduleError}</span>
                </div>
              )}
              <div className="space-y-2">
                <span className="text-[0.625rem] uppercase font-bold text-zinc-400 block tracking-wider">Selecione o Dia</span>
                <div className="grid grid-cols-5 gap-2">
                  {getNext5BusinessDays().map((date, idx) => {
                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`p-2.5 rounded-2xl flex flex-col items-center justify-center border text-center transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-white scale-[1.03] shadow-md shadow-primary/10'
                            : 'bg-zinc-50 border-zinc-150 text-zinc-700 hover:border-primary/30 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400'
                        }`}
                      >
                        <span className="text-[0.5rem] font-bold uppercase tracking-wider block opacity-75">
                          {date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                        </span>
                        <span className="text-sm font-extrabold block mt-0.5">
                          {date.getDate()}
                        </span>
                        <span className="text-[0.5rem] font-bold block mt-0.5">
                          {date.toLocaleDateString('pt-BR', { month: 'short' }).slice(0, 3)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[0.625rem] uppercase font-bold text-zinc-400 block tracking-wider">Selecione o Horário</span>
                <div className="grid grid-cols-4 gap-2">
                  {['08:30', '10:00', '13:30', '15:00'].map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-white scale-[1.02] shadow-sm'
                            : 'bg-zinc-50 border-zinc-150 text-zinc-650 hover:border-primary/20 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="rescheduleReason" className="text-[0.625rem] uppercase font-bold text-zinc-400 block tracking-wider">Motivo da Solicitação *</label>
                <textarea
                  id="rescheduleReason"
                  rows={2}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Explique brevemente por que precisa alterar a data/horário..."
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-primary focus:outline-none dark:text-zinc-100"
                  required
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRescheduleOpen(false)}
                  className="flex-1 h-10 text-xs font-semibold rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleRescheduleSubmit}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1 h-10 text-xs font-bold bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md"
                >
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>,
        document.body
      )}
    </div>
  );
}
