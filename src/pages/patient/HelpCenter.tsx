import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Search, BookOpen, Download, HelpCircle, ChevronDown, Check, Send, Sparkles, FileText, Play, Pause, Captions } from 'lucide-react';
import { getUserByCpf, updatePatientUser, getAppointmentByCpf } from '../../services/db';

interface HelpCenterProps {
  patientCpf: string;
}

interface Booklet {
  id: string;
  title: string;
  category: 'preparo' | 'tratamento' | 'direitos';
  size: string;
  description: string;
  content: string;
}

const BOOKLETS: Booklet[] = [
  {
    id: 'b1',
    title: 'Guia de Preparo para Mamografia',
    category: 'preparo',
    size: '1.2 MB',
    description: 'Instruções essenciais sobre o que fazer e evitar no dia do seu exame de mamografia.',
    content: 'ORIENTAÇÕES OFICIAIS DO HOSPITAL DE AMOR\n\nEXAME: Mamografia Bilateral\n\nINSTRUÇÕES DE PREPARO:\n1. Não use desodorante, talco, creme ou perfume nas mamas e axilas no dia do exame, pois estes produtos podem conter partículas metálicas que interferem no resultado.\n2. Vista roupas de duas peças (ex: blusa e saia ou calça), pois será necessário retirar a parte de cima da vestimenta.\n3. Se possuir exames de mamografia anteriores, traga-os no dia do atendimento. Eles são fundamentais para comparação.'
  },
  {
    id: 'b2',
    title: 'Direitos Sociais do Paciente Oncológico',
    category: 'direitos',
    size: '2.4 MB',
    description: 'Cartilha completa sobre isenção de impostos, saques do FGTS/PIS e outros benefícios.',
    content: 'GUIA DE DIREITOS SOCIAIS DO PACIENTE - HOSPITAL DE AMOR\n\nBenefícios previstos em lei para pacientes em tratamento oncológico:\n\n1. Saque do FGTS e PIS/PASEP: O paciente ou trabalhador que possua dependente com câncer pode realizar o saque integral.\n2. Auxílio-Doença (Benefício por Incapacidade Temporária): Pago pelo INSS caso o paciente fique temporariamente impossibilitado de trabalhar.\n3. Isenção de IPI e IPVA: Válido para a compra de veículos novos adaptados por portadores de limitações decorrentes da enfermidade.\n4. Quitação da Casa Própria: Caso exista cláusula de invalidez por doença no contrato de financiamento habitacional.'
  },
  {
    id: 'b3',
    title: 'Alimentação Saudável na Quimioterapia',
    category: 'tratamento',
    size: '1.8 MB',
    description: 'Recomendações de nutricionistas para reduzir enjoos e manter a imunidade alta.',
    content: 'MANUAL DE NUTRIÇÃO CLÍNICA - HOSPITAL DE AMOR\n\nComo gerenciar efeitos colaterais da quimioterapia por meio da alimentação:\n\n1. Para combater a Náusea:\n   - Coma em pequenas porções várias vezes ao dia (a cada 2 ou 3 horas).\n   - Evite alimentos muito quentes, prefira os frios ou em temperatura ambiente.\n   - Consuma alimentos com gengibre ou gotas de limão para atenuar o enjoo.\n2. Para a Fadiga e Imunidade:\n   - Mantenha-se hidratado (mínimo de 2 litros de água/líquidos por dia).\n   - Consuma frutas ricas em Vitamina C (laranja, acerola, limão).\n   - Evite alimentos crus fora de casa para prevenir infecções intestinais.'
  },
  {
    id: 'b4',
    title: 'Preparo Geral para Tomografia e Ressonância',
    category: 'preparo',
    size: '1.5 MB',
    description: 'Orientações sobre jejum, uso de contrastes e cuidados com objetos metálicos.',
    content: 'ORIENTAÇÕES OFICIAIS DO HOSPITAL DE AMOR\n\nEXAMES: Tomografia Computadorizada / Ressonância Magnética\n\nREGRAS GERAIS:\n1. Jejum absoluto de 4 horas (inclusive de água) para exames realizados com contraste iodado ou de gadolínio.\n2. Para Ressonância: É obrigatório retirar qualquer objeto metálico do corpo (brincos, anéis, piercings, relógios, grampos de cabelo).\n3. Caso possua marcapasso cardíaco ou implantes metálicos, informe a recepção imediatamente antes do exame.'
  }
];

