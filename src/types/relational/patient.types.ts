export type BloodType =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'UNDER_ANALYSIS'
  | 'RESCHEDULE_PENDING'
  | 'AWAITING_FOLLOW_UP'
  | 'COMPLETED'
  | 'ARCHIVED_PENDING_DOCS';

export type AppointmentPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type AttachmentReviewStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'ILLEGIBLE'
  | 'CORRECTION_REQUIRED';

export type WaitlistOfferStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export type SymptomIntensityLevel = 'MILD' | 'MODERATE' | 'SEVERE';

export type ClinicalRecordType = 'EXAM' | 'REPORT' | 'PRESCRIPTION';

export type FeedbackResolutionStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'RESOLVED';

export interface PatientProfile {
  userId: string;
  birthDate: string;
  bloodType?: BloodType;
  knownAllergies?: string;
  clinicalDiagnosis?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  photoUrl?: string;
  referredBy?: string;
  lastConsentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientPrivacyPreference {
  userId: string;
  shouldNotifyByEmail: boolean;
  shouldNotifyBySms: boolean;
  shouldNotifyByWhatsapp: boolean;
  shouldNotifyForNps: boolean;
  shouldReceiveNewsletter: boolean;
  shouldReceiveMarketing: boolean;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  protocolNumber: string;
  patientUserId: string;
  examId: string;
  cityId: string;
  status: AppointmentStatus;
  priorityLevel: AppointmentPriority;
  isLegalPriority: boolean;
  clinicalObservations?: string;
  hasLgpdConsent: boolean;
  originSessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentStatusHistory {
  id: string;
  appointmentId: string;
  status: AppointmentStatus;
  changedByStaffUserId?: string;
  changeNotes?: string;
  changedAt: string;
}

export interface AppointmentSchedule {
  appointmentId: string;
  hospitalUnitId?: string;
  scheduledDoctorUserId?: string;
  scheduledRoom?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  isPresenceConfirmed: boolean;
  presenceConfirmedAt?: string;
  rescheduledDate?: string;
  rescheduledTime?: string;
  rescheduleReason?: string;
  updatedAt: string;
}

export interface AppointmentAttachment {
  id: string;
  appointmentId: string;
  fileName: string;
  fileMimeType: string;
  fileSizeBytes: number;
  storagePath: string;
  reviewStatus: AttachmentReviewStatus;
  reviewedByStaffUserId?: string;
  reviewFeedback?: string;
  isRejected: boolean;
  supersededByAttachmentId?: string;
  uploadedAt: string;
}

export interface WaitlistOffer {
  id: string;
  appointmentId: string;
  offeredDate: string;
  offeredTime: string;
  offerExpiresAt: string;
  status: WaitlistOfferStatus;
  respondedAt?: string;
  createdAt: string;
}

export interface AppointmentFeedback {
  id: string;
  appointmentId: string;
  patientUserId: string;
  npsScore: number;
  commentText?: string;
  originSessionId: string;
  originIpAddress: string;
  adminResponseText?: string;
  adminResponseAt?: string;
  adminResponderUserId?: string;
  resolutionStatus: FeedbackResolutionStatus;
  resolvedAt?: string;
  resolvedByUserId?: string;
  createdAt: string;
}

export interface SymptomDiaryEntry {
  id: string;
  patientUserId: string;
  moodLevel: string;
  generalNotes?: string;
  registeredAt: string;
}

export interface SymptomDiaryItem {
  id: string;
  diaryEntryId: string;
  symptomName: string;
  intensityLevel: SymptomIntensityLevel;
}

export interface SymptomDiaryBodyRegion {
  id: string;
  diaryEntryId: string;
  bodyRegionName: string;
}

export interface PatientClinicalRecord {
  id: string;
  patientUserId: string;
  specialtyId: string;
  title: string;
  recordType: ClinicalRecordType;
  recordDate: string;
  attachmentFileName: string;
  attachmentMimeType: string;
  attachmentSizeBytes: number;
  attachmentStoragePath: string;
  createdAt: string;
}

export interface PatientReadBooklet {
  id: string;
  patientUserId: string;
  bookletId: string;
  readAt: string;
}

export interface AppointmentDraft {
  patientUserId: string;
  draftPayloadJson: string;
  updatedAt: string;
}
