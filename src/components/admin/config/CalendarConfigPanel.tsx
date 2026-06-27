import React, { useState } from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import type { CalendarDay } from '../../../types';

interface CalendarConfigPanelProps {
  calendarDays: CalendarDay[];
  onAddBlock: (date: string, label: string, isWorkingDay: boolean) => Promise<void>;
  onDeleteBlock: (date: string) => Promise<void>;
  onImportDefaultHolidays: () => Promise<void>;
}

export default function CalendarConfigPanel({
  calendarDays,
  onAddBlock,
  onDeleteBlock,
  onImportDefaultHolidays
}: CalendarConfigPanelProps) {
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockLabel, setNewBlockLabel] = useState('');
  const [newBlockIsWorking, setNewBlockIsWorking] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleAddBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockDate || !newBlockLabel.trim()) return;
    await onAddBlock(newBlockDate, newBlockLabel.trim(), newBlockIsWorking);
    setNewBlockDate('');
    setNewBlockLabel('');
    setNewBlockIsWorking(false);
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4 lg:col-span-1 h-full">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-55 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-600" />
              Bloquear Datas
            </h3>
            <p className="text-zinc-500 text-[0.625rem] mt-0.5">Adicione datas de suspensão de atendimento ou pontes de recesso.</p>
          </div>

          <form onSubmit={handleAddBlockSubmit} className="space-y-3">
            <div className="space-y-1 text-xs">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Data do Bloqueio *</label>
              <input
                type="date"
                value={newBlockDate}
                onChange={(e) => setNewBlockDate(e.target.value)}
                min={today}
                className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                required
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Motivo / Justificativa *</label>
              <input
                type="text"
                placeholder="Ex: Feriado Municipal Padroeira"
                value={newBlockLabel}
                onChange={(e) => setNewBlockLabel(e.target.value)}
                className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                required
              />
            </div>

            <div className="flex items-center gap-2 py-1 text-xs">
              <input
                type="checkbox"
                id="blockIsWorking"
                checked={newBlockIsWorking}
                onChange={(e) => setNewBlockIsWorking(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-350 text-pink-605 focus:ring-pink-500 dark:border-zinc-800 dark:bg-zinc-950"
              />
              <label htmlFor="blockIsWorking" className="font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                Considerar dia útil (Exceção de trabalho)
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-xs"
            >
              Habilitar Data / Justificar
            </button>
          </form>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Ferramentas de Carga</span>
            <button
              onClick={onImportDefaultHolidays}
              className="w-full border border-zinc-250 dark:border-zinc-755 hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-700 dark:text-zinc-300 font-extrabold text-xs py-2.5 rounded-xl transition-all"
            >
              + Importar Feriados Padrão (2026/2027)
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs lg:col-span-2 h-full space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-55">Calendário Operacional Exceções ({calendarDays.length})</h3>
            <p className="text-zinc-550 text-[0.625rem] mt-0.5">Lista de todas as datas com alteração de expediente clínico cadastradas.</p>
          </div>

          <div className="overflow-x-auto max-h-[380px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Justificativa / Motivo</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {calendarDays.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-450 dark:text-zinc-500 italic">
                      Nenhuma data de bloqueio ou expediente especial cadastrada.
                    </td>
                  </tr>
                ) : (
                  calendarDays.map(day => (
                    <tr key={day.date} className="border-b border-zinc-100 dark:border-zinc-850/60 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-955/10">
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatDate(day.date)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                          day.isWorkingDay
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400'
                        }`}>
                          {day.isWorkingDay ? 'Trabalho Normal' : 'Bloqueado'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-550 dark:text-zinc-400 font-medium">
                        {day.label}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onDeleteBlock(day.date)}
                          className="text-red-500 hover:text-red-750 p-1 rounded-lg transition-all inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
