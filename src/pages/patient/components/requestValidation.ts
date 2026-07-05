import type { FileAttachment } from '../../../types';

export interface RequestFormData {
  patientName: string;
  patientCpf: string;
  patientBirthDate: string;
  patientPhone: string;
  patientEmail: string;
  state: string;
  city: string;
  region: string;
  isLegalPriority: boolean;
  specialtyId: string;
  specialtyName: string;
  examId: string;
  examName: string;
  fileAttachment: FileAttachment | null;
  consentLgpd: boolean;
  observations: string;
  requiresEncaminhamento: boolean;
}

export function validateStepData(
  currentStep: number,
  formData: RequestFormData
): Record<string, string> {
  const newErrors: Record<string, string> = {};

  if (currentStep === 0) {
    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Nome completo é obrigatório.';
    }
    if (!formData.patientCpf.trim()) {
      newErrors.patientCpf = 'CPF é obrigatório.';
    }
    if (!formData.patientBirthDate.trim()) {
      newErrors.patientBirthDate = 'Data de nascimento é obrigatória.';
    }
    if (!formData.patientPhone.trim()) {
      newErrors.patientPhone = 'Telefone para contato é obrigatório.';
    }
    if (!formData.patientEmail.trim()) {
      newErrors.patientEmail = 'E-mail principal é obrigatório.';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'Estado é obrigatório.';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória.';
    }
  } else if (currentStep === 1) {
    if (!formData.specialtyId) {
      newErrors.specialtyId = 'Especialidade médica é obrigatória.';
    }
    if (!formData.examId) {
      newErrors.examId = 'Tipo de exame é obrigatório.';
    }
  } else if (currentStep === 2) {
    if (formData.requiresEncaminhamento && !formData.fileAttachment) {
      newErrors.fileAttachment = 'O upload do encaminhamento médico é obrigatório.';
    }
    if (!formData.consentLgpd) {
      newErrors.consentLgpd = 'Você precisa aceitar a declaração de consentimento de dados (LGPD).';
    }
  }

  return newErrors;
}
