import { initDb } from './db/base';
import { computeSHA256, createAuditLog, getAuditLogs, addAuditLogAdmin } from './db/auditRepository';
import { getUserByCpf, createUser, updateUserPassword, authenticateUser, getLoginAttempts, recordLoginAttempt, clearLoginAttempts, updatePatientUser, getAllUsersForAdmin, deleteUserAdmin, updateUserAdmin, updateUserStatusAdmin, getCustomRoles, saveCustomRole, deleteCustomRole, getEmployeePermissions, DEFAULT_ROLE_PERMISSIONS } from './db/authRepository';
import { createDonation, updateDonation, getDonationsByCpf, getDonorPoints, addDonorPoints, redeemDonorBadge, triggerDonorPrestige, saveSupportMessage, getSupportMessages, createRecurringSubscription, getRecurringSubscriptionsByCpf, updateRecurringSubscription, deleteRecurringSubscription, getTransparencyData, saveTransparencyData } from './db/transparencyRepository';
import { getSpecialties, createSpecialty, createExam, setMailBounced, triggerStatusUpdateEmail, getCities, checkDuplicateRequest, triggerConfirmationEmail, createAppointment, getAppointmentByProtocol, getAppointmentByCpf, updateAppointment, addSymptomLog, getSymptomLogs, saveAppointmentDraft, getAppointmentDraft, deleteAppointmentDraft, addClinicalRecord, getClinicalRecords, deleteClinicalRecord, getAppointmentsForAdmin, updateAppointmentStatus, confirmAppointmentSchedule, addInternalNote, updateFollowUpStatus, setAppointmentPriority, updatePatientContactInfo, updateSpecialty, getCalendarDays, saveCalendarDay, deleteCalendarDay, getCapacityLimits, saveCapacityLimit, getAverageTriageTime, getEmailQueue, saveChatbotQuery, getTopChatbotQueries, runDataLifecycleArchiving, acceptWaitlistOffer, rejectWaitlistOffer, checkAndProcessExpiredOffers, syncAppointmentWithPep, syncAllPendingPepEntries, registerPatientCheckIn, registerAttendanceStart, signAppointmentLaudo, getTemporaryCapacityLimits, createTemporaryCapacityLimit, deleteTemporaryCapacityLimit, getCustomPriorities, createCustomPriority, deleteCustomPriority, saveFilterCombination, getSavedFilters, deleteSavedFilter, saveFeedback, getFeedbacks, saveFeedbackReply, toggleFeedbackResolution, setFeedbackResolutionStatus } from './db/appointmentRepository';

export { initDb, computeSHA256, createAuditLog, getAuditLogs, addAuditLogAdmin, getUserByCpf, createUser, updateUserPassword, authenticateUser, getLoginAttempts, recordLoginAttempt, clearLoginAttempts, updatePatientUser, getAllUsersForAdmin, deleteUserAdmin, updateUserAdmin, createDonation, updateDonation, getDonationsByCpf, getDonorPoints, addDonorPoints, redeemDonorBadge, triggerDonorPrestige, saveSupportMessage, getSupportMessages, createRecurringSubscription, getRecurringSubscriptionsByCpf, updateRecurringSubscription, deleteRecurringSubscription, getTransparencyData, saveTransparencyData, updateUserStatusAdmin, getCustomRoles, saveCustomRole, deleteCustomRole, getEmployeePermissions, DEFAULT_ROLE_PERMISSIONS, getSpecialties, createSpecialty, createExam, setMailBounced, triggerStatusUpdateEmail, getCities, checkDuplicateRequest, triggerConfirmationEmail, createAppointment, getAppointmentByProtocol, getAppointmentByCpf, updateAppointment, addSymptomLog, getSymptomLogs, saveAppointmentDraft, getAppointmentDraft, deleteAppointmentDraft, addClinicalRecord, getClinicalRecords, deleteClinicalRecord, getAppointmentsForAdmin, updateAppointmentStatus, confirmAppointmentSchedule, addInternalNote, updateFollowUpStatus, setAppointmentPriority, updatePatientContactInfo, updateSpecialty, getCalendarDays, saveCalendarDay, deleteCalendarDay, getCapacityLimits, saveCapacityLimit, getAverageTriageTime, getEmailQueue, saveChatbotQuery, getTopChatbotQueries, runDataLifecycleArchiving, acceptWaitlistOffer, rejectWaitlistOffer, checkAndProcessExpiredOffers, syncAppointmentWithPep, syncAllPendingPepEntries, registerPatientCheckIn, registerAttendanceStart, signAppointmentLaudo, getTemporaryCapacityLimits, createTemporaryCapacityLimit, deleteTemporaryCapacityLimit, getCustomPriorities, createCustomPriority, deleteCustomPriority, saveFilterCombination, getSavedFilters, deleteSavedFilter, saveFeedback, getFeedbacks, saveFeedbackReply, toggleFeedbackResolution, setFeedbackResolutionStatus };

export async function deleteUserAndAppointments(cpf: string): Promise<void> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['users', 'appointments', 'symptoms_diary', 'clinical_history', 'recurring_subscriptions'], 'readwrite');
    const userStore = tx.objectStore('users');
    const appStore = tx.objectStore('appointments');
    const symptomStore = tx.objectStore('symptoms_diary');
    const clinicalStore = tx.objectStore('clinical_history');
    const subStore = tx.objectStore('recurring_subscriptions');

    userStore.delete(cleanCpf);

    const req = appStore.getAll();
    req.onsuccess = () => {
      const apps = req.result;
      const userApps = apps.filter((app: any) => app.patientCpf.replace(/\D/g, "") === cleanCpf);
      userApps.forEach((app: any) => {
        appStore.delete(app.id);
      });
    };

    const symReq = symptomStore.getAll();
    symReq.onsuccess = () => {
      const syms = symReq.result || [];
      const userSyms = syms.filter((sym: any) => sym.patientCpf.replace(/\D/g, "") === cleanCpf);
      userSyms.forEach((sym: any) => {
        symptomStore.delete(sym.id);
      });
    };

    const clinReq = clinicalStore.getAll();
    clinReq.onsuccess = () => {
      const clins = clinReq.result || [];
      const userClins = clins.filter((clin: any) => clin.patientCpf.replace(/\D/g, "") === cleanCpf);
      userClins.forEach((clin: any) => {
        clinicalStore.delete(clin.id);
      });
    };

    const subReq = subStore.getAll();
    subReq.onsuccess = () => {
      const subs = subReq.result || [];
      const userSubs = subs.filter((sub: any) => sub.donorCpf.replace(/\D/g, "") === cleanCpf);
      userSubs.forEach((sub: any) => {
        subStore.delete(sub.id);
      });
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
