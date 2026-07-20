import React, { useState, useEffect, useRef } from 'react';
import {
  getAppointmentsForAdmin,
  getSpecialties,
  runDataLifecycleArchiving,
  addAuditLogAdmin,
  getFeedbacks,
  saveFeedbackReply,
  setFeedbackResolutionStatus
} from '../../services/db';
import type { Appointment, Specialty, PatientUser, FeedbackResponse } from '../../types';

import { Mail } from 'lucide-react';

import AnalyticsCharts from '../../components/admin/analytics/AnalyticsCharts';
import AnalyticsReports from '../../components/admin/analytics/AnalyticsReports';
import NpsFeedbackBoard from '../../components/admin/analytics/NpsFeedbackBoard';
import WaitTimeMonitor from '../../components/admin/analytics/WaitTimeMonitor';

import {
  validateInstitutionalEmails,
  exportWaitTimeToCSV as exportWaitTimeToCSVUtil,
  exportWaitTimeToPDF as exportWaitTimeToPDFUtil,
  handleExportData as handleExportDataUtil,
  handleExportNpsData as handleExportNpsDataUtil
} from '../../components/admin/analytics/analyticsExportUtils';
import CityFilteredRequestsTable from '../../components/admin/analytics/CityFilteredRequestsTable';

interface AdminAnalyticsProps {
  loggedEmployee: PatientUser;
}

