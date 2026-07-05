import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { getDonorPoints, redeemDonorBadge, triggerDonorPrestige } from '../../services/db';
import type { DonorPoints } from '../../types';

import DonorFloatingBadge from '../../components/donor/redeem/DonorFloatingBadge';
import PrestigeModal from '../../components/donor/redeem/PrestigeModal';
import BadgesCatalog from '../../components/donor/redeem/BadgesCatalog';
import MyBadgesGallery from '../../components/donor/redeem/MyBadgesGallery';
import VoucherReceiptModal from '../../components/donor/redeem/VoucherReceiptModal';

interface RedeemPointsProps {
  donorCpf: string;
  updateTrigger?: number;
  onPointsUpdated?: () => void;
}

interface VoucherData {
  badgeName: string;
  cost: number;
  date: string;
  badgeId: string;
  prestige: number;
  hash: string;
}

export default function RedeemPoints({ donorCpf, updateTrigger, onPointsUpdated }: RedeemPointsProps) {
  const [points, setPoints] = useState<DonorPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'gallery'>('catalog');
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [isPrestigeModalOpen, setIsPrestigeModalOpen] = useState(false);
  const [showVoucher, setShowVoucher] = useState<VoucherData | null>(null);

  useEffect(() => {
    loadPoints();
  }, [donorCpf, updateTrigger]);

  const loadPoints = async () => {
    setLoading(true);
    try {
      const p = await getDonorPoints(donorCpf);
      setPoints(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPointsInfo = () => {
    const balance = points?.balance || 0;
    const prestige = points?.prestige || 0;
    const multiplier = 1 + prestige * 0.1;
    const spentPoints =
      points?.redeemedBadges
        ?.filter((b) => b.prestigeAtAcquisition === prestige)
        ?.reduce((sum, b) => sum + b.cost, 0) || 0;
    const rankPoints = balance + spentPoints;

    let level: 'Bronze' | 'Prata' | 'Ouro' | 'Platina' | 'Diamante' = 'Bronze';
    if (rankPoints >= 30000 * multiplier) {
      level = 'Diamante';
    } else if (rankPoints >= 15000 * multiplier) {
      level = 'Platina';
    } else if (rankPoints >= 5000 * multiplier) {
      level = 'Ouro';
    } else if (rankPoints >= 1000 * multiplier) {
      level = 'Prata';
    }

    return { level };
  };

  const handleRedeemBadge = async (badgeId: string, badgeName: string, baseCost: number) => {
    const currentPrestige = points?.prestige || 0;
    const finalCost = Math.round(baseCost * (1 + currentPrestige * 0.1));

    if (!points || points.balance < finalCost) {
      alert('Pontos insuficientes para resgatar este selo.');
      return;
    }

    try {
      await redeemDonorBadge(donorCpf, badgeId, badgeName, finalCost);
      setRedeemSuccess(badgeId);
      const generatedHash = `HA-REDEEM-${Math.random().toString(36).substring(2, 11).toUpperCase()}-${Date.now()}`;
      setShowVoucher({
        badgeName,
        cost: finalCost,
        date: new Date().toISOString(),
        badgeId,
        prestige: currentPrestige,
        hash: generatedHash,
      });
      setTimeout(() => setRedeemSuccess(null), 3000);
      await loadPoints();
      if (onPointsUpdated) {
        onPointsUpdated();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao resgatar selo.');
    }
  };

  const handleActivatePrestige = async () => {
    try {
      await triggerDonorPrestige(donorCpf);
      setIsPrestigeModalOpen(false);
      await loadPoints();
      if (onPointsUpdated) {
        onPointsUpdated();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao ativar prestígio.');
    }
  };

  const pointsInfo = getPointsInfo();
  const currentPrestige = points?.prestige || 0;
  const currentMultiplier = 1 + currentPrestige * 0.1;
  const isEligibleForPrestige =
    pointsInfo.level === 'Diamante' && (points?.balance || 0) >= 30000 * currentMultiplier;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6 text-left">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
          Fidelidade & Prêmios
        </h1>
        <p className="text-zinc-500 mt-1">Troque seus pontos acumulados por selos de honra institucionais.</p>
      </div>

      <DonorFloatingBadge
        level={pointsInfo.level}
        balance={points?.balance || 0}
        prestige={currentPrestige}
        isEligibleForPrestige={isEligibleForPrestige}
        onPrestigeClick={() => setIsPrestigeModalOpen(true)}
      />

      <Card className="border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        <div className="flex border-b border-zinc-155 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-6">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`py-4 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === 'catalog' ? 'border-brand-pink text-brand-pink' : 'border-transparent text-zinc-400 hover:text-zinc-650'}`}
          >
            Catálogo de Selos
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-4 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === 'gallery' ? 'border-brand-pink text-brand-pink' : 'border-transparent text-zinc-400 hover:text-zinc-650'}`}
          >
            Minha Galeria ({points?.redeemedBadges?.length || 0})
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-zinc-400 text-xs">Carregando dados...</div>
          ) : activeTab === 'catalog' ? (
            <BadgesCatalog
              balance={points?.balance || 0}
              prestige={currentPrestige}
              redeemedBadges={points?.redeemedBadges || []}
              redeemSuccess={redeemSuccess}
              onRedeem={handleRedeemBadge}
            />
          ) : (
            <MyBadgesGallery redeemedBadges={points?.redeemedBadges || []} />
          )}
        </div>
      </Card>

      {isPrestigeModalOpen && (
        <PrestigeModal onConfirm={handleActivatePrestige} onClose={() => setIsPrestigeModalOpen(false)} />
      )}

      {showVoucher && <VoucherReceiptModal voucher={showVoucher} onClose={() => setShowVoucher(null)} />}
    </div>
  );
}
