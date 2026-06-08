import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { getDonorPoints, redeemDonorBadge, triggerDonorPrestige } from '../../services/db';
import type { DonorPoints } from '../../types';
import { Trophy, Award, Star, Sparkles } from 'lucide-react';

interface RedeemPointsProps {
  donorCpf: string;
  updateTrigger?: number;
  onPointsUpdated?: () => void;
}

export default function RedeemPoints({ donorCpf, updateTrigger, onPointsUpdated }: RedeemPointsProps) {
  const [points, setPoints] = useState<DonorPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'gallery'>('catalog');
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [isPrestigeModalOpen, setIsPrestigeModalOpen] = useState(false);

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

  const handleRedeemBadge = async (badgeId: string, badgeName: string, baseCost: number) => {
    const prestige = points?.prestige || 0;
    const finalCost = Math.round(baseCost * (1 + prestige * 0.1));
    
    if (!points || points.balance < finalCost) {
      alert('Pontos insuficientes para resgatar este selo.');
      return;
    }
    
    try {
      await redeemDonorBadge(donorCpf, badgeId, badgeName, finalCost);
      setRedeemSuccess(badgeId);
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
  const prestige = points?.prestige || 0;
  const multiplier = 1 + (prestige * 0.1);
  const isEligibleForPrestige = pointsInfo.level === 'Diamante' && (points?.balance || 0) >= 30000 * multiplier;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6 text-left">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
          Fidelidade & Prêmios
        </h1>
        <p className="text-zinc-500 mt-1">Troque seus pontos acumulados por selos de honra institucionais.</p>
      </div>

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
              <Trophy className="w-8 h-8 text-zinc-200 dark:text-zinc-800" />
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
                      : 'text-zinc-450 dark:text-zinc-500 font-semibold'
                  }
                >
                  {lvl}
                </span>
              ))}
            </div>

            {isEligibleForPrestige && (
              <div className="absolute top-2 right-2 animate-bounce">
                <Button 
                  onClick={() => setIsPrestigeModalOpen(true)}
                  className="bg-gradient-to-r from-brand-pink to-primary hover:from-brand-pink/95 hover:to-primary/95 text-white font-black text-[9px] h-7 px-2.5 rounded-xl shadow-md uppercase tracking-wider gap-1 flex items-center"
                >
                  <Sparkles className="w-3 h-3 fill-white" />
                  Ativar Prestígio
                </Button>
              </div>
            )}
          </Card>
        </div>

        <div className="md:col-span-6 flex flex-col">
          <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Saldo de Pontos Disponíveis</h3>
              <p className="text-4xl font-black text-brand-pink mt-2 font-mono">
                {(points?.balance || 0).toLocaleString('pt-BR')} <span className="text-sm font-bold">pts</span>
              </p>
            </div>

            <p className="text-[10px] text-zinc-400 leading-normal">
              Acumule 10 pontos a cada R$ 1,00 doado e troque por selos de honra institucionais. Os pontos nunca expiram.
            </p>

            <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-400 block uppercase">Multiplicador de Custo</span>
              <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mt-1 block">
                {prestige > 0 ? `+${(prestige * 10)}% devido ao Prestígio ${prestige}` : 'Sem acréscimos (1.0x)'}
              </span>
            </div>
          </Card>
        </div>
      </div>

      <Card className="border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        <div className="flex border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'apoiador', name: 'Apoiador da Esperança', desc: 'Concedido a todos os doadores iniciantes que apoiam a causa.', cost: 0, levelReq: 'Bronze', color: 'from-amber-600/20 to-amber-700/10 border-amber-600/30 text-amber-750' },
                { id: 'anjo', name: 'Anjo da Saúde', desc: 'Dedicado aos doadores que viabilizam insumos hospitalares essenciais.', cost: 1000, levelReq: 'Prata', color: 'from-zinc-400/20 to-zinc-500/10 border-zinc-400/30 text-zinc-500' },
                { id: 'defensor', name: 'Defensor da Vida', desc: 'Reconhecimento pela contribuição contínua à manutenção de leitos.', cost: 3000, levelReq: 'Ouro', color: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-600' },
                { id: 'guardiao', name: 'Guardião da Esperança', desc: 'Homenagem aos que sustentam campanhas de exames móveis.', cost: 5000, levelReq: 'Platina', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-600' },
                { id: 'pilar', name: 'Pilar da Solidariedade', desc: 'A maior distinção para doadores que transformam o cenário oncológico.', cost: 10000, levelReq: 'Diamante', color: 'from-pink-500/20 to-indigo-650/20 border-pink-500/30 text-brand-pink' }
              ].map((badge) => {
                const finalCost = Math.round(badge.cost * (1 + (points?.prestige || 0) * 0.1));
                const alreadyRedeemed = points?.redeemedBadges?.some(
                  (b) => b.badgeId === badge.id && b.prestigeAtAcquisition === (points?.prestige || 0)
                ) || false;
                const canRedeem = (points?.balance || 0) >= finalCost && !alreadyRedeemed;
                
                return (
                  <Card key={badge.id} className="p-4 border border-zinc-150 dark:border-zinc-800 bg-zinc-50/25 dark:bg-zinc-900/5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs">
                    <div className="flex gap-3 items-start">
                      <div className={`p-3 bg-gradient-to-br ${badge.color} rounded-2xl border shrink-0`}>
                        <Award className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 truncate leading-none">{badge.name}</h4>
                        <p className="text-[0.625rem] text-zinc-400 leading-normal mt-1">{badge.desc}</p>
                        <span className="inline-block text-[0.5rem] font-bold uppercase tracking-wider text-zinc-450 mt-1">Requisito: {badge.levelReq}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-850">
                      <div>
                        <span className="text-[0.5625rem] text-zinc-400 block uppercase font-bold tracking-wider">Custo</span>
                        <span className="text-xs font-black text-brand-pink font-mono">{finalCost} pts</span>
                      </div>

                      {alreadyRedeemed ? (
                        <span className="text-[0.625rem] font-black text-zinc-500 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1 rounded-xl">Já Resgatado</span>
                      ) : redeemSuccess === badge.id ? (
                        <span className="text-[0.625rem] font-black text-green-600 dark:text-green-400 uppercase tracking-wider bg-green-50 dark:bg-green-950/20 border border-green-200/30 px-3 py-1 rounded-xl">Resgatado!</span>
                      ) : (
                        <Button
                          onClick={() => handleRedeemBadge(badge.id, badge.name, badge.cost)}
                          disabled={!canRedeem}
                          className={`h-8 px-4 rounded-xl text-[0.625rem] font-bold ${canRedeem ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-zinc-100 text-zinc-300 border-zinc-100 pointer-events-none'}`}
                        >
                          Resgatar Selo
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {!points?.redeemedBadges || points.redeemedBadges.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">Você ainda não resgatou nenhum selo. Apoie e acumule pontos!</div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-zinc-400 border-b border-zinc-150 dark:border-zinc-850 font-bold uppercase tracking-wider text-[0.5625rem] pb-2">
                      <th className="py-2">Selo</th>
                      <th className="py-2 text-center">Prestígio</th>
                      <th className="py-2 text-center">Pontos Pagos</th>
                      <th className="py-2 text-right">Data de Resgate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                    {points.redeemedBadges.map((b, idx) => (
                      <tr key={idx} className="text-zinc-700 dark:text-zinc-300">
                        <td className="py-3 font-extrabold flex items-center gap-2">
                          <Award className="w-4 h-4 text-brand-pink" />
                          {b.name}
                        </td>
                        <td className="py-3 text-center font-bold">
                          {b.prestigeAtAcquisition > 0 ? (
                            <span className="bg-brand-pink/5 text-brand-pink text-[0.5625rem] px-2 py-0.5 rounded-full border border-brand-pink/20 font-black uppercase">
                              Prestígio {b.prestigeAtAcquisition}
                            </span>
                          ) : (
                            <span className="text-zinc-400">Regular</span>
                          )}
                        </td>
                        <td className="py-3 text-center font-mono font-bold text-zinc-900 dark:text-zinc-50">{b.cost} pts</td>
                        <td className="py-3 text-right font-mono text-zinc-450">
                          {new Date(b.date).toLocaleDateString('pt-BR')} às {new Date(b.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </Card>

      {isPrestigeModalOpen && (
        <div onClick={() => setIsPrestigeModalOpen(false)} className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl p-6 space-y-5 text-left">
            <div className="flex gap-4 items-start animate-in zoom-in-95 duration-200">
              <div className="p-3 bg-brand-pink/10 text-brand-pink rounded-full shrink-0 border border-brand-pink/20 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50 leading-tight">
                  Ativar Modo de Prestígio?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Ao ativar o prestígio:
                </p>
                <ul className="list-disc pl-4 text-[0.6875rem] text-zinc-505 dark:text-zinc-400 space-y-1 leading-normal">
                  <li>Seu saldo de pontos atual será redefinido para 0.</li>
                  <li>Seu nível voltará para o rank Bronze, permitindo que você resgate novamente os selos do catálogo.</li>
                  <li>Você ganhará 1 Ponto de Prestígio permanente.</li>
                  <li>A progressão de dificuldade para passar de nível e o custo dos selos aumentarão em 10% cumulativamente.</li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPrestigeModalOpen(false)} className="h-10 rounded-xl text-xs font-bold">
                Cancelar
              </Button>
              <Button type="button" onClick={handleActivatePrestige} className="h-10 bg-brand-pink hover:bg-brand-pink/90 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-pink/20">
                Ativar Prestígio
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
