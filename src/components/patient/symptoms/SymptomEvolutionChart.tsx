import { AlertCircle } from 'lucide-react';
import type { SymptomLog } from '../../../types';
import { MOODS } from './SymptomEntryForm';

interface SymptomEvolutionChartProps {
  logs: SymptomLog[];
  selectedLogForDetails: SymptomLog | null;
  onSelectLog: (log: SymptomLog) => void;
  loading: boolean;
}

export default function SymptomEvolutionChart({
  logs,
  selectedLogForDetails,
  onSelectLog,
  loading
}: SymptomEvolutionChartProps) {
  const getMoodValue = (moodName: string): number => {
    return MOODS.find((m) => m.label === moodName)?.value || 3;
  };

  const formatLogDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
  };

  const calculateTrend = () => {
    if (logs.length < 2) return 'Aguardando mais registros diários para traçar tendência.';
    const recentValues = logs.slice(-3).map((l) => getMoodValue(l.mood));
    const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;

    if (avg >= 4) {
      return 'Tendência Positiva - Sua percepção de bem-estar está excelente nos últimos dias. Continue se cuidando!';
    } else if (avg <= 2) {
      return 'Atenção - Você registrou sintomas mais intensos recentemente. Se os sintomas persistirem ou piorarem, entre em contato com nossa equipe médica de suporte.';
    } else {
      return 'Tendência Estável - Sua percepção de bem-estar manteve-se equilibrada nos últimos dias. Continue registrando.';
    }
  };

  const renderEvolutionChart = () => {
    if (logs.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-400 text-xs">
          Nenhum registro nos últimos 7 dias.
        </div>
      );
    }

    const chartLogs = logs.slice(-7);
    const width = 360;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const pointsCount = chartLogs.length;
    const getX = (index: number) => {
      if (pointsCount <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + (index / (pointsCount - 1)) * chartWidth;
    };

    const getY = (val: number) => {
      return paddingTop + chartHeight - ((val - 1) / 4) * chartHeight;
    };

    const pointCoords = chartLogs.map((log, idx) => ({
      x: getX(idx),
      y: getY(getMoodValue(log.mood)),
      log,
    }));

    let pathD = '';
    let areaD = '';

    if (pointCoords.length > 0) {
      pathD = `M ${pointCoords[0].x} ${pointCoords[0].y}`;
      areaD = `M ${pointCoords[0].x} ${paddingTop + chartHeight} L ${pointCoords[0].x} ${pointCoords[0].y}`;

      for (let i = 1; i < pointCoords.length; i++) {
        pathD += ` L ${pointCoords[i].x} ${pointCoords[i].y}`;
        areaD += ` L ${pointCoords[i].x} ${pointCoords[i].y}`;
      }

      areaD += ` L ${pointCoords[pointCoords.length - 1].x} ${paddingTop + chartHeight} Z`;
    }

    return (
      <div className="relative bg-zinc-50 dark:bg-zinc-950 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-inner">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e31463" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#e31463" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[1, 2, 3, 4, 5].map((val) => (
            <line
              key={val}
              x1={paddingLeft}
              y1={getY(val)}
              x2={width - paddingRight}
              y2={getY(val)}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {MOODS.map((m) => (
            <text
              key={m.value}
              x={paddingLeft - 10}
              y={getY(m.value) + 3}
              textAnchor="end"
              className="fill-zinc-400 dark:fill-zinc-500 font-bold text-[9px]"
            >
              {m.emoji}
            </text>
          ))}

          {pointCoords.length > 0 && (
            <>
              <path d={areaD} fill="url(#chartGradient)" />
              <path d={pathD} fill="none" stroke="#e31463" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {pointCoords.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="6"
                className={`fill-white stroke-2 cursor-pointer transition-all ${
                  selectedLogForDetails?.createdAt === pt.log.createdAt
                    ? 'stroke-brand-pink fill-brand-pink'
                    : 'stroke-brand-pink hover:fill-brand-pink'
                }`}
                onClick={() => onSelectLog(pt.log)}
              />
              <text
                x={pt.x}
                y={height - 10}
                textAnchor="middle"
                className={`fill-zinc-400 dark:fill-zinc-500 font-bold text-[9px] cursor-pointer ${
                  selectedLogForDetails?.createdAt === pt.log.createdAt ? 'fill-brand-pink font-extrabold' : ''
                }`}
                onClick={() => onSelectLog(pt.log)}
              >
                {formatLogDate(pt.log.createdAt)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1 mb-4">
        <h2 className="text-sm font-black uppercase text-zinc-400 tracking-wider">Evolução do Bem-estar</h2>
        <p className="text-[10px] text-zinc-500">Acompanhamento dos últimos 7 dias de percepção de saúde.</p>
      </div>
      {loading ? (
        <div className="h-48 flex items-center justify-center text-xs text-zinc-400">Carregando histórico...</div>
      ) : (
        renderEvolutionChart()
      )}

      <div className="mt-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800/80 flex gap-3 items-start">
        <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${logs.length < 2 || logs.slice(-3).reduce((acc, curr) => acc + getMoodValue(curr.mood), 0) / Math.min(3, logs.length) > 2 ? 'text-zinc-400' : 'text-amber-500'}`} />
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
          {loading ? 'Analisando...' : calculateTrend()}
        </p>
      </div>
    </div>
  );
}
