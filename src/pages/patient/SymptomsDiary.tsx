import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Activity, Save, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { addSymptomLog, getSymptomLogs } from '../../services/db';
import type { SymptomLog } from '../../types';

interface SymptomsDiaryProps {
  patientCpf: string;
}

const MOODS = [
  { label: 'Péssimo', emoji: '😠', value: 1, color: 'bg-red-50 text-red-500 border-red-200 active-bg-red-500 ring-red-400' },
  { label: 'Ruim', emoji: '🙁', value: 2, color: 'bg-orange-50 text-orange-500 border-orange-200 active-bg-orange-500 ring-orange-400' },
  { label: 'Razoável', emoji: '😐', value: 3, color: 'bg-pink-50 text-brand-pink border-pink-200 active-bg-brand-pink ring-brand-pink' },
  { label: 'Bem', emoji: '🙂', value: 4, color: 'bg-emerald-50 text-emerald-600 border-emerald-200 active-bg-emerald-600 ring-emerald-400' },
  { label: 'Ótimo', emoji: '😀', value: 5, color: 'bg-green-50 text-green-600 border-green-200 active-bg-green-600 ring-green-400' },
];

const PREDEFINED_SYMPTOMS = ['Náusea', 'Fadiga', 'Falta de apetite', 'Dor de cabeça', 'Tontura'];

