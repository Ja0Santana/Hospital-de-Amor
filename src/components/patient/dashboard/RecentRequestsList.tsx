import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Search, AlertCircle, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';
import type { Appointment } from '../../../types';

interface RecentRequestsListProps {
  appointments: Appointment[];
  onNavigate: (page: string) => void;
}

export default function RecentRequestsList({ appointments, onNavigate }: RecentRequestsListProps) {
  const getStatusBadge = (status: Appointment['status']) => {
    const config = {
      'Pendente': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50',
        icon: Clock,
      },
      'Em análise': {
        color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50',
        icon: Search,
      },
      'Confirmado': {
        color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50',
        icon: CheckCircle2,
      },
      'Cancelado': {
        color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50',
        icon: XCircle,
      },
      'Reagendamento Pendente': {
        color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
        icon: Clock,
      },
    };

    const { color, icon: Icon } = (config as any)[status] || config['Pendente'];

    return (
      <Badge
        variant="outline"
        className={`${color} flex items-center gap-1 w-fit px-2.5 py-0.5 font-semibold text-[11px] rounded-full`}
      >
        <Icon className="w-3 h-3" aria-hidden="true" />
        {status}
      </Badge>
    );
  };

  return (
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
              <p className="font-semibold text-zinc-650 dark:text-zinc-400">Nenhum agendamento encontrado.</p>
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
                      <span className="text-[10px] text-zinc-400 block">
                        Solicitado em{' '}
                        <time dateTime={app.createdAt.split('T')[0]}>
                          {new Date(app.createdAt).toLocaleDateString('pt-BR')}
                        </time>{' '}
                        • Protocolo: {app.protocol}
                      </span>
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
  );
}
