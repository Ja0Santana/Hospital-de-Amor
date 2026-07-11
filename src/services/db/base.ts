import type { Appointment } from '../../types';
import {
  DEFAULT_SPECIALTIES,
  DEFAULT_CITIES,
  INITIAL_PATIENT,
  INITIAL_DONOR,
  INITIAL_RECEPTIONIST,
  INITIAL_MANAGER,
  INITIAL_AUDITOR,
  getMockAppointments,
  getMockSymptoms,
  getMockClinicalHistory,
  INITIAL_POINTS,
  getMockDonations,
  INITIAL_SUPPORT_MESSAGE,
  INITIAL_RECURRING_SUBSCRIPTION,
  getInitialTransparencyData,
} from './seeds';

export const DB_NAME = 'HospitalAmorDB';
export const DB_VERSION = 16;

let dbInstance: IDBDatabase | null = null;

export const DB_STORES = {
  USERS: 'users',
  APPOINTMENTS: 'appointments',
  SPECIALTIES: 'specialties',
  CITIES: 'cities',
  SYMPTOMS_DIARY: 'symptoms_diary',
  CLINICAL_HISTORY: 'clinical_history',
  APPOINTMENT_DRAFTS: 'appointment_drafts',
  LOGIN_ATTEMPTS: 'login_attempts',
  DONATIONS: 'donations',
  DONOR_POINTS: 'donor_points',
  SUPPORT_MESSAGES: 'support_messages',
  RECURRING_SUBSCRIPTIONS: 'recurring_subscriptions',
  AUDIT_LOGS: 'audit_logs',
  CALENDAR_BLOCKS: 'calendar_blocks',
  CAPACITY_LIMITS: 'capacity_limits',
  CUSTOM_ROLES: 'custom_roles',
  EMAIL_QUEUE: 'email_queue',
  FEEDBACKS: 'feedbacks',
  CHATBOT_QUERIES: 'chatbot_queries',
  TRANSPARENCY_DATA: 'transparency_data',
  SAVED_FILTERS: 'saved_filters',
  TEMPORARY_CAPACITY: 'temporary_capacity',
  CUSTOM_PRIORITIES: 'custom_priorities',
} as const;

