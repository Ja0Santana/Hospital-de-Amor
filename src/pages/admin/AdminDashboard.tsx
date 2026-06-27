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
  getCapacityLimits,
  addAuditLogAdmin,
  getSymptomLogs,
  getEmailQueue,
  saveFilterCombination,
  getSavedFilters,
  deleteSavedFilter,
  checkAndProcessExpiredOffers,
  registerPatientCheckIn,
  getAuditLogs
} from '../../services/db';
import type { Appointment, City, Specialty, PatientUser, CapacityLimit, AppointmentStatus, SymptomLog, AuditLog } from '../../types';
import { 
  AlertCircle, 
  CheckCircle, 
  QrCode, 
  MessageSquare, 
  Smartphone, 
  X
} from 'lucide-react';
import TriagemFilterPanel from '../../components/admin/dashboard/TriagemFilterPanel';
import TriagemQueueTable from '../../components/admin/dashboard/TriagemQueueTable';
import TriagemDetailsSidebar from '../../components/admin/dashboard/TriagemDetailsSidebar';
import TriagemScheduleModal from '../../components/admin/dashboard/TriagemScheduleModal';
import AuditAlertsPanel from '../../components/admin/dashboard/AuditAlertsPanel';
import StatsCards from '../../components/admin/dashboard/StatsCards';
import RealocationOffersPanel from '../../components/admin/dashboard/RealocationOffersPanel';
import CheckInScannerModal from '../../components/admin/dashboard/CheckInScannerModal';
import SignatureValidatorModal from '../../components/admin/dashboard/SignatureValidatorModal';
import BatchActionModal from '../../components/admin/dashboard/BatchActionModal';
import { dispatchLobbyCall } from '../../services/lobbyChannel';

interface AdminDashboardProps {
  loggedEmployee: PatientUser;
  permissions: string[];
}

