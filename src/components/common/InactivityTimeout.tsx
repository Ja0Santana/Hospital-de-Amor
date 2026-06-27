import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '../ui/Button';

interface InactivityTimeoutProps {
  onLogout: () => void;
  children: React.ReactNode;
}

export function InactivityTimeout({ onLogout, children }: InactivityTimeoutProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const warnTimerRef = useRef<any>(null);

  const INACTIVITY_TIME = 14 * 60 * 1000;

  const resetInactivityTimers = () => {
    if (showWarning) return;

    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);

    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(60);
    }, INACTIVITY_TIME);
  };

  useEffect(() => {
    const handleActivity = () => {
      resetInactivityTimers();
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    resetInactivityTimers();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
    };
  }, [showWarning]);

  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeoutLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleKeepSessionActive();
      }
    };
    if (showWarning) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showWarning]);

  const handleTimeoutLogout = () => {
    setShowWarning(false);
    onLogout();
  };

  const handleKeepSessionActive = () => {
    setShowWarning(false);
  };

  return (
    <>
      {children}

      {showWarning && (
        <div onClick={handleKeepSessionActive} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="timeout-title"
          >
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-full shrink-0 border border-rose-200/20">
                <Clock className="w-6 h-6 animate-pulse" aria-hidden="true" />
              </div>
              <div className="space-y-1.5 text-left">
                <h3 id="timeout-title" className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 leading-tight">
                  Sessão expirando por inatividade
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Por motivos de segurança (LGPD), sua sessão será encerrada automaticamente em <span className="font-bold text-rose-500 font-mono">{countdown} segundos</span>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleTimeoutLogout}
                className="h-10 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 font-bold rounded-xl text-xs"
              >
                Sair Agora
              </Button>
              <Button
                type="button"
                onClick={handleKeepSessionActive}
                className="h-10 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 transition-transform active:scale-95"
              >
                Continuar Logado
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
