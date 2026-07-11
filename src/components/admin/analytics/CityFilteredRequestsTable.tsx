import type { Appointment } from '../../../types';

interface CityFilteredRequestsTableProps {
  selectedCityFilter: string;
  onClearCityFilter: () => void;
  filteredAppointmentsList: Appointment[];
}

export default function CityFilteredRequestsTable({
  selectedCityFilter,
  onClearCityFilter,
  filteredAppointmentsList,
}: CityFilteredRequestsTableProps) {
  if (!selectedCityFilter) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Solicitações Filtradas - {selectedCityFilter}
        </h3>
        <button
          onClick={onClearCityFilter}
          className="text-xs font-bold text-pink-600 hover:underline focus:outline-none"
        >
          Limpar Filtro
        </button>
      </div>

      <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
        <table className="w-full text-left border-collapse text-xs hidden md:table">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-855 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <th className="py-2.5 px-3">Protocolo</th>
              <th className="py-2.5 px-3">Paciente</th>
              <th className="py-2.5 px-3">Exame</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointmentsList.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-zinc-450 dark:text-zinc-500">
                  Nenhuma solicitação encontrada para esta cidade.
                </td>
              </tr>
            ) : (
              filteredAppointmentsList.map((app) => (
                <tr key={app.id} className="border-b border-zinc-100 dark:border-zinc-850">
                  <td className="py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                    {app.protocol}
                  </td>
                  <td className="py-2 px-3 text-zinc-650 dark:text-zinc-300">{app.patientName}</td>
                  <td className="py-2 px-3 text-zinc-650 dark:text-zinc-300">{app.examName}</td>
                  <td className="py-2 px-3">
                    <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="block md:hidden space-y-3">
          {filteredAppointmentsList.length === 0 ? (
            <div className="py-8 text-center text-zinc-450 dark:text-zinc-500 text-xs">
              Nenhuma solicitação encontrada para esta cidade.
            </div>
          ) : (
            filteredAppointmentsList.map((app) => (
              <div
                key={app.id}
                className="p-4 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 space-y-2 text-[11px]"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider text-[9px]">Protocolo</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{app.protocol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider text-[9px]">Paciente</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">{app.patientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider text-[9px]">Exame</span>
                  <span className="text-zinc-600 dark:text-zinc-400">{app.examName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider text-[9px]">Status</span>
                  <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                    {app.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
