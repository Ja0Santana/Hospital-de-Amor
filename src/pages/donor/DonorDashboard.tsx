import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  getDonationsByCpf, 
  getDonorPoints, 
  getRecurringSubscriptionsByCpf, 
  updateRecurringSubscription, 
  triggerDonorPrestige, 
  addDonorPoints, 
  saveSupportMessage, 
  getUserByCpf, 
  getTransparencyData 
} from '../../services/db';
import type { Donation, DonorPoints, RecurringSubscription, TransparencyData } from '../../types';
import { Trophy, Award, Sparkles, Star, AlertTriangle } from 'lucide-react';

import DonorPrestigeModal from '../../components/donor/dashboard/DonorPrestigeModal';
import DonorBadgesModal from '../../components/donor/dashboard/DonorBadgesModal';
import TaxDeclarationModal from '../../components/donor/dashboard/TaxDeclarationModal';
import RecurringSubscriptionsList from '../../components/donor/dashboard/RecurringSubscriptionsList';
import ReferralPanel from '../../components/donor/dashboard/ReferralPanel';
import ContributionsTable from '../../components/donor/dashboard/ContributionsTable';
import TransparencyMural from '../../components/donor/dashboard/TransparencyMural';

interface ReferredUser {
  id: string;
  name: string;
  date: string;
  status: 'Pendente' | 'Doou (100 pts)';
  amount?: number;
}

interface DonorDashboardProps {
  donorCpf: string;
  donorName: string;
  updateTrigger?: number;
}

