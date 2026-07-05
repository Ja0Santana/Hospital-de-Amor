import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Activity, Download, CheckCircle, Loader2 } from 'lucide-react';
import { addSymptomLog, getSymptomLogs } from '../../services/db';
import type { SymptomLog } from '../../types';

import SymptomEntryForm from '../../components/patient/symptoms/SymptomEntryForm';
import SymptomEvolutionChart from '../../components/patient/symptoms/SymptomEvolutionChart';
import SymptomLogDetails from '../../components/patient/symptoms/SymptomLogDetails';

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

  const handleExportSymptoms = () => {
    if (logs.length === 0 || isExportingRef.current) return;
    isExportingRef.current = true;

    try {
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginLeft = 20;
      const marginRight = pageWidth - 20;
      const contentWidth = marginRight - marginLeft;
      let currentPage = 1;

      const drawHeader = () => {
        doc.setFillColor(227, 20, 99);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('HOSPITAL DE AMOR — PORTAL DO PACIENTE', marginLeft, 7.5);
        doc.text('RELATÓRIO DO DIÁRIO DE SINTOMAS', marginRight, 7.5, { align: 'right' });
      };

      const drawFooter = (pageNum: number) => {
        doc.setFillColor(245, 245, 248);
        doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(160, 160, 160);
        doc.text(
          `Hospital de Amor — Fundação Pio XII | www.hospitaldeamor.org.br | Página ${pageNum}`,
          pageWidth / 2,
          pageHeight - 4,
          { align: 'center' }
        );
      };

      const maskedCpf = patientCpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      const emissionDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

      drawHeader();

      let cursorY = 22;

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Histórico de Acompanhamento', marginLeft, cursorY);

      cursorY += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text('Registros diários de humor, sintomas relatados e observações do diário de saúde.', marginLeft, cursorY);
      doc.text(`Emitido em: ${emissionDate}`, marginRight, cursorY, { align: 'right' });

      cursorY += 6;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(marginLeft, cursorY, marginRight, cursorY);

      cursorY += 6;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(150, 150, 150);
      doc.text('IDENTIFICAÇÃO DO PACIENTE', marginLeft, cursorY);

      cursorY += 4;
      doc.setFillColor(248, 248, 250);
      doc.roundedRect(marginLeft, cursorY, contentWidth, 10, 2, 2, 'F');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('CPF do Paciente:', marginLeft + 4, cursorY + 6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(maskedCpf, marginLeft + 32, cursorY + 6.5);

      cursorY += 16;

      const colDataX = marginLeft + 2;
      const colMoodX = colDataX + 32;
      const colSymptomsX = colMoodX + 22;
      const colNotesX = colSymptomsX + 42;

      const colDataWidth = 30;
      const colMoodWidth = 20;
      const colSymptomsWidth = 40;
      const colNotesWidth = marginRight - colNotesX - 2;

      const drawTableHeaders = (y: number) => {
        doc.setFillColor(240, 240, 245);
        doc.rect(marginLeft, y, contentWidth, 7, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 80);
        doc.text('DATA / HORA', colDataX, y + 4.5);
        doc.text('ESTADO DE HUMOR', colMoodX, y + 4.5);
        doc.text('SINTOMAS RELATADOS', colSymptomsX, y + 4.5);
        doc.text('OBSERVAÇÕES', colNotesX, y + 4.5);
      };

      drawTableHeaders(cursorY);
      cursorY += 7;

      const lineHeight = 4.5;

      logs.forEach((log, index) => {
        const dateStr = new Date(log.createdAt).toLocaleString('pt-BR');
        const symptomsStr = log.symptoms.length > 0 ? log.symptoms.join(', ') : 'Nenhum';
        const notesStr = log.notes || 'Sem observações';

        const dateLines = doc.splitTextToSize(dateStr, colDataWidth);
        const moodLines = doc.splitTextToSize(log.mood, colMoodWidth);
        const symptomsLines = doc.splitTextToSize(symptomsStr, colSymptomsWidth);
        const notesLines = doc.splitTextToSize(notesStr, colNotesWidth);

        const maxLines = Math.max(dateLines.length, moodLines.length, symptomsLines.length, notesLines.length);
        const rowHeight = maxLines * lineHeight + 4;

        if (cursorY + rowHeight > pageHeight - 20) {
          drawFooter(currentPage);
          doc.addPage();
          currentPage++;
          drawHeader();
          cursorY = 22;
          drawTableHeaders(cursorY);
          cursorY += 7;
        }

        if (index % 2 === 0) {
          doc.setFillColor(252, 252, 254);
          doc.rect(marginLeft, cursorY, contentWidth, rowHeight, 'F');
        }

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);

        dateLines.forEach((line: string, i: number) => {
          doc.text(line, colDataX, cursorY + 4.5 + i * lineHeight);
        });

        moodLines.forEach((line: string, i: number) => {
          doc.text(line, colMoodX, cursorY + 4.5 + i * lineHeight);
        });

        symptomsLines.forEach((line: string, i: number) => {
          doc.text(line, colSymptomsX, cursorY + 4.5 + i * lineHeight);
        });

        notesLines.forEach((line: string, i: number) => {
          doc.text(line, colNotesX, cursorY + 4.5 + i * lineHeight);
        });

        cursorY += rowHeight;

        doc.setDrawColor(235, 235, 240);
        doc.setLineWidth(0.1);
        doc.line(marginLeft, cursorY, marginRight, cursorY);
      });

      drawFooter(currentPage);

      const fileName = `historico_sintomas_${patientCpf.replace(/\D/g, '')}.pdf`;
      doc.save(fileName);
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
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans text-left">Diário de Sintomas</h1>
          <p className="text-zinc-500 text-sm text-left">Registre diariamente seu estado de saúde para acompanhamento contínuo da equipe médica.</p>
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
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex gap-2.5 items-start animate-in fade-in zoom-in-95 duration-200 text-left">
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

          {selectedLogForDetails && (
            <SymptomLogDetails selectedLogForDetails={selectedLogForDetails} />
          )}
        </div>
      </div>
    </div>
  );
}
