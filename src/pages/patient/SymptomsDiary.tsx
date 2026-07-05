import { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Activity, Download, CheckCircle, Loader2 } from 'lucide-react';
import { addSymptomLog, getSymptomLogs } from '../../services/db';
import type { SymptomLog } from '../../types';

import SymptomEntryForm from '../../components/patient/symptoms/SymptomEntryForm';
import SymptomEvolutionChart from '../../components/patient/symptoms/SymptomEvolutionChart';
import SymptomLogDetails from '../../components/patient/symptoms/SymptomLogDetails';
import { exportSymptomsToPDF } from '../../components/patient/symptoms/symptomsExportUtils';

interface SymptomsDiaryProps {
  patientCpf: string;
}

export default function SymptomsDiary({ patientCpf }: SymptomsDiaryProps) {
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<SymptomLog | null>(null);
  const [isForceUnlocked, setIsForceUnlocked] = useState(false);
  const isExportingRef = useRef(false);

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

  const handleExportSymptoms = async () => {
    if (logs.length === 0 || isExportingRef.current) return;
    isExportingRef.current = true;

    try {
      await exportSymptomsToPDF(logs, patientCpf);
    } finally {
      setTimeout(() => {
        isExportingRef.current = false;
      }, 1000);
    }
  };

  const handleSymptomSubmit = async (newLog: SymptomLog) => {
    try {
      await addSymptomLog(newLog);
      setSaveSuccess(true);
      setIsForceUnlocked(false);
      await loadLogs();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-55 font-sans text-left">
            Diário de Sintomas
          </h1>
          <p className="text-zinc-500 text-sm text-left">
            Registre diariamente seu estado de saúde para acompanhamento contínuo da equipe médica.
          </p>
        </div>
        {logs.length > 0 && (
          <Button
            onClick={handleExportSymptoms}
            variant="outline"
            className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-bold rounded-2xl gap-2 text-xs h-11 shrink-0"
          >
            <Download className="w-4 h-4" />
            Exportar Histórico
          </Button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex gap-2.5 items-start animate-in fade-in zoom-in-95 duration-200 text-left">
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
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-955/20 flex items-center justify-center text-emerald-500 animate-pulse">
                <CheckCircle className="w-8 h-8 fill-emerald-100 dark:fill-transparent" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">
                  Hoje Registrado!
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                  Volte todo dia para manter seu status atualizado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsForceUnlocked(true)}
                className="text-xs font-extrabold text-brand-pink hover:text-brand-pink/80 hover:underline transition-colors pt-2 focus:outline-none"
              >
                Deseja adicionar mais um status para o dia de hoje?
              </button>
            </div>
          ) : (
            <SymptomEntryForm patientCpf={patientCpf} onSubmit={handleSymptomSubmit} />
          )}
        </Card>

        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-xl shadow-zinc-100 dark:shadow-none p-6 rounded-3xl bg-white dark:bg-zinc-900">
            <SymptomEvolutionChart
              logs={logs}
              selectedLogForDetails={selectedLogForDetails}
              onSelectLog={setSelectedLogForDetails}
              loading={loading}
            />
          </Card>

          {selectedLogForDetails && <SymptomLogDetails selectedLogForDetails={selectedLogForDetails} />}
        </div>
      </div>
    </div>
  );
}
