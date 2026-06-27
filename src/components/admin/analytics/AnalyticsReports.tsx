import React from 'react';
import {
  FileText,
  Download,
  Mail,
  Settings,
  Database,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { PatientUser } from '../../../types';

interface AnalyticsReportsProps {
  loggedEmployee: PatientUser;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  reportFormat: 'pdf' | 'csv' | 'excel';
  onReportFormatChange: (val: 'pdf' | 'csv' | 'excel') => void;
  isExporting: boolean;
  onExportReport: () => Promise<void>;
  reportRecipients: string;
  onReportRecipientsChange: (val: string) => void;
  reportDay: number;
  onReportDayChange: (val: number) => void;
  isReportScheduled: boolean;
  onIsReportScheduledChange: (val: boolean) => void;
  onSaveSchedule: (e: React.FormEvent) => Promise<void>;
  scheduledSuccess: string;
  onRunColdStorage: () => Promise<void>;
  archiveSuccessMsg: string;
  archiveErrorMsg: string;
}

export default function AnalyticsReports({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  reportFormat,
  onReportFormatChange,
  isExporting,
  onExportReport,
  reportRecipients,
  onReportRecipientsChange,
  reportDay,
  onReportDayChange,
  isReportScheduled,
  onIsReportScheduledChange,
  onSaveSchedule,
  scheduledSuccess,
  onRunColdStorage,
  archiveSuccessMsg,
  archiveErrorMsg
}: AnalyticsReportsProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs flex flex-col gap-6 h-full">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <FileText className="w-5 h-5 text-pink-600" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Exportar Relatórios Operacionais</h3>
          </div>

          <div className="flex flex-col justify-between flex-1 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Data de Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  max={today}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Data de Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  min={startDate}
                  max={today}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-855 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-350">Formato:</label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="reportFormat"
                    value="pdf"
                    checked={reportFormat === 'pdf'}
                    onChange={() => onReportFormatChange('pdf')}
                    className="text-pink-600 focus:ring-pink-500"
                  />
                  PDF Institucional
                </label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-650 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="reportFormat"
                    value="csv"
                    checked={reportFormat === 'csv'}
                    onChange={() => onReportFormatChange('csv')}
                    className="text-pink-600 focus:ring-pink-500"
                  />
                  CSV
                </label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-655 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="reportFormat"
                    value="excel"
                    checked={reportFormat === 'excel'}
                    onChange={() => onReportFormatChange('excel')}
                    className="text-pink-600 focus:ring-pink-500"
                  />
                  Excel
                </label>
              </div>
            </div>

            <button
              onClick={onExportReport}
              disabled={isExporting}
              className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exportando...' : 'Exportar Relatório'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs flex flex-col gap-6 h-full">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <Mail className="w-5 h-5 text-pink-600" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Agendar Relatórios de Gestão</h3>
          </div>

          <form onSubmit={onSaveSchedule} className="flex flex-col justify-between text-xs flex-1 pt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Destinatários da Diretoria (Separados por vírgula)</label>
              <input
                type="text"
                placeholder="diretoria@hospitaldeamor.org.br"
                value={reportRecipients}
                onChange={(e) => onReportRecipientsChange(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Dia do Envio</label>
                <select
                  value={reportDay}
                  onChange={(e) => onReportDayChange(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 appearance-none"
                >
                  <option value={1}>1º Dia Útil</option>
                  <option value={2}>2º Dia Útil</option>
                  <option value={5}>5º Dia Útil</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Hora do Disparo</label>
                <input
                  type="time"
                  defaultValue="08:00"
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 py-1">
              <input
                type="checkbox"
                id="schedulerActive"
                checked={isReportScheduled}
                onChange={(e) => onIsReportScheduledChange(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-350 text-pink-600 focus:ring-pink-500 dark:border-zinc-800 dark:bg-zinc-955"
              />
              <label htmlFor="schedulerActive" className="font-semibold text-zinc-700 dark:text-zinc-350 cursor-pointer select-none">
                Habilitar envio recorrente automático
              </label>
            </div>

            <button
              type="submit"
              className="w-full h-11 border border-pink-500 hover:bg-pink-50 text-pink-600 dark:border-pink-400 dark:text-pink-400 dark:hover:bg-pink-955/15 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Settings className="w-4 h-4" />
              Salvar Configurações
            </button>
            {scheduledSuccess && (
              <p className="text-[10px] text-emerald-605 dark:text-emerald-400 font-bold mt-1 text-center animate-pulse">
                {scheduledSuccess}
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <Database className="w-5 h-5 text-pink-600" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Manutenção e Ciclo de Vida de Dados</h3>
        </div>

        {(archiveSuccessMsg || archiveErrorMsg) && (
          <div className="space-y-3 w-full animate-in fade-in">
            {archiveSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{archiveSuccessMsg}</span>
              </div>
            )}
            {archiveErrorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200/50 dark:border-red-800/30 text-red-800 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{archiveErrorMsg}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="text-xs font-extrabold text-zinc-855 dark:text-zinc-200 block">Arquivamento Automático (Cold Storage)</span>
            <p className="text-zinc-550 dark:text-zinc-400 text-xs">
              Conforme a regulamentação interna e LGPD (RF14.5), solicitações resolvidas (Concluídas ou Canceladas) há mais de 2 anos devem ser transferidas para o armazenamento frio. Isso otimiza o desempenho das buscas do painel.
            </p>
          </div>

          <button
            onClick={onRunColdStorage}
            className="h-11 px-5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs shrink-0"
          >
            <Database className="w-4 h-4" />
            Rodar Limpeza (+2 anos)
          </button>
        </div>
      </div>
    </div>
  );
}
