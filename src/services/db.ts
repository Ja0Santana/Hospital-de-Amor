import type { Specialty, City, Appointment, PatientUser, SymptomLog } from '../types';

const DB_NAME = 'HospitalAmorDB';
const DB_VERSION = 3;

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
    request.onsuccess = () => {
      dbInstance = request.result;
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
    };
  }).then((db) => {
    return seedData(db);
  });
}

function seedData(db: IDBDatabase): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const tx = db.transaction(['specialties', 'cities', 'appointments', 'users', 'symptoms_diary'], 'readwrite');
    const specStore = tx.objectStore('specialties');
    const cityStore = tx.objectStore('cities');
    const appStore = tx.objectStore('appointments');
    const userStore = tx.objectStore('users');
    const symptomStore = tx.objectStore('symptoms_diary');

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
    throw new Error('CPF já cadastrado no sistema.');
  }

  const newUser: PatientUser = {
    ...user,
    cpf: cleanCpf,
    createdAt: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');
    const request = store.add(newUser);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
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
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['users', 'appointments'], 'readwrite');
    const userStore = tx.objectStore('users');
    const appStore = tx.objectStore('appointments');

    userStore.delete(cleanCpf);

    const req = appStore.getAll();
    req.onsuccess = () => {
      const apps = req.result;
      const userApps = apps.filter((app: any) => app.patientCpf.replace(/\D/g, "") === cleanCpf);
      userApps.forEach((app: any) => {
        appStore.delete(app.id);
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
