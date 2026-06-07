import type { Specialty, City, Appointment, PatientUser, SymptomLog, ClinicalRecord, Donation, DonorPoints, SupportMessage } from '../types';

const DB_NAME = 'HospitalAmorDB';
const DB_VERSION = 6;

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
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

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
    };
  }).then((db) => {
    return seedData(db);
  });
}

function seedData(db: IDBDatabase): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const tx = db.transaction(['specialties', 'cities', 'appointments', 'users', 'symptoms_diary', 'clinical_history', 'donations', 'donor_points', 'support_messages'], 'readwrite');
    const specStore = tx.objectStore('specialties');
    const cityStore = tx.objectStore('cities');
    const appStore = tx.objectStore('appointments');
    const userStore = tx.objectStore('users');
    const symptomStore = tx.objectStore('symptoms_diary');
    const clinicalStore = tx.objectStore('clinical_history');
    const donationsStore = tx.objectStore('donations');
    const donorPointsStore = tx.objectStore('donor_points');
    const supportMessagesStore = tx.objectStore('support_messages');

    specStore.clear();
    cityStore.clear();

    DEFAULT_SPECIALTIES.forEach((spec) => specStore.put(spec));
    DEFAULT_CITIES.forEach((city) => cityStore.put(city));

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
          level: 'Prata'
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
            date: '2026-05-12T11:00:00.000Z',
            type: 'single',
            hash: 'E2E-PIX-MOCK-1'
          },
          {
            id: 'don-mock-2',
            donorCpf: '98765432100',
            amount: 50.00,
            method: 'Cartão de Crédito',
            status: 'Confirmada',
            date: '2026-05-05T09:00:00.000Z',
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

export async function createAppointment(
  data: Omit<Appointment, 'id' | 'protocol' | 'createdAt' | 'status' | 'feedbackNps' | 'feedbackComment'>
): Promise<Appointment> {
  const db = await initDb();
  const protocol = await generateNextProtocol(db);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const appointment: Appointment = {
    ...data,
    id,
    protocol,
    createdAt,
    status: 'Pendente',
    feedbackNps: null,
    feedbackComment: null
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('appointments', 'readwrite');
    const store = tx.objectStore('appointments');
    const request = store.add(appointment);
    request.onsuccess = () => resolve(appointment);
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
    const tx = db.transaction('appointments', 'readwrite');
    const store = tx.objectStore('appointments');
    const request = store.put(appointment);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
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
  const existing = await getUserByCpf(cleanCpf);

  if (existing) {
    const existingRole = existing.role || 'patient';
    const newRole = user.role || 'patient';

    if (existingRole === newRole || existingRole === 'both') {
      throw new Error('Este CPF já está cadastrado');
    }

    existing.role = 'both';

    return new Promise((resolve, reject) => {
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

  return new Promise((resolve, reject) => {
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
    const tx = db.transaction(['users', 'appointments', 'symptoms_diary', 'clinical_history'], 'readwrite');
    const userStore = tx.objectStore('users');
    const appStore = tx.objectStore('appointments');
    const symptomStore = tx.objectStore('symptoms_diary');
    const clinicalStore = tx.objectStore('clinical_history');

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
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function addDonorPoints(cpf: string, points: number): Promise<void> {
  const db = await initDb();
  const cleanCpf = cpf.replace(/\D/g, "");
  const currentPoints = await getDonorPoints(cleanCpf);
  
  const balance = (currentPoints?.balance || 0) + points;
  let level: 'Bronze' | 'Prata' | 'Ouro' = 'Bronze';
  if (balance > 5000) {
    level = 'Ouro';
  } else if (balance > 1000) {
    level = 'Prata';
  }

  const updatedPoints: DonorPoints = {
    donorCpf: cleanCpf,
    balance,
    level
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
