import React, { useRef } from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import type { Appointment, Specialty } from '../../../types';

interface AnalyticsChartsProps {
  appointments: Appointment[];
  specialties: Specialty[];
  selectedCityFilter: string;
  onCityFilterChange: (city: string) => void;
  cityViewMode: 'quantitativo' | 'percentual';
  onCityViewModeChange: (mode: 'quantitativo' | 'percentual') => void;
  examRankingMode: 'top' | 'bottom';
  onExamRankingModeChange: (mode: 'top' | 'bottom') => void;
}

export default function AnalyticsCharts({
  appointments,
  specialties,
  selectedCityFilter,
  onCityFilterChange,
  cityViewMode,
  onCityViewModeChange,
  examRankingMode,
  onExamRankingModeChange
}: AnalyticsChartsProps) {
  const chartCityRef = useRef<SVGSVGElement | null>(null);
  const chartExamsRef = useRef<SVGSVGElement | null>(null);
  const chartEvolutionRef = useRef<SVGSVGElement | null>(null);

  const getCityChartData = () => {
    const counts: Record<string, number> = {};
    let total = 0;
    appointments.forEach(app => {
      const city = app.city || 'Desconhecida';
      counts[city] = (counts[city] || 0) + 1;
      total++;
    });

    const list = Object.keys(counts).map(city => {
      const count = counts[city];
      const percent = total > 0 ? (count / total) * 100 : 0;
      return { city, count, percent };
    });

    return { list, total };
  };

  const getExamsChartData = () => {
    const counts: Record<string, number> = {};
    appointments.forEach(app => {
      const examId = app.examId;
      if (examId) {
        counts[examId] = (counts[examId] || 0) + 1;
      }
    });

    const examsList: Array<{ exam: any; count: number; specName: string }> = [];
    specialties.forEach(spec => {
      if (spec.exams) {
        spec.exams.forEach(ex => {
          const count = counts[ex.id] || 0;
          examsList.push({ exam: ex, count, specName: spec.name });
        });
      }
    });

    if (examRankingMode === 'top') {
      return examsList.sort((a, b) => b.count - a.count).slice(0, 5);
    } else {
      return examsList.sort((a, b) => a.count - b.count).slice(0, 5);
    }
  };

  const getEvolutionChartData = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().substring(0, 7));
    }

    const counts = months.map(m => {
      const count = appointments.filter(app => app.createdAt && app.createdAt.substring(0, 7) === m).length;
      return { month: m, count };
    });

    const movingAverages = counts.map((item, index) => {
      if (index < 2) return item.count;
      const val = (counts[index].count + counts[index - 1].count + counts[index - 2].count) / 3;
      return Math.round(val);
    });

    const projections = [];
    if (counts.length >= 2) {
      const lastVal = movingAverages[movingAverages.length - 1];
      const prevVal = movingAverages[movingAverages.length - 2];
      const diff = lastVal - prevVal;
      projections.push(Math.max(0, Math.round(lastVal + diff)));
      projections.push(Math.max(0, Math.round(lastVal + 2 * diff)));
      projections.push(Math.max(0, Math.round(lastVal + 3 * diff)));
    } else {
      projections.push(0, 0, 0);
    }

    return { counts, movingAverages, projections, months };
  };

  const formatMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${names[parseInt(month) - 1]}/${year.substring(2)}`;
  };

  const handleExportChartPng = (ref: React.RefObject<SVGSVGElement | null>, filename: string) => {
    const svgElement = ref.current;
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const urlApi = window.URL || (window as any).webkitURL;
    const blobURL = urlApi.createObjectURL(svgBlob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgElement.clientWidth || 600;
      canvas.height = svgElement.clientHeight || 400;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      urlApi.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  const cityData = getCityChartData();
  const examsData = getExamsChartData();
  const evolutionData = getEvolutionChartData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-6 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Demanda por Cidade</h3>
          <button
            onClick={() => handleExportChartPng(chartCityRef, 'Grafico_Demanda_Cidades.png')}
            className="text-[10px] font-extrabold text-pink-600 hover:underline"
          >
            Exportar Imagem
          </button>
        </div>

        <div className="flex flex-col items-center">
          <svg
            ref={chartCityRef}
            width="240"
            height="200"
            viewBox="0 0 240 200"
            className="w-full max-w-[240px]"
          >
            {(() => {
              const radius = 60;
              const circumference = 2 * Math.PI * radius;
              const colors = ['#e31463', '#f472b6', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'];
              let currentOffset = 0;

              return cityData.list.map((item, index) => {
                const strokeLength = (item.percent / 100) * circumference;
                const strokeOffset = currentOffset;
                currentOffset -= strokeLength;
                const color = colors[index % colors.length];

                return (
                  <circle
                    key={item.city}
                    cx="120"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth="16"
                    strokeDasharray={`${strokeLength} ${circumference}`}
                    strokeDashoffset={strokeOffset}
                    onClick={() => {
                      onCityFilterChange(selectedCityFilter === item.city ? '' : item.city);
                    }}
                    className={`cursor-pointer transition-all duration-300 ${selectedCityFilter === item.city ? 'stroke-[22]' : 'hover:stroke-[18]'}`}
                  />
                );
              });
            })()}
            <circle cx="120" cy="100" r="45" className="fill-white dark:fill-zinc-900" />
            <text
              x="120"
              y="105"
              textAnchor="middle"
              className="font-black text-sm fill-zinc-850 dark:fill-zinc-100"
            >
              {cityData.total}
            </text>
          </svg>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onCityViewModeChange('quantitativo')}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg ${cityViewMode === 'quantitativo' ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-400'}`}
            >
              Qtd
            </button>
            <button
              onClick={() => onCityViewModeChange('percentual')}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg ${cityViewMode === 'percentual' ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100' : 'text-zinc-400'}`}
            >
              %
            </button>
          </div>

          <div className="w-full mt-auto space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {cityData.list.map((item, index) => {
              const colors = ['#e31463', '#f472b6', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'];
              const color = colors[index % colors.length];
              const isActive = selectedCityFilter === item.city;

              return (
                <div
                  key={item.city}
                  onClick={() => onCityFilterChange(isActive ? '' : item.city)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${isActive ? 'bg-pink-50 text-pink-700 dark:bg-pink-955/20 dark:text-pink-400' : 'hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-655 dark:text-zinc-350'}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-semibold truncate">{item.city}</span>
                  </div>
                  <span className="font-extrabold shrink-0">
                    {cityViewMode === 'quantitativo' ? item.count : `${item.percent.toFixed(1)}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-6 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Demanda por Exame</h3>
          <button
            onClick={() => handleExportChartPng(chartExamsRef, 'Grafico_Demanda_Exames.png')}
            className="text-[10px] font-extrabold text-pink-600 hover:underline"
          >
            Exportar Imagem
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onExamRankingModeChange('top')}
            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border ${examRankingMode === 'top' ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-950/20 dark:border-pink-900/30 dark:text-pink-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 bg-white dark:bg-zinc-950'}`}
          >
            Mais Solicitados
          </button>
          <button
            onClick={() => onExamRankingModeChange('bottom')}
            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-xl border ${examRankingMode === 'bottom' ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-955/20 dark:border-pink-900/30 dark:text-pink-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 bg-white dark:bg-zinc-955'}`}
          >
            Menos Solicitados
          </button>
        </div>

        <svg
          ref={chartExamsRef}
          width="450"
          height="220"
          viewBox="0 0 450 220"
          className="w-full"
        >
          {(() => {
            const maxCount = Math.max(...examsData.map(e => e.count), 1);
            return examsData.map((item, index) => {
              const y = index * 42 + 20;
              const barWidth = (item.count / maxCount) * 380;
              const isOverLimit = item.count >= (item.exam.maintenanceLimit ?? 100);

              return (
                <g key={item.exam.id}>
                  <text
                    x="0"
                    y={y - 6}
                    className="text-[10px] font-bold fill-zinc-800 dark:fill-zinc-200"
                  >
                    {item.exam.name.substring(0, 32)}
                  </text>
                  <rect
                    x="0"
                    y={y}
                    width="380"
                    height="10"
                    rx="5"
                    className="fill-zinc-100 dark:fill-zinc-800"
                  />
                  <rect
                    x="0"
                    y={y}
                    width={Math.max(barWidth, 6)}
                    height="10"
                    rx="5"
                    className={`${isOverLimit ? 'fill-red-600 animate-pulse' : 'fill-pink-600'}`}
                  />
                  <text
                    x={Math.max(barWidth, 6) + 8}
                    y={y + 8}
                    className="text-[10px] font-black fill-zinc-900 dark:fill-zinc-100"
                  >
                    {item.count}
                  </text>
                </g>
              );
            });
          })()}
        </svg>

        <div className="space-y-3 pt-2 max-h-[160px] overflow-y-auto pr-1 mt-auto">
          {examsData.map((item) => {
            const limit = item.exam.maintenanceLimit ?? 100;
            const isOverLimit = item.count >= limit;

            return (
              <div key={item.exam.id} className="flex flex-col p-2.5 bg-zinc-50 dark:bg-zinc-955/20 border border-zinc-100 dark:border-zinc-850 rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{item.exam.name}</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{item.specName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">Capacidade de Utilização: {item.count} / {limit}</span>
                  {isOverLimit && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-955/20 px-2 py-0.5 rounded-lg border border-red-200/40 dark:border-red-900/30 animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Alerta de Manutenção!</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-6 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Evolução e Projeções</h3>
          <button
            onClick={() => handleExportChartPng(chartEvolutionRef, 'Grafico_Evolucao_Demanda.png')}
            className="text-[10px] font-extrabold text-pink-600 hover:underline"
          >
            Exportar Imagem
          </button>
        </div>

        <svg
          ref={chartEvolutionRef}
          width="350"
          height="215"
          viewBox="0 0 350 215"
          className="w-full"
        >
          {(() => {
            const maxVal = Math.max(...evolutionData.counts.map(c => c.count), ...evolutionData.movingAverages, ...evolutionData.projections, 1);

            const pointsActual = evolutionData.counts.map((item, index) => {
              const x = index * 34 + 35;
              const y = 170 - (item.count / maxVal) * 140;
              return { x, y, label: formatMonthName(item.month), count: item.count };
            });

            const pointsMA = evolutionData.movingAverages.map((val, index) => {
              const x = index * 34 + 35;
              const y = 170 - (val / maxVal) * 140;
              return { x, y };
            });

            const startProjIndex = pointsMA.length - 1;
            const pointsProj = [{
              x: pointsMA[startProjIndex].x,
              y: pointsMA[startProjIndex].y,
              value: evolutionData.movingAverages[startProjIndex]
            }];
            evolutionData.projections.forEach((val, index) => {
              const x = (startProjIndex + index + 1) * 34 + 35;
              const y = 170 - (val / maxVal) * 140;
              pointsProj.push({ x, y, value: val });
            });

            const getProjMonthLabel = (projIndex: number) => {
              if (evolutionData.counts.length === 0) return '';
              const lastMonthStr = evolutionData.counts[evolutionData.counts.length - 1].month;
              const [yearStr, monthStr] = lastMonthStr.split('-');
              let y = parseInt(yearStr);
              let m = parseInt(monthStr);

              m += projIndex + 1;
              while (m > 12) {
                m -= 12;
                y += 1;
              }
              const paddedMonth = m < 10 ? `0${m}` : `${m}`;
              return formatMonthName(`${y}-${paddedMonth}`);
            };

            const pathActualD = pointsActual.length > 0 ? `M ${pointsActual[0].x} ${pointsActual[0].y} ` + pointsActual.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : '';
            const pathMAD = pointsMA.length > 0 ? `M ${pointsMA[0].x} ${pointsMA[0].y} ` + pointsMA.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : '';
            const pathProjD = pointsProj.length > 0 ? `M ${pointsProj[0].x} ${pointsProj[0].y} ` + pointsProj.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') : '';

            return (
              <g>
                <text x="28" y="33" textAnchor="end" className="text-[8px] font-bold fill-zinc-450 dark:fill-zinc-400">{Math.round(maxVal)}</text>
                <text x="28" y="103" textAnchor="end" className="text-[8px] font-bold fill-zinc-450 dark:fill-zinc-400">{Math.round(maxVal / 2)}</text>
                <text x="28" y="173" textAnchor="end" className="text-[8px] font-bold fill-zinc-450 dark:fill-zinc-400">0</text>

                <line x1="35" y1="30" x2="335" y2="30" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="35" y1="100" x2="335" y2="100" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="35" y1="170" x2="335" y2="170" className="stroke-zinc-200 dark:stroke-zinc-750" strokeWidth="1.5" />

                {pathProjD && (
                  <path
                    d={pathProjD}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />
                )}

                {pathMAD && (
                  <path
                    d={pathMAD}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                  />
                )}

                {pathActualD && (
                  <path
                    d={pathActualD}
                    fill="none"
                    stroke="#e31463"
                    strokeWidth="3"
                  />
                )}

                {pointsActual.map((p, idx) => {
                  const hasNote = p.label.includes('Out') || p.label.includes('Nov');
                  return (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        className="fill-pink-600 stroke-white dark:stroke-zinc-900 stroke-2"
                      />
                      <text
                        x={p.x}
                        y={p.y - 8}
                        textAnchor="middle"
                        className="text-[8px] font-extrabold fill-pink-600 dark:fill-pink-400"
                      >
                        {p.count}
                      </text>
                      <text
                        x={p.x}
                        y="192"
                        textAnchor="end"
                        transform={`rotate(-45, ${p.x}, 192)`}
                        className="text-[8px] font-bold fill-zinc-500 dark:fill-zinc-400"
                      >
                        {p.label}
                      </text>
                      {hasNote && (
                        <g>
                          <line x1={p.x} y1="30" x2={p.x} y2="170" className="stroke-pink-500/20" strokeWidth="1" strokeDasharray="2 2" />
                          <circle cx={p.x} cy="30" r="3" className="fill-pink-500" />
                        </g>
                      )}
                    </g>
                  );
                })}
                {pointsProj.slice(1).map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      className="fill-violet-500 stroke-white dark:stroke-zinc-900 stroke-2"
                    />
                    <text
                      x={p.x}
                      y={p.y - 8}
                      textAnchor="middle"
                      className="text-[8px] font-extrabold fill-violet-600 dark:fill-violet-400"
                    >
                      {p.value}
                    </text>
                    <text
                      x={p.x}
                      y="192"
                      textAnchor="end"
                      transform={`rotate(-45, ${p.x}, 192)`}
                      className="text-[8px] font-bold fill-zinc-500 dark:fill-zinc-400"
                    >
                      {getProjMonthLabel(idx)}
                    </text>
                  </g>
                ))}
              </g>
            );
          })()}
        </svg>

        <div className="flex flex-col gap-2 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-pink-600 rounded-sm shrink-0" />
            <span className="text-zinc-650 dark:text-zinc-350">Demanda Real</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-t-2 border-emerald-500 border-dashed shrink-0" />
            <span className="text-zinc-650 dark:text-zinc-350">Média Móvel (3 Meses)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-t-2 border-violet-500 border-dashed shrink-0" />
            <span className="text-zinc-650 dark:text-zinc-350 font-bold text-violet-650">Projeção (Mais 3 Meses)</span>
          </div>
        </div>

        <div className="mt-auto p-3 bg-zinc-50 dark:bg-zinc-955/20 border border-zinc-100 dark:border-zinc-850 rounded-2xl text-[10px] space-y-2 text-zinc-500">
          <div className="flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-pink-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-zinc-750 dark:text-zinc-350">Nota de Contexto Outubro:</strong> Outubro Rosa impulsiona exames preventivos de mamografia (+25% demanda histórica).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
