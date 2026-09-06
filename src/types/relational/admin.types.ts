export type PepSyncStatus = 'PENDING' | 'SYNCHRONIZED' | 'FAILED';

export type EmailDeliveryStatus = 'QUEUED' | 'SENT' | 'BOUNCED' | 'FAILED';

export type HospitalServiceType =
  | 'PREVENTION'
  | 'TREATMENT'
  | 'REHABILITATION';

export interface Specialty {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  specialtyId: string;
  name: string;
  defaultPrepInstructions: string;
  durationMinutes?: number;
  roomNumber?: string;
  operationalCost?: number;
  requiresEncaminhamento: boolean;
  isActive: boolean;
  maintenanceLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamRequiredResource {
  id: string;
  examId: string;
  resourceName: string;
}

export interface CapacityLimit {
  id: string;
  examId: string;
  dailyLimit: number;
  weeklyLimit?: number;
  monthlyLimit?: number;
  updatedAt: string;
}

export interface TemporaryCapacityLimit {
  id: string;
  examId: string;
  targetDate: string;
  temporaryLimit: number;
  justificationReason?: string;
  createdAt: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  healthRegion: string;
}

export interface HospitalUnit {
  id: string;
  cityId: string;
  name: string;
  physicalAddress: string;
  phoneNumber: string;
  operatingHoursDescription: string;
  latitudeCoordinate: number;
  longitudeCoordinate: number;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalUnitService {
  id: string;
  unitId: string;
  serviceType: HospitalServiceType;
}

export interface HospitalUnitSpecialty {
  unitId: string;
  specialtyId: string;
}

export interface TriageInternalNote {
  id: string;
  appointmentId: string;
  authorStaffUserId: string;
  noteText: string;
  isUrgent: boolean;
  createdAt: string;
}

export interface PatientCheckIn {
  id: string;
  appointmentId: string;
  checkedInAt: string;
  receptionistStaffUserId: string;
  receptionDeskIdentifier?: string;
}

export interface AttendanceSession {
  id: string;
  appointmentId: string;
  professionalStaffUserId: string;
  attendanceStartedAt: string;
  attendanceCompletedAt?: string;
  clinicalSummaryText?: string;
}

export interface PepIntegrationSync {
  id: string;
  appointmentId: string;
  syncStatus: PepSyncStatus;
  pepRegistryIdentifier?: string;
  syncAttemptsCount: number;
  lastAttemptedAt?: string;
  lastErrorMessage?: string;
}

export interface DigitalSignature {
  id: string;
  appointmentId: string;
  signerStaffUserId: string;
  signerCpf: string;
  signedAt: string;
  signatureHash: string;
  certificateSerialNumber: string;
}

export interface CustomPriority {
  id: string;
  priorityName: string;
  descriptionText?: string;
  hexColorCode?: string;
}

export interface SavedTriageFilter {
  id: string;
  staffUserId: string;
  filterName: string;
  filterCriteriaJson: string;
  createdAt: string;
}

export interface InstitutionCalendarDay {
  targetDate: string;
  dayLabel: string;
  isWorkingDay: boolean;
  specialtyId?: string;
  operatingHoursOverride?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorIpAddress: string;
  actionCategory: string;
  targetModule: string;
  actionDescription: string;
  changesPayloadJson?: string;
  logHash: string;
  previousLogHash?: string;
}

export interface TransparencyProject {
  id: string;
  projectTitle: string;
  projectDescription: string;
  completedDate: string;
  totalAmountRaised: number;
  isPublished: boolean;
}

export interface TransparencyMonthlyBalance {
  id: string;
  referenceMonth: string;
  totalIncome: number;
  totalExpenses: number;
  totalAttendancesCount: number;
  publishedAt: string;
}

export interface TransparencySectorAllocation {
  id: string;
  monthlyBalanceId?: string;
  sectorName: string;
  allocatedAmount: number;
  hexDisplayColor: string;
}

export interface EmailOutbox {
  id: string;
  appointmentId?: string;
  recipientEmail: string;
  recipientUserId?: string;
  emailSubject: string;
  emailPreviewText: string;
  bodyHtml: string;
  deliveryStatus: EmailDeliveryStatus;
  sentAt?: string;
  failureErrorMessage?: string;
  createdAt: string;
}

export interface ChatbotInteraction {
  id: string;
  sessionIdentifier: string;
  patientUserId?: string;
  userQueryText: string;
  botResponseText: string;
  topicCategory?: string;
  isResolved: boolean;
  createdAt: string;
}
