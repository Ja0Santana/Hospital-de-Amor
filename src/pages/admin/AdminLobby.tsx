import { useState, useEffect } from 'react';
import { Volume2, Tv, Clock, AlertCircle } from 'lucide-react';
import { subscribeToLobby, type LobbyMessage } from '../../services/lobbyChannel';
import logoHospitalDeAmor from '../../assets/logoHospitalDeAmor.png';

interface HistoricalCall {
  patientDisplayName: string;
  examType: string;
  callTicket: string;
  timestamp: number;
}

export default function AdminLobby() {
  const [activeCall, setActiveCall] = useState<HistoricalCall | null>(null);
  const [history, setHistory] = useState<HistoricalCall[]>([]);
  const [time, setTime] = useState(new Date());
  const [isPlayingAlert, setIsPlayingAlert] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToLobby((msg: LobbyMessage) => {
      if (msg.type === 'call' && msg.patientDisplayName && msg.examType && msg.callTicket) {
        const newCall: HistoricalCall = {
          patientDisplayName: msg.patientDisplayName,
          examType: msg.examType,
          callTicket: msg.callTicket,
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

        setIsPlayingAlert(true);
        const alertTimer = setTimeout(() => setIsPlayingAlert(false), 2500);
        
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
          console.warn('AudioContext not allowed or not supported yet.', e);
        }

        return () => clearTimeout(alertTimer);
      } else if (msg.type === 'clear') {
        setActiveCall(null);
        setHistory([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans overflow-hidden">
      <header className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/80 px-8 py-5 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl p-2 flex items-center justify-center shadow-lg shadow-pink-950/20">
            <img src={logoHospitalDeAmor} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-comfortaa font-bold text-lg tracking-wider text-white uppercase flex items-center gap-2">
              <span>Painel de Chamadas</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[10px] text-zinc-400 font-extrabold tracking-widest uppercase">Recepção Geral</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-zinc-850 px-4 py-2 rounded-2xl border border-zinc-800 text-zinc-300">
            <Clock className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-black font-mono">
              {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-zinc-850 px-4 py-2 rounded-2xl border border-zinc-800 text-zinc-300">
            <Tv className="w-4 h-4 text-pink-500" />
            <span className="text-xs font-bold uppercase">Modo TV</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 flex flex-col lg:flex-row gap-8 min-h-0">
        <section className="flex-1 flex flex-col justify-center items-center bg-zinc-900 border border-zinc-800/60 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-950/5 via-transparent to-transparent pointer-events-none" />
          
          {activeCall ? (
            <div className={`w-full max-w-4xl text-center space-y-8 select-none ${isPlayingAlert ? 'animate-bounce' : ''}`}>
              <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-pink-950/30 border border-pink-500/20 text-pink-400 text-xs font-black uppercase tracking-widest animate-pulse">
                <Volume2 className="w-4 h-4 animate-bounce" />
                Chamando Agora
              </div>

              <div className="space-y-4">
                <div className="text-zinc-500 font-black text-xs uppercase tracking-widest">Senha</div>
                <div className="text-8xl md:text-9xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-400">
                  {activeCall.callTicket}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-zinc-500 font-black text-xs uppercase tracking-widest">Paciente</div>
                <div className="text-4xl md:text-5xl font-black text-white leading-tight truncate">
                  {activeCall.patientDisplayName}
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 max-w-md mx-auto">
                <div className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mb-1.5">Especialidade / Exame</div>
                <div className="text-lg font-bold text-zinc-300 uppercase tracking-wide truncate">
                  {activeCall.examType}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6 select-none max-w-md">
              <div className="mx-auto w-24 h-24 rounded-3xl bg-zinc-800/40 border border-zinc-850 flex items-center justify-center shadow-inner">
                <AlertCircle className="w-10 h-10 text-zinc-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-zinc-300">Aguardando Chamados</h3>
                <p className="text-xs text-zinc-500">O painel está pronto para receber novas chamadas do painel de triagem médica.</p>
              </div>
            </div>
          )}
        </section>

        <aside className="w-full lg:w-96 bg-zinc-900 border border-zinc-800/60 rounded-3xl p-6 flex flex-col min-h-[350px] lg:min-h-0 shadow-2xl">
          <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-4 select-none flex items-center justify-between">
            <span>Últimas Chamadas</span>
            <span className="px-2 py-0.5 rounded bg-zinc-850 text-[9px] font-bold text-zinc-500">{history.length} registradas</span>
          </h2>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {history.length > 0 ? (
              history.map((call, idx) => (
                <div 
                  key={call.timestamp + idx} 
                  className="bg-zinc-950 border border-zinc-800/60 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all hover:bg-zinc-900/50 hover:border-zinc-800"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-zinc-300 truncate mb-0.5">{call.patientDisplayName}</h4>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider truncate font-semibold">{call.examType}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black font-mono text-pink-500">{call.callTicket}</span>
                    <span className="block text-[8px] text-zinc-600 mt-0.5 font-bold font-mono">
                      {new Date(call.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-650">
                <p className="text-xs font-bold text-zinc-600">Nenhum histórico disponível</p>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px]">Os chamados anteriores aparecerão listados aqui.</p>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
