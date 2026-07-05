import { Card } from '../../ui/Card';
import { Award } from 'lucide-react';
import { BADGE_STYLES } from './constants';

interface RedeemedBadgeItem {
  badgeId: string;
  name: string;
  date: string;
  cost: number;
  prestigeAtAcquisition: number;
}

interface MyBadgesGalleryProps {
  redeemedBadges: RedeemedBadgeItem[];
}

export default function MyBadgesGallery({ redeemedBadges }: MyBadgesGalleryProps) {
  if (!redeemedBadges || redeemedBadges.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400 text-xs">
        Você ainda não resgatou nenhum selo. Apoie e acumule pontos!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {redeemedBadges.map((b, idx) => {
        const style = BADGE_STYLES[b.badgeId] || {
          color: 'text-zinc-500',
          bg: 'from-zinc-450/20 to-zinc-500/10 border-zinc-400/30',
        };
        return (
          <Card
            key={idx}
            className="p-4 border border-zinc-150 dark:border-zinc-800 bg-zinc-50/25 dark:bg-zinc-900/5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs"
          >
            <div className="flex gap-3 items-start">
              <div className={`p-3 bg-gradient-to-br ${style.bg} rounded-2xl border shrink-0 ${style.color}`}>
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 truncate leading-none">
                  {b.name}
                </h4>
                <p className="text-[0.625rem] text-zinc-405 dark:text-zinc-400 leading-normal mt-1">
                  Resgatado em: {new Date(b.date).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(b.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                <span className="text-[0.5625rem] text-zinc-450 block uppercase font-bold tracking-wider">
                  Pontos Pagos
                </span>
                <span className="text-xs font-black text-brand-pink font-mono">{b.cost} pts</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
