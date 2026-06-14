import type { Specialty, City, Appointment, PatientUser, SymptomLog, ClinicalRecord, Donation, DonorPoints, SupportMessage, RecurringSubscription, AuditLog, AppointmentStatus, CalendarDay, CapacityLimit, UserRole, CustomRole, FeedbackResponse } from '../types';

const DB_NAME = 'HospitalAmorDB';
const DB_VERSION = 13;

let dbInstance: IDBDatabase | null = null;


const DEFAULT_SPECIALTIES: Specialty[] = [
  {
    id: 'spec-1',
    name: 'Oncologia',
    exams: [
      { id: 'exam-1-1', name: 'Consulta Oncológica', defaultPrepInstructions: 'Trazer exames de sangue recentes e laudo de biópsia anterior, se houver.' },
      { id: 'exam-1-2', name: 'Biópsia de Mama', defaultPrepInstructions: 'Não usar desodorante, talco ou perfume nas axilas e mamas no dia do exame.' },
      { id: 'exam-1-3', name: 'Biópsia de Próstata', defaultPrepInstructions: 'Realizar preparo intestinal conforme orientação médica e jejum de 4 horas.' }
    ]
  },
  {
    id: 'spec-2',
    name: 'Mastologia',
    exams: [
      { id: 'exam-2-1', name: 'Mamografia Bilateral', defaultPrepInstructions: 'Não utilizar desodorante ou talco na região das mamas e axilas.' },
      { id: 'exam-2-2', name: 'Consulta Mastologia', defaultPrepInstructions: 'Trazer exames de mamografias e ultrassons anteriores para comparação.' }
    ]
  },
  {
    id: 'spec-3',
    name: 'Radiologia',
    exams: [
      { id: 'exam-3-1', name: 'Tomografia Computadorizada', defaultPrepInstructions: 'Jejum absoluto de 4 horas para exames realizados com contraste iodado.' },
      { id: 'exam-3-2', name: 'Ressonância Magnética', defaultPrepInstructions: 'Chegar com 30 minutos de antecedência. Retirar objetos metálicos e brincos.' }
    ]
  },
  {
    id: 'spec-4',
    name: 'Ginecologia',
    exams: [
      { id: 'exam-4-1', name: 'Papanicolau (Prevenção)', defaultPrepInstructions: 'Não ter relações sexuais nas 48 horas anteriores. Evitar duchas ginecológicas.' },
      { id: 'exam-4-2', name: 'Colposcopia', defaultPrepInstructions: 'Não estar menstruada e trazer resultados de exames preventivos recentes.' }
    ]
  }
];

const DEFAULT_CITIES: City[] = [
  { id: 'city-1', name: 'Lagarto', state: 'SE', region: 'Região de Lagarto' },
  { id: 'city-2', name: 'Aracaju', state: 'SE', region: 'Região de Aracaju' },
  { id: 'city-3', name: 'Itabaiana', state: 'SE', region: 'Região de Itabaiana' },
  { id: 'city-4', name: 'Estância', state: 'SE', region: 'Região de Estância' },
  { id: 'city-5', name: 'Propriá', state: 'SE', region: 'Região de Propriá' },
  { id: 'city-6', name: 'Nossa Senhora do Socorro', state: 'SE', region: 'Região de Aracaju' },
  { id: 'city-7', name: 'Simão Dias', state: 'SE', region: 'Região de Lagarto' },
  { id: 'city-8', name: 'Tobias Barreto', state: 'SE', region: 'Região de Lagarto' }
];

