import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Sparkles, Send } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function RoboFaqEmbeddedChat() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Olá! Sou o Assistente Virtual do Hospital de Amor. Estou aqui para tirar suas dúvidas de saúde, preparo para exames e funcionamento. O que você gostaria de saber hoje?', timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isBotTyping]);

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

  const handleSendMessage = (e: FormEvent) => {
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

  return (
    <Card className="border-zinc-200/80 dark:border-zinc-800 shadow-lg rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 flex flex-col h-[520px] text-left">
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
          className="bg-white border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 h-10 text-xs focus-visible:ring-primary dark:text-zinc-100"
        />
        <Button type="submit" size="icon" className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/95 text-white">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
}