export function initDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      reject(
        new Error(
          'Conexão IndexedDB bloqueada por uma versão antiga aberta. Por favor, recarregue a página ou feche outras abas.'
        )
      );
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(DB_STORES.APPOINTMENTS)) {
        db.createObjectStore(DB_STORES.APPOINTMENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.SPECIALTIES)) {
        db.createObjectStore(DB_STORES.SPECIALTIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.CITIES)) {
        db.createObjectStore(DB_STORES.CITIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.USERS)) {
        db.createObjectStore(DB_STORES.USERS, { keyPath: 'cpf' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.SYMPTOMS_DIARY)) {
        db.createObjectStore(DB_STORES.SYMPTOMS_DIARY, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains(DB_STORES.APPOINTMENT_DRAFTS)) {
        db.createObjectStore(DB_STORES.APPOINTMENT_DRAFTS, { keyPath: 'cpf' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.LOGIN_ATTEMPTS)) {
        db.createObjectStore(DB_STORES.LOGIN_ATTEMPTS, { keyPath: 'cpf' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.CLINICAL_HISTORY)) {
        db.createObjectStore(DB_STORES.CLINICAL_HISTORY, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains(DB_STORES.DONATIONS)) {
        db.createObjectStore(DB_STORES.DONATIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.DONOR_POINTS)) {
        db.createObjectStore(DB_STORES.DONOR_POINTS, { keyPath: 'donorCpf' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.SUPPORT_MESSAGES)) {
        db.createObjectStore(DB_STORES.SUPPORT_MESSAGES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.RECURRING_SUBSCRIPTIONS)) {
        db.createObjectStore(DB_STORES.RECURRING_SUBSCRIPTIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.AUDIT_LOGS)) {
        db.createObjectStore(DB_STORES.AUDIT_LOGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.CALENDAR_BLOCKS)) {
        db.createObjectStore(DB_STORES.CALENDAR_BLOCKS, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.CAPACITY_LIMITS)) {
        db.createObjectStore(DB_STORES.CAPACITY_LIMITS, { keyPath: 'examId' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.CUSTOM_ROLES)) {
        db.createObjectStore(DB_STORES.CUSTOM_ROLES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.EMAIL_QUEUE)) {
        db.createObjectStore(DB_STORES.EMAIL_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains(DB_STORES.FEEDBACKS)) {
        db.createObjectStore(DB_STORES.FEEDBACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.CHATBOT_QUERIES)) {
        db.createObjectStore(DB_STORES.CHATBOT_QUERIES, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains(DB_STORES.TRANSPARENCY_DATA)) {
        db.createObjectStore(DB_STORES.TRANSPARENCY_DATA, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(DB_STORES.SAVED_FILTERS)) {
        db.createObjectStore(DB_STORES.SAVED_FILTERS, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains(DB_STORES.TEMPORARY_CAPACITY)) {
        db.createObjectStore(DB_STORES.TEMPORARY_CAPACITY, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains(DB_STORES.CUSTOM_PRIORITIES)) {
        db.createObjectStore(DB_STORES.CUSTOM_PRIORITIES, { keyPath: 'id' });
      }
    };
  }).then(async (db) => {
    await seedData(db);
    try {
      await processDailyDocumentReminders();
    } catch (e) {
      console.error(e);
    }
    return db;
  });
}

function seedData(db: IDBDatabase): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const storesList = Object.values(DB_STORES);
    const tx = db.transaction(storesList, 'readwrite');
    const specStore = tx.objectStore(DB_STORES.SPECIALTIES);
    const cityStore = tx.objectStore(DB_STORES.CITIES);
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const userStore = tx.objectStore(DB_STORES.USERS);
    const symptomStore = tx.objectStore(DB_STORES.SYMPTOMS_DIARY);
    const clinicalStore = tx.objectStore(DB_STORES.CLINICAL_HISTORY);
    const donationsStore = tx.objectStore(DB_STORES.DONATIONS);
    const donorPointsStore = tx.objectStore(DB_STORES.DONOR_POINTS);
    const supportMessagesStore = tx.objectStore(DB_STORES.SUPPORT_MESSAGES);
    const recurringSubscriptionsStore = tx.objectStore(DB_STORES.RECURRING_SUBSCRIPTIONS);
    const transparencyStore = tx.objectStore(DB_STORES.TRANSPARENCY_DATA);

    const specCountReq = specStore.count();
    specCountReq.onsuccess = () => {
      if (specCountReq.result === 0) {
        DEFAULT_SPECIALTIES.forEach((spec) => specStore.put(spec));
      }
    };

    const cityCountReq = cityStore.count();
    cityCountReq.onsuccess = () => {
      if (cityCountReq.result === 0) {
        DEFAULT_CITIES.forEach((city) => cityStore.put(city));
      }
    };

    const userReq = userStore.get(INITIAL_PATIENT.cpf);
    userReq.onsuccess = () => {
      if (!userReq.result) {
        userStore.put(INITIAL_PATIENT);
      } else if (!userReq.result.role) {
        userStore.put({ ...userReq.result, role: 'patient' });
      }
    };

    const donorReq = userStore.get(INITIAL_DONOR.cpf);
    donorReq.onsuccess = () => {
      if (!donorReq.result) {
        userStore.put(INITIAL_DONOR);
      }
    };

    const receptionistReq = userStore.get(INITIAL_RECEPTIONIST.cpf);
    receptionistReq.onsuccess = () => {
      if (!receptionistReq.result) {
        userStore.put(INITIAL_RECEPTIONIST);
      }
    };

    const managerReq = userStore.get(INITIAL_MANAGER.cpf);
    managerReq.onsuccess = () => {
      if (!managerReq.result) {
        userStore.put(INITIAL_MANAGER);
      }
    };

    const auditorReq = userStore.get(INITIAL_AUDITOR.cpf);
    auditorReq.onsuccess = () => {
      if (!auditorReq.result) {
        userStore.put(INITIAL_AUDITOR);
      }
    };

    const appReq = appStore.getAll();
    appReq.onsuccess = () => {
      if (appReq.result.length === 0) {
        getMockAppointments().forEach((app) => appStore.put(app));
      }
    };

    const symptomReq = symptomStore.getAll();
    symptomReq.onsuccess = () => {
      if (symptomReq.result.length === 0) {
        getMockSymptoms().forEach((s) => symptomStore.put(s));
      }
    };

    const clinicalReq = clinicalStore.getAll();
    clinicalReq.onsuccess = () => {
      if (clinicalReq.result.length === 0) {
        getMockClinicalHistory().forEach((record) => clinicalStore.put(record));
      }
    };

    const pointsReq = donorPointsStore.get(INITIAL_POINTS.donorCpf);
    pointsReq.onsuccess = () => {
      if (!pointsReq.result) {
        donorPointsStore.put(INITIAL_POINTS);
      }
    };

    const donReq = donationsStore.getAll();
    donReq.onsuccess = () => {
      if (donReq.result.length === 0) {
        getMockDonations().forEach((d) => donationsStore.put(d));
      }
    };

    const msgReq = supportMessagesStore.getAll();
    msgReq.onsuccess = () => {
      if (msgReq.result.length === 0) {
        supportMessagesStore.put(INITIAL_SUPPORT_MESSAGE);
      }
    };

    const subReq = recurringSubscriptionsStore.getAll();
    subReq.onsuccess = () => {
      if (subReq.result.length === 0) {
        recurringSubscriptionsStore.put(INITIAL_RECURRING_SUBSCRIPTION);
      }
    };

    const transparencyReq = transparencyStore.get('active');
    transparencyReq.onsuccess = () => {
      if (!transparencyReq.result) {
        transparencyStore.put(getInitialTransparencyData());
      }
    };

    tx.oncomplete = () => resolve(db);
    tx.onerror = () => reject(tx.error);
  });
}

export async function processDailyDocumentReminders(): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.APPOINTMENTS, DB_STORES.EMAIL_QUEUE, DB_STORES.AUDIT_LOGS],
      'readwrite'
    );
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const emailStore = tx.objectStore(DB_STORES.EMAIL_QUEUE);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const emailReq = emailStore.getAll();
    emailReq.onsuccess = () => {
      const emailQueue = emailReq.result || [];
      const bouncedEmails = new Set(
        emailQueue
          .filter((e: any) => e.bounced)
          .map((e: any) => e.recipientEmail?.trim().toLowerCase())
      );
      const bouncedProtocols = new Set(
        emailQueue
          .filter((e: any) => e.bounced)
          .map((e: any) => e.appointmentProtocol?.trim().toLowerCase())
      );

      const request = appStore.getAll();
      request.onsuccess = () => {
        const appointments = request.result as Appointment[];
        const now = new Date();

        for (const app of appointments) {
          const appEmail = app.patientEmail?.trim().toLowerCase();
          const appProtocol = app.protocol?.trim().toLowerCase();
          if (bouncedEmails.has(appEmail) || bouncedProtocols.has(appProtocol)) {
            continue;
          }

          if (
            (app.status === 'Pendente' || app.status === 'Em análise') &&
            app.fileAttachment === null
          ) {
            const createdAtDate = new Date(app.createdAt);
            const diffHours = (now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60);
            const reminders = app.documentReminders || [];

            if (reminders.length === 0) {
              if (diffHours >= 48) {
                const newReminder = { sentAt: now.toISOString(), count: 1 };
                app.documentReminders = [newReminder];

                const subject = `Lembrete #1: Documentação Pendente - Protocolo ${app.protocol}`;
                const body = `Olá, ${app.patientName}.\n\nEste é o lembrete #1 de que sua solicitação de agendamento (Protocolo ${app.protocol}) está paralisada por falta do documento de encaminhamento médico obrigatório.\n\nPor favor, acesse o link seguro abaixo para realizar o upload do documento:\n${window.location.origin}?page=status-check&protocol=${app.protocol}\n\nAtenciosamente,\nHospital de Amor`;

                emailStore.add({
                  recipientEmail: app.patientEmail,
                  subject,
                  body,
                  status: 'pending',
                  appointmentProtocol: app.protocol,
                  bounced: false,
                });

                auditStore.add({
                  id: 'log-' + crypto.randomUUID().slice(0, 8),
                  timestamp: now.toISOString(),
                  userCpf: 'SYSTEM',
                  userName: 'Sistema de Lembretes',
                  action: `Disparo do Lembrete de Documento #1 para o agendamento ${app.protocol}`,
                  module: 'Notificações',
                  ipAddress: '127.0.0.1',
                  details: `E-mail de lembrete enviado para ${app.patientEmail}`,
                });

                appStore.put(app);
              }
            } else if (reminders.length < 3) {
              const lastReminder = reminders[reminders.length - 1];
              const lastReminderDate = new Date(lastReminder.sentAt);
              const diffDaysSinceLast =
                (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24);

              if (diffDaysSinceLast >= 7) {
                const count = reminders.length + 1;
                const newReminder = { sentAt: now.toISOString(), count };
                app.documentReminders = [...reminders, newReminder];

                const subject = `Lembrete #${count}: Documentação Pendente - Protocolo ${app.protocol}`;
                const body = `Olá, ${app.patientName}.\n\nEste é o lembrete #${count} de que sua solicitação de agendamento (Protocolo ${app.protocol}) está paralisada por falta do documento de encaminhamento médico obrigatório.\n\nPor favor, acesse o link seguro abaixo para realizar o upload do documento:\n${window.location.origin}?page=status-check&protocol=${app.protocol}\n\nAtenciosamente,\nHospital de Amor`;

                emailStore.add({
                  recipientEmail: app.patientEmail,
                  subject,
                  body,
                  status: 'pending',
                  appointmentProtocol: app.protocol,
                  bounced: false,
                });

                auditStore.add({
                  id: 'log-' + crypto.randomUUID().slice(0, 8),
                  timestamp: now.toISOString(),
                  userCpf: 'SYSTEM',
                  userName: 'Sistema de Lembretes',
                  action: `Disparo do Lembrete de Documento #${count} para o agendamento ${app.protocol}`,
                  module: 'Notificações',
                  ipAddress: '127.0.0.1',
                  details: `E-mail de lembrete enviado para ${app.patientEmail}`,
                });

                appStore.put(app);
              }
            } else if (reminders.length === 3) {
              const lastReminder = reminders[2];
              const lastReminderDate = new Date(lastReminder.sentAt);
              const diffHoursSinceLast =
                (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60);

              if (diffHoursSinceLast >= 24) {
                app.status = 'Arquivado por Documentação Pendente';
                const oldHistory = app.statusHistory || [];
                app.statusHistory = [
                  ...oldHistory,
                  {
                    status: 'Arquivado por Documentação Pendente',
                    changedAt: now.toISOString(),
                    note:
                      'Arquivado automaticamente por falta de documentação pendente após 3 lembretes.',
                  },
                ];

                const subject = `Solicitação Arquivada - Protocolo ${app.protocol}`;
                const body = `Olá, ${app.patientName}.\n\nSua solicitação de agendamento (Protocolo ${app.protocol}) foi ARQUIVADA por falta de documentação obrigatória após 3 tentativas de lembrete.\n\nCaso ainda deseje atendimento, será necessário realizar uma nova solicitação no portal.\n\nAtenciosamente,\nHospital de Amor`;

                emailStore.add({
                  recipientEmail: app.patientEmail,
                  subject,
                  body,
                  status: 'pending',
                  appointmentProtocol: app.protocol,
                  bounced: false,
                });

                auditStore.add({
                  id: 'log-' + crypto.randomUUID().slice(0, 8),
                  timestamp: now.toISOString(),
                  userCpf: 'SYSTEM',
                  userName: 'Sistema de Lembretes',
                  action: `Arquivamento automático do agendamento ${app.protocol} por falta de documentação`,
                  module: 'Triagem',
                  ipAddress: '127.0.0.1',
                  details: 'Arquivamento após 3 lembretes sem envio de anexo.',
                });

                appStore.put(app);
              }
            }
          }
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    };
    emailReq.onerror = () => reject(emailReq.error);
  });
}
