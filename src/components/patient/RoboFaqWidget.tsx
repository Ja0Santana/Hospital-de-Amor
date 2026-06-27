import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Sparkles } from 'lucide-react';
import { saveChatbotQuery, getSpecialties, getCities, getUserByCpf, checkDuplicateRequest, createAppointment } from '../../services/db';
import type { Specialty, City, Exam, FileAttachment, PatientUser } from '../../types';
import { MinimizedBubble } from './MinimizedBubble';
import { ClosedWidgetButton } from './ClosedWidgetButton';
import { ChatSuggestions } from './ChatSuggestions';
import { ChatInputForm } from './ChatInputForm';
import { ChatMessagesList } from './ChatMessagesList';
import type { ChatMessage } from './ChatMessagesList';

interface RoboFaqWidgetProps {
  onNavigate?: (page: string) => void;
  patientCpf?: string;
  patientName?: string;
}

export default function RoboFaqWidget({ onNavigate, patientCpf = '', patientName = '' }: RoboFaqWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(() => sessionStorage.getItem('robofaq-widget-hidden') === 'true');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Olá! Sou o Robo-FAQ. Tire suas dúvidas sobre preparo de exames, febre pós-quimioterapia, transporte municipal ou direitos do paciente. Como posso ajudar?', timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [schedulingStep, setSchedulingStep] = useState<
    'none' | 'confirm_method' | 'select_state' | 'select_city' | 'input_custom_city' | 'select_specialty' | 'select_exam' | 'upload_file' | 'consent_lgpd' | 'completed'
  >('none');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [attachedFile, setAttachedFile] = useState<FileAttachment | null>(null);
  const [patientUser, setPatientUser] = useState<PatientUser | null>(null);

  useEffect(() => {
    if (patientCpf) {
      getUserByCpf(patientCpf).then(setPatientUser).catch(console.error);
    }
    getSpecialties().then(setSpecialties).catch(console.error);
    getCities().then(setCities).catch(console.error);
  }, [patientCpf]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isBotTyping, isOpen]);

  useEffect(() => {
    const handleVisibility = () => {
      setIsHidden(sessionStorage.getItem('robofaq-widget-hidden') === 'true');
    };
    window.addEventListener('robofaq-visibility-change', handleVisibility);
    return () => window.removeEventListener('robofaq-visibility-change', handleVisibility);
  }, []);

  const getBotResponse = (userText: string): string => {
    const text = userText.toLowerCase();

    if (text.includes('mamografia') || text.includes('preparo de mama') || text.includes('talco') || text.includes('desodorante')) {
      return 'Mamografia: Não use desodorante, talco, hidratante ou perfume nas mamas e axilas no dia do exame (metais podem interferir na imagem). Vista roupas de duas peças!';
    }
    if (text.includes('febre') || text.includes('quimio') || text.includes('temperatura') || text.includes('enjoo')) {
      return 'ATENÇÃO: Caso apresente febre a partir de 37.8°C após sessões de quimioterapia, vá ao pronto-socorro imediatamente. Evite tomar remédios sem prescrição médica!';
    }
    if (text.includes('direito') || text.includes('fgts') || text.includes('isencao') || text.includes('imposto')) {
      return 'Você tem direito ao saque do FGTS/PIS e isenções de IPVA/IPI. Baixe a cartilha "Direitos Sociais" na nossa Biblioteca (menu Ajuda) para o passo a passo!';
    }
    if (text.includes('reagendar') || text.includes('remarcar') || text.includes('cancelar') || text.includes('presenca')) {
      return 'Para reagendar ou confirmar presença em consultas marcadas, vá em "Meus Agendamentos", busque pelo protocolo da sua solicitação e utilize os botões disponíveis no card!';
    }
    if (text.includes('transporte') || text.includes('prefeitura') || text.includes('viagem') || text.includes('tfd')) {
      return 'O transporte deve ser solicitado na prefeitura da sua cidade com a guia de agendamento (que você imprime aqui no portal em "Meus Agendamentos") em até 7 dias úteis de antecedência.';
    }
    if (text.includes('documento') || text.includes('levar') || text.includes('rg') || text.includes('sus')) {
      return 'Traga seu RG, CPF, Cartão do SUS atualizado e o encaminhamento médico físico original no dia da consulta.';
    }
    if (text.includes('ola') || text.includes('oi') || text.includes('bom dia') || text.includes('boa tarde')) {
      return 'Olá! Como posso ajudar você hoje? Pergunte-me sobre preparo, febre, direitos ou transporte municipal.';
    }

    return 'Não consegui compreender bem. Tente termos simples como "preparo mamografia", "febre na quimioterapia" ou "direitos sociais". Se precisar, fale com a administração pelo telefone (17) 3321-6600 ou pelo e-mail suporte@hospitaldeamor.com.br.';
  };

  const addBotMessage = (text: string, options?: Array<{ label: string; value: string }>, fileInput?: boolean) => {
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'bot',
        text,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        options,
        fileInput
      }
    ]);
  };

  const addUserMessage = (text: string) => {
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const startSchedulingFlow = () => {
    if (!patientCpf) {
      addBotMessage('Para realizar um agendamento, você precisa estar logado no portal. Por favor, realize o login para continuar.');
      return;
    }
    setSchedulingStep('confirm_method');
    addBotMessage('Deseja realizar o agendamento diretamente por aqui através do chat ou prefere usar o formulário tradicional do site?', [
      { label: 'Agendar pelo Chat', value: 'chat' },
      { label: 'Usar formulário do site', value: 'form' }
    ]);
  };

  const resetScheduling = () => {
    setSchedulingStep('none');
    setSelectedState('');
    setSelectedCity('');
    setSelectedSpecialty(null);
    setSelectedExam(null);
    setAttachedFile(null);
  };

  const cancelScheduling = () => {
    addBotMessage('Agendamento cancelado. Como posso ajudar você agora?');
    resetScheduling();
  };

  const handleConfirmMethod = (value: string) => {
    addUserMessage(value === 'chat' ? 'Agendar pelo Chat' : 'Usar formulário do site');
    if (value === 'form') {
      addBotMessage('Entendido! Redirecionando para o formulário de agendamento do site...');
      setTimeout(() => {
        onNavigate?.('new-request');
        setIsOpen(false);
        resetScheduling();
      }, 1000);
    } else {
      setSchedulingStep('select_state');
      const uniqueStates = Array.from(new Set(cities.map((c) => c.state))).sort();
      addBotMessage('Selecione o Estado (UF) do seu atendimento:', uniqueStates.map((state) => ({ label: state, value: state })));
    }
  };

  const handleSelectState = (state: string) => {
    addUserMessage(state);
    setSelectedState(state);
    setSchedulingStep('select_city');
    const filteredCities = cities.filter((c) => c.state === state);
    addBotMessage('Selecione a cidade do seu atendimento:', filteredCities.map((c) => ({ label: c.name, value: c.id })));
  };

  const handleSelectCity = (cityId: string) => {
    if (cityId === 'other') {
      addUserMessage('Outra');
      setSchedulingStep('input_custom_city');
      addBotMessage('Por favor, digite o nome da sua cidade no campo de texto:');
      return;
    }
    const cityObj = cities.find((c) => c.id === cityId);
    const cityName = cityObj ? cityObj.name : cityId;
    addUserMessage(cityName);
    setSelectedCity(cityName);
    setSchedulingStep('select_specialty');
    addBotMessage('Selecione a especialidade desejada:', specialties.map((s) => ({ label: s.name, value: s.id })));
  };

  const handleSelectSpecialty = (specialtyId: string) => {
    const specialtyObj = specialties.find((s) => s.id === specialtyId);
    if (!specialtyObj) return;
    addUserMessage(specialtyObj.name);
    setSelectedSpecialty(specialtyObj);
    setSchedulingStep('select_exam');
    addBotMessage('Selecione o exame ou consulta que deseja agendar:', specialtyObj.exams.map((e) => ({ label: e.name, value: e.id })));
  };

  const promptLgpdConsent = (prefixText = '', fileOverride?: FileAttachment | null, examOverride?: Exam | null) => {
    setSchedulingStep('consent_lgpd');
    const fileToUse = fileOverride !== undefined ? fileOverride : attachedFile;
    const examToUse = examOverride !== undefined ? examOverride : selectedExam;
    const docName = fileToUse ? fileToUse.name : (examToUse?.requiresEncaminhamento !== false ? 'Pendente' : 'Não exigido');
    const summary = `Resumo da sua solicitação:
• Paciente: ${patientUser?.name || patientName || 'Anna Beatriz'}
• CPF: ${patientCpf}
• Local: ${selectedCity} - ${selectedState}
• Especialidade: ${selectedSpecialty?.name || ''}
• Exame: ${examToUse?.name || ''}
• Documento: ${docName}

${prefixText}Para concluir a solicitação, é necessário aceitar os termos da LGPD (Lei Geral de Proteção de Dados) para o tratamento dos dados pessoais e de saúde.`;

    addBotMessage(summary, [
      { label: 'Aceitar e Confirmar', value: 'accept' },
      { label: 'Cancelar', value: 'cancel' }
    ]);
  };

  const handleSelectExam = async (examId: string) => {
    if (!selectedSpecialty) return;
    const examObj = selectedSpecialty.exams.find((e) => e.id === examId);
    if (!examObj) return;
    addUserMessage(examObj.name);
    setSelectedExam(examObj);

    const isDuplicate = await checkDuplicateRequest(patientCpf, examObj.id);
    if (isDuplicate) {
      addBotMessage('Você já possui uma solicitação ativa ou em análise para este mesmo exame.', [
        { label: 'Acompanhar Agendamento', value: 'track' },
        { label: 'Voltar ao Início', value: 'restart' }
      ]);
      return;
    }

    if (examObj.requiresEncaminhamento !== false) {
      setSchedulingStep('upload_file');
      addBotMessage('Este exame exige o envio da guia de encaminhamento médico. Por favor, anexe o documento:', [
        { label: 'Simular Anexo de Teste', value: 'simulate' }
      ], true);
    } else {
      promptLgpdConsent('', null, examObj);
    }
  };

  const handleDuplicateResolution = (value: string) => {
    if (value === 'track') {
      addUserMessage('Acompanhar Agendamento');
      addBotMessage('Redirecionando para a tela de acompanhamento...');
      setTimeout(() => {
        onNavigate?.('status-check');
        setIsOpen(false);
        resetScheduling();
      }, 1000);
    } else {
      addUserMessage('Voltar ao Início');
      resetScheduling();
      startSchedulingFlow();
    }
  };

  const handleSimulateUpload = () => {
    addUserMessage('Simular Anexo de Teste');
    const mockFile: FileAttachment = {
      name: 'encaminhamento_simulado.pdf',
      type: 'application/pdf',
      size: 154200,
      base64: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
      status: 'Pendente'
    };
    setAttachedFile(mockFile);
    promptLgpdConsent('Documento anexado com sucesso!\n\n', mockFile, selectedExam);
  };

  const handleRealFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const fileAttach: FileAttachment = {
        name: file.name,
        type: file.type,
        size: file.size,
        base64: base64String,
        status: 'Pendente'
      };
      setAttachedFile(fileAttach);
      promptLgpdConsent('Documento real anexado com sucesso!\n\n', fileAttach, selectedExam);
    };
    reader.readAsDataURL(file);
  };

  const handleConsentLgpd = async (value: string) => {
    if (value === 'cancel') {
      addUserMessage('Cancelar');
      cancelScheduling();
      return;
    }
    addUserMessage('Aceitar e Confirmar');
    setIsBotTyping(true);

    try {
      const cleanCpf = patientCpf.replace(/\D/g, "");
      const appointmentData = {
        patientName: patientUser?.name || patientName || 'Anna Beatriz',
        patientCpf: cleanCpf,
        patientBirthDate: patientUser?.birthDate || '',
        patientPhone: patientUser?.phone || '',
        patientEmail: patientUser?.email || '',
        state: selectedState,
        city: selectedCity,
        specialtyId: selectedSpecialty?.id || '',
        specialtyName: selectedSpecialty?.name || '',
        examId: selectedExam?.id || '',
        examName: selectedExam?.name || '',
        fileAttachment: attachedFile || null,
        observations: 'Agendado via Assistente Virtual (Robo-FAQ)',
        consentLgpd: true
      };

      const createdApp = await createAppointment(appointmentData);
      setIsBotTyping(false);
      setSchedulingStep('completed');
      addBotMessage(`Agendamento realizado com sucesso! Seu protocolo é: ${createdApp.protocol}.`, [
        { label: 'Acompanhar Agendamento', value: `track-${createdApp.protocol}` }
      ]);
      window.dispatchEvent(new CustomEvent('appointment-created-reactively', { detail: { protocol: createdApp.protocol } }));
    } catch (err) {
      setIsBotTyping(false);
      addBotMessage('Ocorreu um erro ao realizar o agendamento. Por favor, tente novamente.');
      resetScheduling();
    }
  };

  const handleFollowUp = (protocol: string) => {
    addUserMessage('Acompanhar Agendamento');
    addBotMessage('Redirecionando para a tela de acompanhamento de agendamento...');
    setTimeout(() => {
      onNavigate?.(`status-${protocol}`);
      setIsOpen(false);
      resetScheduling();
    }, 1000);
  };

  const handleOptionClick = (value: string) => {
    if (schedulingStep === 'confirm_method') {
      handleConfirmMethod(value);
    } else if (schedulingStep === 'select_state') {
      handleSelectState(value);
    } else if (schedulingStep === 'select_city') {
      handleSelectCity(value);
    } else if (schedulingStep === 'select_specialty') {
      handleSelectSpecialty(value);
    } else if (schedulingStep === 'select_exam') {
      if (selectedExam) {
        handleDuplicateResolution(value);
      } else {
        handleSelectExam(value);
      }
    } else if (schedulingStep === 'upload_file') {
      if (value === 'simulate') {
        handleSimulateUpload();
      }
    } else if (schedulingStep === 'consent_lgpd') {
      handleConsentLgpd(value);
    } else if (schedulingStep === 'completed') {
      if (value.startsWith('track-')) {
        const protocol = value.replace('track-', '');
        handleFollowUp(protocol);
      }
    }
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    addUserMessage(userMsg);
    setChatInput('');

    if (userMsg.toLowerCase() === 'cancelar') {
      cancelScheduling();
      return;
    }

    if (schedulingStep !== 'none') {
      if (schedulingStep === 'input_custom_city') {
        const customCity = userMsg.trim();
        if (!customCity) return;
        setSelectedCity(customCity);
        setSchedulingStep('select_specialty');
        addBotMessage('Selecione a especialidade desejada:', specialties.map((s) => ({ label: s.name, value: s.id })));
        return;
      }
      addBotMessage('Por favor, utilize os botões interativos acima para prosseguir ou digite "cancelar" para abortar o agendamento.');
      return;
    }

    if (userMsg.toLowerCase().includes('novo agendamento') || userMsg.toLowerCase() === 'agendar' || userMsg.toLowerCase() === 'marcar consulta' || userMsg.toLowerCase() === 'marcar exame') {
      startSchedulingFlow();
      return;
    }

    setIsBotTyping(true);

    setTimeout(() => {
      const reply = getBotResponse(userMsg);
      const understood = !reply.startsWith('Não consegui compreender bem');
      saveChatbotQuery(userMsg, understood).catch(console.error);

      addBotMessage(reply);
      setIsBotTyping(false);
    }, 1000);
  };

  const selectShortcut = (text: string) => {
    addUserMessage(text);
    if (text.toLowerCase() === 'cancelar') {
      cancelScheduling();
      return;
    }
    if (schedulingStep !== 'none') {
      if (schedulingStep === 'input_custom_city') {
        const customCity = text.trim();
        setSelectedCity(customCity);
        setSchedulingStep('select_specialty');
        addBotMessage('Selecione a especialidade desejada:', specialties.map((s) => ({ label: s.name, value: s.id })));
        return;
      }
      addBotMessage('Por favor, utilize os botões interativos acima para prosseguir ou digite "cancelar" para abortar o agendamento.');
      return;
    }
    if (text.toLowerCase().includes('novo agendamento') || text.toLowerCase() === 'agendar' || text.toLowerCase() === 'marcar consulta' || text.toLowerCase() === 'marcar exame') {
      startSchedulingFlow();
      return;
    }
    setIsBotTyping(true);

    setTimeout(() => {
      const reply = getBotResponse(text);
      const understood = !reply.startsWith('Não consegui compreender bem');
      saveChatbotQuery(text, understood).catch(console.error);

      addBotMessage(reply);
      setIsBotTyping(false);
    }, 850);
  };

  if (isHidden) {
    return (
      <MinimizedBubble
        onRestore={() => {
          sessionStorage.removeItem('robofaq-widget-hidden');
          setIsHidden(false);
          setIsOpen(true);
          window.dispatchEvent(new Event('robofaq-visibility-change'));
        }}
      />
    );
  }

  return (
    <div className="fixed right-6 bottom-6 z-40 font-sans">
      {isOpen ? (
        <Card className={`w-[310px] sm:w-[330px] ${schedulingStep !== 'none' ? 'h-[540px]' : 'h-[440px]'} bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 shadow-2xl rounded-3xl overflow-hidden flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-5`}>
          <CardHeader className="bg-primary p-3.5 text-white flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-secondary fill-secondary" />
              </div>
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-wider text-white">Robo-FAQ Chat</CardTitle>
                <CardDescription className="text-[9px] text-blue-200 font-bold block">Dúvidas rápidas de saúde</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-zinc-50/50 dark:bg-zinc-950/20">
            <ChatMessagesList
              chatMessages={chatMessages}
              schedulingStep={schedulingStep}
              isBotTyping={isBotTyping}
              chatEndRef={chatEndRef}
              onOptionClick={handleOptionClick}
              onRealFileUpload={handleRealFileUpload}
            />
          </CardContent>

          <ChatSuggestions
            onStartScheduling={startSchedulingFlow}
            onSelectShortcut={selectShortcut}
          />

          <ChatInputForm
            chatInput={chatInput}
            onChangeChatInput={setChatInput}
            onSubmit={handleSendMessage}
          />
        </Card>
      ) : (
        <ClosedWidgetButton
          onOpen={() => setIsOpen(true)}
          onHide={() => {
            sessionStorage.setItem('robofaq-widget-hidden', 'true');
            setIsHidden(true);
          }}
        />
      )}
    </div>
  );
}
