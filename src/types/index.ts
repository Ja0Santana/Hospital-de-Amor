export interface Exam {
  id: string;
  name: string;
  defaultPrepInstructions: string;
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
}

export type AppointmentStatus = 'Pendente' | 'Confirmado' | 'Cancelado' | 'Em análise';

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
  observations: string;
  consentLgpd: boolean;
  feedbackNps: number | null;
  feedbackComment: string | null;
  presenceConfirmed?: boolean;
  rescheduledDate?: string;
  rescheduledTime?: string;
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
}

export interface SymptomLog {
  id?: number;
  patientCpf: string;
  mood: string;
  symptoms: string[];
  notes: string;
  createdAt: string;
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
export type UserRole = 'patient' | 'donor' | 'both';

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
  status: 'Confirmada' | 'Pendente' | 'Cancelada' | 'Aguardando Pagamento' | 'Expirado';
  date: string;
  type: 'single' | 'recurring';
  hash: string;
}

export interface DonorPoints {
  donorCpf: string;
  balance: number;
  level: 'Bronze' | 'Prata' | 'Ouro';
}

export interface SupportMessage {
  id: string;
  donorName: string;
  message: string;
  date: string;
  isAuthorized: boolean;
}
