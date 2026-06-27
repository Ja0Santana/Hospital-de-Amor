import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Clock,
  MapPin,
  DollarSign,
  FileText,
  BookOpen,
  X,
  Trash2
} from 'lucide-react';
import type { Specialty, Exam, CapacityLimit, TemporaryCapacityLimit, CustomPriority } from '../../../types';

interface ExamsConfigPanelProps {
  specialties: Specialty[];
  limits: CapacityLimit[];
  temporaryLimits: TemporaryCapacityLimit[];
  customPriorities: CustomPriority[];
  onCreateSpecialty: (name: string) => Promise<void>;
  onCreateExam: (specId: string, examData: any, dailyLimit: number, weeklyLimit?: number, monthlyLimit?: number) => Promise<void>;
  onSaveExamSettings: (specId: string, examId: string, examData: any, dailyLimit: number, weeklyLimit?: number, monthlyLimit?: number) => Promise<void>;
  onAddTempLimit: (examId: string, date: string, limit: number) => Promise<void>;
  onDeleteTempLimit: (id: number) => Promise<void>;
  onAddPriority: (name: string) => Promise<void>;
  onDeletePriority: (id: string) => Promise<void>;
}

export default function ExamsConfigPanel({
  specialties,
  limits,
  temporaryLimits,
  customPriorities,
  onCreateSpecialty,
  onCreateExam,
  onSaveExamSettings,
  onAddTempLimit,
  onDeleteTempLimit,
  onAddPriority,
  onDeletePriority
}: ExamsConfigPanelProps) {
  const [isNewSpecModalOpen, setIsNewSpecModalOpen] = useState(false);
  const [newSpecName, setNewSpecName] = useState('');

  const [isNewExamModalOpen, setIsNewExamModalOpen] = useState(false);
  const [newExamSpecId, setNewExamSpecId] = useState('');
  const [newExamName, setNewExamName] = useState('');
  const [newExamDuration, setNewExamDuration] = useState(30);
  const [newExamRoom, setNewExamRoom] = useState('Sala A');
  const [newExamCost, setNewExamCost] = useState(0);
  const [newExamRequiresEncaminhamento, setNewExamRequiresEncaminhamento] = useState(true);
  const [newExamIsActive, setNewExamIsActive] = useState(true);
  const [newExamLimit, setNewExamLimit] = useState(10);
  const [newExamMaintenanceLimit, setNewExamMaintenanceLimit] = useState(100);
  const [newExamWeeklyLimit, setNewExamWeeklyLimit] = useState<number | ''>('');
  const [newExamMonthlyLimit, setNewExamMonthlyLimit] = useState<number | ''>('');
  const [newExamRequiredResources, setNewExamRequiredResources] = useState('');

  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editingExamSpecId, setEditingExamSpecId] = useState('');
  const [durationInput, setDurationInput] = useState(30);
  const [roomInput, setRoomInput] = useState('Sala A');
  const [costInput, setCostInput] = useState(0);
  const [requiresEncaminhamentoInput, setRequiresEncaminhamentoInput] = useState(true);
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [limitInput, setLimitInput] = useState(10);
  const [maintenanceLimitInput, setMaintenanceLimitInput] = useState(100);
  const [weeklyLimitInput, setWeeklyLimitInput] = useState<number | ''>('');
  const [monthlyLimitInput, setMonthlyLimitInput] = useState<number | ''>('');
  const [requiredResourcesInput, setRequiredResourcesInput] = useState('');

  const [tempLimitExamId, setTempLimitExamId] = useState('');
  const [tempLimitDate, setTempLimitDate] = useState('');
  const [tempLimitValue, setTempLimitValue] = useState(10);

  const [newPriorityName, setNewPriorityName] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingExam) setEditingExam(null);
        if (isNewSpecModalOpen) setIsNewSpecModalOpen(false);
        if (isNewExamModalOpen) setIsNewExamModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingExam, isNewSpecModalOpen, isNewExamModalOpen]);

  useEffect(() => {
    if (editingExam || isNewSpecModalOpen || isNewExamModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingExam, isNewSpecModalOpen, isNewExamModalOpen]);

  const handleCreateSpecialtySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecName.trim()) return;
    await onCreateSpecialty(newSpecName.trim());
    setNewSpecName('');
    setIsNewSpecModalOpen(false);
  };

  const handleCreateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamSpecId || !newExamName.trim()) return;
    const requiredResources = newExamRequiredResources
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const examData = {
      name: newExamName.trim(),
      defaultPrepInstructions: 'Trazer exames de sangue recentes e laudo anterior se aplicável.',
      duration: newExamDuration,
      room: newExamRoom.trim(),
      cost: newExamCost,
      requiresEncaminhamento: newExamRequiresEncaminhamento,
      isActive: newExamIsActive,
      maintenanceLimit: newExamMaintenanceLimit,
      requiredResources: requiredResources.length > 0 ? requiredResources : undefined
    };

    await onCreateExam(
      newExamSpecId,
      examData,
      newExamLimit,
      newExamWeeklyLimit === '' ? undefined : Number(newExamWeeklyLimit),
      newExamMonthlyLimit === '' ? undefined : Number(newExamMonthlyLimit)
    );

    setNewExamName('');
    setNewExamDuration(30);
    setNewExamRoom('Sala A');
    setNewExamCost(0);
    setNewExamRequiresEncaminhamento(true);
    setNewExamIsActive(true);
    setNewExamLimit(10);
    setNewExamWeeklyLimit('');
    setNewExamMonthlyLimit('');
    setNewExamRequiredResources('');
    setNewExamMaintenanceLimit(100);
    setIsNewExamModalOpen(false);
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
    setWeeklyLimitInput(limitObj?.weeklyLimit ?? '');
    setMonthlyLimitInput(limitObj?.monthlyLimit ?? '');
    setRequiredResourcesInput(exam.requiredResources ? exam.requiredResources.join(', ') : '');
    setMaintenanceLimitInput(exam.maintenanceLimit ?? 100);
  };

  const handleSaveExamSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam || !editingExamSpecId) return;

    const requiredResources = requiredResourcesInput
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const examData = {
      name: editingExam.name,
      duration: durationInput,
      room: roomInput,
      cost: costInput,
      requiresEncaminhamento: requiresEncaminhamentoInput,
      isActive: isActiveInput,
      maintenanceLimit: maintenanceLimitInput,
      requiredResources: requiredResources.length > 0 ? requiredResources : undefined
    };

    await onSaveExamSettings(
      editingExamSpecId,
      editingExam.id,
      examData,
      limitInput,
      weeklyLimitInput === '' ? undefined : Number(weeklyLimitInput),
      monthlyLimitInput === '' ? undefined : Number(monthlyLimitInput)
    );

    setEditingExam(null);
  };

  const handleAddTempLimitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempLimitExamId || !tempLimitDate || tempLimitValue < 0) return;
    await onAddTempLimit(tempLimitExamId, tempLimitDate, tempLimitValue);
    setTempLimitExamId('');
    setTempLimitDate('');
    setTempLimitValue(10);
  };

  const handleAddPrioritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriorityName.trim()) return;
    await onAddPriority(newPriorityName.trim());
    setNewPriorityName('');
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
    <div className="space-y-6">
      <div className="flex justify-end gap-3 px-1">
        <button
          onClick={() => setIsNewSpecModalOpen(true)}
          className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <span>+ Especialidade</span>
        </button>
        <button
          onClick={() => setIsNewExamModalOpen(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <span>+ Novo Exame/Consulta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {specialties.map(spec => (
          <div key={spec.id} className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-55 flex items-center gap-2">
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
                        : 'bg-zinc-100/30 border-zinc-200/40 dark:bg-zinc-955/5 dark:border-zinc-900 opacity-60'
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
                      className="w-full h-8 border border-zinc-250 dark:border-zinc-755 hover:border-pink-500 dark:hover:border-pink-500 hover:text-pink-600 dark:hover:text-pink-400 rounded-xl text-[0.625rem] font-bold transition-all bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Limites de Capacidade Temporários</h3>
            <p className="text-zinc-500 text-[0.625rem] mt-0.5">Defina exceções de cotas diárias para exames em datas específicas.</p>
          </div>

          <form onSubmit={handleAddTempLimitSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[0.5625rem] uppercase font-bold text-zinc-400">Exame *</label>
                <select
                  value={tempLimitExamId}
                  onChange={(e) => setTempLimitExamId(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-[0.6875rem] bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer"
                  required
                >
                  <option value="">Selecione...</option>
                  {specialties.map(spec => (
                    <optgroup key={spec.id} label={spec.name}>
                      {spec.exams.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[0.5625rem] uppercase font-bold text-zinc-400">Data da Exceção *</label>
                <input
                  type="date"
                  value={tempLimitDate}
                  onChange={(e) => setTempLimitDate(e.target.value)}
                  min={today}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-[0.6875rem] bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[0.5625rem] uppercase font-bold text-zinc-400">Limite Diário Temporário *</label>
                <input
                  type="number"
                  value={tempLimitValue}
                  onChange={(e) => setTempLimitValue(Number(e.target.value))}
                  min={0}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-[0.6875rem] bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-pink-650 hover:bg-pink-700 text-white font-extrabold text-[0.6875rem] px-4 py-2.5 rounded-xl transition-all active:scale-95"
            >
              Adicionar Limite Temporário
            </button>
          </form>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <h4 className="text-[0.6875rem] font-bold text-zinc-700 dark:text-zinc-300 mb-2">Limites Ativos</h4>
            <div className="max-h-[140px] overflow-y-auto pr-1 space-y-2">
              {temporaryLimits.length === 0 ? (
                <p className="text-[0.625rem] text-zinc-450 italic">Nenhum limite temporário ativo.</p>
              ) : (
                temporaryLimits.map(tl => {
                  const examName = specialties.flatMap(s => s.exams).find(ex => ex.id === tl.examId)?.name || tl.examId;
                  return (
                    <div key={tl.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-955/20 border border-zinc-100 dark:border-zinc-850 p-2.5 rounded-xl text-[0.625rem]">
                      <div>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{examName}</span>
                        <div className="text-[0.5625rem] text-zinc-400 mt-0.5">
                          Data: {formatDate(tl.date)} | Limite: <strong className="text-zinc-750 dark:text-zinc-300">{tl.limit} agendamentos</strong>
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteTempLimit(tl.id)}
                        className="text-red-500 hover:text-red-700 transition-all p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Prioridades Clínicas Personalizadas</h3>
            <p className="text-zinc-550 text-[0.625rem] mt-0.5">Adicione classes de atendimento preferencial ou triagem para as filas hospitalares.</p>
          </div>

          <form onSubmit={handleAddPrioritySubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[0.5625rem] uppercase font-bold text-zinc-400">Nome da Prioridade *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Gestante de Alto Risco"
                  value={newPriorityName}
                  onChange={(e) => setNewPriorityName(e.target.value)}
                  className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 text-[0.6875rem] bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  required
                />
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-[0.6875rem] px-4 py-2.5 rounded-xl transition-all shrink-0"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </form>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <h4 className="text-[0.6875rem] font-bold text-zinc-700 dark:text-zinc-300 mb-2">Prioridades Ativas</h4>
            <div className="max-h-[140px] overflow-y-auto pr-1 space-y-1.5">
              {customPriorities.length === 0 ? (
                <p className="text-[0.625rem] text-zinc-450 italic">Nenhuma prioridade clínica customizada.</p>
              ) : (
                customPriorities.map(p => (
                  <div key={p.id} className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-955/20 border border-zinc-100 dark:border-zinc-850 p-2.5 rounded-xl text-[0.625rem]">
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{p.name}</span>
                    <button
                      onClick={() => onDeletePriority(p.id)}
                      className="text-red-500 hover:text-red-750 transition-all p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {isNewSpecModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-50">Cadastrar Nova Especialidade</h3>
              <button
                onClick={() => setIsNewSpecModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSpecialtySubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nome da Especialidade *</label>
                <input
                  type="text"
                  placeholder="Ex: Ginecologia Oncológica"
                  value={newSpecName}
                  onChange={(e) => setNewSpecName(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewSpecModalOpen(false)}
                  className="border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 px-4 py-2 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl font-bold transition-all"
                >
                  Salvar Especialidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNewExamModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-xl rounded-3xl p-6 shadow-xl space-y-4 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-50">Cadastrar Novo Exame/Consulta</h3>
              <button
                onClick={() => setIsNewExamModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExamSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Especialidade Vínculo *</label>
                  <select
                    value={newExamSpecId}
                    onChange={(e) => setNewExamSpecId(e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer"
                    required
                  >
                    <option value="">Selecione...</option>
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nome do Exame/Consulta *</label>
                  <input
                    type="text"
                    placeholder="Ex: Ecocardiograma"
                    value={newExamName}
                    onChange={(e) => setNewExamName(e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Duração Estimada (minutos) *</label>
                  <input
                    type="number"
                    value={newExamDuration}
                    onChange={(e) => setNewExamDuration(Number(e.target.value))}
                    min={5}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sala / Consultório Padrão *</label>
                  <input
                    type="text"
                    placeholder="Ex: Consultório 102"
                    value={newExamRoom}
                    onChange={(e) => setNewExamRoom(e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Custo Operacional Estimado (R$) *</label>
                  <input
                    type="number"
                    value={newExamCost}
                    onChange={(e) => setNewExamCost(Number(e.target.value))}
                    min={0}
                    step="0.01"
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Limite Diário de Vagas *</label>
                  <input
                    type="number"
                    value={newExamLimit}
                    onChange={(e) => setNewExamLimit(Number(e.target.value))}
                    min={1}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Limite de Manutenção (Alertas)</label>
                  <input
                    type="number"
                    value={newExamMaintenanceLimit}
                    onChange={(e) => setNewExamMaintenanceLimit(Number(e.target.value))}
                    min={1}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Limite Semanal (Opcional)</label>
                  <input
                    type="number"
                    placeholder="Sem limite"
                    value={newExamWeeklyLimit}
                    onChange={(e) => setNewExamWeeklyLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    min={1}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Limite Mensal (Opcional)</label>
                  <input
                    type="number"
                    placeholder="Sem limite"
                    value={newExamMonthlyLimit}
                    onChange={(e) => setNewExamMonthlyLimit(e.target.value === '' ? '' : Number(e.target.value))}
                    min={1}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Recursos Exigidos (Separados por vírgula)</label>
                  <input
                    type="text"
                    placeholder="Ex: Contraste, Gel, Sala Escura"
                    value={newExamRequiredResources}
                    onChange={(e) => setNewExamRequiredResources(e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={newExamRequiresEncaminhamento}
                    onChange={(e) => setNewExamRequiresEncaminhamento(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-650 focus:ring-pink-500 dark:border-zinc-800 dark:bg-zinc-950"
                  />
                  Exige anexo de encaminhamento/guia médica
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={newExamIsActive}
                    onChange={(e) => setNewExamIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-650 focus:ring-pink-500 dark:border-zinc-800 dark:bg-zinc-955"
                  />
                  Habilitado para agendamento (Ativo)
                </label>
              </div>

              <div className="flex gap-3 justify-end border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewExamModalOpen(false)}
                  className="border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 px-4 py-2 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl font-bold transition-all"
                >
                  Salvar Exame/Consulta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingExam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-xl rounded-3xl p-6 shadow-xl space-y-4 my-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-50">Configurar Parâmetros de Exame</h3>
              <button
                onClick={() => setEditingExam(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-zinc-450 uppercase font-black tracking-wider">Exame selecionado: <strong className="text-zinc-900 dark:text-zinc-100 font-black">{editingExam.name}</strong></p>

            <form onSubmit={handleSaveExamSettingsSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Duração Estimada (minutos) *</label>
                  <input
                    type="number"
                    value={durationInput}
                    onChange={(e) => setDurationInput(Number(e.target.value))}
                    min={5}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sala / Consultório Padrão *</label>
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Custo Operacional Estimado (R$) *</label>
                  <input
                    type="number"
                    value={costInput}
                    onChange={(e) => setCostInput(Number(e.target.value))}
                    min={0}
                    step="0.01"
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Limite Diário de Vagas *</label>
                  <input
                    type="number"
                    value={limitInput}
                    onChange={(e) => setLimitInput(Number(e.target.value))}
                    min={1}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Limite de Manutenção (Alertas)</label>
                  <input
                    type="number"
                    value={maintenanceLimitInput}
                    onChange={(e) => setMaintenanceLimitInput(Number(e.target.value))}
                    min={1}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Limite Semanal (Opcional)</label>
                  <input
                    type="number"
                    placeholder="Sem limite"
                    value={weeklyLimitInput}
                    onChange={(e) => setWeeklyLimitInput(e.target.value === '' ? '' : Number(e.target.value))}
                    min={1}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Limite Mensal (Opcional)</label>
                  <input
                    type="number"
                    placeholder="Sem limite"
                    value={monthlyLimitInput}
                    onChange={(e) => setMonthlyLimitInput(e.target.value === '' ? '' : Number(e.target.value))}
                    min={1}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Recursos Exigidos (Separados por vírgula)</label>
                  <input
                    type="text"
                    placeholder="Ex: Contraste, Gel, Sala Escura"
                    value={requiredResourcesInput}
                    onChange={(e) => setRequiredResourcesInput(e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={requiresEncaminhamentoInput}
                    onChange={(e) => setRequiresEncaminhamentoInput(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-650 focus:ring-pink-500 dark:border-zinc-800 dark:bg-zinc-950"
                  />
                  Exige anexo de encaminhamento/guia médica
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isActiveInput}
                    onChange={(e) => setIsActiveInput(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-650 focus:ring-pink-500 dark:border-zinc-800 dark:bg-zinc-955"
                  />
                  Habilitado para agendamento (Ativo)
                </label>
              </div>

              <div className="flex gap-3 justify-end border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 px-4 py-2 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl font-bold transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