const FAQS = [
  {
    q: 'Como funciona o preparo para exames de mama?',
    a: 'Para mamografias e biópsias mamárias, a regra de ouro é não aplicar nenhum produto (desodorante, talco, loções, cremes ou perfumes) na região das mamas e axilas no dia do procedimento. Esses produtos possuem substâncias que imitam microcalcificações na imagem, comprometendo a precisão diagnóstica.',
    cat: 'Preparo'
  },
  {
    q: 'O que devo fazer se apresentar febre após a quimioterapia?',
    a: 'Febre (temperatura axilar a partir de 37.8°C) após sessões de quimioterapia é uma urgência oncológica (sinal de possível neutropenia febril). Não tome antitérmicos por conta própria. Entre em contato imediatamente com o plantão de enfermagem do hospital pelo telefone fornecido no seu cartão de tratamento ou dirija-se ao pronto-socorro mais próximo.',
    cat: 'Tratamento'
  },
  {
    q: 'Como solicito o transporte da prefeitura para as consultas?',
    a: 'O transporte sanitário eletivo é fornecido pela Secretaria de Saúde do seu município (TFD - Tratamento Fora de Domicílio). Para solicitar, você precisará apresentar na prefeitura a Guia de Agendamento emitida pelo Hospital de Amor constando a data e o horário da sua consulta. Faça o requerimento com pelo menos 7 dias de antecedência.',
    cat: 'Funcionamento'
  },
  {
    q: 'Posso ir acompanhado no dia do meu exame?',
    a: 'Sim. Todo paciente tem direito a um acompanhante. Recomendamos dar preferência a acompanhantes maiores de 18 anos e menores de 60 anos. Em alguns setores específicos (como salas de exames radiológicos), o acompanhante precisará aguardar na sala de espera por motivos de segurança radiológica.',
    cat: 'Funcionamento'
  },
  {
    q: 'Como faço para redefinir ou alterar minha senha de acesso?',
    a: 'Você pode alterar sua senha dentro da plataforma acessando o menu "Configurações" no painel lateral e preenchendo o formulário de alteração de senha. Caso tenha esquecido a senha antes de logar, clique em "Esqueci a Senha" na tela de login e siga as instruções enviadas para o seu e-mail simulado.',
    cat: 'Segurança'
  }
];

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function HelpCenter({ patientCpf }: HelpCenterProps) {
  const [activeTab, setActiveTab] = useState<'faq' | 'booklets'>('faq');
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);

  const [readBooklets, setReadBooklets] = useState<string[]>([]);
  const isDownloadingRef = useRef(false);
  const downloadIntervalRef = useRef<any>(null);
  const downloadTimeoutRef = useRef<any>(null);
  const [recommendedBooklet, setRecommendedBooklet] = useState<Booklet | null>(null);

  // Player de Vídeo Simulado
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubtitles, setIsSubtitles] = useState(true);
  const [isLibras, setIsLibras] = useState(true);
  const [currentCaption, setCurrentCaption] = useState('Clique em Play para iniciar o vídeo educativo.');

  useEffect(() => {
    const loadData = async () => {
      if (!patientCpf) return;
      try {
        const cleanCpf = patientCpf.replace(/\D/g, "");
        const patient = await getUserByCpf(cleanCpf);
        if (patient) {
          setReadBooklets(patient.readBooklets || []);
        }
        const apps = await getAppointmentByCpf(cleanCpf);

        const upcoming = apps.find(a => ['Pendente', 'Confirmado', 'Em análise'].includes(a.status));
        if (upcoming) {
          const exam = upcoming.examName.toLowerCase();
          if (exam.includes('mamografia')) {
            setRecommendedBooklet(BOOKLETS.find(b => b.id === 'b1') || null);
          } else if (exam.includes('tomografia') || exam.includes('ressonância') || exam.includes('ressonancia')) {
            setRecommendedBooklet(BOOKLETS.find(b => b.id === 'b4') || null);
          } else {
            setRecommendedBooklet(BOOKLETS.find(b => b.id === 'b4') || null);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [patientCpf]);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 1;
          if (next >= 100) {
            setIsPlaying(false);
            setCurrentCaption('Vídeo concluído. Obrigado por assistir!');
            return 0;
          }
          if (next < 20) {
            setCurrentCaption('Olá! Seja bem-vindo ao guia de acolhimento do Hospital de Amor.');
          } else if (next < 40) {
            setCurrentCaption('Neste vídeo, vamos explicar como se preparar adequadamente para seus exames.');
          } else if (next < 60) {
            setCurrentCaption('Lembre-se sempre de trazer seus documentos originais e encaminhamento médico.');
          } else if (next < 80) {
            setCurrentCaption('Se apresentar sintomas incomuns pós-tratamento, entre em contato imediatamente.');
          } else {
            setCurrentCaption('Sua saúde é nossa maior prioridade. Conte com toda a nossa equipe de suporte!');
          }
          return next;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleMarkAsRead = async (bookletId: string) => {
    if (!patientCpf || readBooklets.includes(bookletId)) return;
    const updated = [...readBooklets, bookletId];
    setReadBooklets(updated);
    try {
      const cleanCpf = patientCpf.replace(/\D/g, "");
      await updatePatientUser(cleanCpf, { readBooklets: updated });
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Olá! Sou o Assistente Virtual do Hospital de Amor. Estou aqui para tirar suas dúvidas de saúde, preparo para exames e funcionamento. O que você gostaria de saber hoje?', timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isBotTyping]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDownloadingId(null);
      }
    };
    if (downloadingId) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [downloadingId]);

  useEffect(() => {
    if (!downloadingId) {
      if (downloadIntervalRef.current) {
        clearInterval(downloadIntervalRef.current);
        downloadIntervalRef.current = null;
      }
      if (downloadTimeoutRef.current) {
        clearTimeout(downloadTimeoutRef.current);
        downloadTimeoutRef.current = null;
      }
      isDownloadingRef.current = false;
    }
  }, [downloadingId]);

  const handleDownload = (booklet: Booklet) => {
    if (downloadingId || isDownloadingRef.current) return;
    isDownloadingRef.current = true;

    setDownloadingId(booklet.id);
    setDownloadProgress(0);
    setDownloadSuccessId(null);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          downloadIntervalRef.current = null;

          const timeout = setTimeout(() => {
            const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const marginLeft = 20;
            const marginRight = pageWidth - 20;
            const contentWidth = marginRight - marginLeft;
            let currentPage = 1;

            const drawHeader = () => {
              doc.setFillColor(227, 20, 99);
              doc.rect(0, 0, pageWidth, 12, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(8);
              doc.setFont('helvetica', 'bold');
              doc.text('HOSPITAL DE AMOR — BIBLIOTECA DE ORIENTAÇÕES', marginLeft, 7.5);
              doc.text('CARTILHA INFORMATIVA', marginRight, 7.5, { align: 'right' });
            };

            const drawFooter = (pageNum: number) => {
              doc.setFillColor(245, 245, 248);
              doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
              doc.setFontSize(6.5);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(160, 160, 160);
              doc.text(
                `Hospital de Amor — Fundação Pio XII | www.hospitaldeamor.org.br | Página ${pageNum}`,
                pageWidth / 2,
                pageHeight - 4,
                { align: 'center' }
              );
            };

            drawHeader();

            let cursorY = 22;

            doc.setTextColor(30, 30, 30);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(booklet.title, marginLeft, cursorY);

            cursorY += 6;
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(120, 120, 120);
            const categoryLabel = booklet.category === 'preparo' ? 'Preparo de Exames' : booklet.category === 'direitos' ? 'Direitos Sociais' : 'Tratamento';
            doc.text(`Categoria: ${categoryLabel} | ID: ${booklet.id}`, marginLeft, cursorY);

            cursorY += 4;
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.line(marginLeft, cursorY, marginRight, cursorY);

            cursorY += 8;

            doc.setFontSize(9.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 60);

            const paragraphs = booklet.content.split('\n');

            for (const paragraph of paragraphs) {
              if (paragraph.trim() === '') {
                cursorY += 4;
                continue;
              }

              const lines = doc.splitTextToSize(paragraph, contentWidth);
              for (const line of lines) {
                if (cursorY > pageHeight - 20) {
                  drawFooter(currentPage);
                  doc.addPage();
                  currentPage++;
                  drawHeader();
                  cursorY = 22;
                  doc.setFontSize(9.5);
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(60, 60, 60);
                }
                doc.text(line, marginLeft, cursorY);
                cursorY += 5.5;
              }
              cursorY += 2.5;
            }

            drawFooter(currentPage);

            const fileName = `${booklet.title.toLowerCase().replace(/\s+/g, '_')}.pdf`;
            doc.save(fileName);

            setDownloadingId(null);
            setDownloadSuccessId(booklet.id);
            handleMarkAsRead(booklet.id);
            isDownloadingRef.current = false;
            downloadTimeoutRef.current = null;
            setTimeout(() => setDownloadSuccessId(null), 3000);
          }, 400);

          downloadTimeoutRef.current = timeout;
          return 100;
        }
        return prev + 20;
      });
    }, 250);

    downloadIntervalRef.current = interval;
  };

  const getBotResponse = (userText: string): string => {
    const text = userText.toLowerCase();

    if (text.includes('mamografia') || text.includes('preparo de mama') || text.includes('talco') || text.includes('desodorante')) {
      return 'Para realizar a Mamografia no Hospital de Amor, não utilize desodorante, talco, hidratante ou perfume nas mamas e axilas. Esses produtos contêm metais que interferem na imagem do raio-X. Vista uma blusa de duas peças e traga seus exames anteriores!';
    }
    if (text.includes('febre') || text.includes('quimio') || text.includes('temperatura') || text.includes('enjoo')) {
      return 'ATENÇÃO: Caso tenha febre a partir de 37.8°C após sessões de quimioterapia, dirija-se imediatamente ao pronto-socorro ou entre em contato com nosso plantão de enfermagem. Evite tomar antitérmicos sem orientação médica!';
    }
    if (text.includes('direito') || text.includes('fgts') || text.includes('isencao') || text.includes('imposto')) {
      return 'Pacientes oncológicos têm direito ao saque integral do FGTS/PIS, auxílio-doença pelo INSS e isenção de impostos como IPI/IPVA na compra de veículos adaptados. Recomendamos baixar nossa cartilha "Direitos Sociais" na aba Biblioteca para ver o passo a passo completo!';
    }
    if (text.includes('reagendar') || text.includes('remarcar') || text.includes('cancelar') || text.includes('presenca')) {
      return 'Você pode confirmar sua presença ou solicitar o reagendamento de consultas confirmadas diretamente pela plataforma! Acesse a aba "Meus Agendamentos", digite o código do seu protocolo e utilize os botões de ação que estarão disponíveis no card.';
    }
    if (text.includes('transporte') || text.includes('prefeitura') || text.includes('viagem') || text.includes('tfd')) {
      return 'O transporte para tratamento (TFD) é solicitado na Secretaria de Saúde da sua cidade. Apresente o comprovante de agendamento que você consegue imprimir aqui no portal (buscando seu protocolo em "Meus Agendamentos") com pelo menos 7 dias de antecedência.';
    }
    if (text.includes('documento') || text.includes('levar') || text.includes('rg') || text.includes('sus')) {
      return 'No dia da consulta ou exame, é obrigatório trazer: RG/CNH original, CPF, o Cartão do SUS atualizado e o encaminhamento médico físico com carimbo legível.';
    }
    if (text.includes('ola') || text.includes('oi') || text.includes('bom dia') || text.includes('boa tarde')) {
      return 'Olá! Como posso ajudar você hoje? Você pode me perguntar sobre preparo de exames, febre pós-quimio, direitos ou transporte municipal.';
    }

    return 'Não consegui identificar sua pergunta com clareza. Tente digitar palavras-chaves como "preparo mamografia", "febre na quimioterapia", "direitos sociais", "transporte municipal" ou explore as perguntas respondidas na aba de FAQs!';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: userMsg, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setChatInput('');
    setIsBotTyping(true);

    setTimeout(() => {
      const reply = getBotResponse(userMsg);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: reply, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
      ]);
      setIsBotTyping(false);
    }, 1200);
  };

  const selectShortcut = (text: string) => {
    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: text, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setIsBotTyping(true);

    setTimeout(() => {
      const reply = getBotResponse(text);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: reply, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
      ]);
      setIsBotTyping(false);
    }, 1000);
  };

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.cat.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
          Central de Ajuda e Orientações
        </h1>
        <p className="text-zinc-500 mt-1">
          Tire suas dúvidas operacionais e baixe guias de preparo oficiais elaborados pelo corpo médico.
        </p>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab('faq')}
          className={`pb-3 font-bold text-sm tracking-wide transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'faq'
              ? 'border-primary text-primary'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Perguntas Frequentes & Robo-FAQ
        </button>
        <button
          onClick={() => setActiveTab('booklets')}
          className={`pb-3 font-bold text-sm tracking-wide transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'booklets'
              ? 'border-primary text-primary'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Biblioteca de Orientações (PDFs)
        </button>
      </div>

      {activeTab === 'faq' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 space-y-5">
            <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
              <CardContent className="p-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Busque por termos como: preparo, febre, FGTS..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="pl-10 h-11 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800"
                  />
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="font-extrabold text-sm uppercase text-zinc-400 tracking-wider">Perguntas Respondidas</h3>
              {filteredFaqs.length === 0 ? (
                <Card className="border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-500 rounded-2xl">
                  Nenhuma dúvida correspondente à busca foi encontrada. Tente outra palavra-chave.
                </Card>
              ) : (
                filteredFaqs.map((faq, idx) => {
                  const isExpanded = expandedFaq === idx;
                  return (
                    <Card
                      key={idx}
                      className="border-zinc-200/60 dark:border-zinc-800 hover:border-primary/20 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 transition-all"
                    >
                      <button
                        onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                        className="w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Badge variant="secondary" className="px-2 py-0.5 text-[9px] font-bold rounded-lg uppercase tracking-wider bg-primary/5 text-primary dark:bg-zinc-900 dark:text-zinc-400">
                            {faq.cat}
                          </Badge>
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180 text-primary' : ''}`}
                        />
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-zinc-650 dark:text-zinc-400 border-t border-zinc-50 dark:border-zinc-900/50 leading-relaxed bg-zinc-50/20 dark:bg-zinc-900/5">
                          {faq.a}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-lg rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 flex flex-col h-[520px]">
              <CardHeader className="bg-primary p-4 text-white flex flex-row items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
                  <Sparkles className="w-5 h-5 text-secondary fill-secondary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black text-white uppercase tracking-wider">Robo-FAQ Hospital</CardTitle>
                  <CardDescription className="text-[10px] text-blue-200 font-bold block">Assistente Virtual 24h</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/5">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end animate-in slide-in-from-right-2' : 'items-start animate-in slide-in-from-left-2'}`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-zinc-400 mt-1 font-semibold px-1">{msg.timestamp}</span>
                  </div>
                ))}

                {isBotTyping && (
                  <div className="flex flex-col items-start max-w-[85%] animate-pulse">
                    <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-zinc-450 dark:text-zinc-400 text-xs rounded-2xl rounded-tl-none">
                      Digitando...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </CardContent>

              <div className="p-3 border-t border-zinc-100 dark:border-zinc-850 shrink-0 space-y-1.5 bg-white dark:bg-zinc-950">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Dúvidas rápidas:</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => selectShortcut('Preparo Mamografia')}
                    className="px-2.5 py-1 bg-zinc-50 hover:bg-primary/5 border border-zinc-150 hover:border-primary/20 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl text-[9px] font-bold text-zinc-650 dark:text-zinc-400 transition-colors"
                  >
                    Preparo Mamografia
                  </button>
                  <button
                    onClick={() => selectShortcut('Febre na quimioterapia')}
                    className="px-2.5 py-1 bg-zinc-50 hover:bg-primary/5 border border-zinc-150 hover:border-primary/20 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl text-[9px] font-bold text-zinc-650 dark:text-zinc-400 transition-colors"
                  >
                    Febre pós-Quimio
                  </button>
                  <button
                    onClick={() => selectShortcut('Direitos do Paciente')}
                    className="px-2.5 py-1 bg-zinc-50 hover:bg-primary/5 border border-zinc-150 hover:border-primary/20 dark:bg-zinc-900 dark:border-zinc-800 rounded-xl text-[9px] font-bold text-zinc-650 dark:text-zinc-400 transition-colors"
                  >
                    Direitos do Paciente
                  </button>
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="p-3 bg-zinc-50 border-t border-zinc-200/50 dark:bg-zinc-900/30 dark:border-zinc-800 flex gap-2 shrink-0">
                <Input
                  type="text"
                  placeholder="Escreva sua pergunta..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 h-10 text-xs focus-visible:ring-primary"
                />
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/95 text-white">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {recommendedBooklet && (
            <Card className="border-2 border-primary/20 shadow-md bg-gradient-to-r from-primary/5 via-white to-secondary/5 rounded-3xl overflow-hidden p-6 relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-24 h-24 text-primary" />
              </div>
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between relative z-10">
                <div className="space-y-2">
                  <Badge className="bg-primary text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                    ✨ Recomendado para o preparo do seu próximo exame
                  </Badge>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50">
                    {recommendedBooklet.title}
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-xl leading-relaxed">
                    {recommendedBooklet.description}
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    handleDownload(recommendedBooklet);
                    handleMarkAsRead(recommendedBooklet.id);
                  }}
                  className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-5 rounded-xl text-xs gap-2 shrink-0 shadow-lg shadow-primary/15"
                >
                  <Download className="w-4 h-4" />
                  Baixar Guia Recomendado
                </Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BOOKLETS.map((booklet) => {
              const isDownloading = downloadingId === booklet.id;
              const isSuccess = downloadSuccessId === booklet.id;
              return (
                <Card
                  key={booklet.id}
                  className="border-zinc-200/60 dark:border-zinc-800 hover:border-primary/20 shadow-sm rounded-3xl bg-white dark:bg-zinc-955 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 flex flex-row items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 dark:bg-zinc-900 border border-secondary/20 dark:border-zinc-800 flex items-center justify-center text-secondary shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="px-2 py-0.5 text-[8px] font-bold rounded-lg uppercase tracking-wider border-zinc-200 text-zinc-400 dark:border-zinc-800">
                          {booklet.category} • {booklet.size}
                        </Badge>
                        {readBooklets.includes(booklet.id) && (
                          <Badge variant="secondary" className="px-2 py-0.5 text-[8px] font-bold rounded-lg uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border-none">
                            ✓ Lido
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                        {booklet.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-0">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {booklet.description}
                    </p>
                    
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-3">
                      <Button
                        onClick={() => {
                          handleDownload(booklet);
                          handleMarkAsRead(booklet.id);
                        }}
                        disabled={downloadingId !== null}
                        className={`flex-1 font-bold h-10 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all ${
                          isSuccess
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : 'bg-primary hover:bg-primary/95 text-white'
                        }`}
                      >
                        {isDownloading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Baixando ({downloadProgress}%)</span>
                          </>
                        ) : isSuccess ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Download Concluído</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="border border-zinc-200/70 dark:border-zinc-800 shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-zinc-950">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-secondary/15 text-secondary font-black rounded-lg uppercase tracking-wider text-[9px] px-2 py-0.5">
                  Vídeo com Acessibilidade
                </Badge>
              </div>
              <CardTitle className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1">
                Orientações Gerais de Acolhimento e Cuidados
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Vídeo explicativo oficial com suporte a Legendas e intérprete virtual de Libras.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-2xl overflow-hidden bg-slate-950 border border-slate-900 flex flex-col justify-between p-4 shadow-inner">
                {isLibras && (
                  <div className="absolute bottom-16 right-4 w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center text-center p-1.5 z-20 animate-in zoom-in-95 duration-200">
                    <span className="text-3xl animate-bounce duration-1000 select-none">
                      {isPlaying ? ['🖐️', '👌', '👍', '👋'][Math.floor(progress / 5) % 4] : '🙋'}
                    </span>
                    <span className="text-[8px] font-bold text-white uppercase tracking-wider mt-1 opacity-90">Libras</span>
                  </div>
                )}

                <div className="w-full flex justify-between items-center text-white/70 text-[10px] z-10">
                  <span className="bg-black/35 px-2.5 py-1 rounded-lg font-bold backdrop-blur-xs font-mono">Offline Simulator</span>
                  <span className="bg-black/35 px-2.5 py-1 rounded-lg font-bold backdrop-blur-xs font-mono">Acolhimento.mp4</span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 hover:bg-primary/90 p-0 border-none"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-white text-white" /> : <Play className="w-6 h-6 fill-white text-white ml-0.5" />}
                  </Button>
                </div>

                <div className="w-full flex flex-col items-center gap-3 z-10">
                  {isSubtitles && (
                    <div className="w-full max-w-lg bg-black/65 backdrop-blur-xs border border-white/5 py-1.5 px-3 rounded-xl text-center text-[10px] sm:text-xs text-white leading-relaxed animate-in fade-in duration-200">
                      {currentCaption}
                    </div>
                  )}

                  <div className="w-full bg-black/35 backdrop-blur-xs p-2.5 rounded-xl border border-white/5 space-y-2">
                    <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/80">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-white font-bold uppercase">
                          {isPlaying ? 'Pausar' : 'Iniciar'}
                        </button>
                        <span>{isPlaying ? `0:${progress.toString().padStart(2, '0')}` : '0:00'} / 0:30</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={() => setIsSubtitles(!isSubtitles)}
                          variant="ghost"
                          className={`h-7 px-2.5 rounded-lg font-extrabold flex items-center gap-1 transition-colors text-[10px] border-none ${isSubtitles ? 'bg-primary text-white hover:bg-primary' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        >
                          <Captions className="w-3.5 h-3.5" />
                          <span>Legendas</span>
                        </Button>
                        <Button
                          onClick={() => setIsLibras(!isLibras)}
                          variant="ghost"
                          className={`h-7 px-2.5 rounded-lg font-extrabold flex items-center gap-1 transition-colors text-[10px] border-none ${isLibras ? 'bg-primary text-white hover:bg-primary' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                        >
                          <span>🙋</span>
                          <span>Libras</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {downloadingId && createPortal(
        <div onClick={() => setDownloadingId(null)} className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <Card onClick={(e) => e.stopPropagation()} className="max-w-xs w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto animate-bounce">
              <Download className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Baixando Cartilha</h3>
              <p className="text-[0.625rem] text-zinc-400">Estabelecendo conexão segura offline...</p>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-200"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-primary block">{downloadProgress}%</span>
          </Card>
        </div>,
        document.body
      )}
    </div>
  );
}
