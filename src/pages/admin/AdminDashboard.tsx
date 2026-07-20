import type { PatientUser } from '../../types';
import {
  AlertCircle,
  CheckCircle,
  QrCode,
  MessageSquare,
  Smartphone,
  X,
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
import { useAdminDashboard } from '../../components/admin/dashboard/useAdminDashboard';
import { getSlaStatus } from '../../components/admin/dashboard/dashboardHelpers';

interface AdminDashboardProps {
  loggedEmployee: PatientUser;
  permissions: string[];
}

export default function AdminDashboard({
  loggedEmployee,
  permissions,
}: AdminDashboardProps) {
  const {
    appointments,
    setAppointments,
    isInitialLoading,
    currentPage,
    setCurrentPage,
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
    selectedApps,
    setSelectedApps,
    activeApp,
    isActiveAppOfferActive,
    isScheduling,
    setIsScheduling,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    scheduleRoom,
    setScheduleRoom,
    scheduleDoctor,
    setScheduleDoctor,
    actionError,
    actionSuccess,
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
  } = useAdminDashboard({ loggedEmployee });

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

  const getSortIcon = (key: typeof sortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  const activeFilters: Array<{ id: string; label: string; clear: () => void }> = [];
  if (searchQuery) {
    activeFilters.push({
      id: 'search',
      label: `Busca: "${searchQuery}"`,
      clear: () => setSearchQuery(''),
    });
  }
  if (selectedCityId) {
    activeFilters.push({
      id: 'city',
      label: `Cidade: ${cities.find((c) => c.id === selectedCityId)?.name}`,
      clear: () => setSelectedCityId(''),
    });
  }
  if (selectedSpecialtyId) {
    activeFilters.push({
      id: 'specialty',
      label: `Especialidade: ${
        specialties.find((s) => s.id === selectedSpecialtyId)?.name
      }`,
      clear: () => setSelectedSpecialtyId(''),
    });
  }
  if (statusFilter !== 'Todos') {
    activeFilters.push({
      id: 'status',
      label: `Status: ${statusFilter}`,
      clear: () => setStatusFilter('Todos'),
    });
  }
  if (startDateFilter) {
    activeFilters.push({
      id: 'startDate',
      label: `Início: ${startDateFilter}`,
      clear: () => setStartDateFilter(''),
    });
  }
  if (endDateFilter) {
    activeFilters.push({
      id: 'endDate',
      label: `Fim: ${endDateFilter}`,
      clear: () => setEndDateFilter(''),
    });
  }
  if (showColdStorage) {
    activeFilters.push({
      id: 'coldStorage',
      label: `Exibindo Cold Storage`,
      clear: () => setShowColdStorage(false),
    });
  }

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedCityId('');
    setSelectedSpecialtyId('');
    setStatusFilter('Todos');
    setStartDateFilter('');
    setEndDateFilter('');
    setShowColdStorage(false);
  };

  return (
    <>
      <div className="space-y-8 animate-in fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight font-sans flex items-center gap-2">
              <span>Painel de Triagem</span>
              {activeFilters.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-100 text-pink-700 dark:bg-pink-955/40 dark:text-pink-400 border border-pink-200/20 animate-in zoom-in-50">
                  {activeFilters.length} {activeFilters.length === 1 ? 'filtro ativo' : 'filtros ativos'}
                </span>
              )}
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">
              Fila de triagem clínica de solicitações de exames.
            </p>
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

        <StatsCards appointments={appointments} isLoading={isInitialLoading} />

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
          filteredCount={filteredAppointments.length}
          totalCount={appointments.length}
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
          scheduleSuccess={scheduleSuccess}
        />
      )}

      {mockNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-zinc-900 text-zinc-100 rounded-3xl p-4 shadow-2xl border border-zinc-800 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-500">
              Simulador de Celular do Paciente
            </span>
            <button
              onClick={() => setMockNotification(null)}
              className="text-zinc-500 hover:text-zinc-350 text-xs flex items-center justify-center transition-transform hover:rotate-90 duration-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
              <span className="text-[10px] text-zinc-455 font-mono">
                {mockNotification.phone}
              </span>
            </div>
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-850 text-xs font-mono text-zinc-300">
              Hospital de Amor: Seu código de validação de triagem é{' '}
              <span className="text-pink-500 font-bold">
                {mockNotification.code}
              </span>
              . Por favor, confirme com o atendente.
            </div>
            <p className="text-[9px] text-zinc-500 text-center italic">
              Este painel simula o recebimento da mensagem no aparelho do
              paciente.
            </p>
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
