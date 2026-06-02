import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { getAppointmentByCpf } from '../../services/db';
import type { Appointment } from '../../types';
import { Search, AlertCircle, CheckCircle2, Clock, XCircle, Info, ChevronRight, FileText } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
  patientCpf: string;
  patientName: string;
}

function formatNextEventDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getNextEventIsoDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().split('T')[0];
}

export default function Dashboard({ onNavigate, patientCpf, patientName }: DashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadAppointments();
  }, [patientCpf]);

  const loadAppointments = async () => {
    try {
      const results = await getAppointmentByCpf(patientCpf);
      setAppointments(results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    const config = {
      'Pendente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50', icon: Clock },
      'Em análise': { color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50', icon: Search },
      'Confirmado': { color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50', icon: CheckCircle2 },
      'Cancelado': { color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50', icon: XCircle }
    };
    const { color, icon: Icon } = config[status] || config['Pendente'];
    return (
      <Badge variant="outline" className={`${color} flex items-center gap-1 w-fit px-2.5 py-0.5 font-semibold text-[11px] rounded-full`}>
        <Icon className="w-3 h-3" aria-hidden="true" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Olá, {patientName}</h1>
        <p className="text-zinc-500 mt-1">Aqui está o resumo do seu cuidado hoje.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 bg-primary text-white border-none shadow-lg rounded-3xl p-6 flex flex-col justify-between min-h-[190px]">
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Iniciar nova solicitação</h2>
            <p className="text-white/80 text-sm max-w-[210px] leading-snug">
              Agende exames, consultas ou solicite documentos.
            </p>
          </div>
          <Button
            onClick={() => onNavigate('new-request')}
            className="w-full bg-white hover:bg-white/90 text-primary font-bold h-12 rounded-2xl flex items-center justify-between px-5 shadow-md shadow-black/10 transition-transform active:scale-[0.98] group"
          >
            <span>INICIAR</span>
            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Button>
        </Card>

        <Card className="lg:col-span-3 border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 flex flex-row min-h-[190px]">
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="space-y-1">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-primary">Próximo Evento</h2>
              <p className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">Consulta de Retorno - Oncologia</p>
            </div>
            <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-3">
              <p className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <time dateTime={getNextEventIsoDate()}>{formatNextEventDate()} às 14:30</time>
              </p>
              <p className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                Unidade Barretos - Ala B, Consultório 4
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
                  <ul className="space-y-3 list-none">
                    {appointments.map((app) => (
                      <li
                        key={app.id}
                        className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 shadow-xs hover:border-primary/30 transition-all gap-4"
                      >
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">{app.examName}</h3>
                          <span className="text-[10px] text-zinc-400 block">Solicitado em <time dateTime={app.createdAt.split('T')[0]}>{new Date(app.createdAt).toLocaleDateString('pt-BR')}</time> • Protocolo: {app.protocol}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(app.status)}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Ver detalhes do agendamento ${app.protocol}`}
                            onClick={() => onNavigate(`status-${app.protocol}`)}
                            className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                          >
                            <ChevronRight className="w-4 h-4 text-zinc-400" aria-hidden="true" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
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
