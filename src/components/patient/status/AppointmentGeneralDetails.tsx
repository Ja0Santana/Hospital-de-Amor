import type { Appointment } from '../../../types';
import { formatCpf } from '../../../lib/sanitizer';

interface AppointmentGeneralDetailsProps {
  appointment: Appointment;
}

export default function AppointmentGeneralDetails({ appointment }: AppointmentGeneralDetailsProps) {
  return (
    <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 space-y-4">
      <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">
        Dados Gerais da Solicitação
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-650 dark:text-zinc-400">
        <p>
          <strong className="text-zinc-800 dark:text-zinc-300 font-medium">Paciente:</strong>{' '}
          {appointment.patientName}
        </p>
        <p>
          <strong className="text-zinc-800 dark:text-zinc-300 font-medium">CPF:</strong>{' '}
          {formatCpf(appointment.patientCpf)}
        </p>
        <p>
          <strong className="text-zinc-800 dark:text-zinc-300 font-medium">Especialidade:</strong>{' '}
          {appointment.specialtyName}
        </p>
        <p>
          <strong className="text-zinc-800 dark:text-zinc-300 font-medium">Exame Solicitado:</strong>{' '}
          {appointment.examName}
        </p>
        <p className="sm:col-span-2">
          <strong className="text-zinc-800 dark:text-zinc-300 font-medium">Localidade:</strong>{' '}
          {appointment.city} ({appointment.state})
        </p>
      </div>
    </div>
  );
}
