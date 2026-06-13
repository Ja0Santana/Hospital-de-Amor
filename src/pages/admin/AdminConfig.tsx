import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Calendar, 
  Clock, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Lock, 
  Unlock, 
  BookOpen, 
  ShieldAlert, 
  DollarSign,
  MapPin,
  FileText
} from 'lucide-react';
import { 
  getSpecialties, 
  updateSpecialty, 
  getCalendarDays, 
  saveCalendarDay, 
  deleteCalendarDay, 
  getCapacityLimits, 
  saveCapacityLimit, 
  getAuditLogs, 
  addAuditLogAdmin 
} from '../../services/db';
import type { Specialty, Exam, CalendarDay, CapacityLimit, AuditLog, PatientUser } from '../../types';

interface AdminConfigProps {
  loggedEmployee: PatientUser;
}

export default function AdminConfig({ loggedEmployee }: AdminConfigProps) {
  const [activeTab, setActiveTab] = useState<'exams' | 'calendar' | 'logs'>('exams');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [limits, setLimits] = useState<CapacityLimit[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editingExamSpecId, setEditingExamSpecId] = useState<string>('');
  const [durationInput, setDurationInput] = useState<number>(30);
  const [roomInput, setRoomInput] = useState<string>('Sala A');
  const [costInput, setCostInput] = useState<number>(0);
  const [requiresEncaminhamentoInput, setRequiresEncaminhamentoInput] = useState<boolean>(true);
  const [isActiveInput, setIsActiveInput] = useState<boolean>(true);
  const [limitInput, setLimitInput] = useState<number>(10);

  const [newBlockDate, setNewBlockDate] = useState<string>('');
  const [newBlockLabel, setNewBlockLabel] = useState<string>('');
  const [newBlockIsWorking, setNewBlockIsWorking] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingExam) {
        setEditingExam(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingExam]);

  const loadData = async () => {
    setLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      if (activeTab === 'exams') {
        const specs = await getSpecialties();
        const caps = await getCapacityLimits();
        setSpecialties(specs);
        setLimits(caps);
      } else if (activeTab === 'calendar') {
        const days = await getCalendarDays();
        const sortedDays = days.sort((a, b) => a.date.localeCompare(b.date));
        setCalendarDays(sortedDays);
      } else if (activeTab === 'logs') {
        const allLogs = await getAuditLogs();
        const filtered = allLogs.filter(log => log.module === 'Configurações');
        setLogs(filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      }
    } catch (e: any) {
      setActionError(e.message || 'Erro ao carregar dados de configuração.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExamClick = (specId: string, exam: Exam) => {
    const limitObj = limits.find(l => l.examId === exam.id);
    setEditingExam(exam);
    setEditingExamSpecId(specId);
    setDurationInput(exam.duration ?? 30);
    setRoomInput(exam.room ?? 'Sala A');
    setCostInput(exam.cost ?? 0);
    setRequiresEncaminhamentoInput(exam.requiresEncaminhamento ?? true);
    setIsActiveInput(exam.isActive ?? true);
    setLimitInput(limitObj?.dailyLimit ?? 10);
  };

  const handleSaveExamSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !editingExamSpecId) return;

    try {
      const spec = specialties.find(s => s.id === editingExamSpecId);
      if (!spec) throw new Error('Especialidade não encontrada');

      const oldLimit = limits.find(l => l.examId === editingExam.id)?.dailyLimit ?? 10;
      const changes: Record<string, { old: any; new: any }> = {};

      if ((editingExam.duration ?? 30) !== durationInput) {
        changes.duration = { old: editingExam.duration ?? 30, new: durationInput };
      }
      if ((editingExam.room ?? 'Sala A') !== roomInput) {
        changes.room = { old: editingExam.room ?? 'Sala A', new: roomInput };
      }
      if ((editingExam.cost ?? 0) !== costInput) {
        changes.cost = { old: editingExam.cost ?? 0, new: costInput };
      }
      if ((editingExam.requiresEncaminhamento ?? true) !== requiresEncaminhamentoInput) {
        changes.requiresEncaminhamento = { old: editingExam.requiresEncaminhamento ?? true, new: requiresEncaminhamentoInput };
      }
      if ((editingExam.isActive ?? true) !== isActiveInput) {
        changes.isActive = { old: editingExam.isActive ?? true, new: isActiveInput };
      }
      if (oldLimit !== limitInput) {
        changes.dailyLimit = { old: oldLimit, new: limitInput };
      }

      const updatedExams = spec.exams.map(ex => {
        if (ex.id === editingExam.id) {
          return {
            ...ex,
            duration: durationInput,
            room: roomInput,
            cost: costInput,
            requiresEncaminhamento: requiresEncaminhamentoInput,
            isActive: isActiveInput
          };
        }
        return ex;
      });

      const updatedSpec: Specialty = {
        ...spec,
        exams: updatedExams
      };

      await updateSpecialty(updatedSpec);
      await saveCapacityLimit({
        examId: editingExam.id,
        dailyLimit: limitInput
      });

      await addAuditLogAdmin(
        `Configuração do exame "${editingExam.name}" atualizada: Limite ${limitInput} vagas, Sala ${roomInput}, Duração ${durationInput}min, Custo R$${costInput}, Ativo: ${isActiveInput ? 'Sim' : 'Não'}`,
        'Configurações',
        `Parâmetros atualizados pelo gestor`,
        loggedEmployee.cpf,
        loggedEmployee.name,
        Object.keys(changes).length > 0 ? changes : undefined
      );

      setActionSuccess(`Configurações de "${editingExam.name}" salvas com sucesso.`);
      setEditingExam(null);
      await loadData();
    } catch (e: any) {
      setActionError(e.message || 'Erro ao salvar configurações do exame.');
    }
  };

  const handleAddBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockDate || !newBlockLabel.trim()) {
      setActionError('Preencha a data e o motivo do bloqueio.');
      return;
    }

    try {
      const day: CalendarDay = {
        date: newBlockDate,
        label: newBlockLabel.trim(),
        isWorkingDay: newBlockIsWorking
      };

      await saveCalendarDay(day);
      await addAuditLogAdmin(
        `Adicionado bloqueio no calendário: ${newBlockDate} (${newBlockLabel.trim()})`,
        'Configurações',
        `Data bloqueada pelo gestor`,
        loggedEmployee.cpf,
        loggedEmployee.name
      );

      setActionSuccess(`Data ${newBlockDate} configurada com sucesso.`);
      setNewBlockDate('');
      setNewBlockLabel('');
      setNewBlockIsWorking(false);
      await loadData();
    } catch (e: any) {
      setActionError(e.message || 'Erro ao bloquear data no calendário.');
    }
  };

  const handleDeleteBlock = async (date: string) => {
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
    setLoading(true);

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
            const day: CalendarDay = {
              date: dateStr,
              label: hol.label,
              isWorkingDay: false
            };
            await saveCalendarDay(day);
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
    } finally {
      setLoading(false);
    }
  };

  const getExamLimit = (examId: string) => {
    const lim = limits.find(l => l.examId === examId);
    return lim ? lim.dailyLimit : 10;
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">Configurações Hospitalares</h1>
        <p className="text-zinc-500 mt-1 text-sm">Gerencie parâmetros de exames, regras de capacidade e calendário operacional institucional.</p>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <button
          onClick={() => setActiveTab('exams')}
          className={`pb-3 text-xs font-bold transition-all relative ${
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
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'calendar' 
              ? 'text-pink-600 dark:text-pink-400 border-b-2 border-pink-600 dark:border-pink-400' 
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'
          }`}
        >
          <div className="flex items-center gap-1.5 px-1">
            <Calendar className="w-4 h-4" />
            Calendário Institucional
          </div>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-xs font-bold transition-all relative ${
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
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4" />
          {actionError}
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {specialties.map(spec => (
              <div key={spec.id} className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-pink-600" />
                    Especialidade: {spec.name}
                  </h3>
                  <span className="text-[0.625rem] bg-zinc-100 dark:bg-zinc-800 font-bold px-2 py-0.5 rounded-md text-zinc-500">
                    {spec.exams.length} Exames
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {spec.exams.map(exam => {
                    const limitVal = getExamLimit(exam.id);
                    const durationVal = exam.duration ?? 30;
                    const roomVal = exam.room ?? 'Sala A';
                    const costVal = exam.cost ?? 0;
                    const isExamActive = exam.isActive ?? true;
                    const isEncaminhamento = exam.requiresEncaminhamento ?? true;

                    return (
                      <div 
                        key={exam.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                          isExamActive 
                            ? 'bg-zinc-50/50 border-zinc-200/80 dark:bg-zinc-950/20 dark:border-zinc-800 hover:border-pink-500/30' 
                            : 'bg-zinc-100/30 border-zinc-200/40 dark:bg-zinc-950/5 dark:border-zinc-900 opacity-60'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50 leading-snug">{exam.name}</h4>
                            <span className={`text-[0.5rem] font-black uppercase px-1.5 py-0.5 rounded-md ${
                              isExamActive 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-200/20' 
                                : 'bg-zinc-200 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                              {isExamActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[0.625rem] text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Tempo estimado: <strong>{durationVal} minutos</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Sala / Consultório: <strong>{roomVal}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Custo Operacional: <strong>R$ {costVal.toFixed(2)}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Anexo Obrigatório: <strong>{isEncaminhamento ? 'Sim' : 'Não'}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Limite de Capacidade: <strong className="text-zinc-900 dark:text-zinc-200">{limitVal} agendamentos / dia</strong></span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEditExamClick(spec.id, exam)}
                          className="w-full h-8 border border-zinc-250 dark:border-zinc-750 hover:border-pink-500 dark:hover:border-pink-500 hover:text-pink-600 dark:hover:text-pink-400 rounded-xl text-[0.625rem] font-bold transition-all bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350"
                        >
                          Configurar Parâmetros
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs h-fit space-y-6">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Bloquear Data</h3>
              <p className="text-zinc-500 text-[0.625rem] mt-0.5">Insira uma data não útil ou feriado no calendário institucional.</p>
            </div>

            <form onSubmit={handleAddBlockSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[0.625rem] uppercase font-bold text-zinc-400">Data *</label>
                <input
                  type="date"
                  value={newBlockDate}
                  onChange={(e) => setNewBlockDate(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[0.625rem] uppercase font-bold text-zinc-400">Motivo / Justificativa *</label>
                <input
                  type="text"
                  placeholder="Ex: Feriado de Corpus Christi"
                  value={newBlockLabel}
                  onChange={(e) => setNewBlockLabel(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newBlockIsWorking"
                  checked={newBlockIsWorking}
                  onChange={(e) => setNewBlockIsWorking(e.target.checked)}
                  className="rounded border-zinc-350 text-pink-600 focus:ring-pink-500"
                />
                <label htmlFor="newBlockIsWorking" className="text-xs text-zinc-700 dark:text-zinc-350 cursor-pointer font-medium select-none">
                  Marcar como Dia Útil (Liberar agendamentos)
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-xl h-10 text-xs font-bold transition-all shadow-md shadow-pink-600/10"
              >
                Salvar Regra
              </button>
            </form>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5 space-y-3">
              <div>
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50">Carga Rápida</h4>
                <p className="text-zinc-500 text-[0.5625rem] mt-0.5">Importe a grade de feriados nacionais padrão no IndexedDB do hospital.</p>
              </div>
              <button
                type="button"
                onClick={handleImportDefaultHolidays}
                disabled={loading}
                className="w-full border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-pink-500 dark:hover:border-pink-500 text-zinc-750 dark:text-zinc-350 hover:text-pink-600 dark:hover:text-pink-400 font-bold h-10 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all bg-zinc-50/50 hover:bg-white dark:bg-zinc-950/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Importar Feriados Padrão (2026-2027)
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Grade de Datas Especiais</h3>
              <p className="text-zinc-500 text-[0.625rem] mt-0.5">Dias com restrição ou regras operacionais customizadas.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[0.5625rem] font-bold uppercase tracking-wider text-zinc-400">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Motivo / Descrição</th>
                    <th className="py-2.5 px-3">Regra Aplicada</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                  {calendarDays.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-zinc-500 text-xs font-semibold">
                        Nenhuma data cadastrada ou bloqueada.
                      </td>
                    </tr>
                  ) : (
                    calendarDays.map(day => (
                      <tr 
                        key={day.date} 
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-xs text-zinc-750 dark:text-zinc-350 transition-colors"
                      >
                        <td className="py-3.5 px-3 font-semibold text-zinc-900 dark:text-zinc-50">
                          {formatDate(day.date)}
                        </td>
                        <td className="py-3.5 px-3 font-medium">{day.label}</td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 text-[0.5625rem] font-bold px-2 py-0.5 border rounded-md ${
                            day.isWorkingDay 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                              : 'bg-red-50 border-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                          }`}>
                            {day.isWorkingDay ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            {day.isWorkingDay ? 'Dia Útil Liberado' : 'Dia Não Útil Bloqueado'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(day.date)}
                            className="p-1 rounded-lg text-zinc-400 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Histórico de Alterações</h3>
              <p className="text-zinc-500 text-[0.625rem] mt-0.5">Logs específicos sobre políticas, exames e capacidade.</p>
            </div>
            <button
              onClick={loadData}
              className="p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[0.5625rem] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Operador</th>
                  <th className="py-2.5 px-3">Ação</th>
                  <th className="py-2.5 px-3">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-zinc-500 text-xs font-semibold">
                      Nenhum log de alteração de configuração registrado.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr 
                      key={log.id} 
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-xs text-zinc-700 dark:text-zinc-355 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-semibold text-zinc-900 dark:text-zinc-55 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : ''}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-zinc-955 dark:text-zinc-50">{log.userName || 'Sistema'}</td>
                      <td className="py-3.5 px-3 font-medium text-pink-600 dark:text-pink-400">{log.action || ''}</td>
                      <td className="py-3.5 px-3 text-zinc-550 dark:text-zinc-450 italic font-mono text-[0.625rem] whitespace-normal leading-relaxed">
                        {log.details || ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {editingExam && (
        <div 
          onClick={() => setEditingExam(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="border-b border-zinc-100 dark:border-zinc-800 p-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Configurar Parâmetros Operacionais</h3>
                <p className="text-zinc-500 text-[0.625rem] mt-0.5">{editingExam.name}</p>
              </div>
              <button 
                onClick={() => setEditingExam(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExamSettings}>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[0.625rem] uppercase font-bold text-zinc-400">Tempo Estimado (minutos) *</label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={durationInput}
                      onChange={(e) => setDurationInput(parseInt(e.target.value))}
                      className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[0.625rem] uppercase font-bold text-zinc-400">Sala / Consultório Padrão *</label>
                    <input
                      type="text"
                      value={roomInput}
                      onChange={(e) => setRoomInput(e.target.value)}
                      className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[0.625rem] uppercase font-bold text-zinc-400">Custo Operacional (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={costInput}
                      onChange={(e) => setCostInput(parseFloat(e.target.value))}
                      className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[0.625rem] uppercase font-bold text-zinc-400">Limite de Capacidade Diária *</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={limitInput}
                      onChange={(e) => setLimitInput(parseInt(e.target.value))}
                      className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requiresEncaminhamentoInput"
                      checked={requiresEncaminhamentoInput}
                      onChange={(e) => setRequiresEncaminhamentoInput(e.target.checked)}
                      className="rounded border-zinc-350 text-pink-600 focus:ring-pink-500"
                    />
                    <label htmlFor="requiresEncaminhamentoInput" className="text-xs text-zinc-750 dark:text-zinc-300 font-medium cursor-pointer select-none">
                      Exigir upload de encaminhamento médico obrigatório
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActiveInput"
                      checked={isActiveInput}
                      onChange={(e) => setIsActiveInput(e.target.checked)}
                      className="rounded border-zinc-350 text-pink-600 focus:ring-pink-500"
                    />
                    <label htmlFor="isActiveInput" className="text-xs text-zinc-750 dark:text-zinc-300 font-medium cursor-pointer select-none">
                      Exame ativo para novos agendamentos e solicitações
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 p-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="flex-1 h-10 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-355 rounded-xl text-xs font-semibold transition-all bg-white dark:bg-zinc-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-600/10"
                >
                  Confirmar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
