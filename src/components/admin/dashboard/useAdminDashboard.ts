import { useState, useEffect, useCallback, useRef } from 'react';
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
  getAuditLogs,
  syncAppointmentWithPep,
} from '../../../services/db';
import type {
  Appointment,
  City,
  Specialty,
  PatientUser,
  CapacityLimit,
  AppointmentStatus,
  SymptomLog,
  AuditLog,
} from '../../../types';
import { dispatchLobbyCall } from '../../../services/lobbyChannel';
import { filterAppointments, sortAppointments } from './dashboardHelpers';

interface UseAdminDashboardProps {
  loggedEmployee: PatientUser;
}

export function useAdminDashboard({
  loggedEmployee,
}: UseAdminDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  const [batchConfirmModal, setBatchConfirmModal] = useState<{
    action: 'Em análise' | 'Cancelado';
    count: number;
  } | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(true);
  const [schedulingErrors, setSchedulingErrors] = useState<string[]>([]);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReasonInput, setOverrideReasonInput] = useState('');

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
  const [mockNotification, setMockNotification] = useState<{ method: string; phone: string; code: string } | null>(null);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [filterNameInput, setFilterNameInput] = useState('');
  const [isSavingFilter, setIsSavingFilter] = useState(false);

  const [sortKey, setSortKey] = useState<string>('fila_priorizada');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [emailQueue, setEmailQueue] = useState<any[]>([]);

  const [selectedApps, setSelectedApps] = useState<string[]>([]);

  const [activeApp, setActiveApp] = useState<Appointment | null>(null);
  const isActiveAppOfferActive = !!(
    activeApp &&
    activeApp.waitingListOfferExpiresAt &&
    new Date(activeApp.waitingListOfferExpiresAt) > new Date() &&
    (activeApp.status === 'Pendente' || activeApp.status === 'Em análise')
  );
  const [isScheduling, setIsScheduling] = useState(false);

  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleRoom, setScheduleRoom] = useState('');
  const [scheduleDoctor, setScheduleDoctor] = useState('');

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteIsUrgent, setNewNoteIsUrgent] = useState(false);

  const [isSettingFollowUp, setIsSettingFollowUp] = useState(false);
  const [followUpDateInput, setFollowUpDateInput] = useState('');
  const [followUpIsSuspended, setFollowUpIsSuspended] = useState(false);
  const [followUpReason, setFollowUpReason] = useState('');

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [patientSymptomLogs, setPatientSymptomLogs] = useState<SymptomLog[]>([]);

  const [verifyingSignatureApp, setVerifyingSignatureApp] =
    useState<Appointment | null>(null);

  const [pepSyncQueue, setPepSyncQueue] = useState<string[]>([]);

  const [priorityInput, setPriorityInput] = useState<'Baixa' | 'Média' | 'Alta'>('Baixa');
  const [statusInput, setStatusInput] = useState<AppointmentStatus>('Pendente');

  const [patientManchesterAlerts, setPatientManchesterAlerts] = useState<Record<string, { hasAlert: boolean; symptoms: string[] }>>({});

  const processSymptomAlert = (logs: SymptomLog[]) => {
    if (logs.length === 0) return { hasAlert: false, symptoms: [] as string[] };

    const sorted = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const latestLog = sorted[0];

    const durationSinceCreation = Date.now() - new Date(latestLog.createdAt).getTime();
    const isRecent = durationSinceCreation <= 48 * 60 * 60 * 1000;
    if (!isRecent) return { hasAlert: false, symptoms: [] as string[] };

    const graveKeywords = ['febre', 'falta de ar', 'dispneia', 'dor forte', 'dor intensa', 'sangramento', 'convulsão'];
    const alertSymptoms: string[] = [];

    latestLog.symptoms.forEach((s) => {
      const isGrave = graveKeywords.some((kw) => s.toLowerCase().includes(kw));
      const intensity = latestLog.symptomIntensities?.[s];
      if (isGrave || intensity === 'intenso') {
        alertSymptoms.push(`${s}${intensity ? ` (${intensity})` : ''}`);
      }
    });

    return {
      hasAlert: alertSymptoms.length > 0,
      symptoms: alertSymptoms,
    };
  };

  useEffect(() => {
    if (appointments.length === 0) return;

    const uniqueCpfs = Array.from(new Set(appointments.map((a) => a.patientCpf)));
    const loadAlerts = async () => {
      const alertsMap: Record<string, { hasAlert: boolean; symptoms: string[] }> = {};
      await Promise.all(
        uniqueCpfs.map(async (cpf) => {
          try {
            const logs = await getSymptomLogs(cpf);
            alertsMap[cpf] = processSymptomAlert(logs);
          } catch (e) {
            console.error(e);
          }
        })
      );
      setPatientManchesterAlerts(alertsMap);
    };

    loadAlerts();
  }, [appointments]);

  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSetIsScheduling = (val: boolean) => {
    setIsScheduling(val);
    if (!val) {
      setScheduleSuccess('');
    }
  };

  const handleCloseTriagem = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveApp(null);
      setIsClosing(false);
      setIsScheduling(false);
      setScheduleSuccess('');
    }, 300);
  };

  const [isClosing, setIsClosing] = useState(false);

  const handleSort = (key: string) => {
    let nextOrder: 'asc' | 'desc' = 'asc';
    if (sortKey === key) {
      nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    setSortKey(key);
    setSortOrder(nextOrder);
    localStorage.setItem(
      'hospital_amor_admin_sort',
      JSON.stringify({ key, order: nextOrder })
    );
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
      setIsInitialLoading(false);
    } catch (e) {
      console.error(e);
      setIsInitialLoading(false);
    }
  };

  const hasMailBounce = (app: Appointment) => {
    const appEmail = app.patientEmail?.trim().toLowerCase();
    const appProtocol = app.protocol?.trim().toLowerCase();
    return emailQueue.some(
      (item: any) =>
        item.bounced &&
        ((item.recipientEmail &&
          item.recipientEmail.trim().toLowerCase() === appEmail) ||
          (item.appointmentProtocol &&
            item.appointmentProtocol.trim().toLowerCase() === appProtocol))
    );
  };

  const getRemainingTime = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0) return 'Expirado';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const examRequiresEncaminhamento = (examId: string) => {
    for (const specialty of specialties) {
      const exam = specialty.exams.find((e) => e.id === examId);
      if (exam) {
        return exam.requiresEncaminhamento !== false;
      }
    }
    return true;
  };

  const runPolling = useCallback(async () => {
    if (document.visibilityState !== 'visible') {
      pollingTimeoutRef.current = setTimeout(runPolling, 5000);
      return;
    }

    try {
      await checkAndProcessExpiredOffers();
      const allAppointments = await getAppointmentsForAdmin();
      setAppointments(allAppointments);

      const logs = await getAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
    }

    pollingTimeoutRef.current = setTimeout(runPolling, 5000);
  }, []);

  useEffect(() => {
    pollingTimeoutRef.current = setTimeout(runPolling, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        runPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [runPolling]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCityId,
    selectedSpecialtyId,
    statusFilter,
    startDateFilter,
    endDateFilter,
    showColdStorage,
    sortKey,
    sortOrder,
  ]);

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
        showColdStorage,
      };
      await saveFilterCombination(
        filterNameInput.trim(),
        filterState,
        loggedEmployee.cpf
      );
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

  useEffect(() => {
    if (pepSyncQueue.length === 0) return;

    let isSubscribed = true;
    const processQueue = async () => {
      const nextId = pepSyncQueue[0];
      try {
        await syncAppointmentWithPep(nextId);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error('Erro na sincronização de background com o PEP:', err);
      }

      if (isSubscribed) {
        setPepSyncQueue((prev) => prev.slice(1));
        await loadData();
      }
    };

    processQueue();

    return () => {
      isSubscribed = false;
    };
  }, [pepSyncQueue]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pageIds = paginatedAppointments.map((app) => app.id);
      setSelectedApps((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = paginatedAppointments.map((app) => app.id);
      setSelectedApps((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApps((prev) => [...prev, id]);
    } else {
      setSelectedApps((prev) => prev.filter((item) => item !== id));
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

  const handleLoteStatusChange = async (
    newStatus: 'Em análise' | 'Cancelado'
  ) => {
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
          'Status alterado na triagem clínica.',
          loggedEmployee.cpf,
          loggedEmployee.name
        );
      }
      setActionSuccess(
        `Status de ${selectedApps.length} agendamentos alterado para "${action}" com sucesso.`
      );
      setPepSyncQueue((prev) => [...prev, ...selectedApps]);
      setSelectedApps([]);
      await loadData();
    } catch (e) {
      console.error(e);
      setActionError('Ocorreu um erro ao atualizar os status em lote.');
    }
  };

  const handleQuickPrioritizeHigh = async (appointmentId: string) => {
    try {
      await setAppointmentPriority(
        appointmentId,
        'Alta',
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      await loadData();
    } catch (e) {
      console.error(e);
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
        setPepSyncQueue((prev) => [...prev, activeApp.id]);
      }

      setActionSuccess(
        `Alterações da triagem de ${activeApp.patientName} salvas com sucesso.`
      );
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
    const lastInitial =
      lastNameParts.length > 1
        ? ' ' + lastNameParts[lastNameParts.length - 1][0] + '.'
        : '';
    const maskedName = firstName + lastInitial;

    const callTicket = 'S-' + Math.floor(100 + Math.random() * 900);
    const callDestination = activeApp.scheduledRoom || 'Consultório 1';

    dispatchLobbyCall(
      maskedName,
      callDestination,
      callTicket,
      loggedEmployee.name
    );

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
    setScheduleSuccess('');
    if (!activeApp) return;

    if (
      !scheduleDate ||
      !scheduleTime ||
      !scheduleRoom.trim() ||
      !scheduleDoctor.trim()
    ) {
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

      setScheduleSuccess(
        `Consulta confirmada para ${activeApp.patientName} em ${scheduleDate} às ${scheduleTime}h.`
      );
      setScheduleDate('');
      setScheduleTime('');
      setScheduleRoom('');
      setScheduleDoctor('');
      setSchedulingErrors([]);
      await loadData();
      const allApps = await getAppointmentsForAdmin();
      const updated = allApps.find((a) => a.id === activeApp.id);
      if (updated) {
        setActiveApp(updated);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Erro ao confirmar o agendamento.';
      setActionError(errMsg);
      setSchedulingErrors(errMsg.split('\n'));
    }
  };

  const handleConfirmOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleSuccess('');
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

      setScheduleSuccess(
        `Consulta confirmada via OVERRIDE para ${activeApp.patientName} em ${scheduleDate} às ${scheduleTime}h.`
      );
      setScheduleDate('');
      setScheduleTime('');
      setScheduleRoom('');
      setScheduleDoctor('');
      setShowOverrideModal(false);
      setOverrideReasonInput('');
      setSchedulingErrors([]);
      await loadData();
      const allApps = await getAppointmentsForAdmin();
      const updated = allApps.find((a) => a.id === activeApp.id);
      if (updated) {
        setActiveApp(updated);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Erro ao forçar agendamento.';
      setActionError(errMsg);
      setSchedulingErrors(errMsg.split('\n'));
      setShowOverrideModal(false);
    }
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

      setActionSuccess(
        `Solicitação de ${activeApp.patientName} em acompanhamento.`
      );
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
      const updated = allApps.find((app) => app.id === activeApp.id);
      if (updated) {
        setActiveApp(updated);
      }
    } catch (err: any) {
      setActionError(err.message || 'Erro ao inserir nota.');
    }
  };

  const openTriagemPanel = (app: Appointment) => {
    setActiveApp(app);
    setIsScheduling(false);
    setActionError('');
    setActionSuccess('');
    setScheduleSuccess('');
    setSchedulingErrors([]);
    setPriorityInput(app.priority || 'Baixa');
    setStatusInput(app.status || 'Pendente');
    setIsSettingFollowUp(false);
  };

  const filteredAppointments = filterAppointments(
    appointments,
    searchQuery,
    selectedCityId,
    selectedSpecialtyId,
    statusFilter,
    showColdStorage,
    cities,
    startDateFilter,
    endDateFilter
  );

  const sortedAppointments = sortAppointments(
    filteredAppointments,
    sortKey,
    sortOrder
  );

  const totalPages = Math.ceil(sortedAppointments.length / ITEMS_PER_PAGE);
  const paginatedAppointments = sortedAppointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return {
    appointments,
    setAppointments,
    isInitialLoading,
    currentPage,
    setCurrentPage,
    ITEMS_PER_PAGE,
    batchConfirmModal,
    setBatchConfirmModal,
    auditLogs,
    isAlertsOpen,
    setIsAlertsOpen,
    schedulingErrors,
    showOverrideModal,
    setShowOverrideModal,
    overrideReasonInput,
    setOverrideReasonInput,
    cities,
    specialties,
    capacityLimits,
    searchQuery,
    setSearchQuery,
    selectedCityId,
    setSelectedCityId,
    selectedSpecialtyId,
    setSelectedSpecialtyId,
    statusFilter,
    setStatusFilter,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    showColdStorage,
    setShowColdStorage,
    savedFilters,
    filterNameInput,
    setFilterNameInput,
    isSavingFilter,
    setIsSavingFilter,
    sortKey,
    setSortKey,
    sortOrder,
    setSortOrder,
    selectedApps,
    setSelectedApps,
    activeApp,
    setActiveApp,
    isActiveAppOfferActive,
    isScheduling,
    setIsScheduling: handleSetIsScheduling,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    scheduleRoom,
    setScheduleRoom,
    scheduleDoctor,
    setScheduleDoctor,
    actionError,
    setActionError,
    actionSuccess,
    setActionSuccess,
    scheduleSuccess,
    newNoteText,
    setNewNoteText,
    newNoteIsUrgent,
    setNewNoteIsUrgent,
    isSettingFollowUp,
    setIsSettingFollowUp,
    followUpDateInput,
    setFollowUpDateInput,
    followUpIsSuspended,
    setFollowUpIsSuspended,
    followUpReason,
    setFollowUpReason,
    isScannerOpen,
    setIsScannerOpen,
    patientSymptomLogs,
    verifyingSignatureApp,
    setVerifyingSignatureApp,
    isClosing,
    handleCloseTriagem,
    handleSort,
    loadData,
    hasMailBounce,
    getRemainingTime,
    examRequiresEncaminhamento,
    handleSelectAll,
    handleSelectOne,
    handleRegisterCheckIn,
    handleLoteStatusChange,
    handleLoteStatusConfirm,
    handleSaveTriagemChanges,
    handleCallOnTv,
    handleConfirmSchedule,
    handleConfirmOverride,
    handleFollowUpSubmit,
    handleAddNote,
    openTriagemPanel,
    filteredAppointments,
    sortedAppointments,
    totalPages,
    paginatedAppointments,
    mockNotification,
    setMockNotification,
    priorityInput,
    setPriorityInput,
    statusInput,
    setStatusInput,
    handleSaveFilter,
    handleApplySavedFilter,
    handleDeleteSavedFilter,
    patientManchesterAlerts,
    handleQuickPrioritizeHigh,
  };
}
