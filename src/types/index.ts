import type { ReactNode } from 'react';

export interface Exam {
  id: string;
  name: string;
  defaultPrepInstructions: string;
  duration?: number;
  room?: string;
  cost?: number;
  requiresEncaminhamento?: boolean;
  isActive?: boolean;
  maintenanceLimit?: number;
  requiredResources?: string[];
}

export interface Specialty {
  id: string;
  name: string;
  exams: Exam[];
}

export interface City {
  id: string;
  name: string;
  state: string;
  region: string;
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  base64: string;
  status?: 'Pendente' | 'Aprovado' | 'Ilegível' | 'Pendente de Correção';
  feedback?: string;
}

export type AppointmentStatus = 'Pendente' | 'Confirmado' | 'Cancelado' | 'Em análise' | 'Reagendamento Pendente' | 'Aguardando Follow-up' | 'Concluído' | 'Arquivado por Documentação Pendente';

export interface Appointment {
  id: string;
  protocol: string;
  patientName: string;
  patientCpf: string;
  patientBirthDate: string;
  patientPhone: string;
  patientEmail: string;
  state: string;
  city: string;
  specialtyId: string;
  specialtyName: string;
  examId: string;
  examName: string;
  createdAt: string;
  status: AppointmentStatus;
  fileAttachment: FileAttachment | null;
  rejectedFilesHistory?: FileAttachment[];
  observations: string;
  consentLgpd: boolean;
  feedbackNps: number | null;
  feedbackComment: string | null;
  presenceConfirmed?: boolean;
  presenceConfirmedAt?: string;
  rescheduledDate?: string;
  rescheduledTime?: string;
  scheduledRoom?: string;
  scheduledDoctor?: string;
  assignedTo?: string;
  priority?: 'Baixa' | 'Média' | 'Alta';
  followUpDate?: string;
  followUpSuspended?: boolean;
  region?: string;
  isLegalPriority?: boolean;
  originSessionId?: string;
  statusHistory?: Array<{ status: AppointmentStatus; changedAt: string; note?: string }>;
  internalNotes?: Array<{
    id: string;
    authorName: string;
    authorCpf: string;
    text: string;
    timestamp: string;
    isUrgent?: boolean;
  }>;
  rescheduleReason?: string;
  documentReminders?: Array<{ sentAt: string; count: number }>;
  isColdStorage?: boolean;
  waitingListOfferDate?: string;
  waitingListOfferExpiresAt?: string;
  checkInAt?: string;
  attendanceStartedAt?: string;
  pepSyncStatus?: 'synchronized' | 'pending' | 'failed';
  pepRegistryId?: string;
  pepSyncAttempts?: number;
  digitalSignature?: {
    signedBy: string;
    cpf: string;
    signedAt: string;
    signatureHash: string;
    certificateSerial: string;
  };
}

export interface FeedbackResponse {
  id: string;
  appointmentProtocol: string;
  npsScore: number;
  comment: string;
  createdAt: string;
  userCpf: string;
  originSessionId: string;
  originIp: string;
  adminResponse?: string;
  adminResponseAt?: string;
  adminResponseAuthor?: string;
  isResolved?: boolean;
  resolutionStatus?: 'Pendente' | 'Em andamento' | 'Resolvido';
  resolutionStatusChangedAt?: string;
  resolutionStatusChangedBy?: string;
}

export interface PatientUser {
  cpf: string;
  name: string;
  birthDate: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
  role?: UserRole;
  bloodType?: string;
  allergies?: string;
  clinicalDiagnosis?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  photoUrl?: string;
  isActive?: boolean;
  privacyPreferences?: {
    emailNotify: boolean;
    smsNotify: boolean;
    whatsappNotify: boolean;
    npsNotify: boolean;
    newsletterNotify: boolean;
    marketingNotify: boolean;
  };
  lastConsentAt?: string;
  readBooklets?: string[];
  referredBy?: string;
  qualifiedExamIds?: string[];
}

export interface SymptomLog {
  id?: number;
  patientCpf: string;
  mood: string;
  symptoms: string[];
  notes: string;
  createdAt: string;
  symptomIntensities?: Record<string, 'leve' | 'moderado' | 'intenso'>;
  bodyRegions?: string[];
}

export interface ClinicalRecord {
  id?: number;
  patientCpf: string;
  title: string;
  type: 'Exame' | 'Laudo' | 'Receituário';
  date: string;
  specialtyName: string;
  fileAttachment: FileAttachment;
  createdAt: string;
}
export type UserRole = 'patient' | 'donor' | 'both' | 'recepcionista' | 'gestor' | 'auditor';

export interface DonorUser {
  cpf: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
}

export interface Donation {
  id: string;
  donorCpf: string;
  amount: number;
  method: 'Pix' | 'Cartão de Crédito' | 'Boleto' | 'Criptomoedas';
  status: 'Confirmada' | 'Pendente' | 'Cancelada' | 'Aguardando Pagamento' | 'Expirado' | 'Processando' | 'Estornada';
  date: string;
  type: 'single' | 'recurring';
  hash: string;
  projectDestiny?: string;
}

export interface RecurringSubscription {
  id: string;
  donorCpf: string;
  amount: number;
  projectDestiny: string;
  status: 'Ativa' | 'Pausada' | 'Cancelada';
  cardMaskedNumber: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RedeemedBadge {
  id: string;
  badgeId: string;
  name: string;
  cost: number;
  date: string;
  prestigeAtAcquisition: number;
}

export interface DonorPoints {
  donorCpf: string;
  balance: number;
  level: 'Bronze' | 'Prata' | 'Ouro' | 'Platina' | 'Diamante';
  prestige?: number;
  redeemedBadges?: RedeemedBadge[];
}

export interface SupportMessage {
  id: string;
  donorName: string;
  message: string;
  date: string;
  isAuthorized: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userCpf: string;
  userName: string;
  action: string;
  module: string;
  ipAddress: string;
  details: string;
  changes?: Record<string, { old: any; new: any }>;
  hash?: string;
  previousHash?: string;
}

export interface CalendarDay {
  date: string;
  label: string;
  isWorkingDay: boolean;
}

export interface CapacityLimit {
  examId: string;
  dailyLimit: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
}

export interface TemporaryCapacityLimit {
  id: number;
  examId: string;
  date: string;
  limit: number;
}

export interface CustomPriority {
  id: string;
  name: string;
}

export interface CustomRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface TransparencyProject {
  id: string;
  title: string;
  description: string;
  completedDate: string;
  amountRaised: number;
}

export interface TransparencyMonthlyRecord {
  month: string;
  entradas: number;
  saidas: number;
  atendimentos: number;
}

export interface SectorDistribution {
  name: string;
  value: number;
  color: string;
}

export interface TransparencyData {
  id: string;
  lastUpdatedAt: string;
  totalArrecadadoAno: number;
  atendimentosAno: number;
  sectors: SectorDistribution[];
  monthlyRecords: TransparencyMonthlyRecord[];
  projects: TransparencyProject[];
}export interface Email {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  date: string;
  preview: string;
  isRead: boolean;
  body: ReactNode;
  ctaText?: string;
  ctaAction?: string;
}

export interface Unit {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  types: ('Prevenção' | 'Tratamento' | 'Reabilitação')[];
  address: string;
  phone: string;
  hours: string;
  specialties: string[];
}
