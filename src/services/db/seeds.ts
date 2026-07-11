import type {
  Specialty,
  City,
  PatientUser,
  Appointment,
  SymptomLog,
  ClinicalRecord,
  Donation,
  DonorPoints,
  SupportMessage,
  RecurringSubscription,
  TransparencyData,
} from '../../types';

export const DEFAULT_SPECIALTIES: Specialty[] = [
  {
    id: 'spec-1',
    name: 'Oncologia',
    exams: [
      {
        id: 'exam-1-1',
        name: 'Consulta Oncológica',
        defaultPrepInstructions:
          'Trazer exames de sangue recentes e laudo de biópsia anterior, se houver.',
      },
      {
        id: 'exam-1-2',
        name: 'Biópsia de Mama',
        defaultPrepInstructions:
          'Não usar desodorante, talco ou perfume nas axilas e mamas no dia do exame.',
      },
      {
        id: 'exam-1-3',
        name: 'Biópsia de Próstata',
        defaultPrepInstructions:
          'Realizar preparo intestinal conforme orientação médica e jejum de 4 horas.',
      },
    ],
  },
  {
    id: 'spec-2',
    name: 'Mastologia',
    exams: [
      {
        id: 'exam-2-1',
        name: 'Mamografia Bilateral',
        defaultPrepInstructions:
          'Não utilizar desodorante ou talco na região das mamas e axilas.',
      },
      {
        id: 'exam-2-2',
        name: 'Consulta Mastologia',
        defaultPrepInstructions:
          'Trazer exames de mamografias e ultrassons anteriores para comparação.',
      },
    ],
  },
  {
    id: 'spec-3',
    name: 'Radiologia',
    exams: [
      {
        id: 'exam-3-1',
        name: 'Tomografia Computadorizada',
        defaultPrepInstructions:
          'Jejum absoluto de 4 horas para exames realizados com contraste iodado.',
      },
      {
        id: 'exam-3-2',
        name: 'Ressonância Magnética',
        defaultPrepInstructions:
          'Chegar com 30 minutos de antecedência. Retirar objetos metálicos e brincos.',
      },
    ],
  },
  {
    id: 'spec-4',
    name: 'Ginecologia',
    exams: [
      {
        id: 'exam-4-1',
        name: 'Papanicolau (Prevenção)',
        defaultPrepInstructions:
          'Não ter relações sexuais nas 48 horas anteriores. Evitar duchas ginecológicas.',
      },
      {
        id: 'exam-4-2',
        name: 'Colposcopia',
        defaultPrepInstructions:
          'Não estar menstruada e trazer resultados de exames preventivos recentes.',
      },
    ],
  },
];

export const DEFAULT_CITIES: City[] = [
  { id: 'city-1', name: 'Lagarto', state: 'SE', region: 'Região de Lagarto' },
  { id: 'city-2', name: 'Aracaju', state: 'SE', region: 'Região de Aracaju' },
  { id: 'city-3', name: 'Itabaiana', state: 'SE', region: 'Região de Itabaiana' },
  { id: 'city-4', name: 'Estância', state: 'SE', region: 'Região de Estância' },
  { id: 'city-5', name: 'Propriá', state: 'SE', region: 'Região de Propriá' },
  {
    id: 'city-6',
    name: 'Nossa Senhora do Socorro',
    state: 'SE',
    region: 'Região de Aracaju',
  },
  { id: 'city-7', name: 'Simão Dias', state: 'SE', region: 'Região de Lagarto' },
  { id: 'city-8', name: 'Tobias Barreto', state: 'SE', region: 'Região de Lagarto' },
];

export const INITIAL_PATIENT: PatientUser = {
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
  emergencyContactRelation: 'Cônjuge',
};

export const INITIAL_DONOR: PatientUser = {
  cpf: '98765432100',
  name: 'Tiago Silva',
  birthDate: '1990-05-12',
  email: 'tiago.silva@email.com',
  phone: '(79) 99911-0033',
  passwordHash: '123456',
  role: 'donor',
  createdAt: '2026-05-12T10:00:00.000Z',
};