export default function AdminAnalytics({ loggedEmployee }: AdminAnalyticsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('');
  const [cityViewMode, setCityViewMode] = useState<'quantitativo' | 'percentual'>('quantitativo');
  const [examRankingMode, setExamRankingMode] = useState<'top' | 'bottom'>('top');

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const today = new Date().toISOString().split('T')[0];

  const [reportRecipients, setReportRecipients] = useState<string>('diretoria@hospitaldeamor.org.br');
  const [reportDay, setReportDay] = useState<number>(1);
  const [isReportScheduled, setIsReportScheduled] = useState<boolean>(false);
  const [scheduledReportSuccess, setScheduledReportSuccess] = useState<string>('');
  const [archiveSuccessMsg, setArchiveSuccessMsg] = useState<string>('');
  const [archiveErrorMsg, setArchiveErrorMsg] = useState<string>('');

  const [simulatedReportAlert, setSimulatedReportAlert] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'demanda' | 'nps' | 'espera'>('demanda');
  const [feedbacks, setFeedbacks] = useState<FeedbackResponse[]>([]);
  const [npsSearch, setNpsSearch] = useState<string>('');
  const [selectedNpsSpecialty, setSelectedNpsSpecialty] = useState<string>('');
  const [selectedNpsRegion, setSelectedNpsRegion] = useState<string>('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [npsExportFormat, setNpsExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
  const [npsRecipients, setNpsRecipients] = useState<string>('diretoria@hospitaldeamor.org.br');
  const [isNpsReportScheduled, setIsNpsReportScheduled] = useState<boolean>(false);
  const [npsReportDay] = useState<number>(1);
  const [npsReportSuccessMsg, setNpsReportSuccessMsg] = useState<string>('');
  const [replySuccessMsgMap, setReplySuccessMsgMap] = useState<Record<string, string>>({});
  const [npsStatusFilter, setNpsStatusFilter] = useState<'Todos' | 'Pendentes' | 'Em andamento' | 'Resolvidos'>('Todos');

  const [timeOffsetMin, setTimeOffsetMin] = useState(0);
  const [, setAnalyticsTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnalyticsTick((t) => t + 1);
      if (activeTab === 'espera') {
        loadData();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [activeTab]);

  const todayApps = appointments.filter((app) => {
    if (!app.checkInAt) return false;
    const checkInDate = app.checkInAt.split('T')[0];
    return checkInDate === today;
  });

  const completedWaits = todayApps
    .filter((app) => app.attendanceStartedAt)
    .map((app) =>
      Math.max(
        0,
        Math.floor(
          (new Date(app.attendanceStartedAt!).getTime() - new Date(app.checkInAt!).getTime()) / 60000
        )
      )
    );

  const averageWaitToday = completedWaits.length > 0
    ? Math.round(completedWaits.reduce((a, b) => a + b, 0) / completedWaits.length)
    : 18;

  const activeQueue = todayApps
    .filter((app) => !app.attendanceStartedAt)
    .map((app) => {
      const elapsedMs =
        new Date().getTime() - new Date(app.checkInAt!).getTime() + timeOffsetMin * 60 * 1000;
      const elapsedMin = Math.max(0, Math.floor(elapsedMs / 60000));
      const isCritical = elapsedMin > 30;
      return { ...app, elapsedMin, isCritical };
    });

  const criticalCount = activeQueue.filter((p) => p.isCritical).length;
  const prevCriticalCount = useRef(0);

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      setTimeout(() => {
        const audioCtx2 = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc2 = audioCtx2.createOscillator();
        const gain2 = audioCtx2.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx2.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx2.currentTime);
        gain2.gain.setValueAtTime(0.15, audioCtx2.currentTime);
        osc2.start();
        osc2.stop(audioCtx2.currentTime + 0.15);
      }, 250);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (criticalCount >= 5 && criticalCount !== prevCriticalCount.current) {
      playAlertSound();
    }
    prevCriticalCount.current = criticalCount;
  }, [criticalCount]);

  const getHourlyData = () => {
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
    const baseline = [15, 28, 35, 18, 24, 12];
    return hours.map((h, idx) => {
      const actualCount = appointments.filter((app) => {
        if (!app.checkInAt) return false;
        const time = new Date(app.checkInAt).getHours();
        const startHour = parseInt(h.split(':')[0]);
        return time >= startHour && time < startHour + 2;
      }).length;
      const value = Math.max(8, baseline[idx] + actualCount * 2);
      return { hour: h, value };
    });
  };

  const hourlyData = getHourlyData();
  const maxVal = Math.max(...hourlyData.map((d) => d.value), 40);

  const exportWaitTimeToCSV = () => {
    exportWaitTimeToCSVUtil(activeQueue);
  };

  const exportWaitTimeToPDF = async () => {
    await exportWaitTimeToPDFUtil(activeQueue, averageWaitToday, loggedEmployee);
  };

  useEffect(() => {
    loadData();
    checkSimulatedReports();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allApps = await getAppointmentsForAdmin();
      setAppointments(allApps);
      const allSpecs = await getSpecialties();
      setSpecialties(allSpecs);
      const allFeedbacks = await getFeedbacks();
      setFeedbacks(allFeedbacks);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSimulatedReports = () => {
    const isSched = localStorage.getItem('report_scheduler_active') === 'true';
    if (isSched) {
      const recipients =
        localStorage.getItem('report_scheduler_recipients') || 'diretoria@hospitaldeamor.org.br';
      setSimulatedReportAlert(
        `Simulação reativa: Relatório consolidado automático enviado com sucesso para ${recipients} (Agendado para o 1º dia útil do mês).`
      );
      setTimeout(() => setSimulatedReportAlert(''), 8000);
    }
    const isNpsSched = localStorage.getItem('nps_report_scheduler_active') === 'true';
    if (isNpsSched) {
      const npsRecs =
        localStorage.getItem('nps_report_scheduler_recipients') || 'diretoria@hospitaldeamor.org.br';
      setSimulatedReportAlert((prev) =>
        prev
          ? prev + ` | Relatório de Satisfação NPS enviado para ${npsRecs}.`
          : `Simulação reativa: Relatório de Satisfação NPS enviado automaticamente para ${npsRecs} (Agendado trimestralmente).`
      );
      setTimeout(() => setSimulatedReportAlert(''), 10000);
    }
  };

  const handleSaveReportSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateInstitutionalEmails(reportRecipients);
    if (!result.isValid) {
      setScheduledReportSuccess(result.error || 'Erro ao validar e-mails.');
      setTimeout(() => setScheduledReportSuccess(''), 4000);
      return;
    }

    localStorage.setItem('report_scheduler_active', isReportScheduled.toString());
    localStorage.setItem('report_scheduler_recipients', reportRecipients);
    localStorage.setItem('report_scheduler_day', reportDay.toString());

    await addAuditLogAdmin(
      `Configuração de envio de relatórios automáticos atualizada: Ativo: ${isReportScheduled ? 'Sim' : 'Não'}, Destinatários: ${reportRecipients}, Dia útil: ${reportDay}`,
      'Relatórios',
      'Configuração de agendamento automático de relatórios consolidados',
      loggedEmployee.cpf,
      loggedEmployee.name
    );

    setScheduledReportSuccess('Configuração de agendamento salva com sucesso!');
    setTimeout(() => setScheduledReportSuccess(''), 4000);
  };

  const handleRunColdStorage = async () => {
    setArchiveSuccessMsg('');
    setArchiveErrorMsg('');
    try {
      const count = await runDataLifecycleArchiving();
      await loadData();
      await addAuditLogAdmin(
        `Rotina de arquivamento automático (Cold Storage) executada. Registros arquivados: ${count}`,
        'Sistema',
        'Limpeza periódica de solicitações inativas há mais de 2 anos',
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setArchiveSuccessMsg(`Rotina concluída com sucesso! ${count} registros movidos para o Cold Storage.`);
      setTimeout(() => setArchiveSuccessMsg(''), 5000);
    } catch (e: any) {
      console.error(e);
      setArchiveErrorMsg(e.message || 'Erro ao rodar rotina de arquivamento.');
      setTimeout(() => setArchiveErrorMsg(''), 5000);
    }
  };

  const handleSaveFeedbackReply = async (feedbackId: string) => {
    const text = replyTextMap[feedbackId];
    if (!text || !text.trim()) return;

    try {
      await saveFeedbackReply(feedbackId, text.trim(), loggedEmployee.cpf, loggedEmployee.name);
      await loadData();
      setReplyTextMap((prev) => ({ ...prev, [feedbackId]: '' }));
      setReplySuccessMsgMap((prev) => ({ ...prev, [feedbackId]: 'Resposta enviada com sucesso!' }));
      setTimeout(() => {
        setReplySuccessMsgMap((prev) => ({ ...prev, [feedbackId]: '' }));
      }, 4000);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleSetFeedbackResolutionStatus = async (
    feedbackId: string,
    status: 'Pendente' | 'Em andamento' | 'Resolvido'
  ) => {
    try {
      await setFeedbackResolutionStatus(feedbackId, status, loggedEmployee.cpf, loggedEmployee.name);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await handleExportDataUtil(appointments, reportFormat, startDate, endDate, loggedEmployee);
      await addAuditLogAdmin(
        `Relatório consolidado exportado: Formato: ${reportFormat.toUpperCase()}, Período: ${
          startDate || 'Início'
        } a ${endDate || 'Fim'}`,
        'Relatórios',
        'Exportação de dados consolidada realizada pelo operador',
        loggedEmployee.cpf,
        loggedEmployee.name
      );
    } catch (e) {
      console.error(e);
    }
    setIsExporting(false);
  };

  const handleExportNpsData = async () => {
    setIsExporting(true);
    try {
      await handleExportNpsDataUtil(feedbacks, npsExportFormat, startDate, endDate, loggedEmployee);
    } catch (e) {
      console.error(e);
    }
    setIsExporting(false);
  };

  const handleSaveNpsReportSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateInstitutionalEmails(npsRecipients);
    if (!result.isValid) {
      setNpsReportSuccessMsg(result.error || 'Erro ao validar e-mails.');
      setTimeout(() => setNpsReportSuccessMsg(''), 4000);
      return;
    }

    localStorage.setItem('nps_report_scheduler_active', isNpsReportScheduled.toString());
    localStorage.setItem('nps_report_scheduler_recipients', npsRecipients);
    localStorage.setItem('nps_report_scheduler_day', npsReportDay.toString());

    await addAuditLogAdmin(
      `Agendamento de relatório NPS atualizado: Ativo: ${isNpsReportScheduled ? 'Sim' : 'Não'}, Destinatários: ${npsRecipients}`,
      'Relatórios',
      'Configuração de agendamento de relatório NPS',
      loggedEmployee.cpf,
      loggedEmployee.name
    );

    setNpsReportSuccessMsg('Agendamento salvo com sucesso!');
    setTimeout(() => setNpsReportSuccessMsg(''), 4000);
  };

  const filteredAppointmentsList = appointments.filter((app) => {
    if (!selectedCityFilter) return true;
    return app.city?.toLowerCase() === selectedCityFilter.toLowerCase();
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-55 tracking-tight font-sans">
          Relatórios & Indicadores
        </h1>
        <p className="text-zinc-500 mt-1 text-sm">
          Painel analítico consolidado e exportação de dados operacionais.
        </p>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <button
          onClick={() => setActiveTab('demanda')}
          className={`py-2 px-1 text-sm font-extrabold border-b-2 transition-all ${
            activeTab === 'demanda'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-zinc-400 hover:text-zinc-650'
          }`}
        >
          Indicadores de Demanda
        </button>
        <button
          onClick={() => setActiveTab('nps')}
          className={`py-2 px-1 text-sm font-extrabold border-b-2 transition-all ${
            activeTab === 'nps' ? 'border-pink-600 text-pink-600' : 'border-transparent text-zinc-400 hover:text-zinc-650'
          }`}
        >
          Pesquisa de Satisfação (NPS)
        </button>
        <button
          onClick={() => setActiveTab('espera')}
          className={`py-2 px-1 text-sm font-extrabold border-b-2 transition-all ${
            activeTab === 'espera'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-zinc-400 hover:text-zinc-650'
          }`}
        >
          Tempo de Espera (Realtime)
        </button>
      </div>

      {simulatedReportAlert && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-250/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
          <Mail className="w-4 h-4 shrink-0 text-emerald-500 animate-bounce" />
          <span>{simulatedReportAlert}</span>
        </div>
      )}

      {activeTab === 'demanda' && (
        <div className="space-y-8 animate-in fade-in">
          <AnalyticsCharts
            appointments={appointments}
            specialties={specialties}
            selectedCityFilter={selectedCityFilter}
            onCityFilterChange={setSelectedCityFilter}
            cityViewMode={cityViewMode}
            onCityViewModeChange={setCityViewMode}
            examRankingMode={examRankingMode}
            onExamRankingModeChange={setExamRankingMode}
            isLoading={isLoading}
          />

          <CityFilteredRequestsTable
            selectedCityFilter={selectedCityFilter}
            onClearCityFilter={() => setSelectedCityFilter('')}
            filteredAppointmentsList={filteredAppointmentsList}
          />

          <AnalyticsReports
            loggedEmployee={loggedEmployee}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            reportFormat={reportFormat}
            onReportFormatChange={setReportFormat}
            isExporting={isExporting}
            onExportReport={handleExportData}
            reportRecipients={reportRecipients}
            onReportRecipientsChange={setReportRecipients}
            reportDay={reportDay}
            onReportDayChange={setReportDay}
            isReportScheduled={isReportScheduled}
            onIsReportScheduledChange={setIsReportScheduled}
            onSaveSchedule={handleSaveReportSchedule}
            scheduledSuccess={scheduledReportSuccess}
            onRunColdStorage={handleRunColdStorage}
            archiveSuccessMsg={archiveSuccessMsg}
            archiveErrorMsg={archiveErrorMsg}
          />
        </div>
      )}

      {activeTab === 'nps' && (
        <NpsFeedbackBoard
          feedbacks={feedbacks}
          appointments={appointments}
          specialties={specialties}
          loggedEmployee={loggedEmployee}
          npsSearch={npsSearch}
          onNpsSearchChange={setNpsSearch}
          selectedNpsSpecialty={selectedNpsSpecialty}
          onSelectedNpsSpecialtyChange={setSelectedNpsSpecialty}
          selectedNpsRegion={selectedNpsRegion}
          onSelectedNpsRegionChange={setSelectedNpsRegion}
          npsStatusFilter={npsStatusFilter}
          onNpsStatusFilterChange={setNpsStatusFilter}
          replyTextMap={replyTextMap}
          onReplyTextChange={(id, text) => setReplyTextMap((prev) => ({ ...prev, [id]: text }))}
          onSendReply={handleSaveFeedbackReply}
          replySuccessMsgMap={replySuccessMsgMap}
          onSetResolutionStatus={handleSetFeedbackResolutionStatus}
          npsExportFormat={npsExportFormat}
          onNpsExportFormatChange={setNpsExportFormat}
          isExporting={isExporting}
          onExportNpsReport={handleExportNpsData}
          npsRecipients={npsRecipients}
          onNpsRecipientsChange={setNpsRecipients}
          isNpsReportScheduled={isNpsReportScheduled}
          onIsNpsReportScheduledChange={setIsNpsReportScheduled}
          onSaveNpsSchedule={handleSaveNpsReportSchedule}
          npsReportSuccessMsg={npsReportSuccessMsg}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
        />
      )}

      {activeTab === 'espera' && (
        <WaitTimeMonitor
          activeQueue={activeQueue}
          averageWaitToday={averageWaitToday}
          timeOffsetMin={timeOffsetMin}
          onTimeOffsetMinChange={setTimeOffsetMin}
          hourlyData={hourlyData}
          maxVal={maxVal}
          onExportWaitCSV={exportWaitTimeToCSV}
          onExportWaitPDF={exportWaitTimeToPDF}
          criticalCount={criticalCount}
        />
      )}
    </div>
  );
}
