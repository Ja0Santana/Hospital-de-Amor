import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Play, Pause, Captions, Accessibility, ThumbsUp, Hand, Check } from 'lucide-react';

export default function EducationalVideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubtitles, setIsSubtitles] = useState(true);
  const [isLibras, setIsLibras] = useState(true);
  const [currentCaption, setCurrentCaption] = useState('Clique em Play para iniciar o vídeo educativo.');

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

  return (
    <Card className="border border-zinc-200/70 dark:border-zinc-800 shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 text-left">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-secondary/15 text-secondary font-black rounded-lg uppercase tracking-wider text-[9px] px-2 py-0.5 border-none">
            Vídeo com Acessibilidade
          </Badge>
        </div>
        <CardTitle className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1 font-sans">
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
              <div className="h-10 flex items-center justify-center text-white select-none transition-all duration-300 transform scale-110">
                {isPlaying ? (
                  [
                    <Hand key="h1" className="w-7 h-7 text-white animate-pulse" />,
                    <Check key="c1" className="w-7 h-7 text-white animate-pulse" />,
                    <ThumbsUp key="t1" className="w-7 h-7 text-white animate-pulse" />,
                    <Hand key="h2" className="w-7 h-7 text-white -rotate-12 animate-pulse" />
                  ][Math.floor(progress / 5) % 4]
                ) : (
                  <Accessibility className="w-7 h-7 text-white" />
                )}
              </div>
              <span className="text-[8px] font-bold text-white uppercase tracking-wider mt-2 opacity-90">Libras</span>
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
                    <Accessibility className="w-3.5 h-3.5" />
                    <span>Libras</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
