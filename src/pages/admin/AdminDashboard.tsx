import React, { useState, useEffect } from 'react';
import { 
  getAppointmentsForAdmin, 
  getCities, 
  getSpecialties, 
  updateAppointmentStatus, 
  confirmAppointmentSchedule,
  addInternalNote,
  updateFollowUpStatus,
  setAppointmentPriority,
  updatePatientContactInfo,
  getCapacityLimits
} from '../../services/db';
import type { Appointment, City, Specialty, PatientUser, CapacityLimit, AppointmentStatus } from '../../types';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  Search, 
  Filter,
  FileText
} from 'lucide-react';

interface AdminDashboardProps {
  loggedEmployee: PatientUser;
}

export default function AdminDashboard({ loggedEmployee }: AdminDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [capacityLimits, setCapacityLimits] = useState<CapacityLimit[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const [sortKey, setSortKey] = useState<'createdAt' | 'protocol' | 'patientName' | 'priority' | 'city'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  
  const [activeApp, setActiveApp] = useState<Appointment | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleRoom, setScheduleRoom] = useState('');
  const [scheduleDoctor, setScheduleDoctor] = useState('');
  
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteIsUrgent, setNewNoteIsUrgent] = useState(false);

  const [isSettingFollowUp, setIsSettingFollowUp] = useState(false);
  const [followUpDateInput, setFollowUpDateInput] = useState('');
  const [followUpIsSuspended, setFollowUpIsSuspended] = useState(false);
  const [followUpReason, setFollowUpReason] = useState('');

  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [mockNotification, setMockNotification] = useState<{ method: string; phone: string; code: string } | null>(null);
  const [priorityInput, setPriorityInput] = useState<'Baixa' | 'Média' | 'Alta'>('Baixa');
  const [statusInput, setStatusInput] = useState<AppointmentStatus>('Pendente');

  const getPatientHistory = (patientCpf: string, currentAppId: string) => {
    const cleanCpf = patientCpf.replace(/\D/g, "");
    const confirmed = appointments.filter(app => 
      app.patientCpf.replace(/\D/g, "") === cleanCpf && 
      app.status === 'Confirmado' && 
      app.id !== currentAppId
    );

    if (confirmed.length === 0) {
      return { status: 'primeiro', text: 'Primeiro Atendimento na Unidade', isPossibleReturn: false };
    }

    const sorted = [...confirmed].sort((a, b) => {
      const dateA = a.rescheduledDate || '';
      const dateB = b.rescheduledDate || '';
      return dateB.localeCompare(dateA);
    });

    const latest = sorted[0];
    const latestDateStr = latest.rescheduledDate || '';
    if (!latestDateStr) {
      return { status: 'com_historico', text: `Último atendimento: ${latest.examName} com Dr(a). ${latest.scheduledDoctor || 'Não especificado'}`, isPossibleReturn: false };
    }

    const latestDate = new Date(latestDateStr + 'T12:00:00');
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - latestDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isPossibleReturn = diffDays < 15;
    return {
      status: isPossibleReturn ? 'possivel_retorno' : 'com_historico',
      text: `Última consulta: ${latest.examName} em ${latestDate.toLocaleDateString('pt-BR')} com Dr(a). ${latest.scheduledDoctor || 'Não especificado'}`,
      isPossibleReturn
    };
  };

  const handleSaveContacts = async () => {
    setActionError('');
    setActionSuccess('');
    if (!activeApp) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editEmail && !emailRegex.test(editEmail)) {
      setActionError('E-mail em formato inválido.');
      return;
    }

    const phoneDigits = editPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setActionError('Telefone em formato inválido. Deve conter DDD e número.');
      return;
    }

    try {
      await updatePatientContactInfo(
        activeApp.patientCpf,
        editEmail,
        editPhone,
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setActionSuccess('Contatos do paciente atualizados com sucesso.');

      const allApps = await getAppointmentsForAdmin();
      setAppointments(allApps);
      const updated = allApps.find(app => app.id === activeApp.id);
      if (updated) {
        setActiveApp(updated);
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro ao salvar contatos.');
    }
  };

  const handleSendMockValidation = (method: string) => {
    if (!activeApp) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setMockNotification({
      method,
      phone: editPhone,
      code
    });
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!activeApp) return;

    if (!followUpIsSuspended && !followUpDateInput) {
      setActionError('Defina a data limite para reavaliação.');
      return;
    }

    if (followUpIsSuspended && !followUpReason.trim()) {
      setActionError('Justifique o motivo da suspensão.');
      return;
    }

    try {
      await updateFollowUpStatus(
        activeApp.id,
        followUpIsSuspended ? null : followUpDateInput,
        followUpIsSuspended,
        followUpReason.trim(),
        loggedEmployee.cpf,
        loggedEmployee.name
      );

      setActionSuccess(`Solicitação de ${activeApp.patientName} em follow-up.`);
      setIsSettingFollowUp(false);
      setFollowUpDateInput('');
      setFollowUpReason('');
      setFollowUpIsSuspended(false);
      setActiveApp(null);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao registrar follow-up.');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!activeApp || !newNoteText.trim()) return;

    try {
      await addInternalNote(
        activeApp.id,
        newNoteText.trim(),
        newNoteIsUrgent,
        loggedEmployee.cpf,
        loggedEmployee.name
      );

      setActionSuccess('Anotação interna cadastrada na ficha.');
      setNewNoteText('');
      setNewNoteIsUrgent(false);

      const allApps = await getAppointmentsForAdmin();
      setAppointments(allApps);
      const updated = allApps.find(app => app.id === activeApp.id);
      if (updated) {
        setActiveApp(updated);
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro ao inserir nota.');
    }
  };

  useEffect(() => {
    loadData();
    const storedSort = localStorage.getItem('hospital_amor_admin_sort');
    if (storedSort) {
      try {
        const { key, order } = JSON.parse(storedSort);
        if (key && order) {
          setSortKey(key);
          setSortOrder(order);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSort = (key: typeof sortKey) => {
    let nextOrder: 'asc' | 'desc' = 'asc';
    if (sortKey === key) {
      nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    setSortKey(key);
    setSortOrder(nextOrder);
    localStorage.setItem('hospital_amor_admin_sort', JSON.stringify({ key, order: nextOrder }));
  };

  const loadData = async () => {
    try {
      const allAppointments = await getAppointmentsForAdmin();
      setAppointments(allAppointments);
      
      const allCities = await getCities();
      setCities(allCities);
      
      const allSpecialties = await getSpecialties();
      setSpecialties(allSpecialties);

      const allLimits = await getCapacityLimits();
      setCapacityLimits(allLimits);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const visibleIds = filteredAppointments.map(app => app.id);
      setSelectedApps(visibleIds);
    } else {
      setSelectedApps([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApps(prev => [...prev, id]);
    } else {
      setSelectedApps(prev => prev.filter(item => item !== id));
    }
  };

  const handleLoteStatusChange = async (newStatus: 'Em análise' | 'Cancelado') => {
    setActionError('');
    setActionSuccess('');
    if (selectedApps.length === 0) return;

    try {
      for (const id of selectedApps) {
        await updateAppointmentStatus(
          id, 
          newStatus, 
          'Atualizado em lote pela equipe administrativa.', 
          loggedEmployee.cpf, 
          loggedEmployee.name
        );
      }
      setActionSuccess(`Status de ${selectedApps.length} agendamentos alterado para "${newStatus}" com sucesso.`);
      setSelectedApps([]);
      await loadData();
    } catch (e) {
      console.error(e);
      setActionError('Ocorreu um erro ao atualizar os status em lote.');
    }
  };

  const handleSaveTriagemChanges = async () => {
    setActionError('');
    setActionSuccess('');
    if (!activeApp) return;

    try {
      if (activeApp.priority !== priorityInput) {
        await setAppointmentPriority(
          activeApp.id,
          priorityInput,
          loggedEmployee.cpf,
          loggedEmployee.name
        );
      }

      if (activeApp.status !== statusInput) {
        await updateAppointmentStatus(
          activeApp.id,
          statusInput,
          'Status alterado na triagem clínica.',
          loggedEmployee.cpf,
          loggedEmployee.name
        );
      }

      setActionSuccess(`Alterações da triagem de ${activeApp.patientName} salvas com sucesso.`);
      setActiveApp(null);
      await loadData();
    } catch (e: any) {
      setActionError(e.message || 'Erro ao salvar alterações da triagem.');
    }
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    if (!activeApp) return;

    if (!scheduleDate || !scheduleTime || !scheduleRoom.trim() || !scheduleDoctor.trim()) {
      setActionError('Preencha todos os campos do agendamento.');
      return;
    }

    try {
      await confirmAppointmentSchedule(
        activeApp.id,
        scheduleDate,
        scheduleTime,
        scheduleRoom.trim(),
        scheduleDoctor.trim(),
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      
      setActionSuccess(`Consulta confirmada para ${activeApp.patientName} em ${scheduleDate} às ${scheduleTime}h.`);
      setIsScheduling(false);
      setScheduleDate('');
      setScheduleTime('');
      setScheduleRoom('');
      setScheduleDoctor('');
      setActiveApp(null);
      await loadData();
    } catch (e: any) {
      setActionError(e.message || 'Erro ao confirmar o agendamento.');
    }
  };

  const openTriagemPanel = (app: Appointment) => {
    setActiveApp(app);
    setIsScheduling(false);
    setActionError('');
    setActionSuccess('');
    setEditPhone(app.patientPhone || '');
    setEditEmail(app.patientEmail || '');
    setPriorityInput(app.priority || 'Baixa');
    setStatusInput(app.status || 'Pendente');
    setIsSettingFollowUp(false);
  };

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = 
      app.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.patientCpf.includes(searchQuery);

    const matchesCity = !selectedCityId || app.city.toLowerCase() === cities.find(c => c.id === selectedCityId)?.name.toLowerCase();
    const matchesSpecialty = !selectedSpecialtyId || app.specialtyId === selectedSpecialtyId;
    const matchesStatus = statusFilter === 'Todos' || app.status === statusFilter;

    return matchesSearch && matchesCity && matchesSpecialty && matchesStatus;
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    let valA: any = a[sortKey] || '';
    let valB: any = b[sortKey] || '';

    if (sortKey === 'priority') {
      const weight = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };
      valA = weight[a.priority as 'Alta' | 'Média' | 'Baixa'] || 0;
      valB = weight[b.priority as 'Alta' | 'Média' | 'Baixa'] || 0;
    }

    if (sortKey === 'createdAt') {
      valA = new Date(a.createdAt).getTime();
      valB = new Date(b.createdAt).getTime();
    }

    if (typeof valA === 'string') {
      return sortOrder === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    } else {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
  });

  const activeFilters: Array<{ id: string, label: string, clear: () => void }> = [];
  if (searchQuery) activeFilters.push({ id: 'search', label: `Busca: "${searchQuery}"`, clear: () => setSearchQuery('') });
  if (selectedCityId) activeFilters.push({ id: 'city', label: `Cidade: ${cities.find(c => c.id === selectedCityId)?.name}`, clear: () => setSelectedCityId('') });
  if (selectedSpecialtyId) activeFilters.push({ id: 'specialty', label: `Especialidade: ${specialties.find(s => s.id === selectedSpecialtyId)?.name}`, clear: () => setSelectedSpecialtyId('') });
  if (statusFilter !== 'Todos') activeFilters.push({ id: 'status', label: `Status: ${statusFilter}`, clear: () => setStatusFilter('Todos') });

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedCityId('');
    setSelectedSpecialtyId('');
    setStatusFilter('Todos');
  };

  const getSortIcon = (key: typeof sortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  const countByStatus = (status: string) => {
    return appointments.filter(app => app.status === status).length;
  };

  const nextBusinessDays = () => {
    const dates: string[] = [];
    const current = new Date();
    while (dates.length < 5) {
      current.setDate(current.getDate() + 1);
      if (current.getDay() !== 0 && current.getDay() !== 6) {
        dates.push(current.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">Painel de Triagem</h1>
          <p className="text-zinc-500 mt-1 text-sm">Fila de triagem clínica de solicitações de exames.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Pendentes</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-yellow-600">{countByStatus('Pendente')}</span>
            <Clock className="w-5 h-5 text-yellow-500 shrink-0" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Em Análise</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-blue-600">{countByStatus('Em análise')}</span>
            <Clock className="w-5 h-5 text-blue-500 shrink-0" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Reagendamento</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-600">{countByStatus('Reagendamento Pendente')}</span>
            <Clock className="w-5 h-5 text-amber-500 shrink-0" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Confirmados</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600">{countByStatus('Confirmado')}</span>
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Cancelados</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-red-600">{countByStatus('Cancelado')}</span>
            <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-800 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450" />
            <input
              type="text"
              placeholder="Buscar por nome, protocolo ou CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
            />
          </div>

          <div className="relative flex items-center">
            <Filter className="absolute left-3.5 w-4 h-4 text-zinc-450" />
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 appearance-none cursor-pointer"
            >
              <option value="">Todas as Cidades</option>
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.state})</option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center">
            <Filter className="absolute left-3.5 w-4 h-4 text-zinc-450" />
            <select
              value={selectedSpecialtyId}
              onChange={(e) => setSelectedSpecialtyId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 appearance-none cursor-pointer"
            >
              <option value="">Todas as Especialidades</option>
              {specialties.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center">
            <Filter className="absolute left-3.5 w-4 h-4 text-zinc-450" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 appearance-none cursor-pointer"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em análise">Em análise</option>
              <option value="Reagendamento Pendente">Reagendamento Pendente</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Cancelado">Cancelado</option>
              <option value="Aguardando Follow-up">Aguardando Follow-up</option>
            </select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 animate-in fade-in">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Filtros Ativos:</span>
            {activeFilters.map(filter => (
              <span key={filter.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800">
                {filter.label}
                <button onClick={filter.clear} className="text-zinc-400 hover:text-zinc-650 font-bold ml-1">✕</button>
              </span>
            ))}
            <button 
              onClick={handleClearAllFilters} 
              className="text-[10px] font-extrabold text-pink-600 hover:underline ml-2"
            >
              Limpar Todos
            </button>
          </div>
        )}

        {selectedApps.length > 0 && (
          <div className="bg-pink-50 border border-pink-200/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-top-2 dark:bg-pink-955/10 dark:border-pink-900/30">
            <span className="text-xs font-bold text-pink-700 dark:text-pink-400">
              {selectedApps.length} item(s) selecionado(s)
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleLoteStatusChange('Em análise')}
                className="flex-1 sm:flex-none h-9 px-4 rounded-xl text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
              >
                Colocar Em Análise
              </button>
              <button
                onClick={() => handleLoteStatusChange('Cancelado')}
                className="flex-1 sm:flex-none h-9 px-4 rounded-xl text-[11px] font-bold bg-red-650 hover:bg-red-700 text-white transition-all shadow-xs"
              >
                Cancelar Agendamentos
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredAppointments.length > 0 && selectedApps.length === filteredAppointments.length}
                    onChange={handleSelectAll}
                    className="rounded text-pink-600 focus:ring-pink-500"
                  />
                </th>
                <th className="py-3 px-4 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-350" onClick={() => handleSort('protocol')}>
                  Protocolo{getSortIcon('protocol')}
                </th>
                <th className="py-3 px-4 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-350" onClick={() => handleSort('patientName')}>
                  Paciente{getSortIcon('patientName')}
                </th>
                <th className="py-3 px-4 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-350" onClick={() => handleSort('city')}>
                  Cidade{getSortIcon('city')}
                </th>
                <th className="py-3 px-4 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-350" onClick={() => handleSort('createdAt')}>
                  Solicitação / Exame{getSortIcon('createdAt')}
                </th>
                <th className="py-3 px-4 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-350" onClick={() => handleSort('priority')}>
                  Prioridade{getSortIcon('priority')}
                </th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Falta Anexo?</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
              {sortedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-500 text-xs font-semibold">
                    Nenhuma solicitação encontrada na fila de triagem.
                  </td>
                </tr>
              ) : (
                sortedAppointments.map(app => {
                  const isHighPriority = app.priority === 'Alta';
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isOverdue = 
                    app.status === 'Aguardando Follow-up' && 
                    app.followUpDate && 
                    !app.followUpSuspended && 
                    app.followUpDate < todayStr;
                  return (
                    <tr 
                      key={app.id} 
                      className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-xs text-zinc-700 dark:text-zinc-355 transition-colors ${
                        isHighPriority 
                          ? 'bg-red-50/20 dark:bg-red-950/10 border-l-2 border-l-red-500' 
                          : app.priority === 'Média' 
                          ? 'bg-amber-50/5 dark:bg-amber-950/5' 
                          : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedApps.includes(app.id)}
                          onChange={(e) => handleSelectOne(app.id, e.target.checked)}
                          className="rounded text-pink-600 focus:ring-pink-500"
                        />
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-zinc-955 dark:text-zinc-50">{app.protocol}</td>
                      <td className="py-4 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2">
                          <span>{app.patientName}</span>
                          {app.internalNotes && app.internalNotes.length > 0 && (
                            <span 
                              title={`${app.internalNotes.length} observações internas`}
                              className={`cursor-pointer ${
                                app.internalNotes.some(note => note.isUrgent)
                                  ? 'text-red-500 animate-pulse font-black'
                                  : 'text-zinc-400'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0 inline" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">{app.city}</td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200">{app.examName}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Solicitado em {new Date(app.createdAt).toLocaleDateString('pt-BR')} • {app.specialtyName}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          app.priority === 'Alta' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400' :
                          app.priority === 'Média' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-955/30 dark:text-amber-400' :
                          'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-350'
                        }`}>
                          {app.priority || 'Baixa'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOverdue 
                              ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 border animate-pulse'
                              : app.status === 'Confirmado' ? 'bg-green-50 text-green-700 dark:bg-green-955/20 dark:text-green-400 border border-green-200/20' :
                              app.status === 'Cancelado' ? 'bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400 border border-red-200/20' :
                              app.status === 'Em análise' ? 'bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400 border border-blue-200/20' :
                              app.status === 'Reagendamento Pendente' ? 'bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-200/20' :
                              app.status === 'Aguardando Follow-up' ? 'bg-purple-50 text-purple-700 dark:bg-purple-955/20 dark:text-purple-400 border border-purple-200/20' :
                              'bg-yellow-50 text-yellow-700 dark:bg-yellow-955/20 dark:text-yellow-400 border border-yellow-200/20'
                          }`}>
                            {isOverdue ? 'Aguardando Follow-up (Vencido)' : app.status}
                          </span>
                          {app.status === 'Aguardando Follow-up' && (
                            <div className="text-[9px] font-bold tracking-tight block">
                              {app.followUpSuspended ? (
                                <span className="text-zinc-400">⏸️ Follow-up Suspenso</span>
                              ) : (
                                <span className={isOverdue ? "text-red-500 font-extrabold animate-pulse" : "text-purple-500"}>
                                  📅 Limite: {app.followUpDate ? new Date(app.followUpDate + 'T12:00:00').toLocaleDateString('pt-BR') : '-'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {!app.fileAttachment ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-650 bg-red-50 dark:bg-red-955/20 px-2 py-0.5 rounded-md border border-red-200/20">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Falta Anexo!
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-semibold">OK</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => openTriagemPanel(app)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-650 dark:hover:bg-pink-955/10 font-bold transition-all bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Triar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeApp && (
        <div className="fixed inset-0 bg-black/45 z-50 flex justify-end animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 h-full flex flex-col shadow-2xl border-l border-zinc-250 dark:border-zinc-800 animate-in slide-in-from-right duration-350">
            <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-zinc-955 dark:text-zinc-50">Ficha de Triagem</h3>
                <span className="text-[10px] font-mono text-zinc-400 font-bold block mt-1">{activeApp.protocol}</span>
              </div>
              <button
                onClick={() => {
                  setActiveApp(null);
                  setIsScheduling(false);
                }}
                className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-500"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-850 space-y-4">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Dados do Paciente</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-455 block uppercase font-bold">Nome Completo</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-150">{activeApp.patientName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-455 block uppercase font-bold">CPF</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-150">{activeApp.patientCpf}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-455 block uppercase font-bold">Telefone</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{activeApp.patientPhone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-455 block uppercase font-bold">E-mail</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">{activeApp.patientEmail}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-zinc-450 block uppercase font-bold">Cidade e Estado</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-150">{activeApp.city} / {activeApp.state}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-zinc-455 block uppercase font-bold">Procedimento e Especialidade</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-150">{activeApp.examName}</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">{activeApp.specialtyName}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-955 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-850 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Histórico de Atendimento</h4>
                {(() => {
                  const history = getPatientHistory(activeApp.patientCpf, activeApp.id);
                  return (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{history.text}</span>
                        {history.isPossibleReturn && (
                          <span className="inline-block px-2 py-0.5 bg-red-100 dark:bg-red-955/30 text-red-800 dark:text-red-400 rounded-md text-[9px] font-bold animate-pulse">
                            🔁 Possível Retorno
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-955 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-850 space-y-4">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Contato Rápido & Validação Híbrida</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-phone" className="text-[10px] text-zinc-455 block uppercase font-bold mb-1">Novo Telefone</label>
                    <input
                      id="edit-phone"
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-email" className="text-[10px] text-zinc-455 block uppercase font-bold mb-1">Novo E-mail</label>
                    <input
                      id="edit-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="paciente@email.com"
                      className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveContacts}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Atualizar Contatos
                  </button>
                </div>

                <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-3 space-y-2">
                  <span className="text-[10px] text-zinc-455 block uppercase font-bold">Enviar Canal de Validação</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendMockValidation('WhatsApp')}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>💬 Testar via WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMockValidation('SMS')}
                      className="py-2.5 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>📱 Testar via SMS</span>
                    </button>
                  </div>
                </div>
              </div>

              {activeApp.status === 'Reagendamento Pendente' && (
                <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-2xl text-xs space-y-2 dark:bg-amber-955/10 dark:border-amber-900/30">
                  <h4 className="font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Solicitação de Reagendamento
                  </h4>
                  <p className="text-amber-700 dark:text-amber-300">
                    O paciente solicitou a alteração do atendimento para a data:
                  </p>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 pt-1">
                    <Calendar className="w-4 h-4 text-pink-650" />
                    {activeApp.rescheduledDate ? new Date(activeApp.rescheduledDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''} às {activeApp.rescheduledTime}h
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Documento do Encaminhamento</span>
                {activeApp.fileAttachment ? (
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-955 flex flex-col">
                    <div className="p-3 bg-white dark:bg-zinc-900 border-b border-zinc-250 dark:border-zinc-800 flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                        {activeApp.fileAttachment.name}
                      </span>
                      <button
                        onClick={() => {
                          const newWindow = window.open();
                          if (newWindow && activeApp.fileAttachment) {
                            newWindow.document.write(
                              `<iframe src="${activeApp.fileAttachment.base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                            );
                          }
                        }}
                        className="text-[11px] font-bold text-pink-600 hover:underline"
                      >
                        Visualizar Tela Cheia
                      </button>
                    </div>
                    <div className="p-4 flex items-center justify-center bg-zinc-100 dark:bg-zinc-955 min-h-[200px]">
                      {activeApp.fileAttachment.type.includes('image') ? (
                        <img 
                          src={activeApp.fileAttachment.base64} 
                          alt="Encaminhamento Clínico" 
                          className="max-h-72 object-contain rounded-lg shadow-xs" 
                        />
                      ) : (
                        <iframe 
                          src={activeApp.fileAttachment.base64} 
                          className="w-full h-80 border-0 rounded-lg shadow-xs bg-white" 
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-red-300 bg-red-50/10 dark:border-red-900/50 dark:bg-red-955/5 rounded-2xl text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                    <h5 className="font-bold text-red-800 dark:text-red-400 text-xs">Documento Ausente</h5>
                    <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">
                      O paciente não anexou o documento de encaminhamento médico para esta solicitação.
                    </p>
                  </div>
                )}
              </div>

              {!isSettingFollowUp && !isScheduling ? (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Grau de Prioridade da Solicitação</label>
                    <div className="flex gap-2">
                      {(['Baixa', 'Média', 'Alta'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={async () => {
                            setPriorityInput(p);
                            if (!activeApp) return;
                            try {
                              await setAppointmentPriority(activeApp.id, p, loggedEmployee.cpf, loggedEmployee.name);
                              setActionSuccess(`Prioridade alterada para ${p}.`);
                              const allApps = await getAppointmentsForAdmin();
                              setAppointments(allApps);
                              const updated = allApps.find(app => app.id === activeApp.id);
                              if (updated) {
                                setActiveApp(updated);
                              }
                            } catch (err: any) {
                              setActionError(err.message || 'Erro ao definir prioridade.');
                            }
                          }}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                            priorityInput === p
                              ? p === 'Alta'
                                ? 'bg-red-500 border-red-500 text-white shadow-xs animate-pulse'
                                : p === 'Média'
                                ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                                : 'bg-zinc-800 border-zinc-800 text-white shadow-xs'
                              : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-800">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Observações Clínicas / Triagem (Imutáveis)</h4>
                    
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {!activeApp.internalNotes || activeApp.internalNotes.length === 0 ? (
                        <p className="text-zinc-400 text-xs italic">Nenhuma anotação registrada ainda.</p>
                      ) : (
                        <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-4 space-y-4 ml-2 py-1">
                          {activeApp.internalNotes.map((note) => (
                            <div key={note.id} className="relative">
                              <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                                note.isUrgent 
                                  ? 'bg-red-500 border-red-500 animate-ping' 
                                  : 'bg-zinc-400 border-zinc-300 dark:border-zinc-850'
                              }`} />
                              <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                                note.isUrgent 
                                  ? 'bg-red-500 border-red-500' 
                                  : 'bg-zinc-455 border-zinc-300 dark:border-zinc-800'
                              }`} />
                              
                              <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-850 space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold">
                                  <span>{note.authorName}</span>
                                  <span>{new Date(note.timestamp).toLocaleString('pt-BR')}</span>
                                </div>
                                {note.isUrgent && (
                                  <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-800 dark:bg-red-955/30 dark:text-red-400 rounded-md text-[9px] font-bold">
                                    ⚠️ URGENTE
                                  </span>
                                )}
                                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line text-xs">{note.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleAddNote} className="space-y-2">
                      <textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Nova anotação clínica..."
                        rows={2}
                        className="w-full border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                        required
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs text-zinc-650 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newNoteIsUrgent}
                            onChange={(e) => setNewNoteIsUrgent(e.target.checked)}
                            className="rounded text-pink-600 focus:ring-pink-500"
                          />
                          Marcar como Urgente
                        </label>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Registrar Nota
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
                    <button
                      onClick={handleSaveTriagemChanges}
                      className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-600/15"
                    >
                      Salvar Alterações
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setIsSettingFollowUp(true);
                          setFollowUpDateInput(activeApp.followUpDate || '');
                          setFollowUpIsSuspended(activeApp.followUpSuspended || false);
                          setFollowUpReason('');
                        }}
                        className="h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        Follow-up
                      </button>
                      <button
                        onClick={() => {
                          setIsScheduling(true);
                          if (activeApp.status === 'Reagendamento Pendente' && activeApp.rescheduledDate && activeApp.rescheduledTime) {
                            setScheduleDate(activeApp.rescheduledDate);
                            setScheduleTime(activeApp.rescheduledTime);
                          } else {
                            setScheduleDate(nextBusinessDays()[0]);
                            setScheduleTime('08:30');
                          }
                        }}
                        className="h-10 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-pink-600/15"
                      >
                        Agendar
                      </button>
                    </div>
                  </div>
                </div>
              ) : isSettingFollowUp ? (
                <form onSubmit={handleFollowUpSubmit} className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 animate-in slide-in-from-bottom-2">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-650" />
                    Configurar Follow-up / Pendência
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-650 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="followup-suspended"
                        checked={followUpIsSuspended}
                        onChange={(e) => setFollowUpIsSuspended(e.target.checked)}
                        className="rounded text-pink-600 focus:ring-pink-500"
                      />
                      <label htmlFor="followup-suspended" className="cursor-pointer font-bold">Suspender Acompanhamento temporariamente</label>
                    </div>

                    {!followUpIsSuspended ? (
                      <div className="space-y-1.5">
                        <label htmlFor="followup-date" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Data Limite de Retorno (Reavaliação)</label>
                        <input
                          id="followup-date"
                          type="date"
                          value={followUpDateInput}
                          onChange={(e) => setFollowUpDateInput(e.target.value)}
                          className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                          required={!followUpIsSuspended}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label htmlFor="followup-reason" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Justificativa da Suspensão</label>
                        <textarea
                          id="followup-reason"
                          rows={2}
                          value={followUpReason}
                          onChange={(e) => setFollowUpReason(e.target.value)}
                          placeholder="Informe o motivo para pausar o follow-up deste paciente..."
                          className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                          required={followUpIsSuspended}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSettingFollowUp(false)}
                      className="flex-1 h-10 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-950 dark:text-zinc-300 text-zinc-700 rounded-xl text-[11px] font-bold transition-all"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm"
                    >
                      Confirmar Follow-up
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmSchedule} className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 animate-in slide-in-from-bottom-2">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-pink-600" />
                    Alocação de Recurso & Horário (Confirmar Agendamento)
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="sch-date" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Data da Consulta</label>
                      <input
                        id="sch-date"
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="sch-time" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Horário</label>
                      <select
                        id="sch-time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer"
                        required
                      >
                        <option value="08:00">08:00h</option>
                        <option value="08:30">08:30h</option>
                        <option value="09:00">09:00h</option>
                        <option value="09:30">09:30h</option>
                        <option value="10:00">10:00h</option>
                        <option value="10:30">10:30h</option>
                        <option value="11:00">11:00h</option>
                        <option value="11:30">11:30h</option>
                        <option value="13:30">13:30h</option>
                        <option value="14:00">14:00h</option>
                        <option value="14:30">14:30h</option>
                        <option value="15:00">15:00h</option>
                        <option value="15:30">15:30h</option>
                        <option value="16:00">16:00h</option>
                        <option value="16:30">16:30h</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="sch-room" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Consultório / Sala de Exame</label>
                      <input
                        id="sch-room"
                        type="text"
                        placeholder="Ex: Consultório 04"
                        value={scheduleRoom}
                        onChange={(e) => setScheduleRoom(e.target.value)}
                        className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="sch-doc" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Médico Responsável</label>
                      <input
                        id="sch-doc"
                        type="text"
                        placeholder="Ex: Dra. Patricia Arantes"
                        value={scheduleDoctor}
                        onChange={(e) => setScheduleDoctor(e.target.value)}
                        className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                        required
                      />
                    </div>

                    {scheduleDate && activeApp && (() => {
                      const limitObj = capacityLimits.find(l => l.examId === activeApp.examId);
                      if (limitObj) {
                        const dailyLimit = limitObj.dailyLimit;
                        const count = appointments.filter(app => {
                          if (app.id === activeApp.id) return false;
                          if (app.examId !== activeApp.examId) return false;
                          const appDate = app.rescheduledDate || '';
                          return (app.status === 'Confirmado' || app.status === 'Reagendamento Pendente') && appDate === scheduleDate;
                        }).length;

                        const usageRatio = (count + 1) / dailyLimit;
                        const isNearLimit = usageRatio >= 0.8;
                        const isExceeded = count >= dailyLimit;

                        return (
                          <div className={`col-span-2 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                            isExceeded
                              ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                              : isNearLimit
                                ? 'bg-amber-50 border-amber-250 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30 animate-pulse'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'
                          }`}>
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <div>
                              <span>Vagas preenchidas: <strong>{count} de {dailyLimit}</strong> para este exame na data.</span>
                              {isExceeded && <p className="text-[10px] font-bold text-red-650 dark:text-red-400 mt-0.5">Capacidade esgotada! O agendamento será rejeitado.</p>}
                              {!isExceeded && isNearLimit && <p className="text-[10px] font-bold text-amber-650 dark:text-amber-400 mt-0.5">Atenção: Data com 80% ou mais da capacidade máxima preenchida!</p>}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsScheduling(false)}
                      className="flex-1 h-10 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-950 dark:text-zinc-300 text-zinc-700 rounded-xl text-[11px] font-bold transition-all"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm shadow-green-600/15"
                    >
                      Confirmar e Salvar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {mockNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-zinc-900 text-zinc-100 rounded-3xl p-4 shadow-2xl border border-zinc-800 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-500">Simulador de Celular do Paciente</span>
            <button onClick={() => setMockNotification(null)} className="text-zinc-500 hover:text-zinc-350 text-xs">✕</button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full font-bold">
                {mockNotification.method === 'WhatsApp' ? '💬 WhatsApp' : '📱 SMS'}
              </span>
              <span className="text-[10px] text-zinc-450 font-mono">{mockNotification.phone}</span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-850 text-xs font-mono text-zinc-300">
              Hospital de Amor: Seu código de validação de triagem é <span className="text-pink-500 font-bold">{mockNotification.code}</span>. Por favor, confirme com o atendente.
            </div>
            <p className="text-[9px] text-zinc-500 text-center italic">Este painel simula o recebimento da mensagem no aparelho do paciente.</p>
          </div>
        </div>
      )}
    </div>
  );
}
