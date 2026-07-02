import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '../../ui/Button';

interface WaitlistOfferWidgetProps {
  expiresAt: string;
  date: string;
  time: string;
  doctor: string;
  room: string;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}

export default function WaitlistOfferWidget({
  expiresAt,
  date,
  time,
  doctor,
  room,
  onAccept,
  onReject
}: WaitlistOfferWidgetProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="p-5 bg-pink-50 dark:bg-pink-950/20 border border-pink-200/40 dark:border-pink-900/30 rounded-2xl space-y-4 animate-in slide-in-from-top-3 text-left">
      <div className="flex gap-3 items-start">
        <Clock className="w-5 h-5 text-pink-600 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1 flex-1">
          <h4 className="font-extrabold text-sm text-pink-700 dark:text-pink-400 font-sans">Oferta de Vaga Liberada! (Fila de Espera)</h4>
          <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed">
            Uma vaga foi liberada para o seu exame/consulta por cancelamento de outro paciente!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-zinc-600 dark:text-zinc-400">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Data e Horário</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR') : ''} às {time}h
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Profissional</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {doctor}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Consultório / Sala</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {room}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Tempo Restante</span>
          <span className="font-mono text-base font-black text-pink-600 bg-white dark:bg-zinc-950 px-3 py-1 rounded-xl border border-pink-200/20">
            {timeLeft}
          </span>
        </div>
      </div>
      <div className="flex gap-2.5 pt-2 border-t border-pink-100 dark:border-pink-900/20 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onReject}
          className="h-9 px-4 rounded-xl text-xs font-bold border-red-200 text-red-650 hover:bg-red-50 dark:border-red-900/40 dark:text-red-400"
        >
          Recusar Vaga
        </Button>
        <Button
          type="button"
          onClick={onAccept}
          className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black shadow-sm"
        >
          Aceitar Vaga
        </Button>
      </div>
    </div>
  );
}
