import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Mail, AlertCircle, ChevronRight } from 'lucide-react';
import type { Email, Appointment } from '../../../types';
import logoHospitalDeAmor from '../../../assets/logoHospitalDeAmor.png';

interface EmailReaderProps {
  selectedEmail: Email | null;
  appointments: Appointment[];
  onSimulateBounce: (protocolVal: string) => Promise<void>;
  onAcceptOffer: (appId: string) => Promise<void>;
  onRejectOffer: (appId: string) => Promise<void>;
  onExecuteCta: (action: string) => void;
}

export default function EmailReader({
  selectedEmail,
  appointments,
  onSimulateBounce,
  onAcceptOffer,
  onRejectOffer,
  onExecuteCta,
}: EmailReaderProps) {
  if (!selectedEmail) {
    return (
      <div className="flex flex-col space-y-3 h-full">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 pl-1">
          Leitor de E-mail
        </h2>
        <Card className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-955 overflow-hidden flex-1 flex flex-col min-h-[500px]">
          <div className="p-8 text-center text-xs text-zinc-400 flex flex-col items-center justify-center flex-1 space-y-2">
            <Mail className="w-10 h-10 text-zinc-300" />
            <p>Selecione uma mensagem na caixa de entrada para ler.</p>
          </div>
        </Card>
      </div>
    );
  }

  const protocol = selectedEmail.ctaAction?.split('status-')[1];
  const app = protocol ? appointments.find((a) => a.protocol === protocol) : null;
  const isOfferEmail = selectedEmail.subject.includes('Oferta de Vaga');
  const isOfferActive =
    app &&
    app.waitingListOfferExpiresAt &&
    new Date(app.waitingListOfferExpiresAt) > new Date() &&
    (app.status === 'Pendente' || app.status === 'Em análise');

  return (
    <div className="flex flex-col space-y-3 h-full">
      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 pl-1">
        Leitor de E-mail
      </h2>

      <Card className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden flex-1 flex flex-col min-h-[500px]">
        <div className="flex flex-col flex-1">
          <div className="bg-zinc-50 dark:bg-zinc-900/60 px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex flex-col gap-1.5 text-xs text-zinc-500 text-left relative">
            <div>
              <strong className="text-zinc-700 dark:text-zinc-300">De:</strong> {selectedEmail.sender}
            </div>
            <div>
              <strong className="text-zinc-700 dark:text-zinc-300 font-bold">Para:</strong> {selectedEmail.recipient}
            </div>
            <div>
              <strong className="text-zinc-700 dark:text-zinc-300">Data:</strong> {selectedEmail.date}
            </div>
            <div>
              <strong className="text-zinc-700 dark:text-zinc-300">Assunto:</strong>{' '}
              <span className="text-zinc-850 dark:text-zinc-200 font-bold">{selectedEmail.subject}</span>
            </div>
            {selectedEmail.id.startsWith('queue-') && (
              <div className="absolute right-4 top-4">
                <Button
                  onClick={async () => {
                    const protocolVal = selectedEmail.ctaAction?.split('status-')[1] || selectedEmail.recipient;
                    await onSimulateBounce(protocolVal);
                  }}
                  className="text-[9px] h-7 px-2 font-bold bg-red-655 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3 h-3 text-white" />
                  Simular Bounce Técnico
                </Button>
              </div>
            )}
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

            {isOfferEmail ? (
              isOfferActive && app ? (
                <div className="flex gap-4 shrink-0">
                  <Button
                    onClick={async () => {
                      await onAcceptOffer(app.id);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-emerald-600/20 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Aceitar Vaga
                  </Button>
                  <Button
                    onClick={async () => {
                      await onRejectOffer(app.id);
                    }}
                    className="bg-zinc-650 hover:bg-zinc-700 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-zinc-650/20 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Recusar Vaga
                  </Button>
                </div>
              ) : (
                <div className="text-zinc-500 font-semibold text-xs py-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl px-4 shrink-0 border border-zinc-150 dark:border-zinc-800">
                  Esta oferta de vaga não está mais ativa ou o prazo de 4 horas expirou.
                </div>
              )
            ) : (
              selectedEmail.ctaText &&
              selectedEmail.ctaAction && (
                <Button
                  onClick={() => onExecuteCta(selectedEmail.ctaAction!)}
                  className="bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-12 px-6 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98] group flex items-center gap-1.5 shrink-0"
                >
                  <span>{selectedEmail.ctaText}</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              )
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
