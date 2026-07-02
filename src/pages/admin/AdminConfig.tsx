import { useState, useEffect } from 'react';
import {
  Sliders,
  Calendar,
  ShieldAlert,
  DollarSign,
  RefreshCw,
  Settings,
  Sun,
  Moon,
  Eye
} from 'lucide-react';
import { useAccessibility } from '../../hooks/useAccessibility';
import {
  getSpecialties,
  updateSpecialty,
  getCalendarDays,
  saveCalendarDay,
  deleteCalendarDay,
  getCapacityLimits,
  saveCapacityLimit,
  getAuditLogs,
  addAuditLogAdmin,
  getTransparencyData,
  saveTransparencyData,
  createSpecialty,
  createExam,
  syncAllPendingPepEntries,
  syncAppointmentWithPep,
  getAppointmentsForAdmin,
  getTemporaryCapacityLimits,
  createTemporaryCapacityLimit,
  deleteTemporaryCapacityLimit,
  getCustomPriorities,
  createCustomPriority,
  deleteCustomPriority
} from '../../services/db';
import type { Specialty, CalendarDay, CapacityLimit, AuditLog, PatientUser, TransparencyData, Appointment, TemporaryCapacityLimit, CustomPriority } from '../../types';

import ExamsConfigPanel from '../../components/admin/config/ExamsConfigPanel';
import CalendarConfigPanel from '../../components/admin/config/CalendarConfigPanel';
import TransparencyPortalConfig from '../../components/admin/config/TransparencyPortalConfig';
import AuditLogsViewer from '../../components/admin/config/AuditLogsViewer';
import PepIntegrationPanel from '../../components/admin/config/PepIntegrationPanel';

interface AdminConfigProps {
  loggedEmployee: PatientUser;
}

