import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Send, Sparkles, MessageSquare } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

interface RoboFaqWidgetProps {
  currentPage: string;
}

export default function RoboFaqWidget({ currentPage }: RoboFaqWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Olá! Sou o Robo-FAQ. Tire suas dúvidas sobre preparo de exames, febre pós-quimioterapia, transporte municipal ou direitos do paciente. Como posso ajudar?', timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isBotTyping, isOpen]);

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

    return 'Não consegui compreender bem. Tente termos simples como "preparo mamografia", "febre na quimioterapia" ou "direitos sociais". Você também pode consultar as FAQs completas no menu Ajuda!';
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
    }, 1000);
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
    }, 850);
  };

  if (currentPage === 'help-center') {
    return null;
  }

  return (
    <div className="fixed left-6 md:left-72 bottom-6 z-40 font-sans">
      {isOpen ? (
        <Card className="w-[310px] sm:w-[330px] h-[440px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
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
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'items-start'}`}
              >
                <div
                  className={`p-2.5 rounded-2xl text-[11px] leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-zinc-800 dark:text-zinc-250 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[7px] text-zinc-400 mt-0.5 font-semibold px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isBotTyping && (
              <div className="flex flex-col items-start max-w-[85%] animate-pulse">
                <div className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-zinc-400 text-[11px] rounded-2xl rounded-tl-none">
                  Digitando...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </CardContent>

          <div className="p-2.5 border-t border-zinc-100 dark:border-zinc-850 shrink-0 space-y-1 bg-white dark:bg-zinc-950">
            <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-wider block">Sugestões:</span>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => selectShortcut('Preparo Mamografia')}
                className="px-2 py-0.5 bg-zinc-50 hover:bg-primary/5 border border-zinc-150 hover:border-primary/20 dark:bg-zinc-900 dark:border-zinc-850 rounded-lg text-[8px] font-bold text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                Preparo Mama
              </button>
              <button
                type="button"
                onClick={() => selectShortcut('Febre na quimioterapia')}
                className="px-2 py-0.5 bg-zinc-50 hover:bg-primary/5 border border-zinc-150 hover:border-primary/20 dark:bg-zinc-900 dark:border-zinc-850 rounded-lg text-[8px] font-bold text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                Febre pós-Quimio
              </button>
              <button
                type="button"
                onClick={() => selectShortcut('Direitos do Paciente')}
                className="px-2 py-0.5 bg-zinc-50 hover:bg-primary/5 border border-zinc-150 hover:border-primary/20 dark:bg-zinc-900 dark:border-zinc-850 rounded-lg text-[8px] font-bold text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                Direitos
              </button>
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="p-2 bg-zinc-50 border-t border-zinc-200/50 dark:bg-zinc-900/30 dark:border-zinc-800 flex gap-1.5 shrink-0">
            <Input
              type="text"
              placeholder="Digite aqui..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="bg-white border-zinc-250 dark:bg-zinc-950 dark:border-zinc-850 h-8 text-[11px] focus-visible:ring-primary"
            />
            <Button type="submit" size="icon" className="h-8 w-8 shrink-0 bg-primary hover:bg-primary/95 text-white">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 bg-primary hover:bg-primary/95 text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/20 transition-all hover:scale-110 active:scale-95 animate-bounce"
          aria-label="Abrir assistente virtual"
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      )}
    </div>
  );
}
