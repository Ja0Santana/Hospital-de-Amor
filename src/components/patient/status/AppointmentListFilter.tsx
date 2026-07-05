import { Search } from 'lucide-react';
import type { Appointment } from '../../../types';

interface AppointmentListFilterProps {
  filterText: string;
  setFilterText: (text: string) => void;
  statusFilter: 'Todos' | Appointment['status'];
  setStatusFilter: (status: 'Todos' | Appointment['status']) => void;
  totalCount: number;
  pendingCount: number;
  analysisCount: number;
  confirmedCount: number;
  cancelledCount: number;
  reschedulePendingCount: number;
}

export default function AppointmentListFilter({
  filterText,
  setFilterText,
  statusFilter,
  setStatusFilter,
  totalCount,
  pendingCount,
  analysisCount,
  confirmedCount,
  cancelledCount,
  reschedulePendingCount
}: AppointmentListFilterProps) {
  return (
    <div className="space-y-4 bg-white/50 dark:bg-zinc-900/30 p-5 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 backdrop-blur-xs shadow-xs text-left">
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-hover:text-pink-500 transition-colors" />
        <input
          type="text"
          placeholder="Buscar por nome do exame ou protocolo..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl text-xs bg-white/80 dark:bg-zinc-950/80 focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 focus:outline-none dark:text-zinc-100 transition-all shadow-2xs placeholder:text-zinc-400"
        />
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 shrink-0 flex-nowrap sm:flex-wrap scrollbar-none -mx-1 px-1">
        <button
          type="button"
          onClick={() => setStatusFilter('Todos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center shrink-0 ${
            statusFilter === 'Todos' 
              ? 'bg-pink-600 border-pink-600 text-white shadow-sm shadow-pink-600/15 scale-[1.02]' 
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-750 hover:bg-zinc-50 dark:hover:bg-zinc-850/30'
          }`}
        >
          <span>Todos</span>
          <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-md font-extrabold ${
            statusFilter === 'Todos' ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
          }`}>
            {totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Pendente')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center shrink-0 ${
            statusFilter === 'Pendente' 
              ? 'bg-amber-600 border-amber-600 text-white shadow-sm shadow-amber-600/15 scale-[1.02]' 
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-750 hover:bg-zinc-50 dark:hover:bg-zinc-850/30'
          }`}
        >
          <span>Pendente</span>
          <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-md font-extrabold ${
            statusFilter === 'Pendente' ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
          }`}>
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Em análise')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center shrink-0 ${
            statusFilter === 'Em análise' 
              ? 'bg-sky-600 border-sky-600 text-white shadow-sm shadow-sky-600/15 scale-[1.02]' 
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-750 hover:bg-zinc-50 dark:hover:bg-zinc-850/30'
          }`}
        >
          <span>Em análise</span>
          <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-md font-extrabold ${
            statusFilter === 'Em análise' ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
          }`}>
            {analysisCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Confirmado')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center shrink-0 ${
            statusFilter === 'Confirmado' 
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/15 scale-[1.02]' 
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-750 hover:bg-zinc-50 dark:hover:bg-zinc-850/30'
          }`}
        >
          <span>Confirmado</span>
          <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-md font-extrabold ${
            statusFilter === 'Confirmado' ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
          }`}>
            {confirmedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Cancelado')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center shrink-0 ${
            statusFilter === 'Cancelado' 
              ? 'bg-rose-600 border-rose-600 text-white shadow-sm shadow-rose-600/15 scale-[1.02]' 
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-750 hover:bg-zinc-50 dark:hover:bg-zinc-850/30'
          }`}
        >
          <span>Cancelado</span>
          <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-md font-extrabold ${
            statusFilter === 'Cancelado' ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
          }`}>
            {cancelledCount}
          </span>
        </button>

        {reschedulePendingCount > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter('Reagendamento Pendente')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center shrink-0 ${
              statusFilter === 'Reagendamento Pendente' 
                ? 'bg-violet-600 border-violet-600 text-white shadow-sm shadow-violet-600/15 scale-[1.02]' 
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-750 hover:bg-zinc-50 dark:hover:bg-zinc-850/30'
            }`}
          >
            <span>Reagendamento</span>
            <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-md font-extrabold ${
              statusFilter === 'Reagendamento Pendente' ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
            }`}>
              {reschedulePendingCount}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
