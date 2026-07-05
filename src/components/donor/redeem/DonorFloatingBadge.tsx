import { createPortal } from 'react-dom';
import { Award, Star, Sparkles } from 'lucide-react';

interface DonorFloatingBadgeProps {
  level: string;
  balance: number;
  prestige: number;
  isEligibleForPrestige: boolean;
  onPrestigeClick: () => void;
}

export default function DonorFloatingBadge({
  level,
  balance,
  prestige,
  isEligibleForPrestige,
  onPrestigeClick,
}: DonorFloatingBadgeProps) {
  return createPortal(
    <div
      onClick={isEligibleForPrestige ? onPrestigeClick : undefined}
      className={`fixed bottom-6 right-6 z-[9990] flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-lg backdrop-blur-md px-4 py-2 rounded-full text-xs font-black animate-in slide-in-from-bottom duration-300 select-none ${
        isEligibleForPrestige ? 'cursor-pointer hover:shadow-xl hover:border-brand-pink/40 transition-all' : 'pointer-events-none'
      }`}
    >
      <Award className="w-3.5 h-3.5 text-secondary shrink-0" />
      <span className="text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">{level}</span>
      {prestige > 0 && (
        <span className="flex items-center gap-0.5 text-brand-pink">
          <Star className="w-2.5 h-2.5 fill-brand-pink shrink-0" />
          P{prestige}
        </span>
      )}
      <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
      <span className="text-brand-pink font-mono">{balance.toLocaleString('pt-BR')}</span>
      <span className="text-zinc-400 font-semibold">pts</span>
      {isEligibleForPrestige && (
        <>
          <span className="w-px h-3 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
          <span className="flex items-center gap-1 text-brand-pink animate-pulse text-[10px] uppercase tracking-wider font-black">
            <Sparkles className="w-3.5 h-3.5 fill-brand-pink shrink-0" />
            Ativar Prestígio
          </span>
        </>
      )}
    </div>,
    document.body
  );
}