export default function AdminDashboard({ loggedEmployee, permissions }: AdminDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  const [batchConfirmModal, setBatchConfirmModal] = useState<{ action: 'Em análise' | 'Cancelado'; count: number } | null>(null);
  const [, setTick] = useState(0);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(true);
  const [schedulingErrors, setSchedulingErrors] = useState<string[]>([]);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReasonInput, setOverrideReasonInput] = useState('');

  useEffect(() => {
    getAppointmentsForAdmin().then(data => {
      setAppointments(data);
      setIsInitialLoading(false);
    }).catch(console.error);
    getAuditLogs().then(setAuditLogs).catch(console.error);
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      checkAndProcessExpiredOffers().then(() => {
        getAppointmentsForAdmin().then(setAppointments).catch(console.error);
      });
      getAuditLogs().then(setAuditLogs).catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const [cities, setCities] = useState<City[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [capacityLimits, setCapacityLimits] = useState<CapacityLimit[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [showColdStorage, setShowColdStorage] = useState(false);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [filterNameInput, setFilterNameInput] = useState('');
  const [isSavingFilter, setIsSavingFilter] = useState(false);

  const [sortKey, setSortKey] = useState<string>('fila_priorizada');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [emailQueue, setEmailQueue] = useState<any[]>([]);

  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  
  const [activeApp, setActiveApp] = useState<Appointment | null>(null);
  const isActiveAppOfferActive = !!(activeApp && activeApp.waitingListOfferExpiresAt && new Date(activeApp.waitingListOfferExpiresAt) > new Date() && (activeApp.status === 'Pendente' || activeApp.status === 'Em análise'));
  const [isScheduling, setIsScheduling] = useState(false);
  
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleRoom, setScheduleRoom] = useState('');
  const [scheduleDoctor, setScheduleDoctor] = useState('');
  
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCityId, selectedSpecialtyId, statusFilter, startDateFilter, endDateFilter, showColdStorage, sortKey, sortOrder]);

  const renderFeedback = () => {
    return (
      <div className="space-y-3 w-full animate-in fade-in">
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200/50 dark:border-red-800/30 text-red-850 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
      </div>
    );
  };

  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteIsUrgent, setNewNoteIsUrgent] = useState(false);

  const [isSettingFollowUp, setIsSettingFollowUp] = useState(false);
  const [followUpDateInput, setFollowUpDateInput] = useState('');
  const [followUpIsSuspended, setFollowUpIsSuspended] = useState(false);
  const [followUpReason, setFollowUpReason] = useState('');

  const [mockNotification, setMockNotification] = useState<{ method: string; phone: string; code: string } | null>(null);
  const [priorityInput, setPriorityInput] = useState<'Baixa' | 'Média' | 'Alta'>('Baixa');
  const [statusInput, setStatusInput] = useState<AppointmentStatus>('Pendente');
  const [isClosing, setIsClosing] = useState(false);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [patientSymptomLogs, setPatientSymptomLogs] = useState<SymptomLog[]>([]);

  const [verifyingSignatureApp, setVerifyingSignatureApp] = useState<Appointment | null>(null);

  const handleCloseTriagem = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveApp(null);
      setIsClosing(false);
      setIsScheduling(false);
    }, 300);
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

      setActionSuccess(`Solicitação de ${activeApp.patientName} em acompanhamento.`);
      setIsSettingFollowUp(false);
      setFollowUpDateInput('');
      setFollowUpReason('');
      setFollowUpIsSuspended(false);
      setActiveApp(null);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Erro ao registrar acompanhamento.');
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

  const loadSavedFilters = async () => {
    try {
      const filters = await getSavedFilters(loggedEmployee.cpf);
      setSavedFilters(filters);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFilter = async () => {
    if (!filterNameInput.trim()) return;
    try {
      const filterState = {
        searchQuery,
        selectedCityId,
        selectedSpecialtyId,
        statusFilter,
        startDateFilter,
        endDateFilter,
        showColdStorage
      };
      await saveFilterCombination(filterNameInput.trim(), filterState, loggedEmployee.cpf);
      setFilterNameInput('');
      setIsSavingFilter(false);
      await loadSavedFilters();
      setActionSuccess('Filtro salvo com sucesso!');
    } catch (err: any) {
      setActionError(err.message || 'Erro ao salvar filtro.');
    }
  };

  const handleApplySavedFilter = (filterState: any) => {
    setSearchQuery(filterState.searchQuery || '');
    setSelectedCityId(filterState.selectedCityId || '');
    setSelectedSpecialtyId(filterState.selectedSpecialtyId || '');
    setStatusFilter(filterState.statusFilter || 'Todos');
    setStartDateFilter(filterState.startDateFilter || '');
    setEndDateFilter(filterState.endDateFilter || '');
    setShowColdStorage(filterState.showColdStorage || false);
  };

  const handleDeleteSavedFilter = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSavedFilter(id);
      await loadSavedFilters();
      setActionSuccess('Filtro removido com sucesso.');
    } catch (err: any) {
      setActionError(err.message || 'Erro ao remover filtro.');
    }
  };

  useEffect(() => {
    loadData();
    loadSavedFilters();
    const storedSort = localStorage.getItem('hospital_amor_admin_sort');
    if (storedSort) {
      try {
        const { key, order } = JSON.parse(storedSort);
        if (key && order) {
          setSortKey(key);
          setSortOrder(order);
        } else {
          setSortKey('fila_priorizada');
          setSortOrder('asc');
        }
      } catch (e) {
        console.error(e);
        setSortKey('fila_priorizada');
        setSortOrder('asc');
      }
    } else {
      setSortKey('fila_priorizada');
      setSortOrder('asc');
    }
  }, []);

  useEffect(() => {
    if (activeApp || isScannerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeApp, isScannerOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeApp) {
        handleCloseTriagem();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeApp]);

  useEffect(() => {
    const fetchSymptomLogs = async () => {
      if (!activeApp) {
        setPatientSymptomLogs([]);
        return;
      }
      try {
        const logs = await getSymptomLogs(activeApp.patientCpf);
        setPatientSymptomLogs(logs);
      } catch (err) {
        console.error('Erro ao carregar logs de sintomas:', err);
      }
    };
    fetchSymptomLogs();
  }, [activeApp]);

  const handleSort = (key: string) => {
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
      await checkAndProcessExpiredOffers();
      const allAppointments = await getAppointmentsForAdmin();
      setAppointments(allAppointments);
      
      const allCities = await getCities();
      setCities(allCities);
      
      const allSpecialties = await getSpecialties();
      setSpecialties(allSpecialties);

      const allLimits = await getCapacityLimits();
      setCapacityLimits(allLimits);

      const queue = await getEmailQueue();
      setEmailQueue(queue);

      const logs = await getAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
    }
  };

  const hasMailBounce = (app: Appointment) => {
    const appEmail = app.patientEmail?.trim().toLowerCase();
    const appProtocol = app.protocol?.trim().toLowerCase();
    return emailQueue.some((item: any) => 
      item.bounced && (
        (item.recipientEmail && item.recipientEmail.trim().toLowerCase() === appEmail) ||
        (item.appointmentProtocol && item.appointmentProtocol.trim().toLowerCase() === appProtocol)
      )
    );
  };

  const getRemainingTime = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return 'Expirado';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const examRequiresEncaminhamento = (examId: string) => {
    for (const specialty of specialties) {
      const exam = specialty.exams.find(e => e.id === examId);
      if (exam) {
        return exam.requiresEncaminhamento !== false;
      }
    }
    return true;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedAppointments.map(app => app.id);
      setSelectedApps(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedAppointments.map(app => app.id);
      setSelectedApps(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApps(prev => [...prev, id]);
    } else {
      setSelectedApps(prev => prev.filter(item => item !== id));
    }
  };

  const handleRegisterCheckIn = async (id: string) => {
    try {
      await registerPatientCheckIn(id);
      const updated = await getAppointmentsForAdmin();
      setAppointments(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoteStatusChange = async (newStatus: 'Em análise' | 'Cancelado') => {
    setActionError('');
    setActionSuccess('');
    if (selectedApps.length === 0) return;
    setBatchConfirmModal({ action: newStatus, count: selectedApps.length });
  };

  const handleLoteStatusConfirm = async () => {
    if (!batchConfirmModal) return;
    const { action } = batchConfirmModal;
    setBatchConfirmModal(null);
    try {
      for (const id of selectedApps) {
        await updateAppointmentStatus(
          id,
          action,
          'Atualizado em lote pela equipe administrativa.',
          loggedEmployee.cpf,
          loggedEmployee.name
        );
      }
      setActionSuccess(`Status de ${selectedApps.length} agendamentos alterado para "${action}" com sucesso.`);
      setSelectedApps([]);
      await loadData();
    } catch (e) {
      console.error(e);
      setActionError('Ocorreu um erro ao atualizar os status em lote.');
    }
  };

  const handleSaveTriagemChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleCallOnTv = async () => {
    if (!activeApp) return;

    setActionSuccess('');
    setActionError('');

    const firstName = activeApp.patientName.split(' ')[0];
    const lastNameParts = activeApp.patientName.split(' ');
    const lastInitial = lastNameParts.length > 1 ? ' ' + lastNameParts[lastNameParts.length - 1][0] + '.' : '';
    const maskedName = firstName + lastInitial;

    const callTicket = 'S-' + Math.floor(100 + Math.random() * 900);
    const callDestination = activeApp.scheduledRoom || 'Consultório 1';

    dispatchLobbyCall(maskedName, callDestination, callTicket, loggedEmployee.name);

    try {
      await addAuditLogAdmin(
        'CHAMAR_PACIENTE_TV',
        'Fila e Recepção',
        `Paciente ${maskedName} chamado para ${callDestination} na TV com a senha ${callTicket}`,
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setActionSuccess(`Chamado enviado para a TV: Senha ${callTicket}.`);
    } catch (e: any) {
      console.error(e);
      setActionError(e.message || 'Erro ao chamar na TV.');
    }
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setSchedulingErrors([]);
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
      setSchedulingErrors([]);
      await loadData();
    } catch (err: any) {
      const errMsg = err.message || 'Erro ao confirmar o agendamento.';
      setActionError(errMsg);
      setSchedulingErrors(errMsg.split('\n'));
    }
  };

  const handleConfirmOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApp || !overrideReasonInput.trim()) return;

    try {
      await confirmAppointmentSchedule(
        activeApp.id,
        scheduleDate,
        scheduleTime,
        scheduleRoom.trim(),
        scheduleDoctor.trim(),
        loggedEmployee.cpf,
        loggedEmployee.name,
        overrideReasonInput.trim()
      );
      
      setActionSuccess(`Consulta confirmada via OVERRIDE para ${activeApp.patientName} em ${scheduleDate} às ${scheduleTime}h.`);
      setIsScheduling(false);
      setScheduleDate('');
      setScheduleTime('');
      setScheduleRoom('');
      setScheduleDoctor('');
      setActiveApp(null);
      setShowOverrideModal(false);
      setOverrideReasonInput('');
      setSchedulingErrors([]);
      await loadData();
    } catch (err: any) {
      const errMsg = err.message || 'Erro ao forçar agendamento.';
      setActionError(errMsg);
      setSchedulingErrors(errMsg.split('\n'));
      setShowOverrideModal(false);
    }
  };

  const openTriagemPanel = (app: Appointment) => {
    setActiveApp(app);
    setIsScheduling(false);
    setActionError('');
    setActionSuccess('');
    setSchedulingErrors([]);
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
    const matchesColdStorage = showColdStorage || !app.isColdStorage;

    const matchesDate = (() => {
      if (!startDateFilter && !endDateFilter) return true;
      if (!app.rescheduledDate) return false;
      const appDateStr = app.rescheduledDate;
      if (startDateFilter && appDateStr < startDateFilter) return false;
      if (endDateFilter && appDateStr > endDateFilter) return false;
      return true;
    })();

    return matchesSearch && matchesCity && matchesSpecialty && matchesStatus && matchesColdStorage && matchesDate;
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (sortKey === 'fila_priorizada') {
      const weightA = a.isLegalPriority ? 1 : 0;
      const weightB = b.isLegalPriority ? 1 : 0;
      if (weightA !== weightB) {
        return sortOrder === 'asc' ? weightB - weightA : weightA - weightB;
      }

      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      if (timeA !== timeB) {
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }

      const pWeight = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };
      const pA = pWeight[a.priority as 'Alta' | 'Média' | 'Baixa'] || 1;
      const pB = pWeight[b.priority as 'Alta' | 'Média' | 'Baixa'] || 1;
      return sortOrder === 'asc' ? pB - pA : pA - pB;
    }

    if (sortKey === 'priority') {
      const weight = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };
      const valA = weight[a.priority as 'Alta' | 'Média' | 'Baixa'] || 1;
      const valB = weight[b.priority as 'Alta' | 'Média' | 'Baixa'] || 1;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    if (sortKey === 'createdAt') {
      const valA = new Date(a.createdAt).getTime();
      const valB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    if (sortKey === 'changedAt') {
      const getLatestStatusChange = (app: Appointment) => {
        if (app.statusHistory && app.statusHistory.length > 0) {
          const dates = app.statusHistory.map(h => new Date(h.changedAt).getTime());
          return Math.max(...dates);
        }
        return new Date(app.createdAt).getTime();
      };
      const valA = getLatestStatusChange(a);
      const valB = getLatestStatusChange(b);
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    if (sortKey === 'assignedTo') {
      const valA = a.assignedTo || '';
      const valB = b.assignedTo || '';
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }

    const valA = (a[sortKey as keyof Appointment] || '') as string;
    const valB = (b[sortKey as keyof Appointment] || '') as string;
    return sortOrder === 'asc' 
      ? valA.localeCompare(valB) 
      : valB.localeCompare(valA);
  });

  const getSlaStatus = (createdAt: string): 'ok' | 'warning' | 'critical' => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
    if (days > 50) return 'critical';
    if (days >= 30) return 'warning';
    return 'ok';
  };

  const totalPages = Math.ceil(sortedAppointments.length / ITEMS_PER_PAGE);
  const paginatedAppointments = sortedAppointments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const activeFilters: Array<{ id: string, label: string, clear: () => void }> = [];
  if (searchQuery) activeFilters.push({ id: 'search', label: `Busca: "${searchQuery}"`, clear: () => setSearchQuery('') });
  if (selectedCityId) activeFilters.push({ id: 'city', label: `Cidade: ${cities.find(c => c.id === selectedCityId)?.name}`, clear: () => setSelectedCityId('') });
  if (selectedSpecialtyId) activeFilters.push({ id: 'specialty', label: `Especialidade: ${specialties.find(s => s.id === selectedSpecialtyId)?.name}`, clear: () => setSelectedSpecialtyId('') });
  if (statusFilter !== 'Todos') activeFilters.push({ id: 'status', label: `Status: ${statusFilter}`, clear: () => setStatusFilter('Todos') });
  if (startDateFilter) activeFilters.push({ id: 'startDate', label: `Início: ${startDateFilter}`, clear: () => setStartDateFilter('') });
  if (endDateFilter) activeFilters.push({ id: 'endDate', label: `Fim: ${endDateFilter}`, clear: () => setEndDateFilter('') });
  if (showColdStorage) activeFilters.push({ id: 'coldStorage', label: `Exibindo Cold Storage`, clear: () => setShowColdStorage(false) });

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedCityId('');
    setSelectedSpecialtyId('');
    setStatusFilter('Todos');
    setStartDateFilter('');
    setEndDateFilter('');
    setShowColdStorage(false);
  };

  const getSortIcon = (key: typeof sortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">Painel de Triagem</h1>
            <p className="text-zinc-500 mt-1 text-sm">Fila de triagem clínica de solicitações de exames.</p>
          </div>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Recepção - Check-in Rápido</span>
          </button>
        </div>

        <AuditAlertsPanel
          auditLogs={auditLogs}
          isAlertsOpen={isAlertsOpen}
          setIsAlertsOpen={setIsAlertsOpen}
        />

        <StatsCards appointments={appointments} />

        <RealocationOffersPanel
          appointments={appointments}
          getRemainingTime={getRemainingTime}
        />

        {renderFeedback()}

        <TriagemFilterPanel
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCityId={selectedCityId}
          setSelectedCityId={setSelectedCityId}
          selectedSpecialtyId={selectedSpecialtyId}
          setSelectedSpecialtyId={setSelectedSpecialtyId}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortKey={sortKey}
          setSortKey={setSortKey}
          sortOrder={sortOrder}
          startDateFilter={startDateFilter}
          setStartDateFilter={setStartDateFilter}
          endDateFilter={endDateFilter}
          setEndDateFilter={setEndDateFilter}
          showColdStorage={showColdStorage}
          setShowColdStorage={setShowColdStorage}
          cities={cities}
          specialties={specialties}
          isSavingFilter={isSavingFilter}
          setIsSavingFilter={setIsSavingFilter}
          filterNameInput={filterNameInput}
          setFilterNameInput={setFilterNameInput}
          savedFilters={savedFilters}
          activeFilters={activeFilters}
          handleSaveFilter={handleSaveFilter}
          handleApplySavedFilter={handleApplySavedFilter}
          handleDeleteSavedFilter={handleDeleteSavedFilter}
          handleClearAllFilters={handleClearAllFilters}
        />

        <TriagemQueueTable
          selectedApps={selectedApps}
          setSelectedApps={setSelectedApps}
          permissions={permissions}
          filteredAppointments={filteredAppointments}
          appointments={appointments}
          isInitialLoading={isInitialLoading}
          sortedAppointments={sortedAppointments}
          paginatedAppointments={paginatedAppointments}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          handleSort={handleSort}
          getSortIcon={getSortIcon}
          handleSelectAll={handleSelectAll}
          handleSelectOne={handleSelectOne}
          handleLoteStatusChange={handleLoteStatusChange}
          getSlaStatus={getSlaStatus}
          getRemainingTime={getRemainingTime}
          hasMailBounce={hasMailBounce}
          examRequiresEncaminhamento={examRequiresEncaminhamento}
          onCheckIn={handleRegisterCheckIn}
          openTriagemPanel={openTriagemPanel}
        />

      </div>

      {activeApp && (
        <TriagemDetailsSidebar
          activeApp={activeApp}
          isClosing={isClosing}
          handleCloseTriagem={handleCloseTriagem}
          isActiveAppOfferActive={isActiveAppOfferActive}
          hasMailBounce={hasMailBounce}
          examRequiresEncaminhamento={examRequiresEncaminhamento}
          renderFeedback={renderFeedback}
          statusInput={statusInput}
          setStatusInput={setStatusInput}
          priorityInput={priorityInput}
          setPriorityInput={setPriorityInput}
          handleSaveTriagem={handleSaveTriagemChanges}
          handleCallTV={handleCallOnTv}
          newNoteText={newNoteText}
          setNewNoteText={setNewNoteText}
          isUrgentNote={newNoteIsUrgent}
          setIsUrgentNote={setNewNoteIsUrgent}
          handleAddNote={handleAddNote}
          isSettingFollowUp={isSettingFollowUp}
          setIsSettingFollowUp={setIsSettingFollowUp}
          followUpDate={followUpDateInput}
          setFollowUpDate={setFollowUpDateInput}
          followUpIsSuspended={followUpIsSuspended}
          setFollowUpIsSuspended={setFollowUpIsSuspended}
          followUpReason={followUpReason}
          setFollowUpReason={setFollowUpReason}
          handleSaveFollowUp={handleFollowUpSubmit}
          isScheduling={isScheduling}
          setIsScheduling={setIsScheduling}
          scheduleDate={scheduleDate}
          setScheduleDate={setScheduleDate}
          scheduleTime={scheduleTime}
          setScheduleTime={setScheduleTime}
          scheduleRoom={scheduleRoom}
          setScheduleRoom={setScheduleRoom}
          scheduleDoctor={scheduleDoctor}
          setScheduleDoctor={setScheduleDoctor}
          handleConfirmSchedule={handleConfirmSchedule}
          capacityLimits={capacityLimits}
          loggedEmployee={loggedEmployee}
          symptomLogs={patientSymptomLogs}
          schedulingErrors={schedulingErrors}
          setShowOverrideModal={setShowOverrideModal}
          setOverrideReasonInput={setOverrideReasonInput}
          onCheckIn={handleRegisterCheckIn}
          appointments={appointments}
        />
      )}

      {mockNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-zinc-900 text-zinc-100 rounded-3xl p-4 shadow-2xl border border-zinc-800 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-500">Simulador de Celular do Paciente</span>
            <button onClick={() => setMockNotification(null)} className="text-zinc-500 hover:text-zinc-350 text-xs flex items-center justify-center transition-transform hover:rotate-90 duration-200"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                {mockNotification.method === 'WhatsApp' ? (
                  <>
                    <MessageSquare className="w-3 h-3 text-emerald-500" />
                    <span>WhatsApp</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3 h-3 text-blue-550" />
                    <span>SMS</span>
                  </>
                )}
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

      <CheckInScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        appointments={appointments}
        setAppointments={setAppointments}
        loggedEmployee={loggedEmployee}
      />

      <SignatureValidatorModal
        app={verifyingSignatureApp}
        onClose={() => setVerifyingSignatureApp(null)}
      />

      <BatchActionModal
        modal={batchConfirmModal}
        onClose={() => setBatchConfirmModal(null)}
        onConfirm={handleLoteStatusConfirm}
        renderFeedback={renderFeedback}
      />

      <TriagemScheduleModal
        showOverrideModal={showOverrideModal}
        setShowOverrideModal={setShowOverrideModal}
        overrideReasonInput={overrideReasonInput}
        setOverrideReasonInput={setOverrideReasonInput}
        handleConfirmOverride={handleConfirmOverride}
        renderFeedback={renderFeedback}
      />
    </>
  );
}
