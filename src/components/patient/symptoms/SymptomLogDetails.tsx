import { Card } from '../../ui/Card';
import { AlertCircle } from 'lucide-react';
import type { SymptomLog } from '../../../types';
import { MOODS, isSymptomGrave } from './SymptomEntryForm';

interface SymptomLogDetailsProps {
  selectedLogForDetails: SymptomLog;
}

export default function SymptomLogDetails({ selectedLogForDetails }: SymptomLogDetailsProps) {
  return (
    <Card className="border-none shadow-xl shadow-zinc-100 dark:shadow-none p-6 rounded-3xl bg-white dark:bg-zinc-900 animate-in fade-in slide-in-from-right-3 duration-250 text-left">
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
              <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-850">
                {selectedLogForDetails.notes}
              </p>
            ) : (
              <p className="text-xs text-zinc-400 leading-relaxed italic">Sem observações descritas.</p>
            )}
          </div>

          {selectedLogForDetails.symptoms.some(isSymptomGrave) && (
            <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800 text-red-650 dark:text-red-400 text-xs font-bold rounded-2xl flex gap-2 items-start mt-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Sintoma grave reportado. Se houver febre persistente ou dificuldade para respirar, procure atendimento de emergência ou ligue para o suporte.</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