export default function SymptomsDiary({ patientCpf }: SymptomsDiaryProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [notes, setNotes] = useState('');
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<SymptomLog | null>(null);
  const [isForceUnlocked, setIsForceUnlocked] = useState(false);
  const hasLoggedToday = logs.some(
    (log) => new Date(log.createdAt).toDateString() === new Date().toDateString()
  );

  useEffect(() => {
    loadLogs();
    const handleUpdate = () => {
      loadLogs();
    };
    window.addEventListener('symptom-logged', handleUpdate);
    return () => {
      window.removeEventListener('symptom-logged', handleUpdate);
    };
  }, [patientCpf]);

  const loadLogs = async () => {
    try {
      const history = await getSymptomLogs(patientCpf);
      setLogs(history);
      if (history.length > 0) {
        setSelectedLogForDetails(history[history.length - 1]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleAddCustomSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms((prev) => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
      setIsAddingCustom(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;

    const newLog: SymptomLog = {
      patientCpf,
      mood: selectedMood,
      symptoms: selectedSymptoms,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      await addSymptomLog(newLog);
      setSaveSuccess(true);
      setSelectedMood(null);
      setSelectedSymptoms([]);
      setNotes('');
      setIsForceUnlocked(false);
      await loadLogs();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const getMoodValue = (moodName: string): number => {
    return MOODS.find((m) => m.label === moodName)?.value || 3;
  };

  const formatLogDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
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
                onClick={() => setSelectedLogForDetails(pt.log)}
              />
              <text
                x={pt.x}
                y={height - 10}
                textAnchor="middle"
                className={`fill-zinc-400 dark:fill-zinc-500 font-bold text-[9px] cursor-pointer ${
                  selectedLogForDetails?.createdAt === pt.log.createdAt ? 'fill-brand-pink font-extrabold' : ''
                }`}
                onClick={() => setSelectedLogForDetails(pt.log)}
              >
                {formatLogDate(pt.log.createdAt)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Diário de Sintomas</h1>
        <p className="text-zinc-500 text-sm">Registre diariamente seu estado de saúde para acompanhamento contínuo da equipe médica.</p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex gap-2.5 items-start animate-in fade-in zoom-in-95 duration-200">
          <Activity className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Registro diário salvo com sucesso! Obrigado por manter seu histórico atualizado.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-7 border-none shadow-xl shadow-zinc-100 dark:shadow-none p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-center py-20 space-y-3">
              <Loader2 className="w-6 h-6 text-brand-pink animate-spin" />
              <p className="text-xs text-zinc-400">Verificando diário de saúde...</p>
            </div>
          ) : hasLoggedToday && !isForceUnlocked ? (
            <div className="flex flex-col items-center justify-center text-center py-12 space-y-4 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 animate-pulse">
                <CheckCircle className="w-8 h-8 fill-emerald-100" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Hoje Registrado!</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                  Volte todo dia para manter seu status atualizado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsForceUnlocked(true)}
                className="text-xs font-extrabold text-brand-pink hover:text-brand-pink/80 hover:underline transition-colors pt-2"
              >
                Deseja adicionar mais um status para o dia de hoje?
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Como você está se sentindo hoje?</label>
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map((m) => {
                  const isActive = selectedMood === m.label;
                  return (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setSelectedMood(m.label)}
                      className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                        isActive
                          ? 'border-brand-pink bg-brand-pink/5 text-brand-pink ring-2 ring-brand-pink/20 font-bold scale-[1.02]'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-400 hover:text-zinc-700'
                      }`}
                    >
                      <span className="text-2xl mb-1">{m.emoji}</span>
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Sintomas Percebidos</label>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Selecione os aplicáveis</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_SYMPTOMS.map((symptom) => {
                  const isChecked = selectedSymptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => handleToggleSymptom(symptom)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                        isChecked
                          ? 'bg-secondary text-secondary-foreground shadow-md shadow-secondary/15 hover:bg-secondary/95 scale-102'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/80'
                      }`}
                    >
                      {symptom}
                    </button>
                  );
                })}

                {selectedSymptoms.filter((s) => !PREDEFINED_SYMPTOMS.includes(s)).map((custom) => (
                  <button
                    key={custom}
                    type="button"
                    onClick={() => handleToggleSymptom(custom)}
                    className="px-4 py-2 rounded-2xl text-xs font-bold bg-secondary text-secondary-foreground shadow-md shadow-secondary/15 hover:bg-secondary/95 scale-102 flex items-center gap-1.5"
                  >
                    <span>{custom}</span>
                  </button>
                ))}

                {!isAddingCustom ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(true)}
                    className="px-4 py-2 rounded-2xl text-xs font-bold border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 dark:hover:text-zinc-300"
                  >
                    + Outro sintoma
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5" onSubmit={handleAddCustomSymptom}>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Sintoma..."
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      className="h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-brand-pink"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSymptom(e);
                        } else if (e.key === 'Escape') {
                          setIsAddingCustom(false);
                        }
                      }}
                    />
                    <Button type="button" size="sm" className="h-8 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 px-3" onClick={handleAddCustomSymptom}>
                      Add
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-8 rounded-xl px-2 text-zinc-400" onClick={() => setIsAddingCustom(false)}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="symptoms-notes" className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Observações ou humor
              </label>
              <textarea
                id="symptoms-notes"
                placeholder="Gostaria de detalhar algo mais sobre o seu dia? Registre dores localizadas, reações pós-medicamento ou humor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[110px] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-brand-pink focus:border-brand-pink text-zinc-800 dark:text-zinc-200"
              />
            </div>

            <Button
              type="submit"
              disabled={!selectedMood}
              className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-12 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Registro Diário
            </Button>
          </form>
          )}
        </Card>

        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-xl shadow-zinc-100 dark:shadow-none p-6 rounded-3xl bg-white dark:bg-zinc-900">
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
          </Card>

          {selectedLogForDetails && (
            <Card className="border-none shadow-xl shadow-zinc-100 dark:shadow-none p-6 rounded-3xl bg-white dark:bg-zinc-900 animate-in fade-in slide-in-from-right-3 duration-250">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {MOODS.find((m) => m.label === selectedLogForDetails.mood)?.emoji}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      Registro de {selectedLogForDetails.mood}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">
                    {new Date(selectedLogForDetails.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-1.5">Sintomas Logados</h4>
                    {selectedLogForDetails.symptoms.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLogForDetails.symptoms.map((symptom) => (
                          <span key={symptom} className="px-2.5 py-1 rounded-xl bg-secondary/10 text-secondary text-[10px] font-extrabold">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 leading-relaxed italic">Nenhum sintoma atípico registrado.</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-1">Notas e Observações</h4>
                    {selectedLogForDetails.notes ? (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-850">
                        {selectedLogForDetails.notes}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 leading-relaxed italic">Sem observações descritas.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
