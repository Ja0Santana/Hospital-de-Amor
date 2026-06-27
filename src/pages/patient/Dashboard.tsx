import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getAppointmentByCpf, getSymptomLogs, getSpecialties } from '../../services/db';
import type { Appointment } from '../../types';
import { Search, AlertCircle, CheckCircle2, Clock, XCircle, Info, ChevronRight, ChevronDown, FileText } from 'lucide-react';
interface DashboardProps {
  onNavigate: (page: string) => void;
  patientCpf: string;
  patientName: string;
  onOpenCard: () => void;
}


export default function Dashboard({ onNavigate, patientCpf, patientName, onOpenCard }: DashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showDiaryAlert, setShowDiaryAlert] = useState(false);
  const [prepAlerts, setPrepAlerts] = useState<{ id: string; title: string; desc: string }[]>([]);
  const [expandedPrepId, setExpandedPrepId] = useState<string | null>(null);
  const [isPrepCardExpanded, setIsPrepCardExpanded] = useState(true);
  const [pendingDocApp, setPendingDocApp] = useState<Appointment | null>(null);

  useEffect(() => {
    loadAppointmentsAndAlerts();
    const handleReactiveAppointment = () => {
      loadAppointmentsAndAlerts();
    };
    window.addEventListener('appointment-created-reactively', handleReactiveAppointment);
    return () => {
      window.removeEventListener('appointment-created-reactively', handleReactiveAppointment);
    };
  }, [patientCpf]);

  const loadAppointmentsAndAlerts = async () => {
    try {
      const results = await getAppointmentByCpf(patientCpf);
      setAppointments(results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

      const logs = await getSymptomLogs(patientCpf);
      const hasLoggedToday = logs.some((log) => {
        const logDate = new Date(log.createdAt).toDateString();
        const todayDate = new Date().toDateString();
        return logDate === todayDate;
      });
      setShowDiaryAlert(!hasLoggedToday);

      const docPending = results.find(
        (app) =>
          (app.status === 'Pendente' || app.status === 'Cancelado') &&
          app.fileAttachment &&
          (app.fileAttachment.status === 'Ilegível' || app.fileAttachment.status === 'Pendente de Correção')
      );
      setPendingDocApp(docPending || null);

      const specialties = await getSpecialties();
      const confirmedApps = results.filter(app => app.status === 'Confirmado');
      const alerts = confirmedApps.map(app => {
        let prep = 'Siga as orientações passadas pela equipe médica.';
        const spec = specialties.find(s => s.id === app.specialtyId);
        if (spec) {
          const exam = spec.exams.find(e => e.id === app.examId);
          if (exam) {
            prep = exam.defaultPrepInstructions;
          }
        }
        return {
          id: app.id,
          title: `Preparo para: ${app.examName}`,
          desc: prep
        };
      });
      setPrepAlerts(alerts);
      if (alerts.length > 0) {
        setExpandedPrepId(alerts[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const nextConfirmedAppointment = appointments
    .filter(app => app.status === 'Confirmado' && app.rescheduledDate)
    .sort((a, b) => {
      const dateA = new Date(`${a.rescheduledDate}T${a.rescheduledTime || '00:00'}`).getTime();
      const dateB = new Date(`${b.rescheduledDate}T${b.rescheduledTime || '00:00'}`).getTime();
      return dateA - dateB;
    })[0] ?? null;


  const getStatusBadge = (status: Appointment['status']) => {
    const config = {
      'Pendente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50', icon: Clock },
      'Em análise': { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50', icon: Search },
      'Confirmado': { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50', icon: CheckCircle2 },
      'Cancelado': { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50', icon: XCircle },
      'Reagendamento Pendente': { color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50', icon: Clock }
    };
    const { color, icon: Icon } = (config as any)[status] || config['Pendente'];
    return (
      <Badge variant="outline" className={`${color} flex items-center gap-1 w-fit px-2.5 py-0.5 font-semibold text-[11px] rounded-full`}>
        <Icon className="w-3 h-3" aria-hidden="true" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Olá, {patientName}</h1>
          <p className="text-zinc-500 mt-1">Aqui está o resumo do seu cuidado hoje.</p>
        </div>
        <Button
          onClick={onOpenCard}
          className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-5 rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto transition-transform active:scale-[0.98]"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect width={18} height={12} x={3} y={6} rx={2} />
            <path d="M3 10h18M8 14h.01M12 14h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ver Carteira Digital
        </Button>
      </div>

      {(showDiaryAlert || prepAlerts.length > 0 || pendingDocApp) && (
        <div className="space-y-4">
          {pendingDocApp && (
            <div className="p-4 rounded-3xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex gap-3 items-start text-left">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Documentação Pendente de Correção</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Sua solicitação de {pendingDocApp.examName} possui documentos com problemas identificados na triagem. Substitua o documento para prosseguir.</p>
                </div>
              </div>
              <Button
                onClick={() => onNavigate('status-' + pendingDocApp.protocol)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold h-9 px-4 rounded-xl text-xs shrink-0 self-end sm:self-center transition-transform active:scale-95 shadow-sm"
              >
                Corrigir Documento
              </Button>
            </div>
          )}

          {showDiaryAlert && (
            <div className="p-4 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex gap-3 items-start text-left">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Diário de Sintomas Pendente</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Você ainda não informou como está se sentindo hoje. Registrar seus sintomas ajuda na regulação do seu tratamento.</p>
                </div>
              </div>
              <Button
                onClick={() => onNavigate('symptoms')}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-9 px-4 rounded-xl text-xs shrink-0 self-end sm:self-center transition-transform active:scale-95 shadow-sm"
              >
                Registrar Saúde
              </Button>
            </div>
          )}

          {prepAlerts.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-250/50 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-md shadow-zinc-100/50 dark:shadow-none animate-in slide-in-from-top-2 duration-300">
              <button
                onClick={() => setIsPrepCardExpanded(!isPrepCardExpanded)}
                className={`w-full bg-zinc-50/80 dark:bg-zinc-900/50 px-5 py-4 flex items-center justify-between hover:bg-zinc-100/40 dark:hover:bg-zinc-800/10 transition-colors text-left ${isPrepCardExpanded ? 'border-b border-zinc-150 dark:border-zinc-800' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Info className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-zinc-800 dark:text-zinc-200">Instruções de Preparo para Exames</h3>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-600/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-450 border-none text-[10px] font-black rounded-lg">
                    {prepAlerts.length} {prepAlerts.length === 1 ? 'Exame' : 'Exames'}
                  </Badge>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-250 ${isPrepCardExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {isPrepCardExpanded && (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in duration-200">
                  {prepAlerts.map((alert) => {
                    const isExpanded = expandedPrepId === alert.id;
                    return (
                      <div key={alert.id} className="group">
                        <button
                          onClick={() => setExpandedPrepId(isExpanded ? null : alert.id)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full transition-colors ${isExpanded ? 'bg-blue-600 dark:bg-blue-400 scale-110' : 'bg-zinc-300 dark:bg-zinc-650'}`} />
                            <span className="font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200">{alert.title}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-250 ${isExpanded ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-1 bg-blue-50/20 dark:bg-blue-950/5 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="pl-5 border-l-2 border-blue-500/35 dark:border-blue-500/20 py-1 space-y-1">
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Recomendações da equipe médica</span>
                              <p className="text-xs text-zinc-600 dark:text-zinc-405 leading-relaxed font-medium">
                                {alert.desc}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 bg-primary text-white border-none shadow-lg rounded-3xl p-6 flex flex-col justify-between min-h-[190px]">
          <div className="space-y-2 pb-4">
            <h2 className="text-2xl font-black tracking-tight">Iniciar nova solicitação</h2>
            <p className="text-white/80 text-sm max-w-[210px] leading-snug">
              Agende exames, consultas ou solicite documentos.
            </p>
          </div>
          <Button
            onClick={() => onNavigate('new-request')}
            className="w-full bg-white hover:bg-white/90 text-brand-pink font-bold h-12 rounded-2xl flex items-center justify-between px-5 shadow-md shadow-black/10 transition-transform active:scale-[0.98] group"
          >
            <span>INICIAR</span>
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Button>
        </Card>

        <Card className="lg:col-span-3 border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 flex flex-row min-h-[190px]">
          {nextConfirmedAppointment ? (
            <>
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div className="space-y-1">
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-primary">Próximo Evento</h2>
                  <p className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                    {nextConfirmedAppointment.examName}
                    {nextConfirmedAppointment.specialtyName ? ` · ${nextConfirmedAppointment.specialtyName}` : ''}
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                  <p className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <time dateTime={nextConfirmedAppointment.rescheduledDate}>
                      {new Date(`${nextConfirmedAppointment.rescheduledDate}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {nextConfirmedAppointment.rescheduledTime ? ` às ${nextConfirmedAppointment.rescheduledTime}` : ''}
                    </time>
                  </p>
                  {(nextConfirmedAppointment.scheduledRoom || nextConfirmedAppointment.scheduledDoctor) && (
                    <p className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      {[nextConfirmedAppointment.scheduledRoom, nextConfirmedAppointment.scheduledDoctor ? `Dr(a). ${nextConfirmedAppointment.scheduledDoctor}` : null].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 font-medium">
                    <Info className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    Protocolo: {nextConfirmedAppointment.protocol}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex w-[160px] bg-[#FFF0F6] dark:bg-zinc-900/30 items-center justify-center p-4 shrink-0 border-l border-zinc-100 dark:border-zinc-800">
                <svg className="w-full h-full text-primary max-h-[130px]" viewBox="0 0 160 120" fill="none" aria-hidden="true">
                  <circle cx="130" cy="30" r="10" fill="#FFB703" />
                  <path d="M125,45 a6,6 0 0,1 12,0 a4,4 0 0,1 8,0 a2,2 0 0,1 2,2 a4,4 0 0,1 -4,4 h-16 a4,4 0 0,1 -2,-6" fill="white" opacity="0.9" />
                  <rect x="25" y="45" width="110" height="65" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
                  <rect x="55" y="25" width="50" height="20" rx="3" fill="#E80053" />
                  <rect x="71" y="31" width="18" height="12" fill="#FFFFFF" />
                  <rect x="35" y="55" width="12" height="12" rx="1" fill="#F1F5F9" />
                  <rect x="55" y="55" width="12" height="12" rx="1" fill="#F1F5F9" />
                  <rect x="75" y="55" width="12" height="12" rx="1" fill="#F1F5F9" />
                  <rect x="95" y="55" width="12" height="12" rx="1" fill="#F1F5F9" />
                  <rect x="113" y="55" width="12" height="12" rx="1" fill="#F1F5F9" />
                  <rect x="35" y="75" width="12" height="12" rx="1" fill="#F1F5F9" />
                  <rect x="113" y="75" width="12" height="12" rx="1" fill="#F1F5F9" />
                  <rect x="65" y="75" width="30" height="35" rx="3" fill="#1A202C" />
                  <path d="M77,31 h6 M80,28 v6" stroke="#E80053" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </>
          ) : (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-100">Nenhum evento agendado</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-[240px] leading-relaxed">
                  Você não possui consultas ou exames confirmados no momento. Tudo em ordem!
                </p>
              </div>
              <button
                onClick={() => onNavigate('status-check')}
                className="mt-1 text-[11px] font-bold text-primary hover:underline"
              >
                Ver meus agendamentos
              </button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-zinc-200/80 dark:border-zinc-800 rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-bold">Pedidos recentes</h2>
            </CardTitle>
            <CardDescription>Acompanhe a situação dos seus últimos pedidos encaminhados.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <AlertCircle className="w-8 h-8 text-zinc-400 mb-2" />
                    <p className="font-semibold text-zinc-600 dark:text-zinc-400">Nenhum agendamento encontrado.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ul className="space-y-3 list-none">
                      {appointments.slice(0, 3).map((app) => (
                        <li
                          key={app.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 shadow-xs hover:border-primary/30 transition-all gap-3 sm:gap-4"
                        >
                          <div className="space-y-1 min-w-0">
                            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 truncate">{app.examName}</h3>
                            <span className="text-[10px] text-zinc-400 block">Solicitado em <time dateTime={app.createdAt.split('T')[0]}>{new Date(app.createdAt).toLocaleDateString('pt-BR')}</time> • Protocolo: {app.protocol}</span>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/50">
                            {getStatusBadge(app.status)}
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Ver detalhes do agendamento ${app.protocol}`}
                              onClick={() => onNavigate(`status-${app.protocol}`)}
                              className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg shrink-0"
                            >
                              <ChevronRight className="w-4 h-4 text-zinc-400" aria-hidden="true" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {appointments.length > 3 && (
                      <div className="flex justify-end pt-1">
                        <Button
                          variant="ghost"
                          onClick={() => onNavigate('status-check')}
                          className="text-xs font-bold text-primary hover:text-primary/95 flex items-center gap-1 p-0 h-auto hover:bg-transparent"
                        >
                          Ver todos os agendamentos ({appointments.length})
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-zinc-200/80 dark:border-zinc-800 rounded-3xl bg-zinc-50/20 dark:bg-zinc-900/10">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-bold">Instruções</h2>
            </CardTitle>
            <CardDescription>Informações importantes sobre seu preparo e comparecimento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 shadow-xs flex gap-3">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 rounded-xl h-fit" aria-hidden="true">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Preparo para Exame</h4>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Lembre-se de manter jejum de 8 horas para o seu exame de sangue agendado para amanhã.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 shadow-xs flex gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-xl h-fit" aria-hidden="true">
                <FileText className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Documentos Necessários</h4>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Traga seu documento de identidade e o cartão do SUS para a próxima consulta.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MapPinProps extends React.SVGProps<SVGSVGElement> {}
function MapPin(props: MapPinProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
