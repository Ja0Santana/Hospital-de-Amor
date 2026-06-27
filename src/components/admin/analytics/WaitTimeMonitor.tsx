import { AlertTriangle, Download } from 'lucide-react';

interface WaitTimeMonitorProps {
  activeQueue: any[];
  averageWaitToday: number;
  timeOffsetMin: number;
  onTimeOffsetMinChange: (val: number) => void;
  hourlyData: Array<{ hour: string; value: number }>;
  maxVal: number;
  onExportWaitCSV: () => void;
  onExportWaitPDF: () => void;
  criticalCount: number;
}

export default function WaitTimeMonitor({
  activeQueue,
  averageWaitToday,
  timeOffsetMin,
  onTimeOffsetMinChange,
  hourlyData,
  maxVal,
  onExportWaitCSV,
  onExportWaitPDF,
  criticalCount
}: WaitTimeMonitorProps) {
  return (
    <div className="space-y-8 animate-in fade-in">
      {criticalCount >= 5 && (
        <div className="p-4 bg-red-100 border border-red-300 dark:bg-red-955/30 dark:border-red-900/50 text-red-800 dark:text-red-400 rounded-2xl flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-750 shrink-0" />
          <div>
            <strong className="text-xs block">ALERTA CRÍTICO: ALTO TEMPO DE ESPERA</strong>
            <span className="text-[11px]">Existem {criticalCount} pacientes aguardando atendimento clínico há mais de 30 minutos na recepção!</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Média de Espera (Hoje)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">{averageWaitToday} min</span>
              <span className={`text-xs font-bold flex items-center ${averageWaitToday <= 22 ? 'text-green-600' : 'text-red-655'}`}>
                {averageWaitToday <= 22 ? '↓ ' : '↑ '}
                {Math.abs(averageWaitToday - 22)} min vs benchmark (22 min)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Fila Ativa na Recepção</span>
            <span className="text-4xl font-black text-zinc-900 dark:text-zinc-50">{activeQueue.length} pacientes</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Simulação de Fluxo</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onTimeOffsetMinChange(timeOffsetMin + 10)}
                className="flex-1 py-2 px-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Simular +10 min
              </button>
              <button
                type="button"
                onClick={() => onTimeOffsetMinChange(0)}
                className="py-2 px-3 border border-zinc-250 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-955 rounded-xl text-xs font-bold transition-all"
              >
                Resetar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-wide">Fila de Espera Ativa</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportWaitCSV}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-555 dark:text-zinc-350 text-xs font-bold transition-all bg-white dark:bg-zinc-955"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
              <button
                type="button"
                onClick={onExportWaitPDF}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-555 dark:text-zinc-350 text-xs font-bold transition-all bg-white dark:bg-zinc-955"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 font-bold">
                  <th className="py-2.5">Protocolo</th>
                  <th className="py-2.5">Paciente</th>
                  <th className="py-2.5">Especialidade</th>
                  <th className="py-2.5">Horário Entrada</th>
                  <th className="py-2.5 text-right">Tempo de Espera</th>
                </tr>
              </thead>
              <tbody>
                {activeQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400 italic">Nenhum paciente aguardando na recepção neste momento.</td>
                  </tr>
                ) : (
                  activeQueue.map(app => (
                    <tr
                      key={app.id}
                      className={`border-b border-zinc-100 dark:border-zinc-850/60 last:border-0 ${
                        app.isCritical
                          ? 'bg-red-50/15 dark:bg-red-955/5 text-red-800 dark:text-red-400 animate-pulse'
                          : ''
                      }`}
                    >
                      <td className="py-3 font-mono font-bold">{app.protocol}</td>
                      <td className="py-3 font-semibold text-zinc-850 dark:text-zinc-200">{app.patientName}</td>
                      <td className="py-3 text-zinc-500">{app.specialtyName}</td>
                      <td className="py-3 text-zinc-500">{new Date(app.checkInAt!).toLocaleTimeString('pt-BR')}</td>
                      <td className="py-3 text-right font-extrabold text-xs">
                        <span className={app.isCritical ? 'text-red-650 inline-flex items-center gap-1' : 'text-zinc-700 dark:text-zinc-300'}>
                          <span>{app.elapsedMin} min</span>
                          {app.isCritical && <AlertTriangle className="w-3.5 h-3.5 text-red-650 animate-pulse" />}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-wide border-b border-zinc-150 dark:border-zinc-800 pb-3">Horários de Pico (Espera Média)</h3>
          <div className="flex flex-col gap-4">
            <svg className="w-full" height="180" viewBox="0 0 450 180">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E31463" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>

              <line x1="35" y1="20" x2="35" y2="140" stroke="#d4d4d8" strokeWidth="1" className="dark:stroke-zinc-800" />
              <line x1="35" y1="140" x2="420" y2="140" stroke="#d4d4d8" strokeWidth="1" className="dark:stroke-zinc-800" />

              <line x1="35" y1="80" x2="420" y2="80" stroke="#f4f4f5" strokeWidth="1" strokeDasharray="4 4" className="dark:stroke-zinc-850" />
              <line x1="35" y1="40" x2="420" y2="40" stroke="#f4f4f5" strokeWidth="1" strokeDasharray="4 4" className="dark:stroke-zinc-850" />

              <text x="10" y="43" fill="#a1a1aa" fontSize="9" fontWeight="bold">30m</text>
              <text x="10" y="83" fill="#a1a1aa" fontSize="9" fontWeight="bold">15m</text>
              <text x="10" y="143" fill="#a1a1aa" fontSize="9" fontWeight="bold">0</text>

              {hourlyData.map((d, idx) => {
                const height = Math.max(5, (d.value / maxVal) * 110);
                return (
                  <g key={idx}>
                    <rect
                      x={60 + idx * 60}
                      y={140 - height}
                      width="24"
                      height={height}
                      rx="4"
                      fill="url(#barGrad)"
                      className="transition-all duration-300"
                    />
                    <text
                      x={72 + idx * 60}
                      y={135 - height}
                      fill={d.value > 30 ? '#EF4444' : '#71717a'}
                      fontSize="8"
                      fontWeight="black"
                      textAnchor="middle"
                    >
                      {d.value}m
                    </text>
                    <text
                      x={72 + idx * 60}
                      y="155"
                      fill="#a1a1aa"
                      fontSize="8"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {d.hour}
                    </text>
                  </g>
                );
              })}
            </svg>
            <p className="text-[10px] text-zinc-400 leading-normal text-center">
              *Dados combinados com faixas históricas do dia atual. As barras apontam a média local de minutos de espera em intervalos de 2 horas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
