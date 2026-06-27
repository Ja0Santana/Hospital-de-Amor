
import { Clock } from 'lucide-react';
import type { Appointment } from '../../../types';

interface RealocationOffersPanelProps {
  appointments: Appointment[];
  getRemainingTime: (expiresAtStr: string) => string;
}

export default function RealocationOffersPanel({
  appointments,
  getRemainingTime,
}: RealocationOffersPanelProps) {
  const realocationOffers = appointments.filter(
    (app) =>
      app.waitingListOfferExpiresAt &&
      new Date(app.waitingListOfferExpiresAt) > new Date()
  );

  if (realocationOffers.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <Clock className="w-5 h-5 text-pink-655 animate-pulse" />
        <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
          Vagas em Realocação Inteligente (RF44)
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {realocationOffers.map((offer) => {
          const timerStr = getRemainingTime(offer.waitingListOfferExpiresAt!);
          return (
            <div
              key={offer.id}
              className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between text-xs gap-4 shadow-sm animate-in fade-in"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-150">
                    {offer.patientName}
                  </span>
                  <span className="font-mono bg-zinc-100 dark:bg-zinc-850 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-500">
                    {offer.protocol}
                  </span>
                </div>
                <p className="text-zinc-500 font-semibold">
                  {offer.examName} • {offer.city}
                </p>
                <p className="text-[10px] text-zinc-400 font-medium">
                  Ofertado em:{' '}
                  {offer.waitingListOfferDate
                    ? new Date(offer.waitingListOfferDate).toLocaleTimeString('pt-BR')
                    : ''}{' '}
                  • Data da Vaga:{' '}
                  {offer.rescheduledDate
                    ? new Date(offer.rescheduledDate + 'T12:00:00').toLocaleDateString(
                        'pt-BR'
                      )
                    : ''}{' '}
                  às {offer.rescheduledTime}h
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Tempo Restante
                </span>
                <span className="font-mono text-base font-black text-pink-600 bg-pink-50 dark:bg-pink-955/20 px-3 py-1 rounded-xl border border-pink-200/30">
                  {timerStr}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
