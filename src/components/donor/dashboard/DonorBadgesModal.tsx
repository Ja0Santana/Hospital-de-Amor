import { createPortal } from 'react-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Award, X } from 'lucide-react';
import type { DonorPoints } from '../../../types';

interface DonorBadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: DonorPoints | null;
}

const BADGE_STYLES: Record<string, { color: string; bg: string }> = {
  apoiador: { color: 'text-amber-700 dark:text-amber-505', bg: 'from-amber-600/20 to-amber-700/10 border-amber-600/30' },
  anjo: { color: 'text-zinc-500 dark:text-zinc-400', bg: 'from-zinc-400/20 to-zinc-500/10 border-zinc-400/30' },
  defensor: { color: 'text-yellow-600 dark:text-yellow-500', bg: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30' },
  guardiao: { color: 'text-cyan-650 dark:text-cyan-500', bg: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30' },
  pilar: { color: 'text-brand-pink', bg: 'from-pink-500/20 to-indigo-650/20 border-pink-500/30' }
};

export default function DonorBadgesModal({ isOpen, onClose, points }: DonorBadgesModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
          <div>
            <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Minhas Conquistas & Insígnias</h2>
            <p className="text-[10px] text-zinc-450">Medalhas e selos institucionais que você já conquistou</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50">
            <X className="w-4 h-4 text-zinc-500" />
          </Button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-left">
          {!points?.redeemedBadges || points.redeemedBadges.length === 0 ? (
            <div className="text-center py-12 text-zinc-450 dark:text-zinc-550 text-xs">
              Você ainda não resgatou nenhum selo. Suas doações geram pontos que podem ser trocados por medalhas na aba Fidelidade!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {points.redeemedBadges.map((b, idx) => {
                const style = BADGE_STYLES[b.badgeId] || { color: 'text-zinc-500', bg: 'from-zinc-450/20 to-zinc-500/10 border-zinc-400/30' };
                return (
                  <Card key={idx} className="p-4 border border-zinc-150 dark:border-zinc-800 bg-zinc-50/25 dark:bg-zinc-900/5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs">
                    <div className="flex gap-3 items-start">
                      <div className={`p-3 bg-gradient-to-br ${style.bg} rounded-2xl border shrink-0 ${style.color}`}>
                        <Award className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 truncate leading-none">{b.name}</h4>
                        <p className="text-[0.625rem] text-zinc-400 leading-normal mt-1">
                          Resgatado em: {new Date(b.date).toLocaleDateString('pt-BR')} às {new Date(b.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {b.prestigeAtAcquisition > 0 ? (
                          <span className="inline-block bg-brand-pink/5 text-brand-pink text-[0.5625rem] px-2 py-0.5 rounded-full border border-brand-pink/20 font-black uppercase mt-1">
                            Prestígio {b.prestigeAtAcquisition}
                          </span>
                        ) : (
                          <span className="inline-block text-[0.5625rem] font-bold uppercase tracking-wider text-zinc-400 mt-1">
                            Regular
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-850">
                      <div>
                        <span className="text-[0.5625rem] text-zinc-400 block uppercase font-bold tracking-wider">Pontos Pagos</span>
                        <span className="text-xs font-black text-brand-pink font-mono">{b.cost} pts</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-150 dark:border-zinc-800 text-center">
          <p className="text-[10px] text-zinc-500 font-medium">
            Para resgatar novos selos com seus pontos acumulados, acesse a aba <span className="font-bold text-brand-pink">Fidelidade</span> na barra lateral.
          </p>
        </div>
      </Card>
    </div>,
    document.body
  );
}
