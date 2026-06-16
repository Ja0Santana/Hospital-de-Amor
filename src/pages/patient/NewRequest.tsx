import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import StepPatientData from './components/StepPatientData';
import StepExamSelection from './components/StepExamSelection';
import StepUploadReview from './components/StepUploadReview';
import { createAppointment, checkDuplicateRequest, getUserByCpf, saveAppointmentDraft, getAppointmentDraft, deleteAppointmentDraft } from '../../services/db';
import { formatCpf } from '../../lib/sanitizer';
import type { FileAttachment } from '../../types';
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Copy, ClipboardCheck } from 'lucide-react';


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
  const [copied, setCopied] = useState(false);

  const [isReadyToSave, setIsReadyToSave] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [draftData, setDraftData] = useState<any | null>(null);
  const [showDraftSavedToast, setShowDraftSavedToast] = useState(false);

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
    if (!isReadyToSave || !patientCpf) return;

    const interval = setInterval(async () => {
      if (successData) return;
      await saveAppointmentDraft(patientCpf, { formData, currentStep });
      setShowDraftSavedToast(true);
      setTimeout(() => setShowDraftSavedToast(false), 3000);
    }, 30000);

    return () => clearInterval(interval);
  }, [isReadyToSave, formData, currentStep, patientCpf, successData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowRestoreModal(false);
        setIsReadyToSave(true);
      }
    };
    if (showRestoreModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showRestoreModal]);

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
    const newErrors: Record<string, string> = {};
    setGlobalError('');

    if (currentStep === 0) {
      if (!formData.patientName.trim()) newErrors.patientName = 'Nome completo é obrigatório.';
      if (!formData.patientCpf.trim()) newErrors.patientCpf = 'CPF é obrigatório.';
      if (!formData.patientBirthDate.trim()) newErrors.patientBirthDate = 'Data de nascimento é obrigatória.';
      if (!formData.patientPhone.trim()) newErrors.patientPhone = 'Telefone para contato é obrigatório.';
      if (!formData.patientEmail.trim()) newErrors.patientEmail = 'E-mail principal é obrigatório.';
      if (!formData.state.trim()) newErrors.state = 'Estado é obrigatório.';
      if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória.';
    } else if (currentStep === 1) {
      if (!formData.specialtyId) newErrors.specialtyId = 'Especialidade médica é obrigatória.';
      if (!formData.examId) newErrors.examId = 'Tipo de exame é obrigatório.';
    } else if (currentStep === 2) {
      if (formData.requiresEncaminhamento && !formData.fileAttachment) newErrors.fileAttachment = 'O upload do encaminhamento médico é obrigatório.';
      if (!formData.consentLgpd) newErrors.consentLgpd = 'Você precisa aceitar a declaração de consentimento de dados (LGPD).';
    }

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


  const handleCopyProtocol = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.protocol);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (successData) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <Card className="border border-zinc-200/80 dark:border-zinc-800 shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-zinc-950">
          <CardContent className="p-8 text-center flex flex-col items-center space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-full border border-green-200/50 dark:border-green-800/30">
              <CheckCircle2 className="w-16 h-16" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Solicitação Enviada!</h1>
              <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                Seu pedido foi registrado com sucesso na fila de triagem médica do Hospital de Amor.
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/80 p-5 rounded-2xl w-full flex flex-col items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Seu Código de Protocolo</span>
              <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 px-4 py-2.5 rounded-xl shadow-sm w-full justify-between">
                <span className="text-lg font-black tracking-wider text-zinc-900 dark:text-zinc-50 font-mono">{successData.protocol}</span>
                <Button variant="ghost" size="icon" onClick={handleCopyProtocol} className="h-9 w-9 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                  {copied ? <ClipboardCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50/20 dark:bg-blue-950/10 border border-blue-200/30 dark:border-blue-800/20 p-4 rounded-2xl text-left w-full space-y-2 text-xs leading-normal">
              <p className="text-zinc-700 dark:text-zinc-400 font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Instruções sobre o Prazo e Próximos Passos:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>O prazo médio de resposta para a triagem administrativa de documentos é de **48 horas úteis**.</li>
                <li>Você receberá alertas automáticos sobre qualquer mudança no status de agendamento.</li>
                <li>Utilize o número do protocolo acima a qualquer momento na opção "Consultar Protocolo" para acompanhar o status e acessar as instruções de preparo do seu exame.</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800/80 p-5 flex justify-center gap-4">
            <Button onClick={() => onNavigate('dashboard')} className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold h-11 text-white rounded-xl">
              Voltar ao Início
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      <div>
        <Button variant="link" onClick={() => onNavigate('dashboard')} className="text-primary p-0 h-auto font-semibold mb-2">
          ← Voltar ao Início
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Solicitar Agendamento</h1>
        <p className="text-zinc-500 mt-1">Preencha o formulário em etapas para enviar o seu encaminhamento.</p>
      </div>

      <div className="flex justify-between items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-6 overflow-x-auto">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx <= currentStep ? 'bg-primary text-white' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-700'}`}>
              {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
            </div>
            <div className="hidden sm:block">
              <span className={`text-xs font-bold block ${idx === currentStep ? 'text-primary' : 'text-zinc-400'}`}>{step.title}</span>
              <span className="text-[10px] text-zinc-400 block">{step.description}</span>
            </div>
            {idx < steps.length - 1 && <ChevronRight className="w-4 h-4 text-zinc-300 hidden sm:block" />}
          </div>
        ))}
      </div>

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
        <CardFooter className="bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800/80 p-5 flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || loading}
            className="h-11 px-5 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-semibold rounded-xl"
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" />
            Anterior
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="h-11 px-5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="h-11 px-6 bg-brand-pink hover:bg-brand-pink/95 text-white font-semibold rounded-xl shadow-md shadow-brand-pink/20"
            >
              {loading ? 'Enviando...' : 'Confirmar e Enviar'}
            </Button>
          )}
        </CardFooter>
      </Card>

      {showRestoreModal && createPortal(
        <div onClick={() => { setShowRestoreModal(false); setIsReadyToSave(true); }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5">
            <div className="flex gap-4 items-start text-left">
              <div className="p-3 bg-primary/10 text-primary rounded-full shrink-0 border border-primary/20">
                <ClipboardCheck className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-50 leading-tight">
                  Recuperar rascunho pendente?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Você possui uma solicitação de agendamento não finalizada. Deseja retomar de onde parou ou iniciar um novo formulário?
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleDiscardDraft}
                className="h-10 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 font-bold rounded-xl text-xs"
              >
                Iniciar Novo
              </Button>
              <Button
                type="button"
                onClick={handleRestoreDraft}
                className="h-10 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 transition-transform active:scale-95"
              >
                Recuperar Rascunho
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showDraftSavedToast && (
        <div className="fixed bottom-4 right-4 bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 z-[9999] border border-zinc-700/30 animate-in fade-in slide-in-from-bottom-5 duration-350">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold font-sans">Rascunho salvo automaticamente</span>
        </div>
      )}
    </div>
  );
}