export default function AdminConfig({ loggedEmployee }: AdminConfigProps) {
  const [activeTab, setActiveTab] = useState<'exams' | 'calendar' | 'logs' | 'transparency' | 'pep' | 'accessibility'>('exams');
  const { fontSize, theme, setFontSize, setTheme } = useAccessibility();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [limits, setLimits] = useState<CapacityLimit[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isProcessingPepBatch, setIsProcessingPepBatch] = useState(false);
  const [pepBatchResult, setPepBatchResult] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const [temporaryLimits, setTemporaryLimits] = useState<TemporaryCapacityLimit[]>([]);
  const [customPriorities, setCustomPriorities] = useState<CustomPriority[]>([]);
  const [transparencyData, setTransparencyData] = useState<TransparencyData | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setActionError('');
    setActionSuccess('');
    try {
      if (activeTab === 'exams') {
        const specs = await getSpecialties();
        const caps = await getCapacityLimits();
        const temps = await getTemporaryCapacityLimits();
        const prs = await getCustomPriorities();
        setSpecialties(specs);
        setLimits(caps);
        setTemporaryLimits(temps);
        setCustomPriorities(prs);
      } else if (activeTab === 'calendar') {
        const days = await getCalendarDays();
        const sortedDays = days.sort((a, b) => a.date.localeCompare(b.date));
        setCalendarDays(sortedDays);
      } else if (activeTab === 'logs') {
        const allLogs = await getAuditLogs();
        const filtered = allLogs.filter(log => log.module === 'Configurações');
        setLogs(filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      } else if (activeTab === 'transparency') {
        const trans = await getTransparencyData();
        if (trans) {
          setTransparencyData(trans);
        }
      } else if (activeTab === 'pep') {
        const allApps = await getAppointmentsForAdmin();
        setAppointments(allApps);
        const allLogs = await getAuditLogs();
        const pepLogs = allLogs.filter(log => log.module === 'Integração PEP');
        setLogs(pepLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      }
    } catch (e: any) {
      setActionError(e.message || 'Erro ao carregar dados de configuração.');
    }
  };

  const handleCreateSpecialty = async (name: string) => {
    setActionError('');
    setActionSuccess('');
    try {
      await createSpecialty(name);
      await addAuditLogAdmin(
        `Especialidade "${name}" cadastrada no sistema`,
        'Configurações',
        'Cadastro de nova especialidade',
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setActionSuccess(`Especialidade "${name}" cadastrada com sucesso.`);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao cadastrar especialidade.');
    }
  };

  const handleCreateExam = async (specId: string, examData: any, dailyLimit: number, weeklyLimit?: number, monthlyLimit?: number) => {
    setActionError('');
    setActionSuccess('');
    try {
      const created = await createExam(specId, examData, dailyLimit);
      await saveCapacityLimit({
        examId: created.id,
        dailyLimit,
        weeklyLimit,
        monthlyLimit
      });
      const spec = specialties.find(s => s.id === specId);
      await addAuditLogAdmin(
        `Novo exame "${examData.name}" cadastrado na especialidade "${spec?.name || ''}": Limite ${dailyLimit} vagas, Manutenção ${examData.maintenanceLimit}, Sala ${examData.room}, Duração ${examData.duration}min, Custo R$${examData.cost}, Ativo: ${examData.isActive ? 'Sim' : 'Não'}`,
        'Configurações',
        'Cadastro de novo exame/consulta',
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setActionSuccess(`Exame/Consulta "${examData.name}" cadastrado com sucesso.`);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao cadastrar exame.');
    }
  };

  const handleSaveExamSettings = async (specId: string, examId: string, examData: any, dailyLimit: number, weeklyLimit?: number, monthlyLimit?: number) => {
    setActionError('');
    setActionSuccess('');
    try {
      const spec = specialties.find(s => s.id === specId);
      if (!spec) throw new Error('Especialidade não encontrada');
      const oldExam = spec.exams.find(ex => ex.id === examId);
      if (!oldExam) throw new Error('Exame não encontrado');

      const oldLimit = limits.find(l => l.examId === examId)?.dailyLimit ?? 10;
      const changes: Record<string, { old: any; new: any }> = {};

      if ((oldExam.duration ?? 30) !== examData.duration) {
        changes.duration = { old: oldExam.duration ?? 30, new: examData.duration };
      }
      if ((oldExam.room ?? 'Sala A') !== examData.room) {
        changes.room = { old: oldExam.room ?? 'Sala A', new: examData.room };
      }
      if ((oldExam.cost ?? 0) !== examData.cost) {
        changes.cost = { old: oldExam.cost ?? 0, new: examData.cost };
      }
      if ((oldExam.requiresEncaminhamento ?? true) !== examData.requiresEncaminhamento) {
        changes.requiresEncaminhamento = { old: oldExam.requiresEncaminhamento ?? true, new: examData.requiresEncaminhamento };
      }
      if ((oldExam.isActive ?? true) !== examData.isActive) {
        changes.isActive = { old: oldExam.isActive ?? true, new: examData.isActive };
      }
      if (oldLimit !== dailyLimit) {
        changes.dailyLimit = { old: oldLimit, new: dailyLimit };
      }
      if ((oldExam.maintenanceLimit ?? 100) !== examData.maintenanceLimit) {
        changes.maintenanceLimit = { old: oldExam.maintenanceLimit ?? 100, new: examData.maintenanceLimit };
      }

      const updatedExams = spec.exams.map(ex => {
        if (ex.id === examId) {
          return { ...ex, ...examData };
        }
        return ex;
      });

      const updatedSpec: Specialty = { ...spec, exams: updatedExams };
      await updateSpecialty(updatedSpec);
      await saveCapacityLimit({
        examId,
        dailyLimit,
        weeklyLimit,
        monthlyLimit
      });

      await addAuditLogAdmin(
        `Configuração do exame "${examData.name}" atualizada: Limite ${dailyLimit} vagas, Manutenção ${examData.maintenanceLimit}, Sala ${examData.room}, Duração ${examData.duration}min, Custo R$${examData.cost}, Ativo: ${examData.isActive ? 'Sim' : 'Não'}`,
        'Configurações',
        `Parâmetros atualizados pelo gestor`,
        loggedEmployee.cpf,
        loggedEmployee.name,
        Object.keys(changes).length > 0 ? changes : undefined
      );

      setActionSuccess(`Configurações de "${examData.name}" salvas com sucesso.`);
      await loadData();
    } catch (e: any) {
      setActionError(e.message || 'Erro ao salvar configurações do exame.');
    }
  };

  const handleAddTempLimit = async (examId: string, date: string, limit: number) => {
    setActionError('');
    setActionSuccess('');
    try {
      await createTemporaryCapacityLimit({ examId, date, limit });
      const examName = specialties.flatMap(s => s.exams).find(ex => ex.id === examId)?.name || examId;
      await addAuditLogAdmin(
        `Criado limite temporário para o exame "${examName}" no dia ${date}: ${limit} vagas`,
        'Configurações',
        `Cota temporária inserida pelo gestor`,
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setActionSuccess('Cota temporária configurada com sucesso.');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao salvar cota temporária.');
    }
  };

  const handleDeleteTempLimit = async (id: number) => {
    setActionError('');
    setActionSuccess('');
    try {
      const target = temporaryLimits.find(tl => tl.id === id);
      await deleteTemporaryCapacityLimit(id);
      const examName = specialties.flatMap(s => s.exams).find(ex => ex.id === target?.examId)?.name || target?.examId;
      await addAuditLogAdmin(
        `Removido limite temporário para o exame "${examName}" no dia ${target?.date}`,
        'Configurações',
        `Cota temporária removida pelo gestor`,
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setActionSuccess('Cota temporária removida com sucesso.');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao remover cota temporária.');
    }
  };

  const handleAddPriority = async (name: string) => {
    setActionError('');
    setActionSuccess('');
    try {
      const id = 'priority-' + name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await createCustomPriority({ id, name: name.trim() });
      await addAuditLogAdmin(
        `Nova prioridade clínica criada: "${name.trim()}"`,
        'Configurações',
        `Prioridade cadastrada pelo gestor`,
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setActionSuccess('Prioridade clínica criada com sucesso.');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao criar prioridade.');
    }
  };

  const handleDeletePriority = async (id: string) => {
    setActionError('');
    setActionSuccess('');
    try {
      const target = customPriorities.find(p => p.id === id);
      await deleteCustomPriority(id);
      await addAuditLogAdmin(
        `Removida prioridade clínica: "${target?.name || id}"`,
        'Configurações',
        `Prioridade excluída pelo gestor`,
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setActionSuccess('Prioridade clínica removida com sucesso.');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao remover prioridade.');
    }
  };

  const handleAddBlock = async (date: string, label: string, isWorkingDay: boolean) => {
    setActionError('');
    setActionSuccess('');
    try {
      await saveCalendarDay({ date, label, isWorkingDay });
      await addAuditLogAdmin(
        `Adicionado bloqueio no calendário: ${date} (${label})`,
        'Configurações',
        `Data bloqueada pelo gestor`,
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setActionSuccess(`Data ${date} configurada com sucesso.`);
      await loadData();
    } catch (e: any) {
      setActionError(e.message || 'Erro ao bloquear data no calendário.');
    }
  };

  const handleDeleteBlock = async (date: string) => {
    setActionError('');
    setActionSuccess('');
    try {
      const target = calendarDays.find(d => d.date === date);
      await deleteCalendarDay(date);
      await addAuditLogAdmin(
        `Removido bloqueio do calendário: ${date}`,
        'Configurações',
        `Justificativa anterior: ${target?.label || ''}`,
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setActionSuccess(`Bloqueio de ${date} removido com sucesso.`);
      await loadData();
    } catch (e: any) {
      setActionError(e.message || 'Erro ao remover bloqueio.');
    }
  };

  const handleImportDefaultHolidays = async () => {
    setActionError('');
    setActionSuccess('');
    try {
      const years = [2026, 2027];
      const defaultHolidays = [
        { monthDay: '01-01', label: 'Confraternização Universal' },
        { monthDay: '04-21', label: 'Tiradentes' },
        { monthDay: '05-01', label: 'Dia do Trabalhador' },
        { monthDay: '09-07', label: 'Independência do Brasil' },
        { monthDay: '10-12', label: 'Nossa Senhora Aparecida' },
        { monthDay: '11-02', label: 'Finados' },
        { monthDay: '11-15', label: 'Proclamação da República' },
        { monthDay: '11-20', label: 'Dia Nacional de Zumbi e da Consciência Negra' },
        { monthDay: '12-25', label: 'Natal' }
      ];

      let count = 0;
      for (const year of years) {
        for (const hol of defaultHolidays) {
          const dateStr = `${year}-${hol.monthDay}`;
          const labelLower = hol.label.trim().toLowerCase();
          const alreadyExists = calendarDays.some(d => d.label.trim().toLowerCase() === labelLower);

          if (!alreadyExists) {
            await saveCalendarDay({ date: dateStr, label: hol.label, isWorkingDay: false });
            count++;
          }
        }
      }

      await addAuditLogAdmin(
        `Importação de feriados padrão realizada: ${count} datas inseridas/atualizadas para os anos 2026 e 2027`,
        'Configurações',
        `Importação de feriados nacionais recorrentes`,
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setActionSuccess(`Importação concluída. ${count} feriados inseridos/atualizados.`);
      await loadData();
    } catch (e: any) {
      setActionError(e.message || 'Erro ao importar feriados.');
    }
  };

  const handleMonthlyRecordChange = (index: number, field: 'entradas' | 'saidas' | 'atendimentos', value: number) => {
    if (!transparencyData) return;
    const updatedRecords = [...transparencyData.monthlyRecords];
    updatedRecords[index] = { ...updatedRecords[index], [field]: value };
    setTransparencyData({ ...transparencyData, monthlyRecords: updatedRecords });
  };

  const handleAddProject = (title: string, description: string, date: string, amount: number) => {
    if (!transparencyData) return;
    const newProj = {
      id: 'proj-' + crypto.randomUUID().slice(0, 8),
      title,
      description,
      completedDate: date,
      amountRaised: amount
    };
    setTransparencyData({
      ...transparencyData,
      projects: [newProj, ...transparencyData.projects]
    });
    setActionSuccess('Projeto adicionado à lista local (clique em "Publicar no Mural" para salvar definitivamente).');
  };

  const handleRemoveProject = (projId: string) => {
    if (!transparencyData) return;
    setTransparencyData({
      ...transparencyData,
      projects: transparencyData.projects.filter(p => p.id !== projId)
    });
    setActionSuccess('Projeto removido da lista local (clique em "Publicar no Mural" para salvar definitivamente).');
  };

  const handlePublishTransparency = async (oncologia: number, mastologia: number, radiologia: number, geral: number) => {
    if (!transparencyData) return;
    setActionError('');
    setActionSuccess('');

    const sum = oncologia + mastologia + radiologia + geral;
    if (sum !== 100) {
      setActionError(`A soma das porcentagens dos setores deve ser exatamente 100%. Soma atual: ${sum}%.`);
      return;
    }

    try {
      const updatedSectors = [
        { name: 'Oncologia', value: oncologia, color: '#e31463' },
        { name: 'Mastologia', value: mastologia, color: '#f472b6' },
        { name: 'Radiologia', value: radiologia, color: '#3b82f6' },
        { name: 'Geral', value: geral, color: '#10b981' }
      ];

      const totalArrecadado = transparencyData.monthlyRecords.reduce((acc, curr) => acc + curr.entradas, 0);
      const totalAtendimentos = transparencyData.monthlyRecords.reduce((acc, curr) => acc + curr.atendimentos, 0);

      const updatedData = {
        ...transparencyData,
        lastUpdatedAt: new Date().toISOString(),
        totalArrecadadoAno: totalArrecadado,
        atendimentosAno: totalAtendimentos,
        sectors: updatedSectors
      };

      await saveTransparencyData(updatedData);
      setTransparencyData(updatedData);

      await addAuditLogAdmin(
        `Mural de transparência publicado. Arrecadado no semestre: R$ ${totalArrecadado.toFixed(2)}, Atendimentos: ${totalAtendimentos}, Setores: Oncologia(${oncologia}%), Mastologia(${mastologia}%), Radiologia(${radiologia}%), Geral(${geral}%)`,
        'Configurações',
        `Mural de Transparência publicado pelo gestor`,
        loggedEmployee.cpf,
        loggedEmployee.name
      );

      setActionSuccess('Mural de transparência publicado e atualizado com sucesso para todos os doadores.');
    } catch (e: any) {
      setActionError(e.message || 'Erro ao publicar dados de transparência.');
    }
  };

  const handleReprocessPepBatch = async () => {
    setIsProcessingPepBatch(true);
    setPepBatchResult('');
    setActionSuccess('');
    setActionError('');
    try {
      const res = await syncAllPendingPepEntries();
      setPepBatchResult(`Lote processado. Sucesso: ${res.successCount} | Falha: ${res.failCount}`);
      setActionSuccess('Processamento da fila de mensagens concluído.');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao processar lote do PEP.');
    } finally {
      setIsProcessingPepBatch(false);
    }
  };

  const handleSinglePepSync = async (appId: string) => {
    setActionSuccess('');
    setActionError('');
    try {
      await syncAppointmentWithPep(appId);
      setActionSuccess('Sincronização individual do PEP concluída.');
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao sincronizar agendamento com PEP.');
    }
  };

  const renderFeedback = () => {
    return (
      <div className="space-y-3 w-full animate-in fade-in">
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-205 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
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
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">Configurações Hospitalares</h1>
        <p className="text-zinc-500 mt-1 text-sm">Gerencie parâmetros de exames, regras de capacidade e calendário operacional institucional.</p>
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
          <AuditLogsViewer
            logs={logs}
            onRefresh={loadData}
          />
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
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Configurações de Tema</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Ajuste o contraste e as cores da interface conforme suas preferências.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-2 ${
                  theme === 'light'
                    ? 'border-pink-600 bg-pink-50/50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-500'
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
                    ? 'border-pink-600 bg-pink-50/50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Moon className="w-4 h-4" />
                </div>
                <span>Tema Escuro</span>
              </button>
              
              <button
                type="button"
                onClick={() => setTheme('contrast')}
                className={`p-4 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-2 ${
                  theme === 'contrast'
                    ? 'border-pink-600 bg-pink-50/50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-500'
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
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Escala de Fonte</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Aumente ou diminua o tamanho do texto para melhor legibilidade.</p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {['small', 'default', 'medium', 'large', 'xlarge'].map((size) => {
                  const sizeLabels: Record<string, string> = {
                    small: 'Pequena',
                    default: 'Padrão',
                    medium: 'Média',
                    large: 'Grande',
                    xlarge: 'Extra Grande'
                  };
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFontSize(size)}
                      className={`h-9 px-4 rounded-xl border text-xs font-bold transition-all ${
                        fontSize === size
                          ? 'border-pink-600 bg-pink-50/50 text-pink-700 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-500'
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
