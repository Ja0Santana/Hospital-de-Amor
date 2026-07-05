import { Calendar, User, MapPin, CheckCircle2, Info } from 'lucide-react';
import { Button } from '../../ui/Button';
import type { Appointment } from '../../../types';

interface ConfirmedSchedulePanelProps {
  appointment: Appointment;
  presenceSuccess: boolean;
  rescheduleSuccess: boolean;
  onConfirmPresence: () => void;
  onCancelPresence: () => void;
  onOpenReschedule: () => void;
}

export default function ConfirmedSchedulePanel({
  appointment,
  presenceSuccess,
  rescheduleSuccess,
  onConfirmPresence,
  onCancelPresence,
  onOpenReschedule,
}: ConfirmedSchedulePanelProps) {
  const canCancelPresence = () => {
    if (!appointment.rescheduledDate) return false;
    const appointmentDateTime = new Date(
      `${appointment.rescheduledDate}T${appointment.rescheduledTime || '08:00'}:00`
    );
    const now = new Date();
    const diffMs = appointmentDateTime.getTime() - now.getTime();
    return diffMs > 24 * 60 * 60 * 1050; // Margem segura de 24h
  };

  return (
    <div className="bg-green-50/20 dark:bg-green-955/10 border border-green-200/30 dark:border-green-800/20 p-5 rounded-2xl space-y-4">
      <h3 className="font-extrabold text-sm text-green-850 dark:text-green-400 flex items-center gap-1.5">
        <CheckCircle2 className="w-4 h-4" />
        Dados da Agenda Confirmada
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-650 dark:text-zinc-400">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Data e Horário</span>
          <p className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            {appointment.rescheduledDate && appointment.rescheduledTime ? (
              <span>
                {new Date(appointment.rescheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')} às{' '}
                {appointment.rescheduledTime}h{' '}
                <span className="text-[10px] text-primary font-bold ml-1">(Reagendado)</span>
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
            {appointment.scheduledRoom ||
              'Unidade Principal - Bloco B, Sala de Exames 03 (Mamógrafo 01)'}
          </p>
        </div>
      </div>

      {presenceSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4" />
          Presença confirmada com sucesso!
        </div>
      )}
      {rescheduleSuccess && (
        <div className="p-3 bg-blue-50 dark:bg-blue-955/20 border border-blue-200 dark:border-blue-800/30 text-blue-800 dark:text-blue-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
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
                onClick={onCancelPresence}
                className="border-red-200 text-red-655 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-955/20 h-9 px-3 rounded-xl text-xs flex items-center gap-1 transition-all active:scale-95"
              >
                Cancelar Confirmação
              </Button>
            )}
          </div>
        ) : (
          <Button
            type="button"
            onClick={onConfirmPresence}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirmar Presença
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onOpenReschedule}
          className="border-zinc-200/80 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 bg-white dark:bg-zinc-950"
        >
          <Calendar className="w-4 h-4 text-primary" />
          Reagendar Atendimento
        </Button>
      </div>
    </div>
  );
}
