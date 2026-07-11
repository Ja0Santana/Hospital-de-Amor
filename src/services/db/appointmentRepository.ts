import type {
  Specialty,
  Exam,
  City,
  Appointment,
  SymptomLog,
  ClinicalRecord,
  AppointmentStatus,
  CalendarDay,
  CapacityLimit,
  TemporaryCapacityLimit,
  CustomPriority,
  PatientUser,
  AuditLog,
  FeedbackResponse,
} from '../../types';
import { initDb, DB_STORES } from './base';
import { computeSHA256 } from './auditRepository';

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

export async function getSpecialties(): Promise<Specialty[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.SPECIALTIES, 'readonly');
    const store = tx.objectStore(DB_STORES.SPECIALTIES);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function createSpecialty(name: string): Promise<Specialty> {
  const db = await initDb();
  const id = `spec-${Date.now()}`;
  const newSpecialty: Specialty = {
    id,
    name,
    exams: [],
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.SPECIALTIES, 'readwrite');
    const store = tx.objectStore(DB_STORES.SPECIALTIES);
    const request = store.add(newSpecialty);
    request.onsuccess = () => resolve(newSpecialty);
    request.onerror = () => reject(request.error);
  });
}

export async function createExam(
  specialtyId: string,
  exam: Omit<Exam, 'id'>,
  dailyLimit: number
): Promise<Exam> {
  const db = await initDb();
  const id = `exam-${Date.now()}`;
  const newExam: Exam = {
    ...exam,
    id,
  };
  return new Promise<Exam>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.SPECIALTIES, DB_STORES.CAPACITY_LIMITS],
      'readwrite'
    );
    const specStore = tx.objectStore(DB_STORES.SPECIALTIES);
    const limitStore = tx.objectStore(DB_STORES.CAPACITY_LIMITS);

    const specReq = specStore.get(specialtyId);
    specReq.onsuccess = () => {
      const specialty = specReq.result as Specialty | undefined;
      if (!specialty) {
        reject(new Error('Especialidade não encontrada.'));
        return;
      }
      specialty.exams = specialty.exams || [];
      specialty.exams.push(newExam);
      specStore.put(specialty);

      const limitRecord: CapacityLimit = {
        examId: id,
        dailyLimit,
      };
      limitStore.put(limitRecord);
    };

    tx.oncomplete = () => resolve(newExam);
    tx.onerror = () => reject(tx.error);
  });
}

