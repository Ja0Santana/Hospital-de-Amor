import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Award } from 'lucide-react';
import { CATALOG_BADGES } from './constants';

interface BadgesCatalogProps {
  balance: number;
  prestige: number;
  redeemedBadges: Array<{
    badgeId: string;
    prestigeAtAcquisition: number;
  }>;
  redeemSuccess: string | null;
  onRedeem: (badgeId: string, badgeName: string, cost: number) => void;
}

export default function BadgesCatalog({
  balance,
  prestige,
  redeemedBadges,
  redeemSuccess,
  onRedeem,
}: BadgesCatalogProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {CATALOG_BADGES.map((badge) => {
        const finalCost = Math.round(badge.cost * (1 + prestige * 0.1));
        const alreadyRedeemed =
          redeemedBadges?.some((b) => b.badgeId === badge.id && b.prestigeAtAcquisition === prestige) || false;
        const canRedeem = balance >= finalCost && !alreadyRedeemed;

        return (
          <Card
            key={badge.id}
            className="p-4 border border-zinc-150 dark:border-zinc-800 bg-zinc-50/25 dark:bg-zinc-900/5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs"
          >
            <div className="flex gap-3 items-start">
              <div className={`p-3 bg-gradient-to-br ${badge.color} rounded-2xl border shrink-0`}>
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 truncate leading-none">
                  {badge.name}
                </h4>
                <p className="text-[0.625rem] text-zinc-400 leading-normal mt-1">{badge.desc}</p>
                <span className="inline-block text-[0.5rem] font-bold uppercase tracking-wider text-zinc-450 mt-1">
                  Requisito: {badge.levelReq}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-850">
              <div>
                <span className="text-[0.5625rem] text-zinc-450 block uppercase font-bold tracking-wider">Custo</span>
                <span className="text-xs font-black text-brand-pink font-mono">{finalCost} pts</span>
              </div>

              {alreadyRedeemed ? (
                <span className="text-[0.625rem] font-black text-zinc-500 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-xl">
                  Já Resgatado
                </span>
              ) : redeemSuccess === badge.id ? (
                <span className="text-[0.625rem] font-black text-green-600 dark:text-green-400 uppercase tracking-wider bg-green-50 dark:bg-green-950/20 border border-green-200/30 px-3 py-1 rounded-xl">
                  Resgatado!
                </span>
              ) : (
                <Button
                  onClick={() => onRedeem(badge.id, badge.name, badge.cost)}
                  disabled={!canRedeem}
                  className={`h-8 px-4 rounded-xl text-[0.625rem] font-bold ${
                    canRedeem
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'bg-zinc-100 text-zinc-300 border-zinc-100 pointer-events-none dark:bg-zinc-800 dark:text-zinc-600'
                  }`}
                >
                  Resgatar Selo
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
