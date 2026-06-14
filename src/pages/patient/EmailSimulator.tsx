import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { getAppointmentByCpf, getUserByCpf, getEmailQueue } from '../../services/db';
import type { Appointment, PatientUser } from '../../types';
import { Mail, MailOpen, Inbox, Clock, Calendar, MapPin, AlertCircle, ChevronRight } from 'lucide-react';
import logoHospitalDeAmor from '../../assets/logoHospitalDeAmor.png';

interface Email {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  date: string;
  preview: string;
  body: React.ReactNode;
  isRead: boolean;
  ctaText?: string;
  ctaAction?: string;
}

interface EmailSimulatorProps {
  patientCpf: string;
  patientName: string;
  onNavigate: (path: string) => void;
}

export default function EmailSimulator({ patientCpf, patientName, onNavigate }: EmailSimulatorProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimulatedEmails();
  }, [patientCpf]);

  const getPrepInstructions = (examName: string) => {
    if (examName.includes('Mamografia')) {
      return 'Não utilizar desodorante ou talco na região das mamas e axilas.';
    }
    if (examName.includes('Tomografia')) {
      return 'Jejum absoluto de 4 horas para exames realizados com contraste iodado.';
    }
    if (examName.includes('Sangue')) {
      return 'Jejum absoluto de 8 horas. Evite bebidas alcoólicas nas 24h anteriores.';
    }
    return 'Siga as orientações passadas pela equipe médica.';
  };

  const loadSimulatedEmails = async () => {
    setLoading(true);
    try {
      const cleanCpf = patientCpf.replace(/\D/g, '');
      const user: PatientUser | null = await getUserByCpf(cleanCpf);
      const appointments: Appointment[] = await getAppointmentByCpf(patientCpf);
      const queueItems = await getEmailQueue();

      const list: Email[] = [];

      const userCreatedDate = user ? new Date(user.createdAt) : new Date();
      list.push({
        id: 'welcome-email',
        sender: 'suporte@hospitalamor.org (Hospital de Amor)',
        recipient: user?.email || 'paciente@email.com',
        subject: 'Bem-vindo ao Portal do Paciente - Hospital de Amor',
        date: userCreatedDate.toLocaleString('pt-BR'),
        preview: 'Seu cadastro foi realizado com sucesso. Saiba como acessar as funcionalidades do portal.',
        isRead: false,
        body: (
          <div className="space-y-4">
            <p>Olá, <strong>{patientName}</strong>!</p>
            <p>Seu cadastro no **Portal do Paciente do Hospital de Amor** foi concluído com sucesso e seus dados estão protegidos sob as diretrizes da LGPD.</p>
            <p>A partir de agora, você pode utilizar a plataforma para solicitar agendamentos de exames e consultas, acompanhar o status da triagem em tempo real, gerenciar seu histórico clínico e manter seu Diário de Sintomas atualizado.</p>
            <p>Seja bem-vindo(a) e conte com nossa equipe para apoiar a sua jornada de saúde.</p>
          </div>
        ),
        ctaText: 'Ir para o Painel Principal',
        ctaAction: 'dashboard'
      });

      const patientEmails = queueItems.filter((item) => {
        const matchEmail = item.recipientEmail.trim().toLowerCase() === (user?.email || '').trim().toLowerCase();
        const matchProtocol = appointments.some((app) => app.protocol === item.appointmentProtocol);
        return matchEmail || matchProtocol;
      });

      patientEmails.forEach((item, index) => {
        const app = appointments.find((a) => a.protocol === item.appointmentProtocol);
        list.push({
          id: `queue-${item.id || index}`,
          sender: 'regulacao@hospitalamor.org (Hospital de Amor)',
          recipient: item.recipientEmail,
          subject: item.subject,
          date: app ? new Date(app.createdAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR'),
          preview: item.body.slice(0, 100) + '...',
          isRead: false,
          body: (
            <div className="space-y-4 whitespace-pre-line">
              {item.body}
            </div>
          ),
          ctaText: 'Acompanhar Solicitação',
          ctaAction: `status-${item.appointmentProtocol}`
        });
      });

      appointments.forEach((app) => {
        const appDate = new Date(app.createdAt);
        const hasEnqueuedEmail = patientEmails.some((email) => email.appointmentProtocol === app.protocol);

        if (!hasEnqueuedEmail) {
          list.push({
            id: `sent-${app.id}`,
            sender: 'regulacao@hospitalamor.org (Hospital de Amor)',
            recipient: user?.email || 'paciente@email.com',
            subject: `Confirmação de Envio - Protocolo ${app.protocol}`,
            date: appDate.toLocaleString('pt-BR'),
            preview: `Seu pedido de agendamento para ${app.examName} foi recebido e está na fila.`,
            isRead: false,
            body: (
              <div className="space-y-4">
                <p>Olá, <strong>{patientName}</strong>.</p>
                <p>Confirmamos o recebimento da sua solicitação de agendamento para o exame/consulta de <strong>{app.examName}</strong>.</p>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <p><strong>Protocolo:</strong> {app.protocol}</p>
                  <p><strong>Especialidade:</strong> {app.specialtyName}</p>
                  <p><strong>Data de Envio:</strong> {appDate.toLocaleDateString('pt-BR')}</p>
                </div>
                <p>O seu pedido foi encaminhado para a nossa fila de triagem médica. O prazo médio de avaliação de documentos é de **48 horas úteis**. Avisaremos você por e-mail sobre qualquer atualização.</p>
              </div>
            ),
            ctaText: 'Acompanhar Solicitação',
            ctaAction: `status-${app.protocol}`
          });
        }

        if (app.status === 'Em análise' || app.status === 'Confirmado' || app.status === 'Cancelado') {
          const analysisDate = new Date(appDate.getTime() + 2 * 60 * 60 * 1000);
          list.push({
            id: `analysis-${app.id}`,
            sender: 'triagem@hospitalamor.org (Hospital de Amor)',
            recipient: user?.email || 'paciente@email.com',
            subject: `Triagem em Andamento - Protocolo ${app.protocol}`,
            date: analysisDate.toLocaleString('pt-BR'),
            preview: `Os documentos da sua solicitação para ${app.examName} estão em análise técnica.`,
            isRead: false,
            body: (
              <div className="space-y-4">
                <p>Olá, <strong>{patientName}</strong>.</p>
                <p>A equipe de triagem administrativa iniciou a avaliação técnica dos documentos anexados (como o encaminhamento médico) para a sua solicitação de <strong>{app.examName}</strong>.</p>
                <p>Caso seja identificada alguma inconsistência ou necessidade de substituição de documento, você receberá instruções detalhadas de correção.</p>
              </div>
            ),
            ctaText: 'Verificar Status do Pedido',
            ctaAction: `status-${app.protocol}`
          });
        }

        if (app.status === 'Confirmado') {
          const confirmDate = new Date(app.createdAt);
          const locationText = app.specialtyName === 'Mastologia' 
            ? 'Unidade Principal - Bloco B, Sala de Exames 03 (Mamógrafo 01)' 
            : 'Unidade Barretos - Ala B, Consultório 4';
          const prepText = getPrepInstructions(app.examName);

          list.push({
            id: `confirm-${app.id}`,
            sender: 'agendamento@hospitalamor.org (Hospital de Amor)',
            recipient: user?.email || 'paciente@email.com',
            subject: `Consulta/Exame Confirmado - Protocolo ${app.protocol}`,
            date: confirmDate.toLocaleString('pt-BR'),
            preview: `Seu exame de ${app.examName} foi agendado com sucesso. Veja data e local.`,
            isRead: false,
            body: (
              <div className="space-y-4">
                <p>Olá, <strong>{patientName}</strong>.</p>
                <p>Temos a satisfação de informar que a sua triagem foi concluída e o seu exame/consulta de <strong>{app.examName}</strong> está **Confirmado**.</p>
                
                <div className="p-4 bg-green-50/25 dark:bg-green-950/10 rounded-xl border border-green-100 dark:border-green-900/30 space-y-2">
                  <p className="flex items-center gap-2 text-xs">
                    <Calendar className="w-4 h-4 text-green-600 shrink-0" />
                    <strong>Data:</strong> {app.rescheduledDate ? new Date(app.rescheduledDate + 'T12:00:00').toLocaleDateString('pt-BR') : '15 de Maio de 2026'}
                  </p>
                  <p className="flex items-center gap-2 text-xs">
                    <Clock className="w-4 h-4 text-green-600 shrink-0" />
                    <strong>Horário:</strong> {app.rescheduledTime || '14:30'}
                  </p>
                  <p className="flex items-center gap-2 text-xs">
                    <MapPin className="w-4 h-4 text-green-600 shrink-0" />
                    <strong>Local:</strong> {locationText}
                  </p>
                </div>

                <p><strong>Instruções importantes:</strong></p>
                <p className="text-zinc-650 dark:text-zinc-350">{prepText}</p>
                <p>Sua credencial de acesso digital com QR Code já está disponível no portal. Apresente-a no guichê de entrada para realizar o seu check-in rápido.</p>
              </div>
            ),
            ctaText: 'Acessar Credencial Digital',
            ctaAction: `status-${app.protocol}`
          });

          if (app.presenceConfirmed) {
            list.push({
              id: `presence-${app.id}`,
              sender: 'recepcao@hospitalamor.org (Hospital de Amor)',
              recipient: user?.email || 'paciente@email.com',
              subject: `Presença Confirmada - Protocolo ${app.protocol}`,
              date: new Date(confirmDate.getTime() + 10 * 60 * 1000).toLocaleString('pt-BR'),
              preview: 'Confirmamos o registro antecipado de presença para o seu agendamento.',
              isRead: false,
              body: (
                <div className="space-y-4">
                  <p>Olá, <strong>{patientName}</strong>.</p>
                  <p>Confirmamos que você efetuou com sucesso o registro antecipado de presença no portal para o exame de <strong>{app.examName}</strong>.</p>
                  <p>Isso ajuda nossa equipe a agilizar sua recepção no dia do atendimento. Lembre-se de comparecer com 15 minutos de antecedência portando seus documentos originais.</p>
                </div>
              ),
              ctaText: 'Visualizar Agendamento',
              ctaAction: `status-${app.protocol}`
            });
          }

          if (app.feedbackNps !== undefined && app.feedbackNps !== null) {
            list.push({
              id: `nps-${app.id}`,
              sender: 'ouvidoria@hospitalamor.org (Hospital de Amor)',
              recipient: user?.email || 'paciente@email.com',
              subject: `Agradecimento de Feedback - Protocolo ${app.protocol}`,
              date: new Date(confirmDate.getTime() + 20 * 60 * 1000).toLocaleString('pt-BR'),
              preview: 'Agradecemos a sua resposta à nossa pesquisa de satisfação.',
              isRead: false,
              body: (
                <div className="space-y-4">
                  <p>Olá, <strong>{patientName}</strong>.</p>
                  <p>Agradecemos imensamente por responder à nossa pesquisa de satisfação referente ao agendamento <strong>{app.protocol}</strong>.</p>
                  <p>Sua nota **{app.feedbackNps}/10** e seus comentários foram encaminhados diretamente para o nosso setor de ouvidoria administrativa para melhoria constante dos nossos serviços clínicos.</p>
                </div>
              ),
              ctaText: 'Ir para o Início',
              ctaAction: 'dashboard'
            });
          }
        }

        if (app.status === 'Cancelado') {
          const cancelDate = new Date(app.createdAt);
          list.push({
            id: `cancel-${app.id}`,
            sender: 'regulacao@hospitalamor.org (Hospital de Amor)',
            recipient: user?.email || 'paciente@email.com',
            subject: `Pendência de Triagem / Cancelamento - Protocolo ${app.protocol}`,
            date: cancelDate.toLocaleString('pt-BR'),
            preview: `Sua solicitação de ${app.examName} possui pendências. Veja como corrigir.`,
            isRead: false,
            body: (
              <div className="space-y-4">
                <p>Olá, <strong>{patientName}</strong>.</p>
                <p>A equipe de triagem administrativa identificou uma inconformidade com a documentação enviada para a solicitação de <strong>{app.examName}</strong>.</p>
                
                <div className="p-4 bg-red-50/20 dark:bg-red-950/10 rounded-xl border border-red-100 dark:border-red-900/30 space-y-2">
                  <p className="flex items-center gap-2 text-xs text-red-650 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <strong>Motivo da Recusa:</strong> {app.observations || 'Documento de encaminhamento médico inelegível, cortado ou fora do prazo de validade.'}
                  </p>
                </div>

                <p><strong>Como corrigir esta pendência?</strong></p>
                <p>Você pode realizar o upload de um novo arquivo corrigido (PNG, JPG ou PDF de até 5MB) diretamente pelo Portal do Paciente. Assim que o novo documento for enviado, sua solicitação voltará automaticamente para o status de "Em análise" para triagem prioritária.</p>
              </div>
            ),
            ctaText: 'Corrigir e Substituir Anexo',
            ctaAction: `status-${app.protocol}`
          });
        }
      });

      const sorted = list.sort((a, b) => {
        const dateA = new Date(a.date.split(', ')[0].split('/').reverse().join('-') + 'T' + a.date.split(', ')[1]);
        const dateB = new Date(b.date.split(', ')[0].split('/').reverse().join('-') + 'T' + b.date.split(', ')[1]);
        return dateB.getTime() - dateA.getTime();
      });

      setEmails(sorted);
      if (sorted.length > 0) {
        setSelectedEmail(sorted[0]);
        sorted[0].isRead = true;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmail = (email: Email) => {
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
    setSelectedEmail(email);
  };

  const executeCta = (action: string) => {
    onNavigate(action);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6 text-left">
      <div>
        <Button variant="link" onClick={() => onNavigate('dashboard')} className="text-primary p-0 h-auto font-semibold mb-2">
          ← Voltar ao Início
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Simulador de Caixa de Entrada (RF07)</h1>
        <p className="text-zinc-500 mt-1">Veja e teste em tempo real o formato das notificações de e-mail enviadas pelo Hospital de Amor conforme o status do seu agendamento.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[500px]">
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 pl-1">Mensagens Recebidas</h2>
          
          <Card className="border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 overflow-hidden flex flex-col">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-y-auto flex-1 max-h-[520px]">
              {loading ? (
                <div className="p-8 text-center text-xs text-zinc-500">Carregando e-mails...</div>
              ) : emails.length === 0 ? (
                <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center">
                  <Inbox className="w-8 h-8 text-zinc-350" />
                  <p className="text-xs font-semibold text-zinc-500">Caixa de entrada vazia</p>
                </div>
              ) : (
                emails.map((email) => {
                  const isSelected = selectedEmail?.id === email.id;
                  return (
                    <div
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={`p-4 cursor-pointer transition-colors text-left flex gap-3 items-start ${
                        isSelected 
                          ? 'bg-zinc-50 dark:bg-zinc-900/60 border-l-4 border-l-primary' 
                          : 'bg-white dark:bg-zinc-950 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20'
                      }`}
                    >
                      <div className="mt-1 shrink-0">
                        {email.isRead ? (
                          <MailOpen className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <Mail className="w-4 h-4 text-primary font-bold" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className={`text-[10px] truncate max-w-[130px] block ${email.isRead ? 'text-zinc-500 font-medium' : 'text-zinc-900 dark:text-zinc-200 font-bold'}`}>
                            {email.sender.split(' ')[0]}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-mono whitespace-nowrap shrink-0">{email.date.split(' ')[0]}</span>
                        </div>
                        <h4 className={`text-xs truncate block ${email.isRead ? 'text-zinc-700 dark:text-zinc-300 font-semibold' : 'text-zinc-950 dark:text-zinc-50 font-black'}`}>
                          {email.subject}
                        </h4>
                        <p className="text-[10px] text-zinc-400 truncate">{email.preview}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7 flex flex-col space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 pl-1">Leitor de E-mail</h2>
          
          <Card className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden flex-1 flex flex-col min-h-[500px]">
            {selectedEmail ? (
              <div className="flex flex-col flex-1">
                <div className="bg-zinc-50 dark:bg-zinc-900/60 px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex flex-col gap-1.5 text-xs text-zinc-500 text-left">
                  <div><strong className="text-zinc-700 dark:text-zinc-300">De:</strong> {selectedEmail.sender}</div>
                  <div><strong className="text-zinc-700 dark:text-zinc-300">Para:</strong> {selectedEmail.recipient}</div>
                  <div><strong className="text-zinc-700 dark:text-zinc-300">Data:</strong> {selectedEmail.date}</div>
                  <div><strong className="text-zinc-700 dark:text-zinc-300">Assunto:</strong> <span className="text-zinc-850 dark:text-zinc-200 font-bold">{selectedEmail.subject}</span></div>
                </div>
                
                <div className="p-6 md:p-8 flex-1 flex flex-col items-center justify-between text-center space-y-6">
                  <div className="w-full flex flex-col items-center space-y-5">
                    <div className="bg-white p-2 rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 w-14 h-14 shrink-0">
                      <img src={logoHospitalDeAmor} alt="Hospital de Amor" className="w-full h-full object-contain" aria-hidden="true" />
                    </div>
                    
                    <div className="text-zinc-655 dark:text-zinc-300 text-xs text-left w-full max-w-md mx-auto leading-relaxed border border-zinc-100 dark:border-zinc-900 p-6 rounded-2xl bg-zinc-50/15 dark:bg-zinc-955 shadow-inner">
                      {selectedEmail.body}
                    </div>
                  </div>

                  {selectedEmail.ctaText && selectedEmail.ctaAction && (
                    <Button
                      onClick={() => executeCta(selectedEmail.ctaAction!)}
                      className="bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98] group flex items-center gap-1.5 shrink-0"
                    >
                      <span>{selectedEmail.ctaText}</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-400 flex flex-col items-center justify-center flex-1 space-y-2">
                <Mail className="w-10 h-10 text-zinc-300" />
                <p>Selecione uma mensagem na caixa de entrada para ler.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
