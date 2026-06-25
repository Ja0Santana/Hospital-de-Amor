import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Tv, Clock, Stethoscope, Heart, Sun, Moon, Accessibility } from 'lucide-react';
import { subscribeToLobby, type LobbyMessage } from '../../services/lobbyChannel';
import logoHospitalDeAmor from '../../assets/logoHospitalDeAmor.png';
import lobbyCampaignBanner from '../../assets/lobby_campaign_banner.png';
import { getSupportMessages } from '../../services/db';
import type { SupportMessage } from '../../types';

interface HistoricalCall {
  patientDisplayName: string;
  examType: string;
  callTicket: string;
  professionalName?: string;
  timestamp: number;
}

export default function AdminLobby() {
  const [activeCall, setActiveCall] = useState<HistoricalCall | null>(null);
  const [history, setHistory] = useState<HistoricalCall[]>([]);
  const [time, setTime] = useState(new Date());
  const [isMuted, setIsMuted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const messages = await getSupportMessages();
        const authorized = messages.filter(m => m.isAuthorized);
        setSupportMessages(authorized);
      } catch (e) {
        console.error(e);
      }
    };
    loadMessages();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToLobby((msg: LobbyMessage) => {
      if (msg.type === 'call' && msg.patientDisplayName && msg.examType && msg.callTicket) {
        const newCall: HistoricalCall = {
          patientDisplayName: msg.patientDisplayName,
          examType: msg.examType,
          callTicket: msg.callTicket,
          professionalName: msg.professionalName,
          timestamp: msg.timestamp
        };

        setActiveCall((prevActive) => {
          if (prevActive) {
            setHistory((prevHistory) => {
              const updated = [prevActive, ...prevHistory];
              return updated.slice(0, 5);
            });
          }
          return newCall;
        });

        if (!isMutedRef.current) {
          try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, context.currentTime);
            osc.frequency.setValueAtTime(880.00, context.currentTime + 0.15);

            gain.gain.setValueAtTime(0.15, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);

            osc.connect(gain);
            gain.connect(context.destination);

            osc.start();
            osc.stop(context.currentTime + 0.6);
          } catch (e) {
            console.warn(e);
          }

          setTimeout(() => {
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
              const text = `Atenção: Paciente ${msg.patientDisplayName}, dirigir-se ao ${msg.examType}`;
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.lang = 'pt-BR';
              utterance.rate = 0.9;
              window.speechSynthesis.speak(utterance);
            }
          }, 800);
        }
      } else if (msg.type === 'clear') {
        setActiveCall(null);
        setHistory([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const fallbackMessages: SupportMessage[] = [
    { id: 'f1', donorName: 'Diretoria', message: 'O amor cura. Obrigado por apoiar o Hospital de Amor.', date: new Date().toISOString(), isAuthorized: true },
    { id: 'f2', donorName: 'Equipe de Saúde', message: 'Prevenir é cuidar. Faça seus exames preventivos regularmente.', date: new Date().toISOString(), isAuthorized: true },
    { id: 'f3', donorName: 'Voluntariado', message: 'A solidariedade transforma vidas. Seja um doador de amor.', date: new Date().toISOString(), isAuthorized: true },
    { id: 'f4', donorName: 'Equipe de Enfermagem', message: 'Cuidar de você com carinho e dedicação é a nossa maior missão.', date: new Date().toISOString(), isAuthorized: true }
  ];

  const activeMessages = supportMessages.length > 0 ? supportMessages : fallbackMessages;

  useEffect(() => {
    if (activeMessages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % activeMessages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeMessages]);

  const currentMsg = activeMessages[currentMessageIndex] || activeMessages[0];
  const isPriority = activeCall && (activeCall.callTicket.startsWith('S-') || activeCall.callTicket.startsWith('P-'));

  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-col md:flex-row h-screen w-screen overflow-hidden font-sans select-none transition-colors duration-300 ${
      isDark ? 'bg-zinc-950 text-white' : 'bg-slate-100 text-zinc-900'
    }`}>
      <div className={`w-full md:w-2/3 h-full flex flex-col p-6 gap-6 border-r transition-colors duration-300 ${
        isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className={`flex-1 flex flex-col justify-between items-center text-center p-8 border rounded-3xl relative overflow-hidden transition-colors duration-300 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-zinc-200'
        }`}>
          <div className={`absolute -top-40 -left-40 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            isDark ? 'bg-pink-500/5' : 'bg-pink-500/10'
          }`} />
          <div className={`absolute -bottom-40 -right-40 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            isDark ? 'bg-rose-500/5' : 'bg-rose-500/10'
          }`} />

          {activeCall ? (
            <div className="flex-1 flex flex-col justify-between items-center w-full py-6">
              <div>
                {isPriority ? (
                  <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-amber-500 text-zinc-955 text-sm font-black uppercase tracking-widest shadow-lg">
                    <Accessibility className="w-5 h-5 text-zinc-955" />
                    <span>Prioridade Legal</span>
                  </div>
                ) : (
                  <div className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-colors duration-300 ${
                    isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-200 text-zinc-700 border-zinc-300'
                  }`}>
                    <span>Chamada Geral</span>
                  </div>
                )}
              </div>

              <div className="space-y-6 w-full my-auto">
                <div className="space-y-1">
                  <div className="text-zinc-500 font-extrabold text-xs uppercase tracking-widest">Senha</div>
                  <div className={`text-8xl md:text-9xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 ${
                    isDark ? 'drop-shadow-[0_0_30px_rgba(244,63,94,0.25)]' : 'drop-shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                  }`}>
                    {activeCall.callTicket}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-zinc-500 font-extrabold text-xs uppercase tracking-widest">Paciente</div>
                  <div className={`text-4xl md:text-6xl font-black leading-tight truncate px-4 transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}>
                    {activeCall.patientDisplayName}
                  </div>
                </div>
              </div>

              <div className={`w-full max-w-xl border-t pt-6 space-y-4 transition-colors duration-300 ${
                isDark ? 'border-zinc-800' : 'border-zinc-200'
              }`}>
                <div>
                  <div className="text-zinc-500 font-extrabold text-[10px] uppercase tracking-widest mb-2">Sala / Consultório</div>
                  <div className="inline-block bg-pink-600 text-white font-black text-2xl md:text-3xl px-8 py-3.5 rounded-2xl shadow-lg uppercase tracking-wide border border-pink-500/20 shadow-pink-500/10">
                    {activeCall.examType}
                  </div>
                </div>

                {activeCall.professionalName && (
                  <div className={`flex items-center gap-2 text-sm justify-center transition-colors duration-300 ${
                    isDark ? 'text-zinc-400' : 'text-zinc-600'
                  }`}>
                    <Stethoscope className="w-4 h-4 text-pink-500" />
                    <span className="font-semibold">Dr(a). {activeCall.professionalName}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full blur-2xl animate-pulse ${
                  isDark ? 'bg-pink-500/10' : 'bg-pink-500/20'
                }`} />
                <div className={`relative w-28 h-28 rounded-3xl border flex items-center justify-center shadow-2xl transition-colors duration-300 ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                }`}>
                  <Tv className="w-12 h-12 text-pink-500 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className={`text-2xl font-black transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-zinc-800'
                }`}>Painel de Chamadas Ativo</h3>
                <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  Aguardando chamadas. As senhas e salas de atendimento serão exibidas aqui em tempo real.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className={`h-1/3 min-h-0 flex flex-col border rounded-3xl p-6 transition-colors duration-300 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <h2 className={`text-xs font-black uppercase tracking-wider mb-4 flex items-center justify-between transition-colors duration-300 ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            <span>Últimas Chamadas</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors duration-300 ${
              isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
            }`}>{history.length} registradas</span>
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {history.length > 0 ? (
              history.map((call, idx) => (
                <div
                  key={call.timestamp + idx}
                  className={`border p-4 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 shadow-sm ${
                    isDark
                      ? `border-zinc-800/60 hover:bg-zinc-800/40 ${idx % 2 === 0 ? 'bg-zinc-900/60' : 'bg-zinc-900/20'}`
                      : `border-zinc-150 hover:bg-slate-50 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`
                  }`}
                >
                  <div className="min-w-0">
                    <h4 className={`text-base font-bold truncate transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-zinc-800'
                    }`}>{call.patientDisplayName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase transition-colors duration-300 ${
                        isDark ? 'bg-pink-950 text-pink-300 border-pink-900/30' : 'bg-pink-50 text-pink-600 border-pink-100'
                      }`}>
                        {call.examType}
                      </span>
                      {call.professionalName && (
                        <span className={`text-[10px] flex items-center gap-1 transition-colors duration-300 ${
                          isDark ? 'text-zinc-400' : 'text-zinc-500'
                        }`}>
                          <Stethoscope className="w-3 h-3 text-pink-500" />
                          {call.professionalName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-black font-mono text-pink-500">{call.callTicket}</span>
                    <span className={`block text-[10px] font-mono mt-0.5 transition-colors duration-300 ${
                      isDark ? 'text-zinc-500' : 'text-zinc-400'
                    }`}>
                      {new Date(call.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <p className={`text-xs font-bold transition-colors duration-300 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Nenhum histórico disponível</p>
                <p className="text-[10px] mt-1 max-w-[200px]">Os chamados anteriores aparecerão listados aqui.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`w-full md:w-1/3 h-full flex flex-col p-6 gap-6 justify-between transition-colors duration-300 ${
        isDark ? 'bg-zinc-950' : 'bg-slate-50'
      }`}>
        <div className={`flex items-center justify-between border-b pb-4 transition-colors duration-300 ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-3">
            <img src={logoHospitalDeAmor} alt="Logo" className="h-10 w-auto object-contain bg-white rounded-lg p-1" />
            <div>
              <h1 className={`text-sm font-black tracking-wider transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-zinc-800'
              }`}>HOSPITAL DE AMOR</h1>
              <p className="text-[10px] text-pink-500 font-extrabold tracking-wider uppercase">Painel Digital</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
              className={`p-2 rounded-xl border transition-colors duration-300 ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
                  : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-800'
              }`}
              title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            </button>

            <button
              onClick={() => setIsMuted(prev => !prev)}
              className={`p-2 rounded-xl border transition-colors duration-300 ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
                  : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-800'
              }`}
              title={isMuted ? 'Ativar som' : 'Desativar som'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-emerald-500" />}
            </button>
          </div>
        </div>

        <div className={`border p-4 rounded-2xl flex items-center justify-between transition-colors duration-300 ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors duration-300 ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            <Clock className="w-4 h-4 text-pink-500" />
            Hora Local
          </span>
          <span className="text-xl font-black font-mono text-pink-500 tracking-wider">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div className={`flex-1 flex items-center justify-center overflow-hidden rounded-3xl border bg-zinc-900 relative group transition-colors duration-300 ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <img
            src={lobbyCampaignBanner}
            alt="Campanha Preventiva"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {currentMsg && (
          <div className={`border p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[160px] transition-all duration-300 ${
            isDark
              ? 'bg-gradient-to-br from-pink-950/40 to-rose-950/20 border-pink-900/30 text-zinc-200'
              : 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100 text-zinc-700'
          }`}>
            <div className={`absolute top-2 right-4 font-serif text-8xl pointer-events-none select-none transition-colors duration-300 ${
              isDark ? 'text-pink-500/10' : 'text-pink-500/5'
            }`}>“</div>

            <div className="flex-1 flex flex-col justify-center">
              <p className="text-sm font-semibold leading-relaxed italic">
                "{currentMsg.message}"
              </p>
            </div>

            <div className={`mt-4 flex items-center justify-between border-t pt-3 transition-colors duration-300 ${
              isDark ? 'border-pink-900/20' : 'border-pink-100'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors duration-300 ${
                  isDark ? 'bg-pink-950 border-pink-900/30' : 'bg-pink-50 border-pink-100'
                }`}>
                  <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
                </div>
                <div>
                  <p className={`text-xs font-bold transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-zinc-900'
                  }`}>{currentMsg.donorName}</p>
                  <p className={`text-[10px] transition-colors duration-300 ${
                    isDark ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>Mensagem de Apoio</p>
                </div>
              </div>

              <span className={`text-[10px] font-mono transition-colors duration-300 ${
                isDark ? 'text-zinc-500' : 'text-zinc-450'
              }`}>
                {new Date(currentMsg.date).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