export function initDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      reject(new Error('Conexão IndexedDB bloqueada por uma versão antiga aberta. Por favor, recarregue a página ou feche outras abas.'));
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

      if (!db.objectStoreNames.contains('appointments')) {
        db.createObjectStore('appointments', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('specialties')) {
        db.createObjectStore('specialties', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('cities')) {
        db.createObjectStore('cities', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'cpf' });
      }

      if (!db.objectStoreNames.contains('symptoms_diary')) {
        db.createObjectStore('symptoms_diary', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('appointment_drafts')) {
        db.createObjectStore('appointment_drafts', { keyPath: 'cpf' });
      }

      if (!db.objectStoreNames.contains('login_attempts')) {
        db.createObjectStore('login_attempts', { keyPath: 'cpf' });
      }

      if (!db.objectStoreNames.contains('clinical_history')) {
        db.createObjectStore('clinical_history', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('donations')) {
        db.createObjectStore('donations', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('donor_points')) {
        db.createObjectStore('donor_points', { keyPath: 'donorCpf' });
      }

      if (!db.objectStoreNames.contains('support_messages')) {
        db.createObjectStore('support_messages', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('recurring_subscriptions')) {
        db.createObjectStore('recurring_subscriptions', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('audit_logs')) {
        db.createObjectStore('audit_logs', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('calendar_blocks')) {
        db.createObjectStore('calendar_blocks', { keyPath: 'date' });
      }

      if (!db.objectStoreNames.contains('capacity_limits')) {
        db.createObjectStore('capacity_limits', { keyPath: 'examId' });
      }

      if (!db.objectStoreNames.contains('custom_roles')) {
        db.createObjectStore('custom_roles', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('email_queue')) {
        db.createObjectStore('email_queue', { keyPath: 'id', autoIncrement: true });
      }

      if (!db.objectStoreNames.contains('feedbacks')) {
        db.createObjectStore('feedbacks', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('chatbot_queries')) {
        db.createObjectStore('chatbot_queries', { keyPath: 'id', autoIncrement: true });
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
    const tx = db.transaction(['specialties', 'cities', 'appointments', 'users', 'symptoms_diary', 'clinical_history', 'donations', 'donor_points', 'support_messages', 'recurring_subscriptions', 'calendar_blocks', 'capacity_limits', 'custom_roles', 'feedbacks', 'chatbot_queries'], 'readwrite');
    const specStore = tx.objectStore('specialties');
    const cityStore = tx.objectStore('cities');
    const appStore = tx.objectStore('appointments');
    const userStore = tx.objectStore('users');
    const symptomStore = tx.objectStore('symptoms_diary');
    const clinicalStore = tx.objectStore('clinical_history');
    const donationsStore = tx.objectStore('donations');
    const donorPointsStore = tx.objectStore('donor_points');
    const supportMessagesStore = tx.objectStore('support_messages');
    const recurringSubscriptionsStore = tx.objectStore('recurring_subscriptions');

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


    const userReq = userStore.get('12345678900');
    userReq.onsuccess = () => {
      if (!userReq.result) {
        userStore.put({
          cpf: '12345678900',
          name: 'Anna Beatriz',
          birthDate: '1985-08-15',
          email: 'anna.beatriz@email.com',
          phone: '(79) 99999-9999',
          passwordHash: '123456',
          role: 'patient',
          createdAt: new Date().toISOString(),
          bloodType: 'A+',
          allergies: 'Penicilina e Corante Amarelo Tartrazina',
          clinicalDiagnosis: 'Neoplasia Lobular da Mama - Estágio Inicial',
          emergencyContactName: 'Carlos Alberto de Souza',
          emergencyContactPhone: '(79) 98888-8888',
          emergencyContactRelation: 'Cônjuge'
        });
      } else if (!userReq.result.role) {
        const updatedUser = { ...userReq.result, role: 'patient' };
        userStore.put(updatedUser);
      }
    };

    const donorReq = userStore.get('98765432100');
    donorReq.onsuccess = () => {
      if (!donorReq.result) {
        userStore.put({
          cpf: '98765432100',
          name: 'Tiago Silva',
          email: 'tiago.silva@email.com',
          phone: '(79) 99911-0033',
          passwordHash: '123456',
          role: 'donor',
          createdAt: '2026-05-12T10:00:00.000Z'
        });
      }
    };

    const receptionistReq = userStore.get('11122233344');
    receptionistReq.onsuccess = () => {
      if (!receptionistReq.result) {
        userStore.put({
          cpf: '11122233344',
          name: 'Fernanda Recepcionista',
          birthDate: '1990-01-01',
          email: 'fernanda.recepcao@hospitalamor.org.br',
          phone: '(79) 98888-1111',
          passwordHash: '123456',
          role: 'recepcionista',
          isActive: true,
          createdAt: new Date().toISOString()
        });
      }
    };

    const managerReq = userStore.get('22233344455');
    managerReq.onsuccess = () => {
      if (!managerReq.result) {
        userStore.put({
          cpf: '22233344455',
          name: 'Acácio Gestor',
          birthDate: '1980-01-01',
          email: 'acacio.gestao@hospitalamor.org.br',
          phone: '(79) 98888-2222',
          passwordHash: '123456',
          role: 'gestor',
          isActive: true,
          createdAt: new Date().toISOString()
        });
      }
    };

    const auditorReq = userStore.get('33344455566');
    auditorReq.onsuccess = () => {
      if (!auditorReq.result) {
        userStore.put({
          cpf: '33344455566',
          name: 'João Auditor',
          birthDate: '1975-01-01',
          email: 'joao.auditoria@hospitalamor.org.br',
          phone: '(79) 98888-3333',
          passwordHash: '123456',
          role: 'auditor',
          isActive: true,
          createdAt: new Date().toISOString()
        });
      }
    };

    const req = appStore.getAll();
    req.onsuccess = () => {
      if (req.result.length === 0) {
        const mockApps = [
          {
            id: 'mock-app-1',
            protocol: 'HA-2026-0001',
            patientName: 'Anna Beatriz',
            patientCpf: '123.456.789-00',
            patientBirthDate: '1985-08-15',
            patientPhone: '(79) 99999-9999',
            patientEmail: 'anna.beatriz@email.com',
            state: 'SE',
            city: 'Lagarto',
            specialtyId: 'spec-3',
            specialtyName: 'Radiologia',
            examId: 'exam-3-1',
            examName: 'Exame de Sangue Completo',
            createdAt: '2026-01-10T10:00:00.000Z',
            status: 'Pendente',
            fileAttachment: null,
            observations: '',
            consentLgpd: true,
            feedbackNps: null,
            feedbackComment: null
          },
          {
            id: 'mock-app-2',
            protocol: 'HA-2026-0002',
            patientName: 'Anna Beatriz',
            patientCpf: '123.456.789-00',
            patientBirthDate: '1985-08-15',
            patientPhone: '(79) 99999-9999',
            patientEmail: 'anna.beatriz@email.com',
            state: 'SE',
            city: 'Lagarto',
            specialtyId: 'spec-2',
            specialtyName: 'Mastologia',
            examId: 'exam-2-1',
            examName: 'Mamografia Bilateral',
            createdAt: '2026-01-10T10:15:00.000Z',
            status: 'Confirmado',
            fileAttachment: null,
            observations: '',
            consentLgpd: true,
            feedbackNps: null,
            feedbackComment: null
          },
          {
            id: 'mock-app-3',
            protocol: 'HA-2026-0003',
            patientName: 'Anna Beatriz',
            patientCpf: '123.456.789-00',
            patientBirthDate: '1985-08-15',
            patientPhone: '(79) 99999-9999',
            patientEmail: 'anna.beatriz@email.com',
            state: 'SE',
            city: 'Lagarto',
            specialtyId: 'spec-4',
            specialtyName: 'Ginecologia',
            examId: 'exam-4-2',
            examName: 'Consulta Nutricional',
            createdAt: '2026-01-10T10:30:00.000Z',
            status: 'Cancelado',
            fileAttachment: null,
            observations: 'Falta de vaga no período.',
            consentLgpd: true,
            feedbackNps: null,
            feedbackComment: null
          }
        ];
        mockApps.forEach((app) => appStore.put(app));
      }
    };

    const symptomReq = symptomStore.getAll();
    symptomReq.onsuccess = () => {
      if (symptomReq.result.length === 0) {
        const mockSymptoms = [
          {
            patientCpf: '12345678900',
            mood: 'Bem',
            symptoms: ['Fadiga'],
            notes: 'Sentindo um cansaço leve à tarde.',
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            patientCpf: '12345678900',
            mood: 'Ótimo',
            symptoms: [],
            notes: 'Me senti muito bem hoje.',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            patientCpf: '12345678900',
            mood: 'Razoável',
            symptoms: ['Náusea', 'Falta de apetite'],
            notes: 'Enjoo leve após a medicação.',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            patientCpf: '12345678900',
            mood: 'Ruim',
            symptoms: ['Náusea', 'Dor de cabeça'],
            notes: 'Muita indisposição e dor de cabeça.',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            patientCpf: '12345678900',
            mood: 'Razoável',
            symptoms: ['Fadiga'],
            notes: 'Cansaço diminuindo aos poucos.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            patientCpf: '12345678900',
            mood: 'Bem',
            symptoms: [],
            notes: 'Alimentação boa e sem enjoos.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        mockSymptoms.forEach((s) => symptomStore.put(s));
      }
    };

    const clinicalReq = clinicalStore.getAll();
    clinicalReq.onsuccess = () => {
      if (clinicalReq.result.length === 0) {
        const mockHistory = [
          {
            patientCpf: '12345678900',
            title: 'Laudo de Ultrassonografia Mamária',
            type: 'Laudo',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            specialtyName: 'Mastologia',
            fileAttachment: {
              name: 'ultrassonografia_mama_fleury.pdf',
              type: 'application/pdf',
              size: 1250000,
              base64: 'data:application/pdf;base64,JVBERi0xLjQKJ...'
            },
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            patientCpf: '12345678900',
            title: 'Hemograma Completo',
            type: 'Exame',
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            specialtyName: 'Hematologia',
            fileAttachment: {
              name: 'hemograma_sirio_libanes.pdf',
              type: 'application/pdf',
              size: 850000,
              base64: 'data:application/pdf;base64,JVBERi0xLjQKJ...'
            },
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        mockHistory.forEach((record) => clinicalStore.put(record));
      }
    };

    const pointsReq = donorPointsStore.get('98765432100');
    pointsReq.onsuccess = () => {
      if (!pointsReq.result) {
        donorPointsStore.put({
          donorCpf: '98765432100',
          balance: 3450,
          level: 'Prata',
          prestige: 0,
          redeemedBadges: []
        });
      }
    };

    const donReq = donationsStore.getAll();
    donReq.onsuccess = () => {
      if (donReq.result.length === 0) {
        const mockDonations = [
          {
            id: 'don-mock-1',
            donorCpf: '98765432100',
            amount: 150.00,
            method: 'Pix',
            status: 'Confirmada',
            date: '2025-05-12T11:00:00.000Z',
            type: 'single',
            hash: 'E2E-PIX-MOCK-1'
          },
          {
            id: 'don-mock-2',
            donorCpf: '98765432100',
            amount: 50.00,
            method: 'Cartão de Crédito',
            status: 'Confirmada',
            date: '2025-05-05T09:00:00.000Z',
            type: 'recurring',
            hash: 'TX-CARD-MOCK-2'
          }
        ];
        mockDonations.forEach((d) => donationsStore.put(d));
      }
    };

    const msgReq = supportMessagesStore.getAll();
    msgReq.onsuccess = () => {
      if (msgReq.result.length === 0) {
        supportMessagesStore.put({
          id: 'msg-mock-1',
          donorName: 'Tiago',
          message: 'Muita força e fé para todos! Vocês não estão sozinhos nessa caminhada.',
          date: '2026-05-12T12:00:00.000Z',
          isAuthorized: true
        });
      }
    };

    const subReq = recurringSubscriptionsStore.getAll();
    subReq.onsuccess = () => {
      if (subReq.result.length === 0) {
        recurringSubscriptionsStore.put({
          id: 'sub-mock-1',
          donorCpf: '98765432100',
          amount: 50.00,
          projectDestiny: 'Ala Infantil',
          status: 'Ativa',
          cardMaskedNumber: '•••• •••• •••• 4321',
          createdAt: new Date('2026-05-05T09:00:00.000Z').toISOString()
        });
      }
    };

    tx.oncomplete = () => resolve(db);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSpecialties(): Promise<Specialty[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('specialties', 'readonly');
    const store = tx.objectStore('specialties');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCities(): Promise<City[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cities', 'readonly');
    const store = tx.objectStore('cities');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function generateNextProtocol(db: IDBDatabase): Promise<string> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('appointments', 'readonly');
    const store = tx.objectStore('appointments');
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

export async function checkDuplicateRequest(cpf: string, examId: string): Promise<boolean> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise((resolve, reject) => {
    const tx = db.transaction('appointments', 'readonly');
    const store = tx.objectStore('appointments');
    const request = store.getAll();
    request.onsuccess = () => {
      const duplicates = request.result.filter((app) => {
        const matchCpf = app.patientCpf.replace(/\D/g, "") === cleanCpf;
        const matchExam = app.examId === examId;
        const activeStatus = app.status === 'Pendente' || app.status === 'Em análise';
        return matchCpf && matchExam && activeStatus;
      });
      resolve(duplicates.length > 0);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function triggerConfirmationEmail(appointment: Appointment): Promise<void> {
  const db = await initDb();
  const emailItem = {
    recipientEmail: appointment.patientEmail,
    subject: `Confirmação de Solicitação de Agendamento - Protocolo ${appointment.protocol}`,
    body: `Olá, ${appointment.patientName}.\n\nSua solicitação de agendamento para o exame/consulta "${appointment.examName}" (${appointment.specialtyName}) foi registrada com sucesso sob o protocolo ${appointment.protocol} em ${new Date(appointment.createdAt).toLocaleString('pt-BR')}.\n\nVocê pode acompanhar o status desta solicitação pelo Portal do Paciente utilizando o seu CPF ou o número do protocolo.\n\nAtenciosamente,\nHospital de Amor`,
    status: 'pending',
    appointmentProtocol: appointment.protocol
  };

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('email_queue', 'readwrite');
    const store = tx.objectStore('email_queue');
    const request = store.add(emailItem);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function createAppointment(
  data: Omit<Appointment, 'id' | 'protocol' | 'createdAt' | 'status' | 'feedbackNps' | 'feedbackComment'>
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

  const appointment: Appointment = {
    ...data,
    id,
    protocol,
    createdAt,
    status: 'Pendente',
    statusHistory: [{ status: 'Pendente', changedAt: createdAt }],
    feedbackNps: null,
    feedbackComment: null,
    originSessionId
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('appointments', 'readwrite');
    const store = tx.objectStore('appointments');
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

export async function getAppointmentByProtocol(protocol: string): Promise<Appointment | null> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('appointments', 'readonly');
    const store = tx.objectStore('appointments');
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

export async function getAppointmentByCpf(cpf: string): Promise<Appointment[]> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise((resolve, reject) => {
    const tx = db.transaction('appointments', 'readonly');
    const store = tx.objectStore('appointments');
    const request = store.getAll();
    request.onsuccess = () => {
      const matches = request.result.filter(
        (app) => app.patientCpf.replace(/\D/g, "") === cleanCpf
      );
      resolve(matches);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function updateAppointment(appointment: Appointment): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['appointments', 'calendar_blocks', 'capacity_limits'], 'readwrite');
    const appStore = tx.objectStore('appointments');

    const getReq = appStore.get(appointment.id);
    getReq.onsuccess = () => {
      const current = getReq.result as Appointment | undefined;
      if (current) {
        if (current.status !== appointment.status) {
          const history = appointment.statusHistory || current.statusHistory || [];
          appointment.statusHistory = [
            ...history,
            {
              status: appointment.status,
              changedAt: new Date().toISOString(),
              note: appointment.observations
            }
          ];
        } else if (!appointment.statusHistory && current.statusHistory) {
          appointment.statusHistory = current.statusHistory;
        }
      }

      if (appointment.status === 'Reagendamento Pendente' && appointment.rescheduledDate) {
        const date = appointment.rescheduledDate;
        const dateObj = new Date(date + 'T12:00:00');
        const dayOfWeek = dateObj.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          reject(new Error('Agendamentos não são permitidos nos finais de semana.'));
          return;
        }

        const calStore = tx.objectStore('calendar_blocks');
        const calReq = calStore.get(date);
        calReq.onsuccess = () => {
          const block = calReq.result as CalendarDay | undefined;
          if (block && !block.isWorkingDay) {
            reject(new Error(`A data selecionada está bloqueada no calendário: ${block.label}`));
            return;
          }

          const limitStore = tx.objectStore('capacity_limits');
          const limitReq = limitStore.get(appointment.examId);
          limitReq.onsuccess = () => {
            const limitConfig = limitReq.result as CapacityLimit | undefined;
            if (limitConfig) {
              const dailyLimit = limitConfig.dailyLimit;
              const getAllReq = appStore.getAll();
              getAllReq.onsuccess = () => {
                const appointments = getAllReq.result as Appointment[];
                const count = appointments.filter(app => {
                  if (app.id === appointment.id) return false;
                  if (app.examId !== appointment.examId) return false;
                  const appDate = app.rescheduledDate || '';
                  return (app.status === 'Confirmado' || app.status === 'Reagendamento Pendente') && appDate === date;
                }).length;

                if (count >= dailyLimit) {
                  reject(new Error(`Capacidade máxima atingida para o exame "${appointment.examName}" no dia ${new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}. Limite: ${dailyLimit} vagas.`));
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

export async function getUserByCpf(cpf: string): Promise<PatientUser | null> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readonly');
    const store = tx.objectStore('users');
    const request = store.get(cleanCpf);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function createUser(user: Omit<PatientUser, 'createdAt'>): Promise<void> {
  const db = await initDb();
  const cleanCpf = user.cpf.replace(/\D/g, "");

  return new Promise<void>((resolve, reject) => {
    const txCheck = db.transaction('users', 'readonly');
    const storeCheck = txCheck.objectStore('users');
    const getAllReq = storeCheck.getAll();
    getAllReq.onsuccess = () => {
      const allUsers = getAllReq.result as PatientUser[];
      const emailExists = allUsers.some(u => u.email.trim().toLowerCase() === user.email.trim().toLowerCase());
      if (emailExists) {
        reject(new Error('Este e-mail já está cadastrado em outra conta.'));
        return;
      }
      resolve();
    };
    txCheck.onerror = () => reject(txCheck.error);
  }).then(async () => {
    const existing = await getUserByCpf(cleanCpf);
    if (existing) {
      const existingRole = existing.role || 'patient';
      const newRole = user.role || 'patient';

      if (existingRole === newRole || existingRole === 'both') {
        throw new Error('Este CPF já está cadastrado');
      }

      existing.role = 'both';

      return new Promise<void>((resolve, reject) => {
        const stores = newRole === 'donor' ? ['users', 'donor_points'] : ['users'];
        const tx = db.transaction(stores, 'readwrite');
        
        const userStore = tx.objectStore('users');
        userStore.put(existing);

        if (newRole === 'donor') {
          const donorPointsStore = tx.objectStore('donor_points');
          donorPointsStore.put({
            donorCpf: cleanCpf,
            balance: 0,
            level: 'Bronze'
          });
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    const newUser: PatientUser = {
      ...user,
      cpf: cleanCpf,
      createdAt: new Date().toISOString()
    };

    return new Promise<void>((resolve, reject) => {
      const stores = newUser.role === 'donor' ? ['users', 'donor_points'] : ['users'];
      const tx = db.transaction(stores, 'readwrite');
      
      const userStore = tx.objectStore('users');
      userStore.add(newUser);

      if (newUser.role === 'donor') {
        const donorPointsStore = tx.objectStore('donor_points');
        donorPointsStore.put({
          donorCpf: cleanCpf,
          balance: 0,
          level: 'Bronze'
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export async function updateUserPassword(cpf: string, newPassword: string): Promise<void> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  const user = await getUserByCpf(cleanCpf);
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  user.passwordHash = newPassword;

  return new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');
    const request = store.put(user);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function authenticateUser(cpf: string, password: string): Promise<PatientUser | null> {
  const cleanCpf = cpf.replace(/\D/g, "");
  const user = await getUserByCpf(cleanCpf);
  if (!user) {
    return null;
  }
  if (user.passwordHash !== password) {
    return null;
  }
  return user;
}

export async function updatePatientUser(cpf: string, data: Partial<Omit<PatientUser, 'cpf' | 'createdAt'>>): Promise<void> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  const user = await getUserByCpf(cleanCpf);
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  const updatedUser: PatientUser = {
    ...user,
    ...data
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');
    const request = store.put(updatedUser);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

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

export async function addSymptomLog(log: SymptomLog): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('symptoms_diary', 'readwrite');
    const store = tx.objectStore('symptoms_diary');
    const req = store.add(log);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSymptomLogs(patientCpf: string): Promise<SymptomLog[]> {
  const db = await initDb();
  const cleanCpf = patientCpf.replace(/\D/g, "");
  return new Promise<SymptomLog[]>((resolve, reject) => {
    const tx = db.transaction('symptoms_diary', 'readonly');
    const store = tx.objectStore('symptoms_diary');
    const req = store.getAll();
    req.onsuccess = () => {
      const results = (req.result || []) as SymptomLog[];
      const filtered = results
        .filter((log) => log.patientCpf.replace(/\D/g, "") === cleanCpf)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      resolve(filtered);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveAppointmentDraft(cpf: string, data: any): Promise<void> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('appointment_drafts', 'readwrite');
    const store = tx.objectStore('appointment_drafts');
    const req = store.put({
      cpf: cleanCpf,
      data,
      updatedAt: new Date().toISOString()
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAppointmentDraft(cpf: string): Promise<any | null> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise<any | null>((resolve, reject) => {
    const tx = db.transaction('appointment_drafts', 'readonly');
    const store = tx.objectStore('appointment_drafts');
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
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('appointment_drafts', 'readwrite');
    const store = tx.objectStore('appointment_drafts');
    const req = store.delete(cleanCpf);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getLoginAttempts(cpf: string): Promise<{ attemptsCount: number; blockedUntil: string | null } | null> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise((resolve, reject) => {
    const tx = db.transaction('login_attempts', 'readonly');
    const store = tx.objectStore('login_attempts');
    const req = store.get(cleanCpf);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function recordLoginAttempt(cpf: string, isSuccess: boolean): Promise<{ attemptsCount: number; blockedUntil: string | null }> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  const currentRecord = await getLoginAttempts(cleanCpf);

  const record = currentRecord || { cpf: cleanCpf, attemptsCount: 0, blockedUntil: null };

  if (isSuccess) {
    record.attemptsCount = 0;
    record.blockedUntil = null;
  } else {
    record.attemptsCount += 1;
    if (record.attemptsCount >= 5) {
      record.blockedUntil = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    }
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction('login_attempts', 'readwrite');
    const store = tx.objectStore('login_attempts');
    const req = store.put(record);
    req.onsuccess = () => resolve({ attemptsCount: record.attemptsCount, blockedUntil: record.blockedUntil });
    req.onerror = () => reject(req.error);
  });
}

export async function clearLoginAttempts(cpf: string): Promise<void> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('login_attempts', 'readwrite');
    const store = tx.objectStore('login_attempts');
    const req = store.delete(cleanCpf);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function addClinicalRecord(record: ClinicalRecord): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('clinical_history', 'readwrite');
    const store = tx.objectStore('clinical_history');
    const req = store.add(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getClinicalRecords(patientCpf: string): Promise<ClinicalRecord[]> {
  const db = await initDb();
  const cleanCpf = patientCpf.replace(/\D/g, "");
  return new Promise<ClinicalRecord[]>((resolve, reject) => {
    const tx = db.transaction('clinical_history', 'readonly');
    const store = tx.objectStore('clinical_history');
    const req = store.getAll();
    req.onsuccess = () => {
      const results = (req.result || []) as ClinicalRecord[];
      const filtered = results
        .filter((record) => record.patientCpf.replace(/\D/g, "") === cleanCpf)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(filtered);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteClinicalRecord(id: number): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('clinical_history', 'readwrite');
    const store = tx.objectStore('clinical_history');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
export async function createDonation(donation: Donation): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('donations', 'readwrite');
    const store = tx.objectStore('donations');
    const request = store.add(donation);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateDonation(id: string, updates: Partial<Donation>): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('donations', 'readwrite');
    const store = tx.objectStore('donations');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const data = getReq.result;
      if (!data) {
        reject(new Error('Doação não encontrada'));
        return;
      }
      const updated = { ...data, ...updates };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function getDonationsByCpf(cpf: string): Promise<Donation[]> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise<Donation[]>((resolve, reject) => {
    const tx = db.transaction('donations', 'readonly');
    const store = tx.objectStore('donations');
    const request = store.getAll();
    request.onsuccess = () => {
      const results = (request.result || []) as Donation[];
      const filtered = results
        .filter((d) => d.donorCpf.replace(/\D/g, "") === cleanCpf)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(filtered);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getDonorPoints(cpf: string): Promise<DonorPoints | null> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise<DonorPoints | null>((resolve, reject) => {
    const tx = db.transaction('donor_points', 'readonly');
    const store = tx.objectStore('donor_points');
    const request = store.get(cleanCpf);
    request.onsuccess = () => {
      const res = request.result;
      if (res) {
        if (res.prestige === undefined) res.prestige = 0;
        if (!res.redeemedBadges) res.redeemedBadges = [];
      }
      resolve(res || null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function addDonorPoints(cpf: string, points: number): Promise<void> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  const currentPoints = await getDonorPoints(cleanCpf);
  
  const prestige = currentPoints?.prestige || 0;
  const multiplier = 1 + (prestige * 0.10);
  
  const balance = (currentPoints?.balance || 0) + points;
  const spentPoints = currentPoints?.redeemedBadges
    ?.filter((b) => b.prestigeAtAcquisition === prestige)
    ?.reduce((sum, b) => sum + b.cost, 0) || 0;
  const rankPoints = balance + spentPoints;

  let level: 'Bronze' | 'Prata' | 'Ouro' | 'Platina' | 'Diamante' = 'Bronze';
  if (rankPoints >= 30000 * multiplier) {
    level = 'Diamante';
  } else if (rankPoints >= 15000 * multiplier) {
    level = 'Platina';
  } else if (rankPoints >= 5000 * multiplier) {
    level = 'Ouro';
  } else if (rankPoints >= 1000 * multiplier) {
    level = 'Prata';
  }

  const updatedPoints: DonorPoints = {
    donorCpf: cleanCpf,
    balance,
    level,
    prestige,
    redeemedBadges: currentPoints?.redeemedBadges || []
  };

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('donor_points', 'readwrite');
    const store = tx.objectStore('donor_points');
    const request = store.put(updatedPoints);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function redeemDonorBadge(cpf: string, badgeId: string, badgeName: string, cost: number): Promise<void> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  const currentPoints = await getDonorPoints(cleanCpf);
  if (!currentPoints) throw new Error("Pontos não encontrados.");
  
  const balance = currentPoints.balance - cost;
  if (balance < 0) throw new Error("Pontos insuficientes para o resgate.");
  
  const newBadge = {
    id: 'badge-' + crypto.randomUUID().slice(0, 8),
    badgeId,
    name: badgeName,
    cost,
    date: new Date().toISOString(),
    prestigeAtAcquisition: currentPoints.prestige || 0
  };
  
  const badgesList = currentPoints.redeemedBadges || [];
  const currentPrestige = currentPoints.prestige || 0;
  const alreadyRedeemed = badgesList.some(
    (b) => b.badgeId === badgeId && b.prestigeAtAcquisition === currentPrestige
  );
  if (alreadyRedeemed) throw new Error("Este selo já foi resgatado no nível de prestígio atual.");

  const updatedPoints: DonorPoints = {
    ...currentPoints,
    balance,
    redeemedBadges: [...badgesList, newBadge]
  };
  
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('donor_points', 'readwrite');
    const store = tx.objectStore('donor_points');
    const request = store.put(updatedPoints);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function triggerDonorPrestige(cpf: string): Promise<void> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  const currentPoints = await getDonorPoints(cleanCpf);
  if (!currentPoints) throw new Error("Pontos não encontrados.");
  
  const prestige = (currentPoints.prestige || 0) + 1;
  const updatedPoints: DonorPoints = {
    ...currentPoints,
    balance: 0,
    level: 'Bronze',
    prestige
  };
  
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('donor_points', 'readwrite');
    const store = tx.objectStore('donor_points');
    const request = store.put(updatedPoints);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveSupportMessage(msg: SupportMessage): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('support_messages', 'readwrite');
    const store = tx.objectStore('support_messages');
    const request = store.add(msg);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSupportMessages(): Promise<SupportMessage[]> {
  const db = await initDb();
  return new Promise<SupportMessage[]>((resolve, reject) => {
    const tx = db.transaction('support_messages', 'readonly');
    const store = tx.objectStore('support_messages');
    const request = store.getAll();
    request.onsuccess = () => {
      const results = (request.result || []) as SupportMessage[];
      const sorted = results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(sorted);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function createRecurringSubscription(sub: RecurringSubscription): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('recurring_subscriptions', 'readwrite');
    const store = tx.objectStore('recurring_subscriptions');
    const request = store.add(sub);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getRecurringSubscriptionsByCpf(cpf: string): Promise<RecurringSubscription[]> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise<RecurringSubscription[]>((resolve, reject) => {
    const tx = db.transaction('recurring_subscriptions', 'readonly');
    const store = tx.objectStore('recurring_subscriptions');
    const request = store.getAll();
    request.onsuccess = () => {
      const results = (request.result || []) as RecurringSubscription[];
      const filtered = results.filter((sub) => sub.donorCpf.replace(/\D/g, "") === cleanCpf);
      resolve(filtered);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function updateRecurringSubscription(id: string, data: Partial<RecurringSubscription>): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('recurring_subscriptions', 'readwrite');
    const store = tx.objectStore('recurring_subscriptions');
    const getReq = store.get(id);
    
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) {
        reject(new Error('Assinatura não encontrada.'));
        return;
      }
      
      const updated = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteRecurringSubscription(id: string): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('recurring_subscriptions', 'readwrite');
    const store = tx.objectStore('recurring_subscriptions');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAppointmentsForAdmin(): Promise<Appointment[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('appointments', 'readonly');
    const store = tx.objectStore('appointments');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  const db = await initDb();
  const newLog: AuditLog = {
    ...log,
    id: 'log-' + crypto.randomUUID().slice(0, 8),
    timestamp: new Date().toISOString()
  };
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('audit_logs', 'readwrite');
    const store = tx.objectStore('audit_logs');
    const request = store.add(newLog);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('audit_logs', 'readonly');
    const store = tx.objectStore('audit_logs');
    const request = store.getAll();
    request.onsuccess = () => {
      const sorted = (request.result || []).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(sorted);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAllUsersForAdmin(): Promise<PatientUser[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readonly');
    const store = tx.objectStore('users');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteUserAdmin(cpf: string): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');
    const request = store.delete(cpf);
    request.onsuccess = () => resolve();
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
    const tx = db.transaction(['appointments', 'audit_logs'], 'readwrite');
    const appStore = tx.objectStore('appointments');
    const auditStore = tx.objectStore('audit_logs');

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

      appStore.put(app);

      const log: AuditLog = {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString(),
        userCpf: employeeCpf,
        userName: employeeName,
        action: `Alteração de status do agendamento ${app.protocol} de ${oldStatus} para ${status}`,
        module: 'Triagem',
        ipAddress: '192.168.1.100',
        details: `Observações: ${observations}`
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
  employeeName: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['appointments', 'audit_logs', 'calendar_blocks', 'capacity_limits'], 'readwrite');
    const appStore = tx.objectStore('appointments');
    const auditStore = tx.objectStore('audit_logs');
    const calStore = tx.objectStore('calendar_blocks');
    const limitStore = tx.objectStore('capacity_limits');

    // 1. Finais de semana
    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      reject(new Error('Agendamentos não são permitidos nos finais de semana.'));
      return;
    }

    // 2. Feriados / Bloqueios
    const calReq = calStore.get(date);
    calReq.onsuccess = () => {
      const block = calReq.result as CalendarDay | undefined;
      if (block && !block.isWorkingDay) {
        reject(new Error(`A data selecionada está bloqueada no calendário: ${block.label}`));
        return;
      }

      // 3. Capacidade e Conflitos
      const getAllReq = appStore.getAll();
      getAllReq.onsuccess = () => {
        const appointments = getAllReq.result as Appointment[];

        const getCurReq = appStore.get(id);
        getCurReq.onsuccess = () => {
          const currentApp = getCurReq.result as Appointment | undefined;
          if (!currentApp) {
            reject(new Error('Agendamento não encontrado.'));
            return;
          }

          // Validação estrita (RF90) contra sobreposição de horário:
          // Mesma data, mesmo horário, e o mesmo médico ou mesma sala.
          // Ignora o próprio agendamento atual se ele já tiver sido gravado.
          const hasConflict = appointments.some(app => {
            if (app.id === id) return false;
            if (app.status !== 'Confirmado') return false;

            const appDate = app.rescheduledDate || '';
            const appTime = app.rescheduledTime || '';
            
            const isSameDateTime = appDate === date && appTime === time;
            if (!isSameDateTime) return false;

            const isSameDoctor = app.scheduledDoctor && app.scheduledDoctor.trim().toLowerCase() === doctor.trim().toLowerCase();
            const isSameRoom = app.scheduledRoom && app.scheduledRoom.trim().toLowerCase() === room.trim().toLowerCase();

            return isSameDoctor || isSameRoom;
          });

          if (hasConflict) {
            reject(new Error('Conflito de agenda detectado: O médico ou a sala já possuem um agendamento confirmado neste mesmo dia e horário.'));
            return;
          }

          // Verificar capacidade
          const limitReq = limitStore.get(currentApp.examId);
          limitReq.onsuccess = () => {
            const limitConfig = limitReq.result as CapacityLimit | undefined;
            if (limitConfig) {
              const dailyLimit = limitConfig.dailyLimit;
              const count = appointments.filter(app => {
                if (app.id === id) return false;
                if (app.examId !== currentApp.examId) return false;
                const appDate = app.rescheduledDate || '';
                return (app.status === 'Confirmado' || app.status === 'Reagendamento Pendente') && appDate === date;
              }).length;

              if (count >= dailyLimit) {
                reject(new Error(`Capacidade máxima atingida para o exame "${currentApp.examName}" no dia ${new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}. Limite: ${dailyLimit} vagas.`));
                return;
              }

              const newCount = count + 1;
              const usageRatio = newCount / dailyLimit;
              if (usageRatio >= 0.8) {
                const warnLog: AuditLog = {
                  id: 'log-' + crypto.randomUUID().slice(0, 8),
                  timestamp: new Date().toISOString(),
                  userCpf: employeeCpf,
                  userName: employeeName,
                  action: `Alerta de Capacidade: Exame "${currentApp.examName}" atingiu ${Math.round(usageRatio * 100)}% da capacidade máxima no dia ${date} (${newCount}/${dailyLimit} vagas)`,
                  module: 'Configurações',
                  ipAddress: '192.168.1.100',
                  details: `Aviso gerado automaticamente pelo sistema de capacidade.`
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

            appStore.put(currentApp);

            const log: AuditLog = {
              id: 'log-' + crypto.randomUUID().slice(0, 8),
              timestamp: new Date().toISOString(),
              userCpf: employeeCpf,
              userName: employeeName,
              action: `Confirmação de agendamento ${currentApp.protocol} para ${date} às ${time} na sala ${room} com dr(a). ${doctor}`,
              module: 'Agendamento',
              ipAddress: '192.168.1.100',
              details: `Status alterado de ${oldStatus} para Confirmado.`
            };
            auditStore.add(log);
          };
        };
      };
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateUserStatusAdmin(
  cpf: string,
  active: boolean,
  employeeCpf: string,
  employeeName: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['users', 'audit_logs'], 'readwrite');
    const userStore = tx.objectStore('users');
    const auditStore = tx.objectStore('audit_logs');

    const getReq = userStore.get(cpf);
    getReq.onsuccess = () => {
      const user = getReq.result as PatientUser | undefined;
      if (!user) {
        reject(new Error('Usuário não encontrado.'));
        return;
      }

      const oldActive = user.isActive !== false;
      user.isActive = active;
      userStore.put(user);

      const log: AuditLog = {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString(),
        userCpf: employeeCpf,
        userName: employeeName,
        action: `${active ? 'Ativação' : 'Desativação'} do usuário ${user.name} (CPF: ${cpf})`,
        module: 'Controle de Usuários',
        ipAddress: '192.168.1.100',
        details: `Usuário administrativo atualizado pelo gestor.`,
        changes: {
          isActive: { old: oldActive, new: active }
        }
      };
      auditStore.add(log);
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
    const tx = db.transaction(['appointments', 'audit_logs'], 'readwrite');
    const appStore = tx.objectStore('appointments');
    const auditStore = tx.objectStore('audit_logs');

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
        isUrgent
      };

      app.internalNotes.push(newNote);
      appStore.put(app);

      const log: AuditLog = {
        id: 'log-' + crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString(),
        userCpf: employeeCpf,
        userName: employeeName,
        action: `Adição de anotação interna ${newNote.isUrgent ? 'URGENTE ' : ''}no agendamento ${app.protocol}`,
        module: 'Triagem',
        ipAddress: '192.168.1.100',
        details: `Conteúdo da nota: "${text.trim().slice(0, 60)}${text.length > 60 ? '...' : ''}"`
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
    const tx = db.transaction(['appointments', 'audit_logs'], 'readwrite');
    const appStore = tx.objectStore('appointments');
    const auditStore = tx.objectStore('audit_logs');

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
        action: `Alteração de status do agendamento ${app.protocol} de ${oldStatus} para Aguardando Follow-up ${isSuspended ? '(Suspenso)' : ''}`,
        module: 'Triagem',
        ipAddress: '192.168.1.100',
        details: isSuspended ? `Motivo da suspensão: ${reason.trim()}` : `Data limite de retorno: ${date}`
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
    const tx = db.transaction(['appointments', 'audit_logs'], 'readwrite');
    const appStore = tx.objectStore('appointments');
    const auditStore = tx.objectStore('audit_logs');

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
        details: `Operação realizada pelo triador.`
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
  const cleanCpf = cpf.replace(/\D/g, "");
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['users', 'appointments', 'audit_logs'], 'readwrite');
    const userStore = tx.objectStore('users');
    const appStore = tx.objectStore('appointments');
    const auditStore = tx.objectStore('audit_logs');

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
          app => app.patientCpf.replace(/\D/g, "") === cleanCpf
        );

        patientApps.forEach(app => {
          app.patientEmail = email.trim();
          app.patientPhone = phone.trim();
          appStore.put(app);
        });

        const log: AuditLog = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          timestamp: new Date().toISOString(),
          userCpf: employeeCpf,
          userName: employeeName,
          action: `Contato do paciente ${user.name} atualizado (CPF: ${cpf})`,
          module: 'Recepção Rápida',
          ipAddress: '192.168.1.100',
          details: `Telefone: ${oldPhone} -> ${phone.trim()} | E-mail: ${oldEmail} -> ${email.trim()}`
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
    const tx = db.transaction('specialties', 'readwrite');
    const store = tx.objectStore('specialties');
    const request = store.put(specialty);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCalendarDays(): Promise<CalendarDay[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('calendar_blocks', 'readonly');
    const store = tx.objectStore('calendar_blocks');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCalendarDay(day: CalendarDay): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('calendar_blocks', 'readwrite');
    const store = tx.objectStore('calendar_blocks');
    const request = store.put(day);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCalendarDay(date: string): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('calendar_blocks', 'readwrite');
    const store = tx.objectStore('calendar_blocks');
    const request = store.delete(date);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCapacityLimits(): Promise<CapacityLimit[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('capacity_limits', 'readonly');
    const store = tx.objectStore('capacity_limits');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCapacityLimit(limit: CapacityLimit): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('capacity_limits', 'readwrite');
    const store = tx.objectStore('capacity_limits');
    const request = store.put(limit);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function addAuditLogAdmin(
  action: string,
  module: string,
  details: string,
  employeeCpf: string,
  employeeName: string,
  changes?: Record<string, { old: any; new: any }>
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('audit_logs', 'readwrite');
    const store = tx.objectStore('audit_logs');
    const log: AuditLog = {
      id: 'log-' + crypto.randomUUID().slice(0, 8),
      timestamp: new Date().toISOString(),
      userCpf: employeeCpf,
      userName: employeeName,
      action,
      module,
      ipAddress: '192.168.1.100',
      details,
      changes
    };
    const request = store.add(log);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function updateUserAdmin(
  cpf: string,
  updatedData: { name: string; email: string; phone: string; role: UserRole },
  employeeCpf: string,
  employeeName: string
): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['users', 'audit_logs'], 'readwrite');
    const userStore = tx.objectStore('users');
    const auditStore = tx.objectStore('audit_logs');

    const getReq = userStore.get(cpf);
    getReq.onsuccess = () => {
      const user = getReq.result as PatientUser | undefined;
      if (!user) {
        reject(new Error('Usuário não encontrado.'));
        return;
      }

      const allReq = userStore.getAll();
      allReq.onsuccess = () => {
        const allUsers = allReq.result as PatientUser[];
        const emailExists = allUsers.some(u => u.email.trim().toLowerCase() === updatedData.email.trim().toLowerCase() && u.cpf !== cpf);
        if (emailExists) {
          reject(new Error('Este e-mail já está cadastrado em outra conta.'));
          return;
        }

        const oldName = user.name;
        const oldEmail = user.email;
        const oldPhone = user.phone;
        const oldRole = user.role;

        const changes: Record<string, { old: any; new: any }> = {};
        if (oldName !== updatedData.name.trim()) changes.name = { old: oldName, new: updatedData.name.trim() };
        if (oldEmail.toLowerCase() !== updatedData.email.trim().toLowerCase()) changes.email = { old: oldEmail, new: updatedData.email.trim() };
        if (oldPhone !== updatedData.phone.trim()) changes.phone = { old: oldPhone, new: updatedData.phone.trim() };
        if (oldRole !== updatedData.role) changes.role = { old: oldRole, new: updatedData.role };

        user.name = updatedData.name.trim();
        user.email = updatedData.email.trim();
        user.phone = updatedData.phone.trim();
        user.role = updatedData.role;

        userStore.put(user);

        const log: AuditLog = {
          id: 'log-' + crypto.randomUUID().slice(0, 8),
          timestamp: new Date().toISOString(),
          userCpf: employeeCpf,
          userName: employeeName,
          action: `Edição do usuário ${user.name} (CPF: ${cpf})`,
          module: 'Controle de Usuários',
          ipAddress: '192.168.1.100',
          details: `Dados cadastrais atualizados pelo gestor.`,
          changes: Object.keys(changes).length > 0 ? changes : undefined
        };
        auditStore.add(log);
      };
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCustomRoles(): Promise<CustomRole[]> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('custom_roles', 'readonly');
    const store = tx.objectStore('custom_roles');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCustomRole(role: CustomRole): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('custom_roles', 'readwrite');
    const store = tx.objectStore('custom_roles');
    const request = store.put(role);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCustomRole(id: string): Promise<void> {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('custom_roles', 'readwrite');
    const store = tx.objectStore('custom_roles');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  gestor: ['view_appointments', 'confirm_appointments', 'manage_config', 'manage_users', 'view_audit'],
  recepcionista: ['view_appointments', 'confirm_appointments'],
  auditor: ['view_appointments', 'view_audit']
};

export async function getEmployeePermissions(role: string): Promise<string[]> {
  if (DEFAULT_ROLE_PERMISSIONS[role]) {
    return DEFAULT_ROLE_PERMISSIONS[role];
  }
  const roles = await getCustomRoles();
  const custom = roles.find(r => r.id === role);
  return custom ? custom.permissions : [];
}

export async function getAverageTriageTime(): Promise<string> {
  const db = await initDb();
  return new Promise<string>((resolve, reject) => {
    const tx = db.transaction('appointments', 'readonly');
    const store = tx.objectStore('appointments');
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
    const tx = db.transaction('email_queue', 'readonly');
    const store = tx.objectStore('email_queue');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveChatbotQuery(query: string, understood: boolean): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('chatbot_queries', 'readwrite');
    const store = tx.objectStore('chatbot_queries');
    const request = store.add({
      query,
      understood,
      timestamp: new Date().toISOString()
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getTopChatbotQueries(): Promise<any[]> {
  const db = await initDb();
  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction('chatbot_queries', 'readonly');
    const store = tx.objectStore('chatbot_queries');
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result || [];
      const counts: Record<string, { query: string; count: number; understood: boolean }> = {};
      results.forEach((item: any) => {
        const key = item.query.trim().toLowerCase();
        if (counts[key]) {
          counts[key].count++;
        } else {
          counts[key] = { query: item.query, count: 1, understood: item.understood };
        }
      });
      const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
      resolve(sorted);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function processDailyDocumentReminders(): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['appointments', 'email_queue', 'audit_logs'], 'readwrite');
    const appStore = tx.objectStore('appointments');
    const emailStore = tx.objectStore('email_queue');
    const auditStore = tx.objectStore('audit_logs');
    
    const request = appStore.getAll();
    request.onsuccess = () => {
      const appointments = request.result as Appointment[];
      const now = new Date();
      
      for (const app of appointments) {
        if ((app.status === 'Pendente' || app.status === 'Em análise') && app.fileAttachment === null) {
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
                bounced: false
              });
              
              auditStore.add({
                id: 'log-' + crypto.randomUUID().slice(0, 8),
                timestamp: now.toISOString(),
                userCpf: 'SYSTEM',
                userName: 'Sistema de Lembretes',
                action: `Disparo do Lembrete de Documento #1 para o agendamento ${app.protocol}`,
                module: 'Notificações',
                ipAddress: '127.0.0.1',
                details: `E-mail de lembrete enviado para ${app.patientEmail}`
              });
              
              appStore.put(app);
            }
          } else if (reminders.length < 3) {
            const lastReminder = reminders[reminders.length - 1];
            const lastReminderDate = new Date(lastReminder.sentAt);
            const diffDaysSinceLast = (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24);
            
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
                bounced: false
              });
              
              auditStore.add({
                id: 'log-' + crypto.randomUUID().slice(0, 8),
                timestamp: now.toISOString(),
                userCpf: 'SYSTEM',
                userName: 'Sistema de Lembretes',
                action: `Disparo do Lembrete de Documento #${count} para o agendamento ${app.protocol}`,
                module: 'Notificações',
                ipAddress: '127.0.0.1',
                details: `E-mail de lembrete enviado para ${app.patientEmail}`
              });
              
              appStore.put(app);
            }
          } else if (reminders.length === 3) {
            const lastReminder = reminders[2];
            const lastReminderDate = new Date(lastReminder.sentAt);
            const diffHoursSinceLast = (now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60);
            
            if (diffHoursSinceLast >= 24) {
              app.status = 'Arquivado por Documentação Pendente';
              const oldHistory = app.statusHistory || [];
              app.statusHistory = [
                ...oldHistory,
                {
                  status: 'Arquivado por Documentação Pendente',
                  changedAt: now.toISOString(),
                  note: 'Arquivado automaticamente por falta de documentação pendente após 3 lembretes.'
                }
              ];
              
              const subject = `Solicitação Arquivada - Protocolo ${app.protocol}`;
              const body = `Olá, ${app.patientName}.\n\nSua solicitação de agendamento (Protocolo ${app.protocol}) foi ARQUIVADA por falta de documentação obrigatória após 3 tentativas de lembrete.\n\nCaso ainda deseje atendimento, será necessário realizar uma nova solicitação no portal.\n\nAtenciosamente,\nHospital de Amor`;
              
              emailStore.add({
                recipientEmail: app.patientEmail,
                subject,
                body,
                status: 'pending',
                appointmentProtocol: app.protocol,
                bounced: false
              });
              
              auditStore.add({
                id: 'log-' + crypto.randomUUID().slice(0, 8),
                timestamp: now.toISOString(),
                userCpf: 'SYSTEM',
                userName: 'Sistema de Lembretes',
                action: `Arquivamento automático do agendamento ${app.protocol} por falta de documentação`,
                module: 'Triagem',
                ipAddress: '127.0.0.1',
                details: 'Arquivamento após 3 lembretes sem envio de anexo.'
              });
              
              appStore.put(app);
            }
          }
        }
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveFeedback(feedback: Omit<FeedbackResponse, 'id' | 'createdAt'>): Promise<void> {
  const db = await initDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['feedbacks', 'appointments', 'audit_logs'], 'readwrite');
    const feedbackStore = tx.objectStore('feedbacks');
    const appStore = tx.objectStore('appointments');
    const auditStore = tx.objectStore('audit_logs');

    const id = 'fb-' + crypto.randomUUID().slice(0, 8);
    const createdAt = new Date().toISOString();

    const newFeedback: FeedbackResponse = {
      ...feedback,
      id,
      createdAt
    };

    feedbackStore.add(newFeedback);

    const getAppsReq = appStore.getAll();
    getAppsReq.onsuccess = () => {
      const appointments = getAppsReq.result as Appointment[];
      const app = appointments.find(
        (a) => a.protocol.toUpperCase() === feedback.appointmentProtocol.trim().toUpperCase()
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
          details: `Feedback enviado pelo paciente. NPS: ${feedback.npsScore} | Comentário: ${feedback.comment}`
        };
        auditStore.add(log);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
