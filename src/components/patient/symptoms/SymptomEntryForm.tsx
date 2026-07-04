import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../ui/Button';
import { Save, AlertCircle } from 'lucide-react';
import type { SymptomLog } from '../../../types';

export const MOODS = [
  { label: 'Péssimo', emoji: '😠', value: 1 },
  { label: 'Ruim', emoji: '🙁', value: 2 },
  { label: 'Razoável', emoji: '😐', value: 3 },
  { label: 'Bem', emoji: '🙂', value: 4 },
  { label: 'Ótimo', emoji: '😀', value: 5 },
];

const PREDEFINED_SYMPTOMS = ['Febre', 'Náusea', 'Fadiga', 'Falta de apetite', 'Dor de cabeça', 'Tontura'];

const GRAVE_KEYWORDS = ['febre', 'falta de ar', 'dispneia', 'dor forte', 'dor intensa', 'sangramento', 'convulsão'];

export const isSymptomGrave = (symptom: string) => {
  return GRAVE_KEYWORDS.some(kw => symptom.toLowerCase().includes(kw));
};

interface SymptomEntryFormProps {
  patientCpf: string;
  onSubmit: (log: SymptomLog) => void;
}

export default function SymptomEntryForm({ patientCpf, onSubmit }: SymptomEntryFormProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [notes, setNotes] = useState('');

  const handleToggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleAddCustomSymptom = (e: FormEvent) => {
    e.preventDefault();
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms((prev) => [...prev, customSymptom.trim()]);
      setCustomSymptom('');
      setIsAddingCustom(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;

    const newLog: SymptomLog = {
      patientCpf,
      mood: selectedMood,
      symptoms: selectedSymptoms,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onSubmit(newLog);

    setSelectedMood(null);
    setSelectedSymptoms([]);
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <div className="space-y-3">
        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Como você está se sentindo hoje?</label>
        <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-5 gap-2">
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
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-200/80'
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
              className="px-4 py-2 rounded-2xl text-xs font-bold border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 dark:hover:text-zinc-350"
            >
              + Outro sintoma
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="Sintoma..."
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                className="h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs focus:outline-none focus:ring-1 focus:ring-brand-pink dark:text-zinc-150"
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

      {selectedSymptoms.some(isSymptomGrave) && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-650 dark:text-red-400 text-xs font-bold rounded-2xl flex gap-2 items-start animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="block font-black">Atenção: Sintoma Grave Selecionado</span>
            <span className="text-[10px] opacity-90 leading-relaxed block mt-0.5">
              Você selecionou sintomas que requerem atenção médica imediata. Se apresentar temperatura corporal acima de 37.8°C ou dificuldade respiratória, por favor dirija-se à unidade mais próxima ou fale com o suporte.
            </span>
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={!selectedMood}
        className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-12 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
      >
        <Save className="w-4 h-4 mr-2" />
        Salvar Registro Diário
      </Button>
    </form>
  );
}