export default function DonorDashboard({ donorCpf, donorName, updateTrigger }: DonorDashboardProps) {
  const [points, setPoints] = useState<DonorPoints | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [subscriptions, setSubscriptions] = useState<RecurringSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [transparency, setTransparency] = useState<TransparencyData | null>(null);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);

  const [isPrestigeModalOpen, setIsPrestigeModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [selectedTaxYear, setSelectedTaxYear] = useState('');

  useEffect(() => {
    const key = `referred_users_${donorCpf}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setReferredUsers(JSON.parse(stored));
    } else {
      const initial = [
        { id: 'ref-1', name: 'Marcos de Oliveira', date: '2026-06-01T14:32:00.000Z', status: 'Doou (100 pts)' as const, amount: 50 },
        { id: 'ref-2', name: 'Carla Dias Souza', date: '2026-06-05T09:15:00.000Z', status: 'Pendente' as const }
      ];
      localStorage.setItem(key, JSON.stringify(initial));
      setReferredUsers(initial);
    }
  }, [donorCpf]);

  useEffect(() => {
    loadData();
  }, [donorCpf, updateTrigger]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPrestigeModalOpen(false);
        setIsCatalogOpen(false);
        setIsTaxModalOpen(false);
      }
    };
    if (isPrestigeModalOpen || isCatalogOpen || isTaxModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPrestigeModalOpen, isCatalogOpen, isTaxModalOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getDonorPoints(donorCpf);
      const d = await getDonationsByCpf(donorCpf);
      const subs = await getRecurringSubscriptionsByCpf(donorCpf);
      const trans = await getTransparencyData();
      setPoints(p);
      setDonations(d);
      setSubscriptions(subs);
      if (trans) {
        setTransparency(trans);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (sub: RecurringSubscription) => {
    const newStatus = sub.status === 'Ativa' ? 'Pausada' : 'Ativa';
    try {
      await updateRecurringSubscription(sub.id, { status: newStatus });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelSub = async (subId: string) => {
    if (window.confirm('Tem certeza de que deseja cancelar esta assinatura recorrente?')) {
      try {
        await updateRecurringSubscription(subId, { status: 'Cancelada' });
        await loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateAmount = async (subId: string, amount: number) => {
    try {
      await updateRecurringSubscription(subId, { amount });
      await loadData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleSimulateReferral = async () => {
    const names = ['Gabriela Costa', 'Rodrigo Ramos', 'Patrícia Lima', 'Fernando Mendes'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const newRef = {
      id: 'ref-' + Math.random().toString(36).substring(2, 9),
      name: randomName,
      date: new Date().toISOString(),
      status: 'Doou (100 pts)' as const,
      amount: 50
    };
    
    const updated = [newRef, ...referredUsers];
    localStorage.setItem(`referred_users_${donorCpf}`, JSON.stringify(updated));
    setReferredUsers(updated);
    
    try {
      await addDonorPoints(donorCpf, 100);
      loadData();
      alert(`Indicação simulada com sucesso! ${randomName} cadastrou-se e efetuou uma doação. Você ganhou 100 pontos de bônus!`);
    } catch(err) {
      console.error(err);
    }
  };

  const handleSimulateShare = (channel: string) => {
    if (channel === 'E-mail') {
      const key = `email_limit_${donorCpf}`;
      const now = Date.now();
      const stored = localStorage.getItem(key);
      const timestamps: number[] = stored ? JSON.parse(stored) : [];
      const tenMinutesAgo = now - 600000;
      const recentSends = timestamps.filter(t => t > tenMinutesAgo);
      
      if (recentSends.length >= 3) {
        alert('Limite de segurança atingido: Para evitar spam, você só pode enviar até 3 convites por e-mail a cada 10 minutos. Recomendamos copiar o link e compartilhar manualmente.');
        return;
      }
      
      recentSends.push(now);
      localStorage.setItem(key, JSON.stringify(recentSends));
    }
    alert(`Simulação: Compartilhando link de indicação via ${channel}. Mensagem enviada com sucesso!`);
  };

  const handleSendSupportMsg = async (message: string, isAuthorized: boolean) => {
    try {
      const cleanCpf = donorCpf.replace(/\D/g, "");
      const donor = await getUserByCpf(cleanCpf);
      const donorNameLabel = donor && isAuthorized ? donor.name.split(' ')[0] : 'Doador Anônimo';
      
      await saveSupportMessage({
        id: crypto.randomUUID(),
        donorName: donorNameLabel,
        message,
        date: new Date().toISOString(),
        isAuthorized
      });
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleActivatePrestige = async () => {
    try {
      await triggerDonorPrestige(donorCpf);
      setIsPrestigeModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao ativar prestígio.');
    }
  };

  const getPointsInfo = () => {
    const balance = points?.balance || 0;
    const prestige = points?.prestige || 0;
    const multiplier = 1 + (prestige * 0.1);
    const spentPoints = points?.redeemedBadges
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
    
    if (level === 'Bronze') {
      const nextLimit = 1000 * multiplier;
      const progress = (rankPoints / nextLimit) * 100;
      const remaining = Math.max(0, nextLimit - rankPoints);
      return { level, progress, label: `Faltam ${Math.round(remaining)} pontos para o nível Prata`, nextLevel: 'Prata', maxLimit: nextLimit };
    } else if (level === 'Prata') {
      const nextLimit = 5000 * multiplier;
      const baseLimit = 1000 * multiplier;
      const progress = ((rankPoints - baseLimit) / (nextLimit - baseLimit)) * 100;
      const remaining = Math.max(0, nextLimit - rankPoints);
      return { level, progress, label: `Faltam ${Math.round(remaining)} pontos para o nível Ouro`, nextLevel: 'Ouro', maxLimit: nextLimit };
    } else if (level === 'Ouro') {
      const nextLimit = 15000 * multiplier;
      const baseLimit = 5000 * multiplier;
      const progress = ((rankPoints - baseLimit) / (nextLimit - baseLimit)) * 100;
      const remaining = Math.max(0, nextLimit - rankPoints);
      return { level, progress, label: `Faltam ${Math.round(remaining)} pontos para o nível Platina`, nextLevel: 'Platina', maxLimit: nextLimit };
    } else if (level === 'Platina') {
      const nextLimit = 30000 * multiplier;
      const baseLimit = 15000 * multiplier;
      const progress = ((rankPoints - baseLimit) / (nextLimit - baseLimit)) * 100;
      const remaining = Math.max(0, nextLimit - rankPoints);
      return { level, progress, label: `Faltam ${Math.round(remaining)} pontos para o nível Diamante`, nextLevel: 'Diamante', maxLimit: nextLimit };
    } else {
      return { level, progress: 100, label: 'Nível máximo atingido! Obrigado pelo seu apoio extraordinário.', nextLevel: null, maxLimit: 30000 * multiplier };
    }
  };

  const pointsInfo = getPointsInfo();
  const prestige = points?.prestige || 0;
  const multiplier = 1 + (prestige * 0.1);
  const isEligibleForPrestige = pointsInfo.level === 'Diamante' && (points?.balance || 0) >= 30000 * multiplier;
  const years = Array.from(new Set(donations.map(d => new Date(d.date).getFullYear()))).sort((a, b) => b - a);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans animate-in slide-in-from-left duration-300">
            Olá, {donorName.split(' ')[0]}
          </h1>
          <p className="text-zinc-500 mt-1">Obrigado por fazer a diferença. Acompanhe seu impacto hoje.</p>
        </div>
      </div>

      {points && points.balance > 0 && (
        <div className="bg-amber-50/10 dark:bg-amber-950/15 border border-amber-500/20 p-4 rounded-2xl flex gap-3 items-start animate-in fade-in slide-in-from-top duration-300">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 leading-tight">Pontos Expirando Em Breve</h4>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Você possui <strong>{Math.min(350, points.balance)} pontos</strong> que expiram em 15 dias (ano fiscal corrente). Aproveite para trocá-los por selos de honra na aba Fidelidade!
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        <div className="md:col-span-6 flex flex-col">
          <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nível do Doador</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Award className="w-6 h-6 text-secondary" />
                  <span className="text-2xl font-black text-primary font-sans">
                    {pointsInfo.level}
                  </span>
                  {prestige > 0 && (
                    <span className="flex items-center gap-1 bg-brand-pink/10 border border-brand-pink/20 text-brand-pink text-[9px] font-black px-2 py-0.5 rounded-full uppercase ml-1 animate-pulse">
                      <Star className="w-2.5 h-2.5 fill-brand-pink text-brand-pink shrink-0" />
                      Prestígio {prestige}
                    </span>
                  )}
                </div>
              </div>
              {!isEligibleForPrestige && <Trophy className="w-8 h-8 text-zinc-200 dark:text-zinc-800" />}
            </div>

            <div className="space-y-2">
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-secondary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, pointsInfo.progress))}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-400 font-semibold">{pointsInfo.label}</p>
            </div>

            <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold border-t border-zinc-100 dark:border-zinc-800 pt-3">
              {['Bronze', 'Prata', 'Ouro', 'Platina', 'Diamante'].map((lvl) => (
                <span
                  key={lvl}
                  className={
                    pointsInfo.level === lvl
                      ? 'text-brand-pink font-black text-xs scale-105 transition-all bg-brand-pink/5 px-2.5 py-0.5 rounded-full border border-brand-pink/20'
                      : 'text-zinc-450 dark:text-zinc-550 font-semibold'
                  }
                >
                  {lvl}
                </span>
              ))}
            </div>

            {isEligibleForPrestige && (
              <div className="pt-2">
                <Button 
                  onClick={() => setIsPrestigeModalOpen(true)}
                  className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold text-xs h-10 rounded-xl shadow-md uppercase tracking-wider gap-1.5 flex items-center justify-center transition-all active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  Ativar Prestígio
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="md:col-span-6 flex flex-col">
          <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Saldo de Pontos</h3>
                <p className="text-4xl font-black text-brand-pink mt-2 font-mono">
                  {(points?.balance || 0).toLocaleString('pt-BR')} <span className="text-sm font-bold">pts</span>
                </p>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 leading-normal">
              Acumule 10 pontos a cada R$ 1,00 doado e troque por selos de honra institucionais.
            </p>

            <Button 
              variant="outline" 
              onClick={() => setIsCatalogOpen(true)}
              className="w-full h-10 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl text-xs font-bold transition-all active:scale-[0.99] hover:border-brand-pink/30 hover:text-brand-pink"
            >
              Ver Catálogo & Conquistas
            </Button>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 flex flex-col">
          <RecurringSubscriptionsList
            loading={loading}
            subscriptions={subscriptions}
            onToggleStatus={handleToggleStatus}
            onCancelSub={handleCancelSub}
            onUpdateAmount={handleUpdateAmount}
          />
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <ReferralPanel
            donorCpf={donorCpf}
            referredUsers={referredUsers}
            onSimulateReferral={handleSimulateReferral}
            onSimulateShare={handleSimulateShare}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-12 flex flex-col">
          <ContributionsTable
            loading={loading}
            donorName={donorName}
            donorCpf={donorCpf}
            donations={donations}
            onOpenTaxModal={(year) => {
              setSelectedTaxYear(year);
              setIsTaxModalOpen(true);
            }}
          />
        </div>
      </div>

      <TransparencyMural
        points={points}
        donations={donations}
        referredUsers={referredUsers}
        transparency={transparency}
        donorName={donorName}
        onSendSupportMsg={handleSendSupportMsg}
      />

      <DonorPrestigeModal
        isOpen={isPrestigeModalOpen}
        onClose={() => setIsPrestigeModalOpen(false)}
        onConfirm={handleActivatePrestige}
      />

      <DonorBadgesModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        points={points}
      />

      <TaxDeclarationModal
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
        selectedTaxYear={selectedTaxYear}
        setSelectedTaxYear={setSelectedTaxYear}
        years={years}
        donorName={donorName}
        donorCpf={donorCpf}
        donations={donations}
      />
    </div>
  );
}
