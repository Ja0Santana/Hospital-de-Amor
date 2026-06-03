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