export const INITIAL_RECEPTIONIST: PatientUser = {
  cpf: '11122233344',
  name: 'Fernanda Recepcionista',
  birthDate: '1990-01-01',
  email: 'fernanda.recepcao@hospitalamor.org.br',
  phone: '(79) 98888-1111',
  passwordHash: '123456',
  role: 'recepcionista',
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const INITIAL_MANAGER: PatientUser = {
  cpf: '22233344455',
  name: 'Acácio Gestor',
  birthDate: '1980-01-01',
  email: 'acacio.gestao@hospitalamor.org.br',
  phone: '(79) 98888-2222',
  passwordHash: '123456',
  role: 'gestor',
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const INITIAL_AUDITOR: PatientUser = {
  cpf: '33344455566',
  name: 'João Auditor',
  birthDate: '1975-01-01',
  email: 'joao.auditoria@hospitalamor.org.br',
  phone: '(79) 98888-3333',
  passwordHash: '123456',
  role: 'auditor',
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const getMockAppointments = (): Appointment[] => [
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
    feedbackComment: null,
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
    feedbackComment: null,
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
    observations: 'Falta de vaga no período.',
    consentLgpd: true,
    feedbackNps: null,
    feedbackComment: null,
    fileAttachment: null,
  },
  {
    id: 'mock-app-4',
    protocol: 'HA-2026-0004',
    patientName: 'Anna Beatriz',
    patientCpf: '123.456.789-00',
    patientBirthDate: '1985-08-15',
    patientPhone: '(79) 99999-9999',
    patientEmail: 'anna.beatriz@email.com',
    state: 'SE',
    city: 'Lagarto',
    specialtyId: 'spec-2',
    specialtyName: 'Mastologia',
    examId: 'exam-2-2',
    examName: 'Consulta Mastologia',
    createdAt: '2026-01-12T09:00:00.000Z',
    status: 'Cancelado',
    fileAttachment: {
      name: 'encaminhamento_ilegivel.png',
      type: 'image/png',
      size: 204800,
      base64:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      status: 'Ilegível',
      feedback:
        'O encaminhamento médico anexado possui rasuras na data de emissão. Favor anexar uma cópia legível.',
    },
    observations:
      'Documentação Ilegível: A foto do encaminhamento médico anexada está borrada e impossibilita a leitura do carimbo do profissional de saúde.',
    consentLgpd: true,
    feedbackNps: null,
    feedbackComment: null,
  },
  {
    id: 'mock-app-5',
    protocol: 'HA-2026-0005',
    patientName: 'Roberto Carlos da Silva',
    patientCpf: '987.654.321-09',
    patientBirthDate: '1970-11-25',
    patientPhone: '(79) 98888-8888',
    patientEmail: 'roberto.carlos@email.com',
    state: 'SE',
    city: 'Aracaju',
    specialtyId: 'spec-3',
    specialtyName: 'Radiologia',
    examId: 'exam-3-1',
    examName: 'Exame de Sangue Completo',
    createdAt: '2026-01-12T09:00:00.000Z',
    status: 'Confirmado',
    rescheduledDate: new Date().toISOString().split('T')[0],
    rescheduledTime: '14:30',
    scheduledRoom: 'Sala de Coleta 2',
    scheduledDoctor: 'Dr. Roberto Santos',
    fileAttachment: null,
    observations: '',
    consentLgpd: true,
    feedbackNps: null,
    feedbackComment: null,
    checkInAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-app-6',
    protocol: 'HA-2026-0006',
    patientName: 'Maria Antônia Mendonça',
    patientCpf: '456.789.012-34',
    patientBirthDate: '1965-05-14',
    patientPhone: '(79) 97777-7777',
    patientEmail: 'maria.antonia@email.com',
    state: 'SE',
    city: 'Itabaiana',
    specialtyId: 'spec-2',
    specialtyName: 'Mastologia',
    examId: 'exam-2-1',
    examName: 'Mamografia Bilateral',
    createdAt: '2026-01-13T10:00:00.000Z',
    status: 'Confirmado',
    rescheduledDate: new Date().toISOString().split('T')[0],
    rescheduledTime: '15:00',
    scheduledRoom: 'Sala de Mamografia 1',
    scheduledDoctor: 'Dra. Patricia Arantes',
    fileAttachment: null,
    observations: '',
    consentLgpd: true,
    feedbackNps: null,
    feedbackComment: null,
    checkInAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-app-7',
    protocol: 'HA-2026-0007',
    patientName: 'Julio Cesar de Almeida',
    patientCpf: '111.222.333-44',
    patientBirthDate: '1990-02-10',
    patientPhone: '(79) 96666-6666',
    patientEmail: 'julio.cesar@email.com',
    state: 'SE',
    city: 'Lagarto',
    specialtyId: 'spec-3',
    specialtyName: 'Radiologia',
    examId: 'exam-3-1',
    examName: 'Exame de Sangue Completo',
    createdAt: '2026-01-13T10:30:00.000Z',
    status: 'Confirmado',
    rescheduledDate: new Date().toISOString().split('T')[0],
    rescheduledTime: '15:30',
    scheduledRoom: 'Sala de Coleta 2',
    scheduledDoctor: 'Dr. Roberto Santos',
    fileAttachment: null,
    observations: '',
    consentLgpd: true,
    feedbackNps: null,
    feedbackComment: null,
    checkInAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
];

export const getMockSymptoms = (): Omit<SymptomLog, 'id'>[] => [
  {
    patientCpf: '12345678900',
    mood: 'Bem',
    symptoms: ['Fadiga'],
    notes: 'Sentindo um cansaço leve à tarde.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    patientCpf: '12345678900',
    mood: 'Ótimo',
    symptoms: [],
    notes: 'Me senti muito bem hoje.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    patientCpf: '12345678900',
    mood: 'Razoável',
    symptoms: ['Náusea', 'Falta de apetite'],
    notes: 'Enjoo leve após a medicação.',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    patientCpf: '12345678900',
    mood: 'Ruim',
    symptoms: ['Náusea', 'Dor de cabeça'],
    notes: 'Muita indisposição e dor de cabeça.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    patientCpf: '12345678900',
    mood: 'Razoável',
    symptoms: ['Fadiga'],
    notes: 'Cansaço diminuindo aos poucos.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    patientCpf: '12345678900',
    mood: 'Bem',
    symptoms: [],
    notes: 'Alimentação boa e sem enjoos.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const getMockClinicalHistory = (): Omit<ClinicalRecord, 'id'>[] => [
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
      base64: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
    },
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
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
      base64: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
    },
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_POINTS: DonorPoints = {
  donorCpf: '98765432100',
  balance: 3450,
  level: 'Prata',
  prestige: 0,
  redeemedBadges: [],
};

export const getMockDonations = (): Donation[] => [
  {
    id: 'don-mock-1',
    donorCpf: '98765432100',
    amount: 150.0,
    method: 'Pix',
    status: 'Confirmada',
    date: '2025-05-12T11:00:00.000Z',
    type: 'single',
    hash: 'E2E-PIX-MOCK-1',
  },
  {
    id: 'don-mock-2',
    donorCpf: '98765432100',
    amount: 50.0,
    method: 'Cartão de Crédito',
    status: 'Confirmada',
    date: '2025-05-05T09:00:00.000Z',
    type: 'recurring',
    hash: 'TX-CARD-MOCK-2',
  },
];

export const INITIAL_SUPPORT_MESSAGE: SupportMessage = {
  id: 'msg-mock-1',
  donorName: 'Tiago',
  message: 'Muita força e fé para todos! Vocês não estão sozinhos nessa caminhada.',
  date: '2026-05-12T12:00:00.000Z',
  isAuthorized: true,
};

export const INITIAL_RECURRING_SUBSCRIPTION: RecurringSubscription = {
  id: 'sub-mock-1',
  donorCpf: '98765432100',
  amount: 50.0,
  projectDestiny: 'Ala Infantil',
  status: 'Ativa',
  cardMaskedNumber: '•••• •••• •••• 4321',
  createdAt: new Date('2026-05-05T09:00:00.000Z').toISOString(),
};

export const getInitialTransparencyData = (): TransparencyData => ({
  id: 'active',
  lastUpdatedAt: new Date().toISOString(),
  totalArrecadadoAno: 1250000,
  atendimentosAno: 4800,
  sectors: [
    { name: 'Oncologia', value: 45, color: '#e31463' },
    { name: 'Mastologia', value: 25, color: '#f472b6' },
    { name: 'Radiologia', value: 15, color: '#3b82f6' },
    { name: 'Geral', value: 15, color: '#10b981' },
  ],
  monthlyRecords: [
    { month: 'Jan', entradas: 180000, saidas: 150000, atendimentos: 750 },
    { month: 'Fev', entradas: 210000, saidas: 170000, atendimentos: 800 },
    { month: 'Mar', entradas: 195000, saidas: 160000, atendimentos: 780 },
    { month: 'Abr', entradas: 220000, saidas: 185000, atendimentos: 820 },
    { month: 'Mai', entradas: 235000, saidas: 190000, atendimentos: 850 },
    { month: 'Jun', entradas: 210000, saidas: 175000, atendimentos: 800 },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Construção da Nova Ala de Quimioterapia Pediátrica',
      description:
        'Expansão da capacidade de atendimento infantil com 15 novos leitos e brinquedoteca equipada.',
      completedDate: '2026-03-15',
      amountRaised: 450000,
    },
    {
      id: 'proj-2',
      title: 'Aquisição de Acelerador Linear para Radioterapia',
      description:
        'Equipamento de última geração para tratamento radioterápico mais preciso e rápido.',
      completedDate: '2026-05-10',
      amountRaised: 800000,
    },
  ],
});
