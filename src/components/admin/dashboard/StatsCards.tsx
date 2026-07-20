
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Appointment } from '../../../types';

interface StatsCardsProps {
  appointments: Appointment[];
  isLoading?: boolean;
}

export default function StatsCards({ appointments, isLoading }: StatsCardsProps) {
  const countByStatus = (status: string) => {
    return appointments.filter((app) => app.status === status).length;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs animate-pulse space-y-3">
            <div className="h-2 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            <div className="flex items-center justify-between">
              <div className="h-6 w-8 bg-zinc-250 dark:bg-zinc-750 rounded-lg" />
              <div className="h-5 w-5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
        <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
          Pendentes
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-yellow-600">
            {countByStatus('Pendente')}
          </span>
          <Clock className="w-5 h-5 text-yellow-500 shrink-0" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
        <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
          Em Análise
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-blue-600">
            {countByStatus('Em análise')}
          </span>
          <Clock className="w-5 h-5 text-blue-500 shrink-0" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
        <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
          Reagendamento
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-amber-600">
            {countByStatus('Reagendamento Pendente')}
          </span>
          <Clock className="w-5 h-5 text-amber-500 shrink-0" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
        <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
          Confirmados
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-emerald-600">
            {countByStatus('Confirmado')}
          </span>
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs col-span-2 lg:col-span-1">
        <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
          Cancelados
        </span>
        <div className="flex items-baseline justify-between mt-2">
          <span className="text-2xl font-black text-red-600">
            {countByStatus('Cancelado')}
          </span>
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
        </div>
      </div>
    </div>
  );
}