export async function setMailBounced(
  emailOrProtocol: string,
  bounced: boolean
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.EMAIL_QUEUE, 'readwrite');
    const store = tx.objectStore(DB_STORES.EMAIL_QUEUE);
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result;
      for (const item of items) {
        const matchProtocol =
          item.appointmentProtocol &&
          item.appointmentProtocol.trim().toLowerCase() ===
            emailOrProtocol.trim().toLowerCase();
        const matchEmail =
          item.recipientEmail &&
          item.recipientEmail.trim().toLowerCase() ===
            emailOrProtocol.trim().toLowerCase();
        if (matchProtocol || matchEmail) {
          item.bounced = bounced;
          store.put(item);
        }
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function triggerStatusUpdateEmail(
  appointment: Appointment,
  note?: string,
  existingTx?: IDBTransaction
): Promise<void> {
  const db = await initDb();
  let subject = `Atualização de Status - Protocolo ${appointment.protocol}`;
  let body = '';

  const safeLink = 'https://hospitaldeamor.org.br/portal';

  if (appointment.status === 'Confirmado') {
    subject = `Agendamento Confirmado - Protocolo ${appointment.protocol}`;
    body = `Olá, ${appointment.patientName}.\n\nSeu agendamento foi confirmado com sucesso!\n\nDetalhes do Atendimento:\nLocal: Unidade Hospital de Amor - ${appointment.city || 'Principal'}\nData: ${appointment.rescheduledDate || ''}\nHora: ${appointment.rescheduledTime || ''}\nSala: ${appointment.scheduledRoom || ''}\nProfissional: Dr(a). ${appointment.scheduledDoctor || ''}\n\nPreparo:\nConsulte as orientações de preparo específicas para o seu exame no nosso Portal do Paciente.\n\nAcompanhe seu agendamento no link seguro: ${safeLink}\n\nAtenciosamente,\nHospital de Amor`;
  } else if (
    appointment.status === 'Cancelado' ||
    appointment.status === 'Reagendamento Pendente' ||
    appointment.status === 'Arquivado por Documentação Pendente'
  ) {
    subject = `Solicitação com Pendência ou Cancelada - Protocolo ${appointment.protocol}`;
    const obsText = note || appointment.observations || '';
    body = `Olá, ${appointment.patientName}.\n\nIdentificamos uma necessidade de correção ou cancelamento em sua solicitação sob o protocolo ${appointment.protocol}.\n\nObservações Técnicas:\n${obsText}\n\nComo Corrigir:\nPor favor, acesse o Portal do Paciente, acesse sua solicitação e reenvie os documentos ou anexos corretos de forma legível.\n\nAcesse o portal no link seguro: ${safeLink}\n\nAtenciosamente,\nHospital de Amor`;
  } else if (appointment.status === 'Em análise') {
    subject = `Solicitação em Análise - Protocolo ${appointment.protocol}`;
    body = `Olá, ${appointment.patientName}.\n\nInformamos que a sua solicitação de agendamento sob o protocolo ${appointment.protocol} entrou em etapa de análise documental por nossa equipe de triagem.\n\nVocê será notificado por e-mail assim que a análise for concluída.\n\nAcompanhe o status no link seguro: ${safeLink}\n\nAtenciosamente,\nHospital de Amor`;
  } else if (appointment.status === 'Aguardando Follow-up') {
    subject = `Acompanhamento Necessário - Protocolo ${appointment.protocol}`;
    body = `Olá, ${appointment.patientName}.\n\nIdentificamos a necessidade de acompanhamento clínico para o seu caso vinculado ao protocolo ${appointment.protocol}.\n\nPor favor, verifique o prazo limite de retorno e orientações seguras em nosso portal.\n\nAcesse o portal no link seguro: ${safeLink}\n\nAtenciosamente,\nHospital de Amor`;
  } else {
    body = `Olá, ${appointment.patientName}.\n\nO status da sua solicitação sob o protocolo ${appointment.protocol} foi atualizado para: ${appointment.status}.\n\nConsulte os detalhes no link seguro: ${safeLink}\n\nAtenciosamente,\nHospital de Amor`;
  }

  const emailItem = {
    recipientEmail: appointment.patientEmail,
    subject,
    body,
    status: 'pending',
    appointmentProtocol: appointment.protocol,
  };

  if (existingTx) {
    const store = existingTx.objectStore(DB_STORES.EMAIL_QUEUE);
    store.add(emailItem);
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.EMAIL_QUEUE, 'readwrite');
    const store = tx.objectStore(DB_STORES.EMAIL_QUEUE);
    const request = store.add(emailItem);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCities(): Promise<City[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CITIES, 'readonly');
    const store = tx.objectStore(DB_STORES.CITIES);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function generateNextProtocol(db: IDBDatabase): Promise<string> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.APPOINTMENTS, 'readonly');
    const store = tx.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.getAll();
    request.onsuccess = () => {
      const year = new Date().getFullYear();
      const count = request.result.length + 1;
      const sequence = String(count).padStart(4, '0');
      resolve(`HA-${year}-${sequence}`);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function checkDuplicateRequest(
  cpf: string,
  examId: string
): Promise<boolean> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.APPOINTMENTS, 'readonly');
    const store = tx.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.getAll();
    request.onsuccess = () => {
      const duplicates = request.result.filter((app) => {
        const matchCpf = normalizeCpf(app.patientCpf) === cleanCpf;
        const matchExam = app.examId === examId;
        const activeStatus =
          app.status === 'Pendente' || app.status === 'Em análise';
        return matchCpf && matchExam && activeStatus;
      });
      resolve(duplicates.length > 0);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function triggerConfirmationEmail(
  appointment: Appointment
): Promise<void> {
  const db = await initDb();
  const emailItem = {
    recipientEmail: appointment.patientEmail,
    subject: `Confirmação de Solicitação de Agendamento - Protocolo ${appointment.protocol}`,
    body: `Olá, ${appointment.patientName}.\n\nSua solicitação de agendamento para o exame/consulta "${appointment.examName}" (${appointment.specialtyName}) foi registrada com sucesso sob o protocolo ${appointment.protocol} em ${new Date(appointment.createdAt).toLocaleString('pt-BR')}.\n\nVocê pode acompanhar o status desta solicitação pelo Portal do Paciente utilizando o seu CPF ou o número do protocolo.\n\nAtenciosamente,\nHospital de Amor`,
    status: 'pending',
    appointmentProtocol: appointment.protocol,
  };

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.EMAIL_QUEUE, 'readwrite');
    const store = tx.objectStore(DB_STORES.EMAIL_QUEUE);
    const request = store.add(emailItem);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function createAppointment(
  data: Omit<
    Appointment,
    | 'id'
    | 'protocol'
    | 'createdAt'
    | 'status'
    | 'feedbackNps'
    | 'feedbackComment'
  >
): Promise<Appointment> {
  const db = await initDb();
  const protocol = await generateNextProtocol(db);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  let originSessionId = sessionStorage.getItem('patient_session_id');
  if (!originSessionId) {
    originSessionId = crypto.randomUUID();
    sessionStorage.setItem('patient_session_id', originSessionId);
  }

  const normalizedData = {
    ...data,
    patientCpf: normalizeCpf(data.patientCpf),
  };

  const appointment: Appointment = {
    ...normalizedData,
    id,
    protocol,
    createdAt,
    status: 'Pendente',
    statusHistory: [{ status: 'Pendente', changedAt: createdAt }],
    feedbackNps: null,
    feedbackComment: null,
    originSessionId,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.APPOINTMENTS, 'readwrite');
    const store = tx.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.add(appointment);
    request.onsuccess = async () => {
      try {
        await triggerConfirmationEmail(appointment);
        resolve(appointment);
      } catch (err) {
        reject(err);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAppointmentByProtocol(
  protocol: string
): Promise<Appointment | null> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.APPOINTMENTS, 'readonly');
    const store = tx.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.getAll();
    request.onsuccess = () => {
      const match = request.result.find(
        (app) => app.protocol.toUpperCase() === protocol.trim().toUpperCase()
      );
      resolve(match || null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAppointmentByCpf(
  cpf: string
): Promise<Appointment[]> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.APPOINTMENTS, 'readonly');
    const store = tx.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.getAll();
    request.onsuccess = () => {
      const matches = request.result.filter(
        (app) => normalizeCpf(app.patientCpf) === cleanCpf
      );
      resolve(matches);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function updateAppointment(
  appointment: Appointment
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [
        DB_STORES.APPOINTMENTS,
        DB_STORES.CALENDAR_BLOCKS,
        DB_STORES.CAPACITY_LIMITS,
        DB_STORES.AUDIT_LOGS,
        DB_STORES.EMAIL_QUEUE,
      ],
      'readwrite'
    );
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);

    const getReq = appStore.get(appointment.id);
    getReq.onsuccess = () => {
      const current = getReq.result as Appointment | undefined;
      if (current) {
        if (current.status !== appointment.status) {
          const history =
            appointment.statusHistory || current.statusHistory || [];
          appointment.statusHistory = [
            ...history,
            {
              status: appointment.status,
              changedAt: new Date().toISOString(),
              note: appointment.observations,
            },
          ];
          if (
            current.status === 'Confirmado' &&
            appointment.status === 'Cancelado'
          ) {
            const slot = {
              rescheduledDate: current.rescheduledDate || '',
              rescheduledTime: current.rescheduledTime || '',
              scheduledRoom: current.scheduledRoom || '',
              scheduledDoctor: current.scheduledDoctor || '',
            };
            if (slot.rescheduledDate) {
              offerSlotToNextInWaitlist(
                appointment.specialtyId,
                appointment.examId,
                slot,
                tx
              );
            }
          }
        } else if (!appointment.statusHistory && current.statusHistory) {
          appointment.statusHistory = current.statusHistory;
        }
      }

      if (
        appointment.status === 'Reagendamento Pendente' &&
        appointment.rescheduledDate
      ) {
        const date = appointment.rescheduledDate;
        const dateObj = new Date(date + 'T12:00:00');
        const dayOfWeek = dateObj.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          reject(
            new Error('Agendamentos não são permitidos nos finais de semana.')
          );
          return;
        }

        const calStore = tx.objectStore(DB_STORES.CALENDAR_BLOCKS);
        const calReq = calStore.get(date);
        calReq.onsuccess = () => {
          const block = calReq.result as CalendarDay | undefined;
          if (block && !block.isWorkingDay) {
            reject(
              new Error(
                `A data selecionada está bloqueada no calendário: ${block.label}`
              )
            );
            return;
          }

          const limitStore = tx.objectStore(DB_STORES.CAPACITY_LIMITS);
          const limitReq = limitStore.get(appointment.examId);
          limitReq.onsuccess = () => {
            const limitConfig = limitReq.result as CapacityLimit | undefined;
            if (limitConfig) {
              const dailyLimit = limitConfig.dailyLimit;
              const getAllReq = appStore.getAll();
              getAllReq.onsuccess = () => {
                const appointments = getAllReq.result as Appointment[];
                const count = appointments.filter((app) => {
                  if (app.id === appointment.id) return false;
                  if (app.examId !== appointment.examId) return false;
                  const appDate = app.rescheduledDate || '';
                  return (
                    (app.status === 'Confirmado' ||
                      app.status === 'Reagendamento Pendente') &&
                    appDate === date
                  );
                }).length;

                if (count >= dailyLimit) {
                  reject(
                    new Error(
                      `Capacidade máxima atingida para o exame "${
                        appointment.examName
                      }" no dia ${new Date(
                        date + 'T12:00:00'
                      ).toLocaleDateString('pt-BR')}. Limite: ${dailyLimit} vagas.`
                    )
                  );
                  return;
                }

                const request = appStore.put(appointment);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
              };
            } else {
              const request = appStore.put(appointment);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            }
          };
        };
      } else {
        const request = appStore.put(appointment);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }
    };
    getReq.onerror = () => reject(getReq.error);
    tx.onerror = () => reject(tx.error);
  });
}

export async function addSymptomLog(log: SymptomLog): Promise<void> {
  const db = await initDb();
  const normalizedLog = {
    ...log,
    patientCpf: normalizeCpf(log.patientCpf),
  };
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.SYMPTOMS_DIARY, 'readwrite');
    const store = tx.objectStore(DB_STORES.SYMPTOMS_DIARY);
    const req = store.add(normalizedLog);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSymptomLogs(
  patientCpf: string
): Promise<SymptomLog[]> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(patientCpf);
  return new Promise<SymptomLog[]>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.SYMPTOMS_DIARY, 'readonly');
    const store = tx.objectStore(DB_STORES.SYMPTOMS_DIARY);
    const req = store.getAll();
    req.onsuccess = () => {
      const results = (req.result || []) as SymptomLog[];
      const filtered = results
        .filter((log) => normalizeCpf(log.patientCpf) === cleanCpf)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      resolve(filtered);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveAppointmentDraft(
  cpf: string,
  data: any
): Promise<void> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.APPOINTMENT_DRAFTS, 'readwrite');
    const store = tx.objectStore(DB_STORES.APPOINTMENT_DRAFTS);
    const req = store.put({
      cpf: cleanCpf,
      data,
      updatedAt: new Date().toISOString(),
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAppointmentDraft(cpf: string): Promise<any | null> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise<any | null>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.APPOINTMENT_DRAFTS, 'readonly');
    const store = tx.objectStore(DB_STORES.APPOINTMENT_DRAFTS);
    const req = store.get(cleanCpf);
    req.onsuccess = () => {
      if (req.result) {
        resolve(req.result.data);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteAppointmentDraft(cpf: string): Promise<void> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.APPOINTMENT_DRAFTS, 'readwrite');
    const store = tx.objectStore(DB_STORES.APPOINTMENT_DRAFTS);
    const req = store.delete(cleanCpf);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function addClinicalRecord(record: ClinicalRecord): Promise<void> {
  const db = await initDb();
  const normalizedRecord = {
    ...record,
    patientCpf: normalizeCpf(record.patientCpf),
  };
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CLINICAL_HISTORY, 'readwrite');
    const store = tx.objectStore(DB_STORES.CLINICAL_HISTORY);
    const req = store.add(normalizedRecord);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getClinicalRecords(
  patientCpf: string
): Promise<ClinicalRecord[]> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(patientCpf);
  return new Promise<ClinicalRecord[]>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CLINICAL_HISTORY, 'readonly');
    const store = tx.objectStore(DB_STORES.CLINICAL_HISTORY);
    const req = store.getAll();
    req.onsuccess = () => {
      const results = (req.result || []) as ClinicalRecord[];
      const filtered = results
        .filter((record) => normalizeCpf(record.patientCpf) === cleanCpf)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      resolve(filtered);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteClinicalRecord(id: number): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CLINICAL_HISTORY, 'readwrite');
    const store = tx.objectStore(DB_STORES.CLINICAL_HISTORY);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAppointmentsForAdmin(): Promise<Appointment[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.APPOINTMENTS, 'readonly');
    const store = tx.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  observations: string,
  employeeCpf: string,
  employeeName: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.APPOINTMENTS, DB_STORES.AUDIT_LOGS, DB_STORES.EMAIL_QUEUE],
      'readwrite'
    );
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const getReq = appStore.get(id);
    getReq.onsuccess = () => {
      const app = getReq.result as Appointment | undefined;
      if (!app) {
        reject(new Error('Agendamento não encontrado.'));
        return;
      }
      const oldStatus = app.status;
      app.status = status;
      app.observations = observations;
      app.assignedTo = employeeName;

      if (status === 'Confirmado' || status === 'Concluído') {
        app.pepSyncStatus = 'pending';
        app.pepSyncAttempts = 0;
      }

      appStore.put(app);
      triggerStatusUpdateEmail(app, observations, tx);

      if (oldStatus === 'Confirmado' && status === 'Cancelado') {
        const slot = {
          rescheduledDate: app.rescheduledDate || '',
          rescheduledTime: app.rescheduledTime || '',
          scheduledRoom: app.scheduledRoom || '',
          scheduledDoctor: app.scheduledDoctor || '',
        };
        if (slot.rescheduledDate) {
          offerSlotToNextInWaitlist(app.specialtyId, app.examId, slot, tx);
        }
      }

      const log: AuditLog = {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString(),
        userCpf: employeeCpf,
        userName: employeeName,
        action: `Alteração de status do agendamento ${app.protocol} de ${oldStatus} para ${status}`,
        module: 'Triagem',
        ipAddress: '192.168.1.100',
        details: `Observações: ${observations}`,
      };
      auditStore.add(log);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function confirmAppointmentSchedule(
  id: string,
  date: string,
  time: string,
  room: string,
  doctor: string,
  employeeCpf: string,
  employeeName: string,
  overrideReason?: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [
        DB_STORES.APPOINTMENTS,
        DB_STORES.AUDIT_LOGS,
        DB_STORES.CALENDAR_BLOCKS,
        DB_STORES.CAPACITY_LIMITS,
        DB_STORES.EMAIL_QUEUE,
        DB_STORES.USERS,
        DB_STORES.TEMPORARY_CAPACITY,
        DB_STORES.SPECIALTIES,
      ],
      'readwrite'
    );
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);
    const calStore = tx.objectStore(DB_STORES.CALENDAR_BLOCKS);
    const limitStore = tx.objectStore(DB_STORES.CAPACITY_LIMITS);
    const userStore = tx.objectStore(DB_STORES.USERS);
    const tempCapStore = tx.objectStore(DB_STORES.TEMPORARY_CAPACITY);
    const specStore = tx.objectStore(DB_STORES.SPECIALTIES);

    const getCurReq = appStore.get(id);
    getCurReq.onsuccess = () => {
      const currentApp = getCurReq.result as Appointment | undefined;
      if (!currentApp) {
        reject(new Error('Agendamento não encontrado.'));
        return;
      }

      const calReq = calStore.get(date);
      calReq.onsuccess = () => {
        const block = calReq.result as CalendarDay | undefined;

        const limitReq = limitStore.get(currentApp.examId);
        limitReq.onsuccess = () => {
          const limitConfig = limitReq.result as CapacityLimit | undefined;

          const tempCapReq = tempCapStore.getAll();
          tempCapReq.onsuccess = () => {
            const tempCapacities =
              tempCapReq.result as TemporaryCapacityLimit[];

            const allUsersReq = userStore.getAll();
            allUsersReq.onsuccess = () => {
              const allUsers = allUsersReq.result as PatientUser[];

              const specReq = specStore.get(currentApp.specialtyId);
              specReq.onsuccess = () => {
                const specialty = specReq.result as Specialty | undefined;
                const exam = specialty?.exams?.find(
                  (e) => e.id === currentApp.examId
                );

                const getAllAppsReq = appStore.getAll();
                getAllAppsReq.onsuccess = () => {
                  const appointments = getAllAppsReq.result as Appointment[];

                  const errors: string[] = [];
                  const dateObj = new Date(date + 'T12:00:00');
                  const dayOfWeek = dateObj.getDay();

                  if (dayOfWeek === 0 || dayOfWeek === 6) {
                    errors.push(
                      'Agendamentos não são permitidos nos finais de semana.'
                    );
                  }

                  if (block && !block.isWorkingDay) {
                    errors.push(
                      `A data selecionada está bloqueada no calendário: ${block.label}`
                    );
                  }

                  const hasConflict = appointments.some((app) => {
                    if (app.id === id) return false;
                    if (app.status !== 'Confirmado') return false;

                    const appDate = app.rescheduledDate || '';
                    const appTime = app.rescheduledTime || '';
                    const isSameDateTime = appDate === date && appTime === time;
                    if (!isSameDateTime) return false;

                    const isSameDoctor =
                      app.scheduledDoctor &&
                      app.scheduledDoctor.trim().toLowerCase() ===
                        doctor.trim().toLowerCase();
                    const isSameRoom =
                      app.scheduledRoom &&
                      app.scheduledRoom.trim().toLowerCase() ===
                        room.trim().toLowerCase();

                    return isSameDoctor || isSameRoom;
                  });

                  if (hasConflict) {
                    errors.push(
                      'Conflito de agenda detectado: O médico ou a sala já possuem um agendamento confirmado neste mesmo dia e horário.'
                    );
                  }

                  const dateException = tempCapacities.find(
                    (tc) =>
                      tc.examId === currentApp.examId && tc.date === date
                  );
                  const dailyLimit = dateException
                    ? dateException.limit
                    : limitConfig
                    ? limitConfig.dailyLimit
                    : Infinity;

                  const dailyCount = appointments.filter((app) => {
                    if (app.id === id) return false;
                    if (app.examId !== currentApp.examId) return false;
                    const appDate = app.rescheduledDate || '';
                    return (
                      (app.status === 'Confirmado' ||
                        app.status === 'Reagendamento Pendente') &&
                      appDate === date
                    );
                  }).length;

                  if (dailyCount >= dailyLimit) {
                    errors.push(
                      `Capacidade diária máxima atingida para o exame "${
                        currentApp.examName
                      }" no dia ${new Date(
                        date + 'T12:00:00'
                      ).toLocaleDateString('pt-BR')}. Limite: ${dailyLimit} vagas.`
                    );
                  }

                  const startOfWeek = new Date(dateObj);
                  startOfWeek.setDate(dateObj.getDate() - dayOfWeek);
                  const endOfWeek = new Date(startOfWeek);
                  endOfWeek.setDate(startOfWeek.getDate() + 6);
                  const startOfWeekStr =
                    startOfWeek.toISOString().split('T')[0];
                  const endOfWeekStr = endOfWeek.toISOString().split('T')[0];

                  const weeklyLimit = limitConfig?.weeklyLimit ?? Infinity;
                  const weeklyCount = appointments.filter((app) => {
                    if (app.id === id) return false;
                    if (app.examId !== currentApp.examId) return false;
                    const appDate = app.rescheduledDate || '';
                    const isAppActive =
                      app.status === 'Confirmado' ||
                      app.status === 'Reagendamento Pendente';
                    return (
                      isAppActive &&
                      appDate >= startOfWeekStr &&
                      appDate <= endOfWeekStr
                    );
                  }).length;

                  if (weeklyCount >= weeklyLimit) {
                    errors.push(
                      `Capacidade semanal máxima atingida para o exame "${
                        currentApp.examName
                      }" na semana de ${startOfWeek.toLocaleDateString(
                        'pt-BR'
                      )} a ${endOfWeek.toLocaleDateString(
                        'pt-BR'
                      )}. Limite: ${weeklyLimit} vagas.`
                    );
                  }

                  const yearMonth = date.substring(0, 7);
                  const monthlyLimit = limitConfig?.monthlyLimit ?? Infinity;
                  const monthlyCount = appointments.filter((app) => {
                    if (app.id === id) return false;
                    if (app.examId !== currentApp.examId) return false;
                    const appDate = app.rescheduledDate || '';
                    const isAppActive =
                      app.status === 'Confirmado' ||
                      app.status === 'Reagendamento Pendente';
                    return isAppActive && appDate.startsWith(yearMonth);
                  }).length;

                  if (monthlyCount >= monthlyLimit) {
                    errors.push(
                      `Capacidade mensal máxima atingida para o exame "${
                        currentApp.examName
                      }" no mês ${date.substring(5, 7)}/${date.substring(
                        0,
                        4
                      )}. Limite: ${monthlyLimit} vagas.`
                    );
                  }

                  const matchedDoctor = allUsers.find(
                    (u) =>
                      u.name.trim().toLowerCase() ===
                        doctor.trim().toLowerCase() &&
                      (u.role === 'gestor' ||
                        u.role === 'recepcionista' ||
                        u.role === 'auditor' ||
                        u.role === 'both' ||
                        u.qualifiedExamIds !== undefined)
                  );
                  if (matchedDoctor) {
                    if (
                      matchedDoctor.qualifiedExamIds &&
                      !matchedDoctor.qualifiedExamIds.includes(
                        currentApp.examId
                      )
                    ) {
                      errors.push(
                        `O profissional Dr(a). ${doctor} não possui qualificação registrada para realizar o exame "${currentApp.examName}".`
                      );
                    }
                  }

                  const requiredResources = exam?.requiredResources || [];
                  if (requiredResources.length > 0) {
                    for (const resource of requiredResources) {
                      const resLower = resource.toLowerCase();
                      const roomLower = room.toLowerCase();
                      let hasEquipment = false;
                      if (
                        resLower.includes('mamógrafo') ||
                        resLower.includes('mamografia')
                      ) {
                        hasEquipment =
                          roomLower.includes('mamografia') ||
                          roomLower.includes('mamógrafo');
                      } else if (
                        resLower.includes('tomógrafo') ||
                        resLower.includes('tomografia')
                      ) {
                        hasEquipment =
                          roomLower.includes('tomografia') ||
                          roomLower.includes('tomógrafo');
                      } else if (resLower.includes('ressonância')) {
                        hasEquipment = roomLower.includes('ressonância');
                      } else if (
                        resLower.includes('ultrassom') ||
                        resLower.includes('ultrassonografia')
                      ) {
                        hasEquipment =
                          roomLower.includes('ultrassom') ||
                          roomLower.includes('ultrassonografia') ||
                          roomLower.includes('ecografia');
                      } else if (
                        resLower.includes('raio-x') ||
                        resLower.includes('radiologia')
                      ) {
                        hasEquipment =
                          roomLower.includes('raio-x') ||
                          roomLower.includes('radiografia') ||
                          roomLower.includes('radiologia');
                      } else {
                        hasEquipment =
                          roomLower.includes(resLower) ||
                          roomLower.includes('coleta') ||
                          roomLower.includes('consultório') ||
                          roomLower.includes('sala de exames') ||
                          roomLower.includes('sala de coleta');
                      }

                      if (!hasEquipment) {
                        errors.push(
                          `A sala "${room}" não possui o equipamento/recurso obrigatório "${resource}" exigido para o exame "${currentApp.examName}".`
                        );
                      }
                    }
                  }

                  if (errors.length > 0) {
                    const employee = allUsers.find(
                      (u) =>
                        normalizeCpf(u.cpf) === normalizeCpf(employeeCpf)
                    );
                    const isGestor = employee && employee.role === 'gestor';

                    if (
                      isGestor &&
                      overrideReason &&
                      overrideReason.trim().length > 0
                    ) {
                      const overrideLog: AuditLog = {
                        id: 'log-' + crypto.randomUUID().slice(0, 8),
                        timestamp: new Date().toISOString(),
                        userCpf: employeeCpf,
                        userName: employeeName,
                        action: `OVERRIDE CRÍTICO de agendamento ${currentApp.protocol} para ${date} às ${time} por conflito clínico/capacidade`,
                        module: 'Agendamento',
                        ipAddress: '192.168.1.100',
                        details: `Erros ignorados: [${errors.join(
                          ' | '
                        )}]. Justificativa do Gestor: "${overrideReason.trim()}"`,
                      };
                      auditStore.add(overrideLog);
                    } else {
                      reject(new Error(errors.join('\n')));
                      return;
                    }
                  } else if (limitConfig) {
                    const newCount = dailyCount + 1;
                    const usageRatio = newCount / dailyLimit;
                    if (usageRatio >= 0.8) {
                      const warnLog: AuditLog = {
                        id: 'log-' + crypto.randomUUID().slice(0, 8),
                        timestamp: new Date().toISOString(),
                        userCpf: employeeCpf,
                        userName: employeeName,
                        action: `Alerta de Capacidade: Exame "${
                          currentApp.examName
                        }" atingiu ${Math.round(
                          usageRatio * 100
                        )}% da capacidade máxima no dia ${date} (${newCount}/${dailyLimit} vagas)`,
                        module: 'Configurações',
                        ipAddress: '192.168.1.100',
                        details: `Aviso gerado automaticamente pelo sistema de capacidade.`,
                      };
                      auditStore.add(warnLog);
                    }
                  }

                  const oldStatus = currentApp.status;
                  currentApp.status = 'Confirmado';
                  currentApp.rescheduledDate = date;
                  currentApp.rescheduledTime = time;
                  currentApp.scheduledRoom = room;
                  currentApp.scheduledDoctor = doctor;
                  currentApp.assignedTo = employeeName;
                  currentApp.pepSyncStatus = 'pending';
                  currentApp.pepSyncAttempts = 0;

                  appStore.put(currentApp);
                  triggerStatusUpdateEmail(currentApp, undefined, tx);

                  const log: AuditLog = {
                    id: 'log-' + crypto.randomUUID().slice(0, 8),
                    timestamp: new Date().toISOString(),
                    userCpf: employeeCpf,
                    userName: employeeName,
                    action: `Confirmação de agendamento ${currentApp.protocol} para ${date} às ${time} na sala ${room} com dr(a). ${doctor}`,
                    module: 'Agendamento',
                    ipAddress: '192.168.1.100',
                    details: `Status alterado de ${oldStatus} para Confirmado.${
                      overrideReason
                        ? ` (Override realizado com justificativa: ${overrideReason})`
                        : ''
                    }`,
                  };
                  auditStore.add(log);
                };
              };
            };
          };
        };
      };
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function addInternalNote(
  id: string,
  text: string,
  isUrgent: boolean,
  employeeCpf: string,
  employeeName: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.APPOINTMENTS, DB_STORES.AUDIT_LOGS],
      'readwrite'
    );
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const getReq = appStore.get(id);
    getReq.onsuccess = () => {
      const app = getReq.result as Appointment | undefined;
      if (!app) {
        reject(new Error('Agendamento não encontrado.'));
        return;
      }

      if (!app.internalNotes) {
        app.internalNotes = [];
      }

      const newNote = {
        id: 'note-' + crypto.randomUUID().slice(0, 8),
        authorName: employeeName,
        authorCpf: employeeCpf,
        text: text.trim(),
        timestamp: new Date().toISOString(),
        isUrgent,
      };

      app.internalNotes.push(newNote);
      appStore.put(app);

      const log: AuditLog = {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString(),
        userCpf: employeeCpf,
        userName: employeeName,
        action: `Adição de anotação interna ${
          newNote.isUrgent ? 'URGENTE ' : ''
        }no agendamento ${app.protocol}`,
        module: 'Triagem',
        ipAddress: '192.168.1.100',
        details: `Conteúdo da nota: "${text.trim().slice(0, 60)}${
          text.length > 60 ? '...' : ''
        }"`,
      };
      auditStore.add(log);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateFollowUpStatus(
  id: string,
  date: string | null,
  isSuspended: boolean,
  reason: string,
  employeeCpf: string,
  employeeName: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.APPOINTMENTS, DB_STORES.AUDIT_LOGS],
      'readwrite'
    );
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const getReq = appStore.get(id);
    getReq.onsuccess = () => {
      const app = getReq.result as Appointment | undefined;
      if (!app) {
        reject(new Error('Agendamento não encontrado.'));
        return;
      }

      const oldStatus = app.status;
      app.status = 'Aguardando Follow-up';
      if (date) {
        app.followUpDate = date;
      }
      app.followUpSuspended = isSuspended;

      if (isSuspended && reason.trim()) {
        app.observations = `Pendente suspenso: ${reason.trim()}`;
      }

      appStore.put(app);

      const log: AuditLog = {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString(),
        userCpf: employeeCpf,
        userName: employeeName,
        action: `Alteração de status do agendamento ${
          app.protocol
        } de ${oldStatus} para Aguardando Follow-up ${
          isSuspended ? '(Suspenso)' : ''
        }`,
        module: 'Triagem',
        ipAddress: '192.168.1.100',
        details: isSuspended
          ? `Motivo da suspensão: ${reason.trim()}`
          : `Data limite de retorno: ${date}`,
      };
      auditStore.add(log);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function setAppointmentPriority(
  id: string,
  priority: 'Baixa' | 'Média' | 'Alta',
  employeeCpf: string,
  employeeName: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.APPOINTMENTS, DB_STORES.AUDIT_LOGS],
      'readwrite'
    );
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const getReq = appStore.get(id);
    getReq.onsuccess = () => {
      const app = getReq.result as Appointment | undefined;
      if (!app) {
        reject(new Error('Agendamento não encontrado.'));
        return;
      }

      const oldPriority = app.priority || 'Não definida';
      app.priority = priority;
      appStore.put(app);

      const log: AuditLog = {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString(),
        userCpf: employeeCpf,
        userName: employeeName,
        action: `Prioridade do agendamento ${app.protocol} alterada de ${oldPriority} para ${priority}`,
        module: 'Triagem',
        ipAddress: '192.168.1.100',
        details: `Operação realizada pelo triador.`,
      };
      auditStore.add(log);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updatePatientContactInfo(
  cpf: string,
  email: string,
  phone: string,
  employeeCpf: string,
  employeeName: string
): Promise<void> {
  const db = await initDb();
  const cleanCpf = normalizeCpf(cpf);
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [
        DB_STORES.USERS,
        DB_STORES.APPOINTMENTS,
        DB_STORES.AUDIT_LOGS,
        DB_STORES.EMAIL_QUEUE,
      ],
      'readwrite'
    );
    const userStore = tx.objectStore(DB_STORES.USERS);
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);
    const emailStore = tx.objectStore(DB_STORES.EMAIL_QUEUE);

    const getUserReq = userStore.get(cleanCpf);
    getUserReq.onsuccess = () => {
      const user = getUserReq.result as PatientUser | undefined;
      if (!user) {
        reject(new Error('Paciente não encontrado.'));
        return;
      }

      const oldEmail = user.email;
      const oldPhone = user.phone;
      user.email = email.trim();
      user.phone = phone.trim();
      userStore.put(user);

      const getAppsReq = appStore.getAll();
      getAppsReq.onsuccess = () => {
        const appointments = getAppsReq.result as Appointment[];
        const patientApps = appointments.filter(
          (app) => normalizeCpf(app.patientCpf) === cleanCpf
        );

        patientApps.forEach((app) => {
          app.patientEmail = email.trim();
          app.patientPhone = phone.trim();
          appStore.put(app);
        });

        const emailChanged =
          email.trim().toLowerCase() !== oldEmail?.trim().toLowerCase();
        if (emailChanged) {
          const emailReq = emailStore.getAll();
          emailReq.onsuccess = () => {
            const emails = emailReq.result;
            const patientProtocols = new Set(
              patientApps.map((app) => app.protocol.trim().toLowerCase())
            );
            const oldEmailClean = oldEmail?.trim().toLowerCase();
            const newEmailClean = email.trim().toLowerCase();
            for (const item of emails) {
              const itemEmailClean = item.recipientEmail?.trim().toLowerCase();
              const itemProtoClean =
                item.appointmentProtocol?.trim().toLowerCase();
              const matchesEmail =
                itemEmailClean === oldEmailClean ||
                itemEmailClean === newEmailClean;
              const matchesProtocol =
                itemProtoClean && patientProtocols.has(itemProtoClean);
              if (matchesEmail || matchesProtocol) {
                if (item.bounced) {
                  item.bounced = false;
                  emailStore.put(item);
                }
              }
            }
          };
        }

        const log: AuditLog = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          timestamp: new Date().toISOString(),
          userCpf: employeeCpf,
          userName: employeeName,
          action: `Contato do paciente ${user.name} atualizado (CPF: ${cpf})`,
          module: 'Recepção Rápida',
          ipAddress: '192.168.1.100',
          details: `Telefone: ${oldPhone} -> ${phone.trim()} | E-mail: ${oldEmail} -> ${email.trim()}`,
        };
        auditStore.add(log);
      };
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateSpecialty(specialty: Specialty): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.SPECIALTIES, 'readwrite');
    const store = tx.objectStore(DB_STORES.SPECIALTIES);
    const request = store.put(specialty);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCalendarDays(): Promise<CalendarDay[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CALENDAR_BLOCKS, 'readonly');
    const store = tx.objectStore(DB_STORES.CALENDAR_BLOCKS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCalendarDay(day: CalendarDay): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CALENDAR_BLOCKS, 'readwrite');
    const store = tx.objectStore(DB_STORES.CALENDAR_BLOCKS);
    const request = store.put(day);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCalendarDay(date: string): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CALENDAR_BLOCKS, 'readwrite');
    const store = tx.objectStore(DB_STORES.CALENDAR_BLOCKS);
    const request = store.delete(date);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCapacityLimits(): Promise<CapacityLimit[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CAPACITY_LIMITS, 'readonly');
    const store = tx.objectStore(DB_STORES.CAPACITY_LIMITS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCapacityLimit(limit: CapacityLimit): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CAPACITY_LIMITS, 'readwrite');
    const store = tx.objectStore(DB_STORES.CAPACITY_LIMITS);
    const request = store.put(limit);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAverageTriageTime(): Promise<string> {
  const db = await initDb();
  return new Promise<string>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.APPOINTMENTS, 'readonly');
    const store = tx.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.getAll();
    request.onsuccess = () => {
      const appointments = request.result as Appointment[];
      const samples: number[] = [];

      for (const app of appointments) {
        if (!app.createdAt || !app.statusHistory) {
          continue;
        }
        const transition = app.statusHistory.find(
          (h) => h.status === 'Confirmado' || h.status === 'Cancelado'
        );
        if (transition) {
          const startTime = new Date(app.createdAt).getTime();
          const endTime = new Date(transition.changedAt).getTime();
          if (endTime > startTime) {
            const diffHours = (endTime - startTime) / (1000 * 60 * 60);
            samples.push(diffHours);
          }
        }
      }

      if (samples.length < 5) {
        resolve('24 horas úteis');
        return;
      }

      const recentSamples = samples.slice(-30);
      const total = recentSamples.reduce((sum, val) => sum + val, 0);
      const average = Math.round(total / recentSamples.length);
      resolve(`~${average} horas úteis`);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getEmailQueue(): Promise<any[]> {
  const db = await initDb();
  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.EMAIL_QUEUE, 'readonly');
    const store = tx.objectStore(DB_STORES.EMAIL_QUEUE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveChatbotQuery(
  query: string,
  understood: boolean
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CHATBOT_QUERIES, 'readwrite');
    const store = tx.objectStore(DB_STORES.CHATBOT_QUERIES);
    const request = store.add({
      query,
      understood,
      timestamp: new Date().toISOString(),
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getTopChatbotQueries(): Promise<any[]> {
  const db = await initDb();
  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CHATBOT_QUERIES, 'readonly');
    const store = tx.objectStore(DB_STORES.CHATBOT_QUERIES);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result || [];
      const counts: Record<
        string,
        { query: string; count: number; understood: boolean }
      > = {};
      results.forEach((item: any) => {
        const key = item.query.trim().toLowerCase();
        if (counts[key]) {
          counts[key].count++;
        } else {
          counts[key] = {
            query: item.query,
            count: 1,
            understood: item.understood,
          };
        }
      });
      const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
      resolve(sorted);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function runDataLifecycleArchiving(): Promise<number> {
  const db = await initDb();
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.APPOINTMENTS, 'readwrite');
    const store = tx.objectStore(DB_STORES.APPOINTMENTS);
    const request = store.getAll();
    request.onsuccess = () => {
      const appointments = request.result || [];
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      let count = 0;
      for (const app of appointments) {
        const createdDate = new Date(app.createdAt);
        const hasFinalStatus =
          app.status === 'Concluído' ||
          app.status === 'Cancelado' ||
          app.status === 'Arquivado por Documentação Pendente';
        if (hasFinalStatus && createdDate < twoYearsAgo && !app.isColdStorage) {
          app.isColdStorage = true;
          store.put(app);
          count++;
        }
      }
      resolve(count);
    };
    request.onerror = () => reject(request.error);
  });
}

export function offerSlotToNextInWaitlist(
  specialtyId: string,
  examId: string,
  slot: {
    rescheduledDate: string;
    rescheduledTime: string;
    scheduledRoom: string;
    scheduledDoctor: string;
  },
  tx: IDBTransaction
): void {
  const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
  const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);
  const emailStore = tx.objectStore(DB_STORES.EMAIL_QUEUE);

  const req = appStore.getAll();
  req.onsuccess = () => {
    const appointments = req.result as Appointment[];
    const candidates = appointments.filter(
      (a) =>
        a.specialtyId === specialtyId &&
        a.examId === examId &&
        (a.status === 'Pendente' || a.status === 'Em análise') &&
        (!a.waitingListOfferExpiresAt ||
          new Date(a.waitingListOfferExpiresAt) < new Date())
    );

    if (candidates.length === 0) return;

    candidates.sort((a, b) => {
      const pA = a.isLegalPriority ? 1 : 0;
      const pB = b.isLegalPriority ? 1 : 0;
      if (pA !== pB) return pB - pA;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const candidate = candidates[0];
    const now = new Date();
    let expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    candidate.rescheduledDate = slot.rescheduledDate;
    candidate.rescheduledTime = slot.rescheduledTime;
    candidate.scheduledRoom = slot.scheduledRoom;
    candidate.scheduledDoctor = slot.scheduledDoctor;
    candidate.waitingListOfferDate = now.toISOString();

    const examDateTime = new Date(
      `${slot.rescheduledDate}T${slot.rescheduledTime}`
    );
    if (
      !isNaN(examDateTime.getTime()) &&
      examDateTime > now &&
      examDateTime < expiresAt
    ) {
      expiresAt = examDateTime;
    }
    candidate.waitingListOfferExpiresAt = expiresAt.toISOString();

    appStore.put(candidate);

    const log: AuditLog = {
      id: 'log-' + crypto.randomUUID().slice(0, 8),
      timestamp: now.toISOString(),
      userCpf: 'SYSTEM',
      userName: 'Fila de Espera Inteligente',
      action: `Oferta de vaga automatica para o paciente ${candidate.patientName} (Protocolo ${candidate.protocol})`,
      module: 'Triagem',
      ipAddress: '127.0.0.1',
      details: `Vaga cancelada do agendamento foi realocada com expiracao de 4 horas.`,
    };
    auditStore.add(log);

    const emailItem = {
      recipientEmail: candidate.patientEmail,
      subject: `Oferta de Vaga Liberada - Protocolo ${candidate.protocol}`,
      body: `Olá, ${candidate.patientName}.\n\nUma vaga para o seu exame/consulta "${candidate.examName}" foi liberada por cancelamento!\n\nVocê tem 4 horas para aceitar esta vaga. Caso contrário, ela será oferecida ao próximo paciente da fila.\n\nDetalhes da Vaga:\nLocal: Unidade Hospital de Amor - ${candidate.city || 'Principal'}\nData: ${slot.rescheduledDate}\nHora: ${slot.rescheduledTime}\nSala: ${slot.scheduledRoom}\nProfissional: Dr(a). ${slot.scheduledDoctor}\n\nVocê pode aceitar ou recusar esta oferta acessando nosso portal.\n\nAtenciosamente,\nHospital de Amor`,
      status: 'pending',
      appointmentProtocol: candidate.protocol,
      bounced: false,
    };
    emailStore.add(emailItem);
  };
}

export async function acceptWaitlistOffer(
  appointmentId: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.APPOINTMENTS, DB_STORES.AUDIT_LOGS, DB_STORES.EMAIL_QUEUE],
      'readwrite'
    );
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const getReq = appStore.get(appointmentId);
    getReq.onsuccess = () => {
      const app = getReq.result as Appointment | undefined;
      if (!app) {
        reject(new Error('Agendamento não encontrado.'));
        return;
      }

      app.status = 'Confirmado';
      app.waitingListOfferDate = undefined;
      app.waitingListOfferExpiresAt = undefined;

      appStore.put(app);
      triggerStatusUpdateEmail(app, undefined, tx);

      const log: AuditLog = {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString(),
        userCpf: app.patientCpf,
        userName: app.patientName,
        action: `Paciente aceitou oferta de vaga via portal - Protocolo ${app.protocol}`,
        module: 'Paciente',
        ipAddress: '127.0.0.1',
        details: `Agendamento confirmado para ${app.rescheduledDate} às ${app.rescheduledTime}.`,
      };
      auditStore.add(log);
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function rejectWaitlistOffer(
  appointmentId: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.APPOINTMENTS, DB_STORES.AUDIT_LOGS, DB_STORES.EMAIL_QUEUE],
      'readwrite'
    );
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const getReq = appStore.get(appointmentId);
    getReq.onsuccess = () => {
      const app = getReq.result as Appointment | undefined;
      if (!app) {
        reject(new Error('Agendamento não encontrado.'));
        return;
      }

      const slot = {
        rescheduledDate: app.rescheduledDate || '',
        rescheduledTime: app.rescheduledTime || '',
        scheduledRoom: app.scheduledRoom || '',
        scheduledDoctor: app.scheduledDoctor || '',
      };

      app.rescheduledDate = undefined;
      app.rescheduledTime = undefined;
      app.scheduledRoom = undefined;
      app.scheduledDoctor = undefined;
      app.waitingListOfferDate = undefined;
      app.waitingListOfferExpiresAt = undefined;

      appStore.put(app);

      const log: AuditLog = {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString(),
        userCpf: app.patientCpf,
        userName: app.patientName,
        action: `Paciente recusou oferta de vaga via portal - Protocolo ${app.protocol}`,
        module: 'Paciente',
        ipAddress: '127.0.0.1',
        details: 'Vaga liberada para o próximo paciente da fila.',
      };
      auditStore.add(log);

      if (slot.rescheduledDate) {
        offerSlotToNextInWaitlist(app.specialtyId, app.examId, slot, tx);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function checkAndProcessExpiredOffers(): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.APPOINTMENTS, DB_STORES.AUDIT_LOGS, DB_STORES.EMAIL_QUEUE],
      'readwrite'
    );
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const req = appStore.getAll();
    req.onsuccess = () => {
      const appointments = req.result as Appointment[];
      const now = new Date();
      const expired = appointments.filter(
        (a) =>
          a.waitingListOfferExpiresAt &&
          new Date(a.waitingListOfferExpiresAt) < now
      );

      if (expired.length === 0) {
        resolve();
        return;
      }

      expired.forEach((app) => {
        const slot = {
          rescheduledDate: app.rescheduledDate || '',
          rescheduledTime: app.rescheduledTime || '',
          scheduledRoom: app.scheduledRoom || '',
          scheduledDoctor: app.scheduledDoctor || '',
        };

        app.rescheduledDate = undefined;
        app.rescheduledTime = undefined;
        app.scheduledRoom = undefined;
        app.scheduledDoctor = undefined;
        app.waitingListOfferDate = undefined;
        app.waitingListOfferExpiresAt = undefined;

        appStore.put(app);

        const log: AuditLog = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          timestamp: now.toISOString(),
          userCpf: 'SYSTEM',
          userName: 'Sistema de Regulação',
          action: `Oferta de vaga expirada sem resposta - Protocolo ${app.protocol}`,
          module: 'Triagem',
          ipAddress: '127.0.0.1',
          details: `Prazo de 4 horas expirou. Vaga do exame ${app.examName} será repassada.`,
        };
        auditStore.add(log);

        if (slot.rescheduledDate) {
          offerSlotToNextInWaitlist(app.specialtyId, app.examId, slot, tx);
        }
      });
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncAppointmentWithPep(
  appointmentId: string
): Promise<void> {
  const db = await initDb();
  const tx = db.transaction(
    [DB_STORES.APPOINTMENTS, DB_STORES.AUDIT_LOGS],
    'readwrite'
  );
  const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
  const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

  const app = await new Promise<Appointment | undefined>((resolve, reject) => {
    const req = appStore.get(appointmentId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!app) throw new Error('Agendamento não encontrado.');

  const attempts = (app.pepSyncAttempts || 0) + 1;
  app.pepSyncAttempts = attempts;

  const isFailure =
    app.patientCpf.endsWith('9') || (attempts === 1 && Math.random() < 0.2);

  if (isFailure) {
    app.pepSyncStatus = 'failed';
    appStore.put(app);

    const log: AuditLog = {
      id: 'log-' + crypto.randomUUID().slice(0, 8),
      timestamp: new Date().toISOString(),
      userCpf: 'SYSTEM_PEP_INTEGRATION',
      userName: 'Fila de Mensagens PEP',
      action: `Falha na integração com o PEP para o protocolo ${app.protocol}`,
      module: 'Integração PEP',
      ipAddress: '127.0.0.1',
      details: `Tentativa #${attempts}. Erro de comunicação: Servidor PEP indisponível ou timeout de API.`,
    };
    auditStore.add(log);
  } else {
    app.pepSyncStatus = 'synchronized';
    app.pepRegistryId = 'PEP-' + Math.floor(100000 + Math.random() * 900000);
    appStore.put(app);

    const log: AuditLog = {
      id: 'log-' + crypto.randomUUID().slice(0, 8),
      timestamp: new Date().toISOString(),
      userCpf: 'SYSTEM_PEP_INTEGRATION',
      userName: 'Fila de Mensagens PEP',
      action: `Sucesso na integração com o PEP para o protocolo ${app.protocol}`,
      module: 'Integração PEP',
      ipAddress: '127.0.0.1',
      details: `Tentativa #${attempts}. Prontuário vinculado com ID: ${app.pepRegistryId}.`,
    };
    auditStore.add(log);
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function syncAllPendingPepEntries(): Promise<{
  successCount: number;
  failCount: number;
}> {
  const db = await initDb();
  const tx = db.transaction(DB_STORES.APPOINTMENTS, 'readonly');
  const store = tx.objectStore(DB_STORES.APPOINTMENTS);

  const allApps = await new Promise<Appointment[]>((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  const pendingOrFailed = allApps.filter(
    (app) =>
      app.pepSyncStatus === 'pending' || app.pepSyncStatus === 'failed'
  );

  let successCount = 0;
  let failCount = 0;

  for (const app of pendingOrFailed) {
    try {
      await syncAppointmentWithPep(app.id);
      const updatedDb = await initDb();
      const checkTx = updatedDb.transaction(DB_STORES.APPOINTMENTS, 'readonly');
      const checkStore = checkTx.objectStore(DB_STORES.APPOINTMENTS);
      const updatedApp = await new Promise<Appointment>((resolve) => {
        const req = checkStore.get(app.id);
        req.onsuccess = () => resolve(req.result);
      });
      if (updatedApp.pepSyncStatus === 'synchronized') {
        successCount++;
      } else {
        failCount++;
      }
    } catch {
      failCount++;
    }
  }

  return { successCount, failCount };
}

export async function registerPatientCheckIn(
  appointmentId: string
): Promise<void> {
  const db = await initDb();
  const tx = db.transaction(
    [DB_STORES.APPOINTMENTS, DB_STORES.AUDIT_LOGS],
    'readwrite'
  );
  const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
  const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

  const app = await new Promise<Appointment | undefined>((resolve, reject) => {
    const req = appStore.get(appointmentId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!app) throw new Error('Agendamento não encontrado.');

  app.checkInAt = new Date().toISOString();
  appStore.put(app);

  const log: AuditLog = {
    id: 'log-' + crypto.randomUUID().slice(0, 8),
    timestamp: new Date().toISOString(),
    userCpf: 'RECEPTION',
    userName: app.assignedTo || 'Recepção',
    action: `Check-in do paciente ${app.patientName} (Protocolo ${app.protocol}) registrado na recepção`,
    module: 'Fila e Recepção',
    ipAddress: '192.168.1.100',
    details: `Check-in realizado em: ${new Date(
      app.checkInAt
    ).toLocaleString('pt-BR')}`,
  };
  auditStore.add(log);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function registerAttendanceStart(
  appointmentId: string
): Promise<void> {
  const db = await initDb();
  const tx = db.transaction(
    [DB_STORES.APPOINTMENTS, DB_STORES.AUDIT_LOGS],
    'readwrite'
  );
  const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
  const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

  const app = await new Promise<Appointment | undefined>((resolve, reject) => {
    const req = appStore.get(appointmentId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!app) throw new Error('Agendamento não encontrado.');

  app.attendanceStartedAt = new Date().toISOString();
  app.status = 'Concluído';
  appStore.put(app);

  const log: AuditLog = {
    id: 'log-' + crypto.randomUUID().slice(0, 8),
    timestamp: new Date().toISOString(),
    userCpf: 'RECEPTION',
    userName: app.assignedTo || 'Médico/Atendente',
    action: `Início de atendimento clínico para o paciente ${app.patientName} (Protocolo ${app.protocol})`,
    module: 'Fila e Recepção',
    ipAddress: '192.168.1.100',
    details: `Atendimento iniciado. Status alterado para Concluído.`,
  };
  auditStore.add(log);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function signAppointmentLaudo(
  appointmentId: string,
  doctorName: string,
  doctorCpf: string
): Promise<void> {
  const db = await initDb();
  const tx = db.transaction(
    [DB_STORES.APPOINTMENTS, DB_STORES.AUDIT_LOGS],
    'readwrite'
  );
  const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
  const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

  const app = await new Promise<Appointment | undefined>((resolve, reject) => {
    const req = appStore.get(appointmentId);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!app) throw new Error('Agendamento não encontrado.');

  const signTime = new Date().toISOString();
  const documentPayload = `${app.id}|${app.protocol}|${app.patientCpf}|${app.examName}|${app.observations}|${signTime}`;

  const hash = await computeSHA256(documentPayload);
  const certSerial =
    'ICP-BR-ID-' + Math.floor(10000000 + Math.random() * 90000000);

  app.digitalSignature = {
    signedBy: doctorName,
    cpf: doctorCpf,
    signedAt: signTime,
    signatureHash: hash,
    certificateSerial: certSerial,
  };

  appStore.put(app);

  const log: AuditLog = {
    id: 'log-' + crypto.randomUUID().slice(0, 8),
    timestamp: signTime,
    userCpf: doctorCpf,
    userName: doctorName,
    action: `Laudo/Triagem de ${app.patientName} (Protocolo ${app.protocol}) assinado digitalmente`,
    module: 'Assinatura Digital',
    ipAddress: '192.168.1.100',
    details: `Assinatura ICP-Brasil vinculada. Série do Certificado: ${certSerial}. Hash SHA-256 do documento: ${hash}`,
  };
  auditStore.add(log);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getTemporaryCapacityLimits(): Promise<
  TemporaryCapacityLimit[]
> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.TEMPORARY_CAPACITY, 'readonly');
    const store = tx.objectStore(DB_STORES.TEMPORARY_CAPACITY);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function createTemporaryCapacityLimit(
  limit: Omit<TemporaryCapacityLimit, 'id'>
): Promise<TemporaryCapacityLimit> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.TEMPORARY_CAPACITY, 'readwrite');
    const store = tx.objectStore(DB_STORES.TEMPORARY_CAPACITY);
    const getAllReq = store.getAll();
    getAllReq.onsuccess = () => {
      const allLimits = getAllReq.result as TemporaryCapacityLimit[];
      const existing = allLimits.find(
        (l) => l.examId === limit.examId && l.date === limit.date
      );
      if (existing) {
        const updated = { ...existing, limit: limit.limit };
        const putReq = store.put(updated);
        putReq.onsuccess = () => resolve(updated);
        putReq.onerror = () => reject(putReq.error);
      } else {
        const newLimit = { ...limit };
        const addReq = store.add(newLimit);
        addReq.onsuccess = (e: any) => {
          const generatedId = e.target.result;
          resolve({ ...newLimit, id: generatedId });
        };
        addReq.onerror = () => reject(addReq.error);
      }
    };
    getAllReq.onerror = () => reject(getAllReq.error);
  });
}

export async function deleteTemporaryCapacityLimit(id: number): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.TEMPORARY_CAPACITY, 'readwrite');
    const store = tx.objectStore(DB_STORES.TEMPORARY_CAPACITY);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCustomPriorities(): Promise<CustomPriority[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CUSTOM_PRIORITIES, 'readonly');
    const store = tx.objectStore(DB_STORES.CUSTOM_PRIORITIES);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function createCustomPriority(
  priority: CustomPriority
): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CUSTOM_PRIORITIES, 'readwrite');
    const store = tx.objectStore(DB_STORES.CUSTOM_PRIORITIES);
    const request = store.put(priority);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCustomPriority(id: string): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.CUSTOM_PRIORITIES, 'readwrite');
    const store = tx.objectStore(DB_STORES.CUSTOM_PRIORITIES);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveFilterCombination(
  name: string,
  filterState: any,
  employeeCpf: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.SAVED_FILTERS, 'readwrite');
    const store = tx.objectStore(DB_STORES.SAVED_FILTERS);
    const item = {
      name,
      filterState,
      employeeCpf,
      createdAt: new Date().toISOString(),
    };
    const request = store.add(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSavedFilters(employeeCpf: string): Promise<any[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.SAVED_FILTERS, 'readonly');
    const store = tx.objectStore(DB_STORES.SAVED_FILTERS);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = (request.result || []).filter(
        (item: any) => item.employeeCpf === employeeCpf
      );
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSavedFilter(id: number): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORES.SAVED_FILTERS, 'readwrite');
    const store = tx.objectStore(DB_STORES.SAVED_FILTERS);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveFeedback(
  feedback: Omit<FeedbackResponse, 'id' | 'createdAt'>
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.FEEDBACKS, DB_STORES.APPOINTMENTS, DB_STORES.AUDIT_LOGS],
      'readwrite'
    );
    const feedbackStore = tx.objectStore(DB_STORES.FEEDBACKS);
    const appStore = tx.objectStore(DB_STORES.APPOINTMENTS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const id = 'fb-' + crypto.randomUUID().slice(0, 8);
    const createdAt = new Date().toISOString();

    const newFeedback: FeedbackResponse = {
      ...feedback,
      id,
      createdAt,
    };

    feedbackStore.add(newFeedback);

    const getAppsReq = appStore.getAll();
    getAppsReq.onsuccess = () => {
      const appointments = getAppsReq.result as Appointment[];
      const app = appointments.find(
        (a) =>
          a.protocol.toUpperCase() ===
          feedback.appointmentProtocol.trim().toUpperCase()
      );

      if (app) {
        app.feedbackNps = feedback.npsScore;
        app.feedbackComment = feedback.comment;
        appStore.put(app);

        const log: AuditLog = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          timestamp: createdAt,
          userCpf: feedback.userCpf,
          userName: app.patientName,
          action: `Envio de feedback NPS ${feedback.npsScore} para o agendamento ${feedback.appointmentProtocol}`,
          module: 'Paciente',
          ipAddress: feedback.originIp,
          details: `Feedback enviado pelo paciente. NPS: ${feedback.npsScore} | Comentário: ${feedback.comment}`,
        };
        auditStore.add(log);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getFeedbacks(): Promise<FeedbackResponse[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORES.FEEDBACKS, 'readonly');
    const store = tx.objectStore(DB_STORES.FEEDBACKS);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFeedbackReply(
  feedbackId: string,
  replyText: string,
  authorCpf: string,
  authorName: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.FEEDBACKS, DB_STORES.AUDIT_LOGS],
      'readwrite'
    );
    const feedbackStore = tx.objectStore(DB_STORES.FEEDBACKS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const getReq = feedbackStore.get(feedbackId);
    getReq.onsuccess = () => {
      const fb = getReq.result as FeedbackResponse;
      if (fb) {
        const isEditing = fb.adminResponse && fb.adminResponse !== replyText;
        const oldResponse = fb.adminResponse || '';
        fb.adminResponse = replyText;
        fb.adminResponseAt = new Date().toISOString();
        fb.adminResponseAuthor = authorName;
        if (fb.isResolved === undefined) {
          fb.isResolved = false;
        }
        feedbackStore.put(fb);

        const log: AuditLog = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          timestamp: new Date().toISOString(),
          userCpf: authorCpf,
          userName: authorName,
          action: isEditing
            ? `Edicao de resposta ao feedback NPS - Protocolo ${fb.appointmentProtocol}`
            : `Resposta ao feedback NPS - Protocolo ${fb.appointmentProtocol}`,
          module: 'Ouvidoria',
          ipAddress: '127.0.0.1',
          details: isEditing
            ? `Resposta anterior: "${oldResponse}" | Nova resposta: "${replyText}"`
            : `Resposta registrada: "${replyText}"`,
          changes: isEditing
            ? {
                adminResponse: { old: oldResponse, new: replyText },
              }
            : undefined,
        };
        auditStore.add(log);
      } else {
        reject(new Error('Feedback não encontrado.'));
      }
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function toggleFeedbackResolution(
  feedbackId: string,
  operatorCpf: string,
  operatorName: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.FEEDBACKS, DB_STORES.AUDIT_LOGS],
      'readwrite'
    );
    const feedbackStore = tx.objectStore(DB_STORES.FEEDBACKS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const getReq = feedbackStore.get(feedbackId);
    getReq.onsuccess = () => {
      const fb = getReq.result as FeedbackResponse;
      if (fb) {
        const oldVal = fb.isResolved || false;
        const newVal = !oldVal;
        fb.isResolved = newVal;
        fb.resolutionStatus = newVal ? 'Resolvido' : 'Pendente';
        fb.resolutionStatusChangedAt = new Date().toISOString();
        fb.resolutionStatusChangedBy = operatorName;
        feedbackStore.put(fb);

        const log: AuditLog = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          timestamp: new Date().toISOString(),
          userCpf: operatorCpf,
          userName: operatorName,
          action: `Alteracao de resolucao de NPS - Protocolo ${fb.appointmentProtocol}`,
          module: 'Ouvidoria',
          ipAddress: '127.0.0.1',
          details: `Status de resolucao alterado de ${
            oldVal ? 'Resolvido' : 'Pendente'
          } para ${newVal ? 'Resolvido' : 'Pendente'}.`,
          changes: { isResolved: { old: oldVal, new: newVal } },
        };
        auditStore.add(log);
      } else {
        reject(new Error('Feedback não encontrado.'));
      }
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function setFeedbackResolutionStatus(
  feedbackId: string,
  targetStatus: 'Pendente' | 'Em andamento' | 'Resolvido',
  operatorCpf: string,
  operatorName: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [DB_STORES.FEEDBACKS, DB_STORES.AUDIT_LOGS],
      'readwrite'
    );
    const feedbackStore = tx.objectStore(DB_STORES.FEEDBACKS);
    const auditStore = tx.objectStore(DB_STORES.AUDIT_LOGS);

    const getReq = feedbackStore.get(feedbackId);
    getReq.onsuccess = () => {
      const fb = getReq.result as FeedbackResponse;
      if (!fb) {
        reject(new Error('Feedback não encontrado.'));
        return;
      }
      const previousStatus =
        fb.resolutionStatus || (fb.isResolved ? 'Resolvido' : 'Pendente');
      fb.resolutionStatus = targetStatus;
      fb.isResolved = targetStatus === 'Resolvido';
      fb.resolutionStatusChangedAt = new Date().toISOString();
      fb.resolutionStatusChangedBy = operatorName;
      feedbackStore.put(fb);

      const log: AuditLog = {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString(),
        userCpf: operatorCpf,
        userName: operatorName,
        action: `Workflow de ouvidoria atualizado - Protocolo ${fb.appointmentProtocol}`,
        module: 'Ouvidoria',
        ipAddress: '127.0.0.1',
        details: `Status alterado de "${previousStatus}" para "${targetStatus}".`,
        changes: {
          resolutionStatus: { old: previousStatus, new: targetStatus },
        },
      };
      auditStore.add(log);
    };
    getReq.onerror = () => reject(getReq.error);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
