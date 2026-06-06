import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { X, Save, Activity, CheckCircle } from 'lucide-react';
import { addSymptomLog, getSymptomLogs } from '../services/db';
import type { SymptomLog } from '../types';

interface SymptomFloatingWidgetProps {
  patientCpf: string;
  currentPage: string;
}

const MOODS = [
  { label: 'Péssimo', emoji: '😠' },
  { label: 'Ruim', emoji: '🙁' },
  { label: 'Razoável', emoji: '😐' },
  { label: 'Bem', emoji: '🙂' },
  { label: 'Ótimo', emoji: '😀' },
];

const PREDEFINED_SYMPTOMS = ['Náusea', 'Fadiga', 'Falta de apetite', 'Dor de cabeça', 'Tontura'];

export default function SymptomFloatingWidget({ patientCpf, currentPage }: SymptomFloatingWidgetProps) {
  const [hasLoggedToday, setHasLoggedToday] = useState(true);
  const [isDismissed, setIsDismissed] = useState(() => sessionStorage.getItem('symptoms-widget-dismissed') === 'true');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isForceUnlocked, setIsForceUnlocked] = useState(false);

  useEffect(() => {
    checkLogToday();
    const handleUpdate = () => checkLogToday();
    window.addEventListener('symptom-logged', handleUpdate);
    return () => window.removeEventListener('symptom-logged', handleUpdate);
  }, [patientCpf]);

  const checkLogToday = async () => {
    try {
      const history = await getSymptomLogs(patientCpf);
      if (history.length === 0) {
        setHasLoggedToday(false);
        return;
      }
      
      const lastLog = history[history.length - 1];
      const lastLogDate = new Date(lastLog.createdAt).toDateString();
      const todayDate = new Date().toDateString();
      
      setHasLoggedToday(lastLogDate === todayDate);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('symptoms-widget-dismissed', 'true');
    setIsDismissed(true);
  };

  const handleToggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
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
      window.dispatchEvent(new CustomEvent('symptom-logged'));
      setTimeout(() => {
        setHasLoggedToday(true);
        setIsForceUnlocked(false);
        setSaveSuccess(false);
        setSelectedMood(null);
        setSelectedSymptoms([]);
        setNotes('');
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  if (currentPage === 'symptoms' || isDismissed) {
    return null;
  }

  return (
    <Card className="fixed left-6 md:left-72 bottom-6 z-40 max-w-sm w-[320px] bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 shadow-2xl p-4 rounded-3xl animate-in slide-in-from-bottom-5 duration-300">
      {saveSuccess ? (
        <div className="flex flex-col items-center justify-center text-center py-6 space-y-2 animate-in zoom-in-95 duration-200">
          <CheckCircle className="w-10 h-10 text-emerald-500 fill-emerald-100" />
          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Registro Salvo!</h4>
          <p className="text-[10px] text-zinc-400">Obrigado por atualizar seu diário hoje.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-brand-pink">
              <Activity className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Diário de Saúde</h3>
            </div>
            <button 
              onClick={handleDismiss} 
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Ocultar lembrete"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {hasLoggedToday && !isForceUnlocked ? (
            <div className="space-y-3 py-2 text-center animate-in fade-in duration-200">
              <p className="text-xs font-bold text-zinc-600 dark:text-zinc-350 leading-relaxed">
                Volte todo dia para manter seu status atualizado.
              </p>
              <button
                type="button"
                onClick={() => setIsForceUnlocked(true)}
                className="text-[10px] font-extrabold text-brand-pink hover:text-brand-pink/80 hover:underline transition-colors block mx-auto pt-1"
              >
                Deseja adicionar mais um status para o dia de hoje?
              </button>
            </div>
          ) : (
            <>
              {!selectedMood ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                    Como está se sentindo hoje? Registre em poucos cliques:
                  </p>
                  <div className="flex justify-between gap-1">
                    {MOODS.map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => setSelectedMood(m.label)}
                        className="flex flex-col items-center justify-center w-11 h-11 rounded-2xl bg-zinc-50 hover:bg-brand-pink/5 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 hover:border-brand-pink/20 transition-all hover:scale-110 active:scale-95 group"
                        title={m.label}
                      >
                        <span className="text-lg">{m.emoji}</span>
                        <span className="text-[7px] text-zinc-400 group-hover:text-brand-pink font-semibold uppercase mt-0.5">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <span className="text-lg">
                      {MOODS.find((m) => m.label === selectedMood)?.emoji}
                    </span>
                    <span className="text-[10px] font-black uppercase text-zinc-700 dark:text-zinc-300">
                      Sentindo-se {selectedMood}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedMood(null)}
                      className="ml-auto text-[9px] font-bold text-zinc-400 hover:text-brand-pink underline"
                    >
                      Alterar
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Algum sintoma hoje?</label>
                    <div className="flex flex-wrap gap-1">
                      {PREDEFINED_SYMPTOMS.map((symptom) => {
                        const isChecked = selectedSymptoms.includes(symptom);
                        return (
                          <button
                            key={symptom}
                            type="button"
                            onClick={() => handleToggleSymptom(symptom)}
                            className={`px-2.5 py-1 rounded-xl text-[9px] font-bold transition-all ${
                              isChecked
                                ? 'bg-secondary text-secondary-foreground shadow-sm shadow-secondary/10'
                                : 'bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:bg-zinc-100 border border-zinc-100 dark:border-zinc-850'
                            }`}
                          >
                            {symptom}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <textarea
                      placeholder="Alguma observação rápida? (opcional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full h-12 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-[10px] focus:outline-none focus:ring-1 focus:ring-brand-pink text-zinc-700 dark:text-zinc-300"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-9 rounded-xl shadow-md shadow-brand-pink/15 text-[10px] transition-transform hover:scale-[1.01]"
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Salvar Registro
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
