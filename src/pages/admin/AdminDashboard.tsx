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
  getCapacityLimits,
  getClinicalRecords,
  updateAppointment,
  addAuditLogAdmin,
  getSymptomLogs,
  getEmailQueue,
  saveFilterCombination,
  getSavedFilters,
  deleteSavedFilter,
  checkAndProcessExpiredOffers,
  syncAppointmentWithPep,
  registerPatientCheckIn,
  registerAttendanceStart,
  signAppointmentLaudo
} from '../../services/db';
import type { Appointment, City, Specialty, PatientUser, CapacityLimit, AppointmentStatus, SymptomLog } from '../../types';
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  Search, 
  Filter,
  FileText,
  Tv
} from 'lucide-react';
import { dispatchLobbyCall } from '../../services/lobbyChannel';

const GRAVE_KEYWORDS = ['febre', 'falta de ar', 'dispneia', 'dor forte', 'dor intensa', 'sangramento', 'convulsão'];

const isSymptomGrave = (symptom: string) => {
  return GRAVE_KEYWORDS.some(kw => symptom.toLowerCase().includes(kw));
};

interface AdminDashboardProps {
  loggedEmployee: PatientUser;
  permissions: string[];
}

export default function AdminDashboard({ loggedEmployee, permissions }: AdminDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      checkAndProcessExpiredOffers().then(() => {
        getAppointmentsForAdmin().then(setAppointments).catch(console.error);
      });
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
  const [isClosing, setIsClosing] = useState(false);

  const [hasClinicalRecords, setHasClinicalRecords] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [patientSymptomLogs, setPatientSymptomLogs] = useState<SymptomLog[]>([]);
  const [scannedCode, setScannedCode] = useState('');
  const [scannedApp, setScannedApp] = useState<Appointment | null>(null);
  const [scannerError, setScannerError] = useState('');
  const [scannerSuccess, setScannerSuccess] = useState('');

  const [doctorNameInput, setDoctorNameInput] = useState(loggedEmployee?.name || '');
  const [doctorCpfInput, setDoctorCpfInput] = useState(loggedEmployee?.cpf || '123.456.789-00');
  const [verifyingSignatureApp, setVerifyingSignatureApp] = useState<Appointment | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isSyncingPep, setIsSyncingPep] = useState(false);

  const refreshActiveApp = async (appId: string) => {
    await loadData();
    const updatedApps = await getAppointmentsForAdmin();
    const found = updatedApps.find(a => a.id === appId);
    if (found) {
      setActiveApp(found);
    }
  };

  const handleSyncPep = async (appId: string) => {
    setIsSyncingPep(true);
    setActionError('');
    setActionSuccess('');
    try {
      await syncAppointmentWithPep(appId);
      setActionSuccess('Tentativa de sincronização com o PEP concluída.');
      await refreshActiveApp(appId);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao sincronizar com o PEP.');
    } finally {
      setIsSyncingPep(false);
    }
  };

  const handleStartAttendance = async (appId: string) => {
    setActionError('');
    setActionSuccess('');
    try {
      await registerAttendanceStart(appId);
      setActionSuccess('Atendimento clínico iniciado com sucesso!');
      await refreshActiveApp(appId);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao iniciar atendimento clínico.');
    }
  };

  const handleSignLaudo = async (appId: string) => {
    if (!doctorNameInput.trim() || !doctorCpfInput.trim()) {
      setActionError('Por favor, preencha o nome e o CPF do médico para assinar.');
      return;
    }
    setIsSigning(true);
    setActionError('');
    setActionSuccess('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      await signAppointmentLaudo(appId, doctorNameInput, doctorCpfInput);
      setActionSuccess('Laudo assinado digitalmente com sucesso (ICP-Brasil)!');
      await refreshActiveApp(appId);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao assinar o laudo digitalmente.');
    } finally {
      setIsSigning(false);
    }
  };

  const handleCloseTriagem = () => {
    setIsClosing(true);
    setTimeout(() => {
      setActiveApp(null);
      setIsClosing(false);
      setIsScheduling(false);
    }, 300);
  };

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

  const renderAdminSymptomChart = () => {
    const chartLogs = patientSymptomLogs.slice(-7);
    if (chartLogs.length === 0) return null;

    const width = 360;
    const height = 130;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const pointsCount = chartLogs.length;
    const getX = (index: number) => {
      if (pointsCount <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + (index / (pointsCount - 1)) * chartWidth;
    };

    const getMoodValue = (moodName: string): number => {
      const vals: Record<string, number> = { 'Péssimo': 1, 'Ruim': 2, 'Razoável': 3, 'Bem': 4, 'Ótimo': 5 };
      return vals[moodName] || 3;
    };

    const getY = (val: number) => {
      return paddingTop + chartHeight - ((val - 1) / 4) * chartHeight;
    };

    const pointCoords = chartLogs.map((log, idx) => ({
      x: getX(idx),
      y: getY(getMoodValue(log.mood)),
      log,
    }));

    let pathD = '';
    let areaD = '';

    if (pointCoords.length > 0) {
      pathD = `M ${pointCoords[0].x} ${pointCoords[0].y}`;
      areaD = `M ${pointCoords[0].x} ${paddingTop + chartHeight} L ${pointCoords[0].x} ${pointCoords[0].y}`;

      for (let i = 1; i < pointCoords.length; i++) {
        pathD += ` L ${pointCoords[i].x} ${pointCoords[i].y}`;
        areaD += ` L ${pointCoords[i].x} ${pointCoords[i].y}`;
      }

      areaD += ` L ${pointCoords[pointCoords.length - 1].x} ${paddingTop + chartHeight} Z`;
    }

    const emojis: Record<string, string> = { 'Péssimo': '😠', 'Ruim': '🙁', 'Razoável': '😐', 'Bem': '🙂', 'Ótimo': '😀' };

    return (
      <div className="relative bg-white dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-sm">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="adminChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e31463" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#e31463" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[1, 2, 3, 4, 5].map((val) => (
            <line
              key={val}
              x1={paddingLeft}
              y1={getY(val)}
              x2={width - paddingRight}
              y2={getY(val)}
              className="stroke-zinc-100 dark:stroke-zinc-850"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          ))}

          {Object.entries(emojis).map(([, emoji], idx) => {
            const val = idx + 1;
            return (
              <text
                key={val}
                x={paddingLeft - 8}
                y={getY(val) + 3}
                textAnchor="end"
                className="fill-zinc-400 dark:fill-zinc-500 font-bold text-[8px]"
              >
                {emoji}
              </text>
            );
          })}

          {pointCoords.length > 0 && (
            <>
              <path d={areaD} fill="url(#adminChartGradient)" />
              <path d={pathD} fill="none" stroke="#e31463" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {pointCoords.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                className="fill-white stroke-brand-pink stroke-2"
              />
              <text
                x={pt.x}
                y={height - 5}
                textAnchor="middle"
                className="fill-zinc-400 dark:fill-zinc-500 font-bold text-[7px]"
              >
                {new Date(pt.log.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

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

  const handleCallOnTv = async () => {
    if (!activeApp) return;

    const firstName = activeApp.patientName.split(' ')[0];
    const lastNameParts = activeApp.patientName.split(' ');
    const lastInitial = lastNameParts.length > 1 ? ' ' + lastNameParts[lastNameParts.length - 1][0] + '.' : '';
    const maskedName = firstName + lastInitial;

    const callTicket = 'S-' + Math.floor(100 + Math.random() * 900);
    const callDestination = activeApp.scheduledRoom || 'Consultório 1';

    dispatchLobbyCall(maskedName, callDestination, callTicket);

    try {
      await addAuditLogAdmin(
        'CHAMAR_PACIENTE_TV',
        'Fila e Recepção',
        `Paciente ${maskedName} chamado para ${callDestination} na TV com a senha ${callTicket}`,
        loggedEmployee.cpf,
        loggedEmployee.name
      );
      setActionSuccess(`Chamado enviado para a TV: Senha ${callTicket}.`);
    } catch (e) {
      console.error(e);
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

    getClinicalRecords(app.patientCpf).then((records) => {
      setHasClinicalRecords(records && records.length > 0);
    }).catch((err) => {
      console.error(err);
      setHasClinicalRecords(false);
    });
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
    <>
      <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">Painel de Triagem</h1>
          <p className="text-zinc-500 mt-1 text-sm">Fila de triagem clínica de solicitações de exames.</p>
        </div>
        <button
          onClick={() => {
            setIsScannerOpen(true);
            setScannedCode('');
            setScannedApp(null);
            setScannerError('');
            setScannerSuccess('');
          }}
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
        >
          <span>🎫 Recepção - Check-in Rápido</span>
        </button>
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

      {(() => {
        const realocationOffers = appointments.filter(
          (app) => app.waitingListOfferExpiresAt && new Date(app.waitingListOfferExpiresAt) > new Date()
        );
        if (realocationOffers.length === 0) return null;
        return (
          <div className="bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <Clock className="w-5 h-5 text-pink-650 animate-pulse" />
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Vagas em Realocação Inteligente (RF44)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {realocationOffers.map((offer) => {
                const timerStr = getRemainingTime(offer.waitingListOfferExpiresAt!);
                return (
                  <div key={offer.id} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-xs gap-4 shadow-sm animate-in fade-in">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-150">{offer.patientName}</span>
                        <span className="font-mono bg-zinc-100 dark:bg-zinc-850 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-500">{offer.protocol}</span>
                      </div>
                      <p className="text-zinc-500 font-semibold">{offer.examName} • {offer.city}</p>
                      <p className="text-[10px] text-zinc-400 font-medium">
                        Ofertado em: {offer.waitingListOfferDate ? new Date(offer.waitingListOfferDate).toLocaleTimeString('pt-BR') : ''} • Data da Vaga: {offer.rescheduledDate ? new Date(offer.rescheduledDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''} às {offer.rescheduledTime}h
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Tempo Restante</span>
                      <span className="font-mono text-base font-black text-pink-600 bg-pink-50 dark:bg-pink-955/20 px-3 py-1 rounded-xl border border-pink-200/30">
                        {timerStr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <option value="Aguardando Follow-up">Aguardando Acompanhamento</option>
            </select>
          </div>

          <div className="relative flex items-center">
            <Filter className="absolute left-3.5 w-4 h-4 text-zinc-450" />
            <select
              value={sortKey}
              onChange={(e) => {
                const newKey = e.target.value;
                setSortKey(newKey);
                localStorage.setItem('hospital_amor_admin_sort', JSON.stringify({ key: newKey, order: sortOrder }));
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 appearance-none cursor-pointer"
            >
              <option value="fila_priorizada">Fila Priorizada (Padrão)</option>
              <option value="protocol">Protocolo</option>
              <option value="patientName">Paciente</option>
              <option value="city">Cidade</option>
              <option value="changedAt">Última alteração de status</option>
              <option value="assignedTo">Operador responsável</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Período de Atendimento (Início)</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Período de Atendimento (Fim)</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
            />
          </div>
          <div className="flex items-center gap-2 mt-5">
            <input
              type="checkbox"
              id="coldStorageCheck"
              checked={showColdStorage}
              onChange={(e) => setShowColdStorage(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-350 text-pink-600 focus:ring-pink-500 dark:border-zinc-800 dark:bg-zinc-950"
            />
            <label htmlFor="coldStorageCheck" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              Exibir Histórico Antigo (+2 anos)
            </label>
          </div>
          <div className="flex items-end justify-end">
            {!isSavingFilter ? (
              <button
                onClick={() => setIsSavingFilter(true)}
                className="w-full md:w-auto px-4 py-2 border border-pink-500 text-pink-600 dark:border-pink-400 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-955/15 text-xs font-bold rounded-xl transition-all"
              >
                💾 Salvar Filtro Atual
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  placeholder="Nome do filtro..."
                  value={filterNameInput}
                  onChange={(e) => setFilterNameInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                />
                <button
                  onClick={handleSaveFilter}
                  disabled={!filterNameInput.trim()}
                  className="px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setIsSavingFilter(false);
                    setFilterNameInput('');
                  }}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 text-xs font-bold rounded-xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-950"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {savedFilters.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Filtros Salvos:</span>
            {savedFilters.map((f) => (
              <div
                key={f.id}
                onClick={() => handleApplySavedFilter(f.filterState)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-250 border border-zinc-200 dark:border-zinc-800 hover:bg-pink-50 dark:hover:bg-pink-955/15 transition-all cursor-pointer"
              >
                <span>{f.name}</span>
                <button
                  onClick={(e) => handleDeleteSavedFilter(f.id, e)}
                  className="text-zinc-400 hover:text-red-500 font-extrabold ml-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

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

        {selectedApps.length > 0 && permissions.includes('confirm_appointments') && (
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
                className="flex-1 sm:flex-none h-9 px-4 rounded-xl text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-xs"
              >
                Cancelar Agendamentos
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold px-1 py-2">
          <span>
            Exibindo <strong className="text-zinc-800 dark:text-zinc-200">{filteredAppointments.length}</strong> de <strong className="text-zinc-800 dark:text-zinc-200">{appointments.length}</strong> solicitações na fila.
          </span>
        </div>

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

                  const isOfferActive = !!(app.waitingListOfferExpiresAt && new Date(app.waitingListOfferExpiresAt) > new Date() && (app.status === 'Pendente' || app.status === 'Em análise'));
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
                          disabled={isOfferActive}
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
                          {isOfferActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-pink-100 text-pink-700 dark:bg-pink-955/20 dark:text-pink-400 border border-pink-200/20 animate-pulse block w-max">
                              ⚡ Oferta Ativa: {getRemainingTime(app.waitingListOfferExpiresAt!)}
                            </span>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOverdue 
                                ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-955/20 dark:text-red-400 border animate-pulse'
                                : app.status === 'Confirmado' ? 'bg-green-50 text-green-700 dark:bg-green-955/20 dark:text-green-400 border border-green-200/20' :
                                app.status === 'Cancelado' ? 'bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400 border border-red-200/20' :
                                app.status === 'Em análise' ? 'bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400 border border-blue-200/20' :
                                app.status === 'Reagendamento Pendente' ? 'bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-200/20' :
                                app.status === 'Aguardando Follow-up' ? 'bg-purple-50 text-purple-700 dark:bg-purple-955/20 dark:text-purple-400 border border-purple-200/20' :
                                'bg-yellow-50 text-yellow-700 dark:bg-yellow-955/20 dark:text-yellow-400 border border-yellow-200/20'
                            }`}>
                              {isOverdue ? 'Aguardando Acompanhamento (Vencido)' : app.status === 'Aguardando Follow-up' ? 'Aguardando Acompanhamento' : app.status}
                            </span>
                          )}
                          {hasMailBounce(app) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-955/20 dark:text-red-400 border border-red-200/20 animate-pulse block w-max">
                              ⚠️ Falha de Envio (E-mail)
                            </span>
                          )}
                          {app.status === 'Aguardando Follow-up' && (
                            <div className="text-[9px] font-bold tracking-tight block">
                              {app.followUpSuspended ? (
                                <span className="text-zinc-400">⏸️ Acompanhamento Suspenso</span>
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
                          examRequiresEncaminhamento(app.examId) ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-650 bg-red-50 dark:bg-red-955/20 px-2 py-0.5 rounded-md border border-red-200/20">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Falta Anexo!
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-200/20">
                              Não exigido
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-semibold">OK</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {app.status === 'Confirmado' && !app.checkInAt && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await registerPatientCheckIn(app.id);
                                  const updated = await getAppointmentsForAdmin();
                                  setAppointments(updated);
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-955/10 font-bold transition-all bg-white dark:bg-zinc-950 text-emerald-700 dark:text-emerald-400 text-[10px]"
                              title="Registrar check-in do paciente"
                            >
                              ✓ Check-in
                            </button>
                          )}
                          <button
                            onClick={() => openTriagemPanel(app)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-650 dark:hover:bg-pink-955/10 font-bold transition-all bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Triar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      </div>

      {activeApp && (
        <div 
          onClick={handleCloseTriagem}
          className={`fixed inset-0 bg-black/45 z-50 flex justify-end animate-in fade-in ${
            isClosing ? 'animate-out fade-out duration-300' : ''
          }`}
          style={isClosing ? { animationFillMode: 'forwards' } : undefined}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-xl bg-white dark:bg-zinc-900 h-full flex flex-col shadow-2xl border-l border-zinc-250 dark:border-zinc-800 animate-in slide-in-from-right duration-300 ${
              isClosing ? 'animate-out slide-out-to-right' : ''
            }`}
            style={isClosing ? { animationFillMode: 'forwards' } : undefined}
          >
            <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-zinc-955 dark:text-zinc-50">Ficha de Triagem</h3>
                <span className="text-[10px] font-mono text-zinc-400 font-bold block mt-1">{activeApp.protocol}</span>
              </div>
              <button
                onClick={handleCloseTriagem}
                className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-500"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isActiveAppOfferActive && (
                <div className="p-4 bg-pink-50 dark:bg-pink-955/15 border border-pink-200/40 dark:border-pink-900/20 text-pink-850 dark:text-pink-400 rounded-2xl flex flex-col gap-1.5 animate-in slide-in-from-top-3">
                  <div className="flex items-center gap-2 font-black text-xs text-pink-700 dark:text-pink-400">
                    <AlertCircle className="w-4 h-4 shrink-0 text-pink-650" />
                    <span>Fila Inteligente: Oferta de Vaga Ativa</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Esta solicitação possui uma oferta de vaga automática ativa. As ações manuais de triagem, alteração de status e agendamento estão bloqueadas até o desfecho da oferta (aceite, recusa ou expiração do prazo).
                  </p>
                </div>
              )}
              {hasMailBounce(activeApp) && (
                <div className="p-4 bg-red-50 dark:bg-red-955/20 border border-red-205/50 dark:border-red-900/30 text-red-800 dark:text-red-400 rounded-2xl flex flex-col gap-2 animate-in slide-in-from-top-3">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-650" />
                    <span>Falha de Comunicação: E-mail não entregue (Bounce)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    A última tentativa de envio de notificação por e-mail para este paciente falhou. 
                    <strong> Por favor, entre em contato via telefone ou WhatsApp para prosseguir com a triagem.</strong>
                  </p>
                  <div className="flex flex-col gap-1 text-[11px] bg-red-100/50 dark:bg-red-955/40 p-2.5 rounded-xl mt-1">
                    <div><strong>Telefone do Paciente:</strong> {activeApp.patientPhone || 'Não cadastrado'}</div>
                  </div>
                </div>
              )}
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

              {hasClinicalRecords && (
                <div className="bg-red-50 border border-red-200/50 p-4 rounded-2xl text-xs space-y-2 dark:bg-red-955/10 dark:border-red-900/30 animate-pulse">
                  <h4 className="font-extrabold text-red-800 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    ⚠️ Documentos Clínicos Externos
                  </h4>
                  <p className="text-red-700 dark:text-red-300">
                    Atenção: Este paciente possui documentos clínicos externos anexados ao seu prontuário. Por favor, revise-os.
                  </p>
                </div>
              )}

              {patientSymptomLogs.some(log => log.symptoms.some(isSymptomGrave)) && (
                <div className="bg-red-50 border border-red-250 p-4 rounded-2xl text-xs space-y-2 dark:bg-red-955/10 dark:border-red-900/30 animate-pulse">
                  <h4 className="font-extrabold text-red-800 dark:text-red-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    ⚠️ Alerta: Sintomas Graves Reportados
                  </h4>
                  <p className="text-red-750 dark:text-red-300 font-semibold leading-relaxed">
                    Este paciente registrou sintomas graves (como Febre) em seu diário de saúde recentemente. Por favor, avalie a triagem com prioridade clínica adequada.
                  </p>
                </div>
              )}

              {activeApp.checkInAt ? (
                <div className="bg-zinc-50 dark:bg-zinc-955 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-850 space-y-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Fluxo da Recepção & Espera</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-550 dark:text-zinc-400 font-semibold">Horário de Check-in:</span>
                      <span className="font-bold text-zinc-855 dark:text-zinc-200">
                        {new Date(activeApp.checkInAt).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    {activeApp.attendanceStartedAt ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-zinc-550 dark:text-zinc-400 font-semibold">Início do Atendimento:</span>
                          <span className="font-bold text-zinc-855 dark:text-zinc-200">
                            {new Date(activeApp.attendanceStartedAt).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-850 pt-2 mt-2">
                          <span className="text-zinc-550 dark:text-zinc-400 font-semibold">Tempo Total de Espera:</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {Math.max(0, Math.floor((new Date(activeApp.attendanceStartedAt).getTime() - new Date(activeApp.checkInAt).getTime()) / 60000))} min
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-550 dark:text-zinc-400 font-semibold">Tempo de Espera Atual:</span>
                          {(() => {
                            const elapsedMs = new Date().getTime() - new Date(activeApp.checkInAt).getTime();
                            const elapsedMin = Math.floor(elapsedMs / 60000);
                            const isCritical = elapsedMin > 30;
                            return (
                              <span className={`px-2 py-0.5 rounded-md font-extrabold text-xs ${
                                isCritical 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-955/40 dark:text-red-400 border border-red-200 dark:border-red-900/50 animate-pulse' 
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-200/20'
                              }`}>
                                {elapsedMin} min {isCritical && '⚠️ (Atraso Crítico)'}
                              </span>
                            );
                          })()}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartAttendance(activeApp.id)}
                          className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/15"
                        >
                          Iniciar Atendimento Médico
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                activeApp.status === 'Confirmado' && (
                  <div className="bg-zinc-50 dark:bg-zinc-955 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-850 space-y-3">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Fluxo da Recepção</h4>
                    <p className="text-zinc-400 text-xs italic">Paciente confirmado, aguardando dar entrada na recepção.</p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await registerPatientCheckIn(activeApp.id);
                          await refreshActiveApp(activeApp.id);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/15"
                    >
                      Registrar Entrada (Check-in)
                    </button>
                  </div>
                )
              )}

              {(activeApp.status === 'Confirmado' || activeApp.status === 'Concluído') && (
                <div className="bg-zinc-50 dark:bg-zinc-955 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-850 space-y-3">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Integração com Prontuário Eletrônico (PEP)</h4>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500 font-semibold">Status de Envio:</span>
                      {activeApp.pepSyncStatus === 'synchronized' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-green-50 text-green-700 dark:bg-green-955/20 dark:text-green-400 border border-green-200/20">
                          Sincronizado
                        </span>
                      ) : activeApp.pepSyncStatus === 'failed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 dark:bg-red-955/20 dark:text-red-400 border border-red-200/20 animate-pulse">
                          Falhou ({activeApp.pepSyncAttempts || 0} tentativas)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-955/20 dark:text-amber-400 border border-amber-200/20 animate-pulse">
                          Pendente
                        </span>
                      )}
                    </div>
                    {activeApp.pepRegistryId && (
                      <div className="flex justify-between text-xs border-t border-zinc-200 dark:border-zinc-850 pt-2">
                        <span className="text-zinc-500 font-semibold">ID do Registro PEP:</span>
                        <span className="font-mono font-bold text-zinc-800 dark:text-zinc-250">{activeApp.pepRegistryId}</span>
                      </div>
                    )}
                    {activeApp.pepSyncStatus !== 'synchronized' && (
                      <button
                        type="button"
                        onClick={() => handleSyncPep(activeApp.id)}
                        disabled={isSyncingPep}
                        className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-55 flex items-center justify-center gap-2"
                      >
                        {isSyncingPep ? (
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : activeApp.pepSyncStatus === 'failed' ? (
                          'Reenviar para PEP'
                        ) : (
                          'Sincronizar PEP Manualmente'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeApp.status === 'Concluído' && (
                <div className="bg-zinc-50 dark:bg-zinc-955 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-850 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Assinatura Digital de Laudo</h4>
                  {activeApp.digitalSignature ? (
                    <div className="relative p-4 rounded-2xl border border-amber-300 dark:border-amber-800/40 bg-amber-50/15 dark:bg-amber-955/5 overflow-hidden flex flex-col md:flex-row gap-4 items-center">
                      <div className="flex-1 space-y-1.5 text-xs">
                        <div className="text-amber-800 dark:text-amber-400 font-black flex items-center gap-1 uppercase tracking-wider text-[10px]">
                          🛡️ Laudo Assinado Digitalmente
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                          Este laudo de triagem foi criptografado e validado juridicamente via ICP-Brasil.
                        </p>
                        <div className="space-y-1 border-t border-zinc-200 dark:border-zinc-850 pt-2 text-[10px]">
                          <div><strong>Assinado por:</strong> {activeApp.digitalSignature.signedBy}</div>
                          <div><strong>CPF:</strong> {activeApp.digitalSignature.cpf}</div>
                          <div><strong>Data/Hora:</strong> {new Date(activeApp.digitalSignature.signedAt).toLocaleString('pt-BR')}</div>
                          <div><strong>Certificado Série:</strong> {activeApp.digitalSignature.certificateSerial}</div>
                          <div className="truncate font-mono block text-[9px] text-zinc-400 max-w-full">
                            <strong>SHA-256:</strong> {activeApp.digitalSignature.signatureHash}
                          </div>
                        </div>
                      </div>
                      <div 
                        onClick={() => setVerifyingSignatureApp(activeApp)}
                        className="cursor-pointer bg-white p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850 flex flex-col items-center justify-center gap-1 hover:border-amber-500 transition-all select-none group shrink-0"
                        title="Clique para validar a assinatura digital"
                      >
                        <svg className="w-16 h-16 text-zinc-800 dark:text-zinc-200 group-hover:scale-105 transition-transform" viewBox="0 0 100 100">
                          <rect x="10" y="10" width="16" height="16" fill="currentColor" />
                          <rect x="34" y="10" width="8" height="8" fill="currentColor" />
                          <rect x="50" y="10" width="16" height="16" fill="currentColor" />
                          <rect x="74" y="10" width="16" height="16" fill="currentColor" />
                          <rect x="10" y="34" width="8" height="8" fill="currentColor" />
                          <rect x="26" y="34" width="16" height="16" fill="currentColor" />
                          <rect x="50" y="34" width="8" height="8" fill="currentColor" />
                          <rect x="66" y="34" width="16" height="16" fill="currentColor" />
                          <rect x="10" y="50" width="16" height="16" fill="currentColor" />
                          <rect x="34" y="50" width="8" height="8" fill="currentColor" />
                          <rect x="50" y="50" width="16" height="16" fill="currentColor" />
                          <rect x="74" y="50" width="16" height="16" fill="currentColor" />
                          <rect x="10" y="74" width="16" height="16" fill="currentColor" />
                          <rect x="34" y="74" width="16" height="16" fill="currentColor" />
                          <rect x="58" y="74" width="8" height="8" fill="currentColor" />
                          <rect x="74" y="74" width="16" height="16" fill="currentColor" />
                          <rect x="42" y="42" width="16" height="16" fill="currentColor" />
                        </svg>
                        <span className="text-[8px] font-bold text-zinc-400 group-hover:text-amber-600 transition-colors uppercase">Validar Selo</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl space-y-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] text-zinc-455 block uppercase font-bold mb-1">Médico Responsável</label>
                          <input
                            type="text"
                            value={doctorNameInput}
                            onChange={(e) => setDoctorNameInput(e.target.value)}
                            placeholder="Dr(a). Nome do Médico"
                            className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-455 block uppercase font-bold mb-1">e-CPF (ICP-Brasil)</label>
                          <input
                            type="text"
                            value={doctorCpfInput}
                            onChange={(e) => setDoctorCpfInput(e.target.value)}
                            placeholder="000.000.000-00"
                            className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSignLaudo(activeApp.id)}
                        disabled={isSigning}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/15 disabled:opacity-55 flex items-center justify-center gap-2"
                      >
                        {isSigning ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Assinando com e-CPF...</span>
                          </>
                        ) : (
                          'Assinar Laudo com e-CPF'
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-zinc-50 dark:bg-zinc-955 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-855 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Log de Comunicação de Lembretes</h4>
                {!activeApp.documentReminders || activeApp.documentReminders.length === 0 ? (
                  <p className="text-zinc-400 text-xs italic">Nenhum lembrete enviado para este agendamento.</p>
                ) : (
                  <div className="space-y-2">
                    {activeApp.documentReminders.map((reminder, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-zinc-100 dark:border-zinc-800 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">Lembrete #{reminder.count}</span>
                        <span className="text-zinc-500 font-mono text-[10px]">{new Date(reminder.sentAt).toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {patientSymptomLogs.length > 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-955 p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-850 space-y-4">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400">Evolução do Diário de Saúde (7 Dias)</h4>
                  {renderAdminSymptomChart()}
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-400 font-bold block uppercase">Sintomas Recentes do Paciente:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(patientSymptomLogs.flatMap(l => l.symptoms))).slice(0, 8).map(sym => (
                        <span key={sym} className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold ${isSymptomGrave(sym) ? 'bg-red-100 text-red-750 dark:bg-red-950/30 dark:text-red-400' : 'bg-secondary/10 text-secondary'}`}>
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
                    <Calendar className="w-4 h-4 text-pink-600" />
                    {activeApp.rescheduledDate ? new Date(activeApp.rescheduledDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''} às {activeApp.rescheduledTime}h
                  </p>
                  {activeApp.rescheduleReason && (
                    <p className="text-zinc-700 dark:text-zinc-300 mt-2 bg-white dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-850 italic">
                      <strong>Motivo informado:</strong> "{activeApp.rescheduleReason}"
                    </p>
                  )}
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
                  examRequiresEncaminhamento(activeApp.examId) ? (
                    <div className="p-6 border border-dashed border-red-300 bg-red-50/10 dark:border-red-900/50 dark:bg-red-955/5 rounded-2xl text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                      <h5 className="font-bold text-red-800 dark:text-red-400 text-xs">Documento Ausente</h5>
                      <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">
                        O paciente não anexou o documento de encaminhamento médico para esta solicitação.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-zinc-350 bg-zinc-50/10 dark:border-zinc-800 dark:bg-zinc-950/5 rounded-2xl text-center space-y-2">
                      <CheckCircle className="w-8 h-8 text-zinc-450 mx-auto" />
                      <h5 className="font-bold text-zinc-650 dark:text-zinc-350 text-xs">Anexo Opcional</h5>
                      <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">
                        Este procedimento não exige documento de encaminhamento médico obrigatório.
                      </p>
                    </div>
                  )
                )}
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
                      disabled={!!activeApp.digitalSignature || isActiveAppOfferActive}
                      placeholder="(00) 00000-0000"
                      className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 disabled:opacity-55"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-email" className="text-[10px] text-zinc-455 block uppercase font-bold mb-1">Novo E-mail</label>
                    <input
                      id="edit-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      disabled={!!activeApp.digitalSignature || isActiveAppOfferActive}
                      placeholder="paciente@email.com"
                      className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 disabled:opacity-55"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveContacts}
                    disabled={!!activeApp.digitalSignature || isActiveAppOfferActive}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-55"
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
                      disabled={!!activeApp.digitalSignature || isActiveAppOfferActive}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-55"
                    >
                      <span>💬 Testar via WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMockValidation('SMS')}
                      disabled={!!activeApp.digitalSignature || isActiveAppOfferActive}
                      className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-55"
                    >
                      <span>📱 Testar via SMS</span>
                    </button>
                  </div>
                </div>
              </div>

              {!isSettingFollowUp && !isScheduling ? (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Status da Solicitação</label>
                    <div className="flex gap-2">
                      {(['Pendente', 'Em análise', 'Cancelado'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={!!activeApp.digitalSignature || isActiveAppOfferActive}
                          onClick={() => setStatusInput(s)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                            statusInput === s
                              ? s === 'Cancelado'
                                ? 'bg-red-600 border-red-600 text-white shadow-xs'
                                : s === 'Em análise'
                                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                : 'bg-yellow-600 border-yellow-600 text-white shadow-xs'
                              : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-55'
                          }`}
                        >
                          {s === 'Em análise' ? 'Em Análise' : s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Grau de Prioridade da Solicitação</label>
                    <div className="flex gap-2">
                      {(['Baixa', 'Média', 'Alta'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          disabled={!!activeApp.digitalSignature || isActiveAppOfferActive}
                          onClick={() => setPriorityInput(p)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                            priorityInput === p
                              ? p === 'Alta'
                                ? 'bg-red-600 border-red-600 text-white shadow-xs'
                                : p === 'Média'
                                ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                                : 'bg-zinc-800 border-zinc-800 text-white shadow-xs'
                              : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-55'
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
                        disabled={!!activeApp.digitalSignature}
                        placeholder="Nova anotação clínica..."
                        rows={2}
                        className="w-full border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 disabled:opacity-55"
                        required
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs text-zinc-650 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={newNoteIsUrgent}
                            onChange={(e) => setNewNoteIsUrgent(e.target.checked)}
                            disabled={!!activeApp.digitalSignature}
                            className="rounded text-pink-600 focus:ring-pink-500 disabled:opacity-55"
                          />
                          Marcar como Urgente
                        </label>
                        <button
                          type="submit"
                          disabled={!!activeApp.digitalSignature}
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-55"
                        >
                          Registrar Nota
                        </button>
                      </div>
                    </form>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
                    {activeApp.status === 'Confirmado' && (
                      <button
                        onClick={handleCallOnTv}
                        disabled={!!activeApp.digitalSignature || isActiveAppOfferActive}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/15 disabled:opacity-50 flex items-center justify-center gap-2 mb-1"
                      >
                        <Tv className="w-4 h-4" />
                        Chamar na TV da Recepção
                      </button>
                    )}

                    <button
                      onClick={handleSaveTriagemChanges}
                      disabled={!!activeApp.digitalSignature || isActiveAppOfferActive}
                      className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-pink-600/15 disabled:opacity-50"
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
                        disabled={!!activeApp.digitalSignature || isActiveAppOfferActive}
                        className="h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                      >
                        Acompanhamento
                      </button>
                      {permissions.includes('confirm_appointments') && (
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
                          disabled={!!activeApp.digitalSignature || isActiveAppOfferActive}
                          className="h-10 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-pink-600/15 disabled:opacity-50"
                        >
                          Agendar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : isSettingFollowUp ? (
                <form onSubmit={handleFollowUpSubmit} className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-800 animate-in slide-in-from-bottom-2">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-650" />
                    Configurar Acompanhamento / Pendência
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
                          placeholder="Informe o motivo para pausar o acompanhamento deste paciente..."
                          className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
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
                      Confirmar Acompanhamento
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

      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setIsScannerOpen(false)}
              className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 rounded-full"
            >
              ✕
            </button>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              🎫 Recepção - Validação de QR Code
            </h3>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setScannerError('');
                setScannerSuccess('');
                if (!scannedCode.trim()) return;
                
                let protocol = '';
                let id = '';
                if (scannedCode.startsWith('HA-QR|')) {
                  const parts = scannedCode.split('|');
                  protocol = parts[1];
                  id = parts[2];
                } else {
                  protocol = scannedCode.trim();
                }
                
                const app = appointments.find(a => a.protocol === protocol || a.id === id || a.protocol === scannedCode.trim());
                if (!app) {
                  setScannerError('Código inválido: Nenhum agendamento encontrado para este QR Code.');
                  setScannedApp(null);
                  return;
                }
                
                if (app.status === 'Cancelado' || app.status === 'Arquivado por Documentação Pendente') {
                  setScannerError(`Código inválido: Esta solicitação está com status de ${app.status}.`);
                  setScannedApp(null);
                  return;
                }
                
                if (app.rescheduledDate) {
                  const appDateTime = new Date(`${app.rescheduledDate}T${app.rescheduledTime || '08:00'}:00`);
                  const now = new Date();
                  const diffMs = now.getTime() - appDateTime.getTime();
                  if (diffMs > 1 * 60 * 60 * 1000) {
                    setScannerError(`Código inválido: O horário do agendamento expirou há mais de 1 hora. (Agendado para: ${new Date(app.rescheduledDate + 'T12:00:00').toLocaleDateString('pt-BR')} às ${app.rescheduledTime}h).`);
                    setScannedApp(null);
                    return;
                  }
                }
                
                setScannedApp(app);
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label htmlFor="qr-code-input" className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Ler QR Code (Simulado)</label>
                <div className="flex gap-2">
                  <input
                    id="qr-code-input"
                    type="text"
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    placeholder="Digite a string do QR Code ou cole..."
                    className="flex-1 p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold text-xs rounded-xl transition-all"
                  >
                    Escanear
                  </button>
                </div>
              </div>
            </form>

            {scannerError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 text-red-850 dark:text-red-400 rounded-2xl text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{scannerError}</span>
              </div>
            )}

            {scannerSuccess && (
              <div className="p-3.5 bg-green-50 dark:bg-green-955/20 border border-green-200/30 dark:border-green-800/30 text-green-850 dark:text-green-400 rounded-2xl text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{scannerSuccess}</span>
              </div>
            )}

            {scannedApp && (
              <div className="bg-zinc-50 dark:bg-zinc-955 p-4 rounded-2xl border border-zinc-250/50 dark:border-zinc-850 space-y-3 text-xs animate-in slide-in-from-top-2">
                <div className="flex justify-between items-start border-b border-zinc-200/50 dark:border-zinc-800 pb-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Paciente</span>
                    <h4 className="font-extrabold text-zinc-900 dark:text-zinc-50">{scannedApp.patientName}</h4>
                  </div>
                  <span className="font-mono bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-650 dark:text-zinc-400">{scannedApp.protocol}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Procedimento</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{scannedApp.examName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Horário</span>
                    <span className="font-bold text-zinc-850 dark:text-zinc-150">
                      {scannedApp.rescheduledDate ? new Date(scannedApp.rescheduledDate + 'T12:00:00').toLocaleDateString('pt-BR') : ''} às {scannedApp.rescheduledTime}h
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-bold">Presença no Sistema:</span>
                    {scannedApp.presenceConfirmed ? (
                      <span className="text-green-600 font-extrabold bg-green-50 dark:bg-green-955/35 px-2 py-0.5 rounded border border-green-200/30">Confirmada</span>
                    ) : (
                      <span className="text-zinc-500 font-bold bg-zinc-150 dark:bg-zinc-800 px-2 py-0.5 rounded">Pendente</span>
                    )}
                  </div>
                </div>

                {!scannedApp.presenceConfirmed && (
                  <button
                    onClick={async () => {
                      try {
                        const updatedApp = {
                          ...scannedApp,
                          presenceConfirmed: true,
                          presenceConfirmedAt: new Date().toISOString()
                        };
                        await updateAppointment(updatedApp);
                        await addAuditLogAdmin(
                          `Confirmação de presença via QR Code (Recepção) - Protocolo ${scannedApp.protocol}`,
                          "Recepção",
                          `Presença de ${scannedApp.patientName} registrada na recepção física.`,
                          loggedEmployee.cpf,
                          loggedEmployee.name
                        );
                        
                        const allApps = appointments.map(a => a.id === scannedApp.id ? updatedApp : a);
                        setAppointments(allApps);
                        
                        setScannerSuccess('Presença confirmada com sucesso!');
                        setScannedApp(updatedApp);
                      } catch (e: any) {
                        setScannerError(e.message || 'Erro ao salvar confirmação de presença.');
                      }
                    }}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-green-600/10 active:scale-95"
                  >
                    Confirmar Presença na Recepção (1 Clique)
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Consultas Disponíveis para Check-in (Mocks)</span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                {appointments.filter(a => a.status === 'Confirmado').length === 0 ? (
                  <p className="text-zinc-400 italic">Nenhuma consulta confirmada disponível no momento.</p>
                ) : (
                  appointments.filter(a => a.status === 'Confirmado').map(app => (
                    <button
                      key={app.id}
                      onClick={() => {
                        setScannedCode(`HA-QR|${app.protocol}|${app.id}`);
                        setScannerError('');
                        setScannerSuccess('');
                        setScannedApp(app);
                      }}
                      className="w-full p-2.5 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-xl text-left flex justify-between items-center transition-all"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 block truncate">{app.patientName}</span>
                        <span className="text-zinc-500 font-mono text-[9px]">{app.protocol} | {app.examName}</span>
                      </div>
                      <span className="text-[9px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded font-black shrink-0">Simular QR</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {verifyingSignatureApp && verifyingSignatureApp.digitalSignature && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in animate-duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-150 dark:border-zinc-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-955/20 flex items-center justify-center text-emerald-650 shrink-0">
                🛡️
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 leading-tight">Portal de Validação de Assinaturas</h3>
                <span className="text-[10px] text-zinc-400 block font-semibold mt-0.5">ITI / ICP-Brasil Validador Simulado</span>
              </div>
              <button
                onClick={() => setVerifyingSignatureApp(null)}
                className="p-1.5 rounded-xl border border-zinc-250 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-955 text-zinc-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-955/10 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-2xl flex flex-col gap-1">
                <span className="font-extrabold text-xs uppercase tracking-wider">Assinatura VÁLIDA</span>
                <p className="text-[11px] leading-relaxed font-semibold">
                  O documento correspondente a este laudo de triagem está devidamente assinado, contendo hash criptográfico intacto e validado pela cadeia ICP-Brasil.
                </p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-955 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 text-xs space-y-3">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-850">
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Paciente</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{verifyingSignatureApp.patientName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">CPF do Paciente</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{verifyingSignatureApp.patientCpf}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Procedimento</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{verifyingSignatureApp.examName}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-850">
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Médico Assinante</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{verifyingSignatureApp.digitalSignature.signedBy}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">CPF do Médico</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{verifyingSignatureApp.digitalSignature.cpf}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Data da Assinatura</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{new Date(verifyingSignatureApp.digitalSignature.signedAt).toLocaleString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase font-bold">Série do Certificado</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{verifyingSignatureApp.digitalSignature.certificateSerial}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Hash SHA-256 de Integridade</span>
                  <span className="font-mono text-[9px] bg-zinc-100 dark:bg-zinc-950 p-2.5 rounded-xl block break-all text-zinc-650 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/80">
                    {verifyingSignatureApp.digitalSignature.signatureHash}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-450 pt-1">
                  <span>Algoritmo:</span>
                  <span className="font-bold text-zinc-600 dark:text-zinc-350">SHA-256 com RSA (2048 bits)</span>
                  <span className="mx-1">•</span>
                  <span>Cadeia:</span>
                  <span className="font-bold text-zinc-600 dark:text-zinc-350">AC VALID v5 / ICP-Brasil</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 flex justify-end">
              <button
                type="button"
                onClick={() => setVerifyingSignatureApp(null)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl text-xs font-bold transition-all"
              >
                Concluir Verificação
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
