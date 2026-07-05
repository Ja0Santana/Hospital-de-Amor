import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/Alert';
import StepPatientData from './components/StepPatientData';
import StepExamSelection from './components/StepExamSelection';
import StepUploadReview from './components/StepUploadReview';
import { 
  createAppointment, 
  checkDuplicateRequest, 
  getUserByCpf, 
  saveAppointmentDraft, 
  getAppointmentDraft, 
  deleteAppointmentDraft 
} from '../../services/db';
import { formatCpf } from '../../lib/sanitizer';
import type { FileAttachment } from '../../types';
import { AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';

import { validateStepData } from './components/requestValidation';
import RequestStepsTimeline from './components/RequestStepsTimeline';
import RequestSuccessPanel from './components/RequestSuccessPanel';
import RestoreDraftModal from './components/RestoreDraftModal';

interface NewRequestProps {
  onNavigate: (page: string) => void;
  patientCpf: string;
}

const INITIAL_FORM_DATA = {
  patientName: '',
  patientCpf: '',
  patientBirthDate: '',
  patientPhone: '',
  patientEmail: '',
  state: '',
  city: '',
  region: '',
  isLegalPriority: false,
  specialtyId: '',
  specialtyName: '',
  examId: '',
  examName: '',
  fileAttachment: null as FileAttachment | null,
  consentLgpd: false,
  observations: '',
  requiresEncaminhamento: true
};

export default function NewRequest({ onNavigate, patientCpf }: NewRequestProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ protocol: string } | null>(null);

  const [isReadyToSave, setIsReadyToSave] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [draftData, setDraftData] = useState<any | null>(null);

  useEffect(() => {
    const initForm = async () => {
      if (!patientCpf) return;
      try {
        const cleanCpf = patientCpf.replace(/\D/g, "");
        const user = await getUserByCpf(cleanCpf);
        let baseData = { ...INITIAL_FORM_DATA };
        if (user) {
          baseData = {
            ...baseData,
            patientName: user.name,
            patientCpf: formatCpf(user.cpf),
            patientBirthDate: user.birthDate,
            patientPhone: user.phone,
            patientEmail: user.email
          };
        }
        setFormData(baseData);

        const draft = await getAppointmentDraft(patientCpf);
        if (draft) {
          setDraftData(draft);
          setShowRestoreModal(true);
        } else {
          setIsReadyToSave(true);
        }
      } catch (err) {
        console.error(err);
        setIsReadyToSave(true);
      }
    };
    initForm();
  }, [patientCpf]);

  useEffect(() => {
    if (!isReadyToSave || !patientCpf || loading || successData) return;

    const interval = setInterval(async () => {
      await saveAppointmentDraft(patientCpf, { formData, currentStep });
    }, 30000);

    return () => clearInterval(interval);
  }, [isReadyToSave, formData, currentStep, patientCpf, successData, loading]);

  const handleRestoreDraft = () => {
    if (draftData) {
      setFormData(draftData.formData);
      setCurrentStep(draftData.currentStep);
    }
    setShowRestoreModal(false);
    setIsReadyToSave(true);
  };

  const handleDiscardDraft = async () => {
    if (patientCpf) {
      await deleteAppointmentDraft(patientCpf);
    }
    setShowRestoreModal(false);
    setIsReadyToSave(true);
  };

  const steps = [
    { title: 'Dados Básicos', description: 'Identificação e Contato' },
    { title: 'Atendimento', description: 'Especialidade e Exame' },
    { title: 'Documentos e Revisão', description: 'Upload e Consentimento' }
  ];

  const handleFormChange = (data: Partial<typeof INITIAL_FORM_DATA>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleExamChange = (data: { specialtyId: string; specialtyName: string; examId: string; examName: string; requiresEncaminhamento?: boolean }) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateStep = async (): Promise<boolean> => {
    setGlobalError('');
    const newErrors = validateStepData(currentStep, formData);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return false;

    if (currentStep === 1) {
      setLoading(true);
      try {
        const isDuplicate = await checkDuplicateRequest(formData.patientCpf, formData.examId);
        if (isDuplicate) {
          setGlobalError(
            `Você já possui uma solicitação ativa ("Pendente" ou "Em análise") para o exame "${formData.examName}" associada a este CPF. Não é permitido criar solicitações idênticas em andamento.`
          );
          setLoading(false);
          return false;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    return true;
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (patientCpf) {
        await saveAppointmentDraft(patientCpf, { formData, currentStep: nextStep });
      }
    }
  };

  const handleBack = async () => {
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    if (patientCpf) {
      await saveAppointmentDraft(patientCpf, { formData, currentStep: prevStep });
    }
  };

  const handleSubmit = async () => {
    const isValid = await validateStep();
    if (!isValid) return;

    setLoading(true);
    try {
      const result = await createAppointment({
        patientName: formData.patientName,
        patientCpf: formData.patientCpf,
        patientBirthDate: formData.patientBirthDate,
        patientPhone: formData.patientPhone,
        patientEmail: formData.patientEmail,
        state: formData.state,
        city: formData.city,
        region: formData.region,
        isLegalPriority: formData.isLegalPriority,
        specialtyId: formData.specialtyId,
        specialtyName: formData.specialtyName,
        examId: formData.examId,
        examName: formData.examName,
        fileAttachment: formData.fileAttachment,
        consentLgpd: formData.consentLgpd,
        observations: formData.observations
      });

      if (patientCpf) {
        await deleteAppointmentDraft(patientCpf);
      }
      setSuccessData({ protocol: result.protocol });
    } catch (err) {
      console.error(err);
      setGlobalError('Ocorreu um erro ao registrar sua solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return <RequestSuccessPanel protocol={successData.protocol} onNavigate={onNavigate} />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      <div>
        <Button variant="link" onClick={() => onNavigate('dashboard')} className="text-primary p-0 h-auto font-semibold mb-2">
          ← Voltar ao Início
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-55">Solicitar Agendamento</h1>
        <p className="text-zinc-500 mt-1">Preencha o formulário em etapas para enviar o seu encaminhamento.</p>
      </div>

      <RequestStepsTimeline currentStep={currentStep} steps={steps} />

      {globalError && (
        <Alert variant="destructive" className="border-red-200 bg-red-50/10 rounded-2xl">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle className="font-bold">Aviso Importante</AlertTitle>
          <AlertDescription className="text-xs leading-normal">{globalError}</AlertDescription>
        </Alert>
      )}

      <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
        <CardContent className="p-6 md:p-8">
          {currentStep === 0 && (
            <StepPatientData
              formData={formData}
              onChange={handleFormChange}
              errors={errors}
              setErrors={setErrors}
            />
          )}
          {currentStep === 1 && (
            <StepExamSelection
              formData={formData}
              onChange={handleExamChange}
              errors={errors}
              setErrors={setErrors}
            />
          )}
          {currentStep === 2 && (
            <StepUploadReview
              formData={formData}
              onChange={handleFormChange}
              onEditStep={setCurrentStep}
              errors={errors}
              setErrors={setErrors}
            />
          )}
        </CardContent>
        <div className="bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800/80 px-6 md:px-8 py-5 w-full box-border">
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 sm:gap-4 w-full box-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
              className="h-11 px-5 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-semibold rounded-xl w-full sm:w-auto"
            >
              <ChevronLeft className="w-4 h-4 mr-1.5" />
              Anterior
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="h-11 px-5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl border border-transparent w-full sm:w-auto"
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="h-11 px-6 bg-brand-pink hover:bg-brand-pink/95 text-white font-semibold rounded-xl shadow-md shadow-brand-pink/20 border border-transparent w-full sm:w-auto"
              >
                {loading ? 'Enviando...' : 'Confirmar e Enviar'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <RestoreDraftModal
        isOpen={showRestoreModal}
        onClose={() => { setShowRestoreModal(false); setIsReadyToSave(true); }}
        onRestoreDraft={handleRestoreDraft}
        onDiscardDraft={handleDiscardDraft}
      />
    </div>
  );
}
