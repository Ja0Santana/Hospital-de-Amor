import { useState } from 'react';
import type { FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Label } from '../../ui/Label';
import { Button } from '../../ui/Button';
import { Star, CheckCircle2, AlertCircle, MessageSquare, Clock } from 'lucide-react';
import type { FeedbackResponse } from '../../../types';

interface NpsFeedbackFormProps {
  appointmentProtocol: string;
  appointmentFeedbackNps?: number | null;
  appointmentCreatedAt: string;
  appointmentStatusHistory?: { status: string; changedAt: string }[];
  feedbacks: FeedbackResponse[];
  onSubmitNps: (score: number, comment: string) => Promise<void>;
}

export default function NpsFeedbackForm({
  appointmentProtocol,
  appointmentFeedbackNps,
  appointmentCreatedAt,
  appointmentStatusHistory = [],
  feedbacks,
  onSubmitNps
}: NpsFeedbackFormProps) {
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [npsComment, setNpsComment] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [simulatedHours, setSimulatedHours] = useState(0);

  const getFeedbackStatus = () => {
    const historyItem = [...appointmentStatusHistory]
      .reverse()
      .find(h => h.status === 'Confirmado' || h.status === 'Concluído');
    const baseDate = historyItem ? new Date(historyItem.changedAt) : new Date(appointmentCreatedAt);
    const changeTime = baseDate.getTime();
    let hoursElapsed = (new Date().getTime() - changeTime) / (1000 * 60 * 60);
    if (simulatedHours !== 0) {
      hoursElapsed = simulatedHours;
    }
    if (hoursElapsed < 24) {
      const availableDate = new Date(changeTime + 24 * 60 * 60 * 1000);
      return {
        visible: false,
        reason: 'pending_24h',
        availableAt: availableDate.toLocaleString('pt-BR')
      };
    }
    if (hoursElapsed > 24 + (7 * 24)) {
      return { visible: false, reason: 'expired' };
    }
    return { visible: true };
  };

  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (npsScore === null) {
      setFeedbackError('Por favor, selecione uma nota de 0 a 10.');
      return;
    }
    if (!npsComment.trim()) {
      setFeedbackError('Por favor, escreva um comentário sobre o seu atendimento.');
      return;
    }
    if (!window.confirm(`Confirma o envio da sua avaliação com a nota ${npsScore}?`)) {
      return;
    }
    try {
      await onSubmitNps(npsScore, npsComment.trim());
      setFeedbackSuccess(true);
      setFeedbackError('');
    } catch (error) {
      console.error(error);
      setFeedbackError('Ocorreu um erro ao enviar o feedback. Tente novamente.');
    }
  };

  const feedbackStatus = getFeedbackStatus();

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-xs rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 text-left">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Sua opinião é muito importante!
        </CardTitle>
        <CardDescription className="text-xs">
          Por favor, reserve 30 segundos para avaliar o nosso fluxo de agendamento online.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feedbackSuccess || (appointmentFeedbackNps !== undefined && appointmentFeedbackNps !== null) ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/10 border border-green-200/30 dark:border-green-800/20 rounded-2xl flex gap-2.5 items-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-sm font-semibold text-green-805 dark:text-green-400">Obrigado! Seu feedback (NPS) foi registrado com sucesso.</span>
            </div>
            {(() => {
              const matchingFeedback = feedbacks.find(
                (f) => f.appointmentProtocol.toUpperCase() === appointmentProtocol.toUpperCase()
              );
              if (matchingFeedback && matchingFeedback.adminResponse) {
                return (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 text-xs text-left animate-in fade-in">
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                      <span>Resposta da Ouvidoria Administrativa ({matchingFeedback.adminResponseAuthor})</span>
                      <span>{matchingFeedback.adminResponseAt ? new Date(matchingFeedback.adminResponseAt).toLocaleDateString('pt-BR') : ''}</span>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-350 italic font-semibold leading-relaxed">
                      "{matchingFeedback.adminResponse}"
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        ) : feedbackStatus.visible ? (
          <form onSubmit={handleFeedbackSubmit} className="space-y-5">
            {feedbackError && (
              <div className="p-3 bg-red-50/10 border border-red-200 rounded-xl text-red-500 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                {feedbackError}
              </div>
            )}
            
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-normal block">
                Em uma escala de 0 a 10, qual a probabilidade de você recomendar o nosso sistema de agendamento para um amigo ou familiar?
              </Label>
              <div className="grid grid-cols-11 gap-1 sm:gap-1.5 pt-1 w-full">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setNpsScore(score)}
                    className={`w-full aspect-square rounded-full text-[10px] sm:text-xs font-bold transition-all border flex items-center justify-center ${
                      npsScore === score
                        ? score <= 6
                          ? 'bg-red-500 border-red-500 text-white scale-105 shadow-md shadow-red-500/20'
                          : score <= 8
                            ? 'bg-amber-500 border-amber-500 text-white scale-105 shadow-md shadow-amber-500/20'
                            : 'bg-emerald-500 border-emerald-500 text-white scale-105 shadow-md shadow-emerald-500/20'
                        : 'bg-white border-zinc-200 text-zinc-650 hover:border-primary/50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-zinc-450 dark:text-zinc-400 px-1 pt-0.5">
                <span>0 - Muito Improvável</span>
                <span>10 - Extremamente Provável</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="npsComment" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Deixe um comentário explicando sua nota: *
              </Label>
              <textarea
                id="npsComment"
                rows={3}
                value={npsComment}
                onChange={(e) => setNpsComment(e.target.value)}
                placeholder="Escreva sua sugestão ou elogio..."
                className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-primary focus:outline-none dark:text-zinc-100"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-semibold h-10 px-5 shadow-sm text-xs rounded-xl">
                <MessageSquare className="w-4 h-4 mr-1.5" />
                Enviar Avaliação
              </Button>
              <Button type="button" variant="ghost" onClick={() => setSimulatedHours(h => h + 168)} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 h-8 px-2.5">
                Simular +7 Dias (Expirar Link)
              </Button>
            </div>
          </form>
        ) : feedbackStatus.reason === 'pending_24h' ? (
          <div className="space-y-3">
            <div className="p-4 bg-amber-50 dark:bg-amber-955/10 border border-amber-200/30 dark:border-amber-800/20 rounded-2xl flex flex-col gap-2">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Pesquisa pendente: A avaliação estará disponível a partir de {feedbackStatus.availableAt} (24 horas pós-confirmação).
              </span>
            </div>
            <Button type="button" variant="outline" onClick={() => setSimulatedHours(25)} className="text-xs font-bold border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-400">
              Simular +24 horas (Liberar Pesquisa)
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-red-50 dark:bg-red-955/10 border border-red-200/30 dark:border-red-800/20 rounded-2xl flex flex-col gap-2">
              <span className="text-xs font-semibold text-red-800 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                O link desta pesquisa de feedback expirou (validade máxima de 7 dias após o envio).
              </span>
            </div>
            <Button type="button" variant="outline" onClick={() => setSimulatedHours(12)} className="text-xs font-bold border-zinc-200 text-zinc-655 bg-white dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400">
              Resetar Simulação de Tempo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
