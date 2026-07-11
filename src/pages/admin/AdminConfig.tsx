import type { PatientUser } from '../../types';
import {
  Sliders,
  Calendar,
  ShieldAlert,
  DollarSign,
  RefreshCw,
  Settings,
  Sun,
  Moon,
  Eye,
} from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';
import ExamsConfigPanel from '../../components/admin/config/ExamsConfigPanel';
import CalendarConfigPanel from '../../components/admin/config/CalendarConfigPanel';
import TransparencyPortalConfig from '../../components/admin/config/TransparencyPortalConfig';
import AuditLogsViewer from '../../components/admin/config/AuditLogsViewer';
import PepIntegrationPanel from '../../components/admin/config/PepIntegrationPanel';
import { useAdminConfig } from '../../components/admin/config/useAdminConfig';

interface AdminConfigProps {
  loggedEmployee: PatientUser;
}

export default function AdminConfig({ loggedEmployee }: AdminConfigProps) {
  const { fontSize, theme, setFontSize, setTheme } = useAccessibility();
  const {
    activeTab,
    setActiveTab,
    specialties,
    limits,
    calendarDays,
    logs,
    appointments,
    isProcessingPepBatch,
    pepBatchResult,
    actionSuccess,
    actionError,
    temporaryLimits,
    customPriorities,
    transparencyData,
    loadData,
    handleCreateSpecialty,
    handleCreateExam,
    handleSaveExamSettings,
    handleAddTempLimit,
    handleDeleteTempLimit,
    handleAddPriority,
    handleDeletePriority,
    handleAddBlock,
    handleDeleteBlock,
    handleImportDefaultHolidays,
    handleMonthlyRecordChange,
    handleAddProject,
    handleRemoveProject,
    handlePublishTransparency,
    handleReprocessPepBatch,
    handleSinglePepSync,
  } = useAdminConfig({ loggedEmployee });

  const renderFeedback = () => {
    return (
      <div className="space-y-3 w-full animate-in fade-in">
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <Sliders className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200/50 dark:border-red-800/30 text-red-800 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <Sliders className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">
          Configurações Hospitalares
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Gerencie parâmetros de exames, regras de capacidade e calendário operacional
          institucional.
        </p>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-4 overflow-x-auto scrollbar-none flex-nowrap pb-1">
        <button
          onClick={() => setActiveTab('exams')}
          className={`pb-3 text-xs font-bold transition-all relative shrink-0 ${
            activeTab === 'exams'
              ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
          }`}
        >
          <div className="flex items-center gap-1.5 px-1">
            <Sliders className="w-4 h-4" />
            Serviços e Capacidades
          </div>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 text-xs font-bold transition-all relative shrink-0 ${
            activeTab === 'calendar'
              ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-355'
          }`}
        >
          <div className="flex items-center gap-1.5 px-1">
            <Calendar className="w-4 h-4" />
            Calendário Institucional
          </div>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-xs font-bold transition-all relative shrink-0 ${
            activeTab === 'logs'
              ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
          }`}
        >
          <div className="flex items-center gap-1.5 px-1">
            <ShieldAlert className="w-4 h-4" />
            Auditoria de Configurações
          </div>
        </button>

        <button
          onClick={() => setActiveTab('transparency')}
          className={`pb-3 text-xs font-bold transition-all relative shrink-0 ${
            activeTab === 'transparency'
              ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
          }`}
        >
          <div className="flex items-center gap-1.5 px-1">
            <DollarSign className="w-4 h-4" />
            Mural de Transparência
          </div>
        </button>

        <button
          onClick={() => setActiveTab('pep')}
          className={`pb-3 text-xs font-bold transition-all relative shrink-0 ${
            activeTab === 'pep'
              ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
          }`}
        >
          <div className="flex items-center gap-1.5 px-1">
            <RefreshCw className="w-4 h-4" />
            Integração PEP
          </div>
        </button>

        <button
          onClick={() => setActiveTab('accessibility')}
          className={`pb-3 text-xs font-bold transition-all relative shrink-0 ${
            activeTab === 'accessibility'
              ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
          }`}
        >
          <div className="flex items-center gap-1.5 px-1">
            <Settings className="w-4 h-4" />
            Acessibilidade e Tema
          </div>
        </button>
      </div>

      {activeTab === 'exams' && (
        <div className="space-y-6">
          {renderFeedback()}
          <ExamsConfigPanel
            specialties={specialties}
            limits={limits}
            temporaryLimits={temporaryLimits}
            customPriorities={customPriorities}
            onCreateSpecialty={handleCreateSpecialty}
            onCreateExam={handleCreateExam}
            onSaveExamSettings={handleSaveExamSettings}
            onAddTempLimit={handleAddTempLimit}
            onDeleteTempLimit={handleDeleteTempLimit}
            onAddPriority={handleAddPriority}
            onDeletePriority={handleDeletePriority}
          />
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {renderFeedback()}
          <CalendarConfigPanel
            calendarDays={calendarDays}
            onAddBlock={handleAddBlock}
            onDeleteBlock={handleDeleteBlock}
            onImportDefaultHolidays={handleImportDefaultHolidays}
          />
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-6">
          {renderFeedback()}
          <AuditLogsViewer logs={logs} onRefresh={loadData} />
        </div>
      )}

      {activeTab === 'transparency' && (
        <div className="space-y-6">
          {renderFeedback()}
          <TransparencyPortalConfig
            transparencyData={transparencyData}
            onMonthlyRecordChange={handleMonthlyRecordChange}
            onAddProject={handleAddProject}
            onRemoveProject={handleRemoveProject}
            onPublishTransparency={handlePublishTransparency}
          />
        </div>
      )}

      {activeTab === 'pep' && (
        <PepIntegrationPanel
          appointments={appointments}
          logs={logs}
          onReprocessPepBatch={handleReprocessPepBatch}
          onSinglePepSync={handleSinglePepSync}
          isProcessingPepBatch={isProcessingPepBatch}
          pepBatchResult={pepBatchResult}
        />
      )}

      {activeTab === 'accessibility' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Configurações de Tema
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Ajuste o contraste e as cores da interface conforme suas preferências.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-2 ${
                  theme === 'light'
                    ? 'border-pink-600 bg-pink-50/50 text-pink-700 dark:bg-pink-955/20 dark:text-pink-450 dark:border-pink-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Sun className="w-4 h-4" />
                </div>
                <span>Tema Claro</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-2 ${
                  theme === 'dark'
                    ? 'border-pink-600 bg-pink-50/50 text-pink-700 dark:bg-pink-955/20 dark:text-pink-450 dark:border-pink-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-955/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Moon className="w-4 h-4" />
                </div>
                <span>Tema Escuro</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('contrast')}
                className={`p-4 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-2 ${
                  theme === 'contrast'
                    ? 'border-pink-600 bg-pink-50/50 text-pink-700 dark:bg-pink-955/20 dark:text-pink-450 dark:border-pink-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center text-zinc-900 dark:text-zinc-350 border border-zinc-200/50 dark:border-zinc-800">
                  <Eye className="w-4 h-4" />
                </div>
                <span>Alto Contraste</span>
              </button>
            </div>

            <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Escala de Fonte
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Aumente ou diminua o tamanho do texto para melhor legibilidade.
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {['small', 'default', 'medium', 'large', 'xlarge'].map((size) => {
                  const sizeLabels: Record<string, string> = {
                    small: 'Pequena',
                    default: 'Padrão',
                    medium: 'Média',
                    large: 'Grande',
                    xlarge: 'Extra Grande',
                  };
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFontSize(size)}
                      className={`h-9 px-4 rounded-xl border text-xs font-bold transition-all ${
                        fontSize === size
                          ? 'border-pink-600 bg-pink-50/50 text-pink-700 dark:bg-pink-955/20 dark:text-pink-450 dark:border-pink-500'
                          : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {sizeLabels[size]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
