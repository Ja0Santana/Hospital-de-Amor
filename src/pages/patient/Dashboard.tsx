import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getAppointmentByCpf, getSymptomLogs, getSpecialties } from '../../services/db';
import type { Appointment } from '../../types';
import { Clock, Info, ChevronRight, CheckCircle2, MapPin } from 'lucide-react';

import DashboardAlerts from '../../components/patient/dashboard/DashboardAlerts';
import RecentRequestsList from '../../components/patient/dashboard/RecentRequestsList';
import InstructionCards from '../../components/patient/dashboard/InstructionCards';

interface DashboardProps {
  onNavigate: (page: string) => void;
  patientCpf: string;
  patientName: string;
  onOpenCard: () => void;
}

export default function Dashboard({
  onNavigate,
  patientCpf,
  patientName,
  onOpenCard,
}: DashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showDiaryAlert, setShowDiaryAlert] = useState(false);
  const [prepAlerts, setPrepAlerts] = useState<{ id: string; title: string; desc: string }[]>([]);
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
      setAppointments(
        results.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );

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
          (app.fileAttachment.status === 'Ilegível' ||
            app.fileAttachment.status === 'Pendente de Correção')
      );
      setPendingDocApp(docPending || null);

      const specialties = await getSpecialties();
      const confirmedApps = results.filter((app) => app.status === 'Confirmado');
      const alerts = confirmedApps.map((app) => {
        let prep = 'Siga as orientações passadas pela equipe médica.';
        const spec = specialties.find((s) => s.id === app.specialtyId);
        if (spec) {
          const exam = spec.exams.find((e) => e.id === app.examId);
          if (exam) {
            prep = exam.defaultPrepInstructions;
          }
        }
        return {
          id: app.id,
          title: `Preparo para: ${app.examName}`,
          desc: prep,
        };
      });
      setPrepAlerts(alerts);
    } catch (error) {
      console.error(error);
    }
  };

  const nextConfirmedAppointment =
    appointments
      .filter((app) => app.status === 'Confirmado' && app.rescheduledDate)
      .sort((a, b) => {
        const dateA = new Date(`${a.rescheduledDate}T${a.rescheduledTime || '00:00'}`).getTime();
        const dateB = new Date(`${b.rescheduledDate}T${b.rescheduledTime || '00:00'}`).getTime();
        return dateA - dateB;
      })[0] ?? null;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Olá, {patientName}
          </h1>
          <p className="text-zinc-500 mt-1">Aqui está o resumo do seu cuidado hoje.</p>
        </div>
        <Button
          onClick={onOpenCard}
          className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-5 rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto transition-transform active:scale-[0.98] border border-transparent"
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <rect width={18} height={12} x={3} y={6} rx={2} />
            <path d="M3 10h18M8 14h.01M12 14h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ver Carteira Digital
        </Button>
      </div>

      <DashboardAlerts
        pendingDocApp={pendingDocApp}
        showDiaryAlert={showDiaryAlert}
        prepAlerts={prepAlerts}
        onNavigate={onNavigate}
      />

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
            className="w-full bg-white hover:bg-white/90 text-brand-pink font-bold h-12 rounded-2xl flex items-center justify-between px-5 shadow-md shadow-black/10 transition-transform active:scale-[0.98] group border border-transparent"
          >
            <span>INICIAR</span>
            <ChevronRight
              className="w-5 h-5 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Button>
        </Card>

        <Card className="lg:col-span-3 border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 flex flex-row min-h-[190px]">
          {nextConfirmedAppointment ? (
            <>
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div className="space-y-1">
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Próximo Evento
                  </h2>
                  <p className="text-lg font-black text-zinc-900 dark:text-zinc-55 leading-tight">
                    {nextConfirmedAppointment.examName}
                    {nextConfirmedAppointment.specialtyName
                      ? ` · ${nextConfirmedAppointment.specialtyName}`
                      : ''}
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                  <p className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <time dateTime={nextConfirmedAppointment.rescheduledDate}>
                      {new Date(`${nextConfirmedAppointment.rescheduledDate}T12:00:00`).toLocaleDateString(
                        'pt-BR',
                        { day: 'numeric', month: 'long', year: 'numeric' }
                      )}
                      {nextConfirmedAppointment.rescheduledTime
                        ? ` às ${nextConfirmedAppointment.rescheduledTime}`
                        : ''}
                    </time>
                  </p>
                  {(nextConfirmedAppointment.scheduledRoom || nextConfirmedAppointment.scheduledDoctor) && (
                    <p className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      {[
                        nextConfirmedAppointment.scheduledRoom,
                        nextConfirmedAppointment.scheduledDoctor
                          ? `Dr(a). ${nextConfirmedAppointment.scheduledDoctor}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 font-medium">
                    <Info className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    Protocolo: {nextConfirmedAppointment.protocol}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex w-[160px] bg-[#FFF0F6] dark:bg-zinc-900/30 items-center justify-center p-4 shrink-0 border-l border-zinc-100 dark:border-zinc-800">
                <svg
                  className="w-full h-full text-primary max-h-[130px]"
                  viewBox="0 0 160 120"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="130" cy="30" r="10" fill="#FFB703" />
                  <path
                    d="M125,45 a6,6 0 0,1 12,0 a4,4 0 0,1 8,0 a2,2 0 0,1 2,2 a4,4 0 0,1 -4,4 h-16 a4,4 0 0,1 -2,-6"
                    fill="white"
                    opacity="0.9"
                  />
                  <rect
                    x="25"
                    y="45"
                    width="110"
                    height="65"
                    rx="6"
                    fill="#FFFFFF"
                    stroke="#E2E8F0"
                    strokeWidth="2"
                  />
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
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-100">
                  Nenhum evento agendado
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-[240px] leading-relaxed">
                  Você não possui consultas ou exames confirmados no momento. Tudo em ordem!
                </p>
              </div>
              <button
                onClick={() => onNavigate('status-check')}
                className="mt-1 text-[11px] font-bold text-primary hover:underline focus:outline-none"
              >
                Ver meus agendamentos
              </button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentRequestsList appointments={appointments} onNavigate={onNavigate} />
        <InstructionCards />
      </div>
    </div>
  );
}
