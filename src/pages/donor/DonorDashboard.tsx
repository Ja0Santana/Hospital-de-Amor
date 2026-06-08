import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { getDonationsByCpf, getDonorPoints, getRecurringSubscriptionsByCpf, updateRecurringSubscription, triggerDonorPrestige } from '../../services/db';
import type { Donation, DonorPoints, RecurringSubscription } from '../../types';
import { Trophy, History, TrendingUp, Users, Award, Heart, Play, Pause, XCircle, Edit2, Sparkles, Star, X, FileText } from 'lucide-react';

const BADGE_STYLES: Record<string, { color: string; bg: string }> = {
  apoiador: { color: 'text-amber-700 dark:text-amber-505', bg: 'from-amber-600/20 to-amber-700/10 border-amber-600/30' },
  anjo: { color: 'text-zinc-500 dark:text-zinc-400', bg: 'from-zinc-400/20 to-zinc-500/10 border-zinc-400/30' },
  defensor: { color: 'text-yellow-600 dark:text-yellow-500', bg: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30' },
  guardiao: { color: 'text-cyan-650 dark:text-cyan-500', bg: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30' },
  pilar: { color: 'text-brand-pink', bg: 'from-pink-500/20 to-indigo-650/20 border-pink-500/30' }
};

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
  
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editError, setEditError] = useState<string>('');

  const [isPrestigeModalOpen, setIsPrestigeModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [selectedTaxYear, setSelectedTaxYear] = useState('2025');
  
  const [hoveredInvestment, setHoveredInvestment] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

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

  const getFilteredDonations = () => {
    return donations.filter((d) => {
      const matchesSearch = searchQuery
        ? d.id.toLowerCase().includes(searchQuery.toLowerCase()) || (d.hash && d.hash.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      
      const donationDate = new Date(d.date);
      const matchesYear = filterYear ? donationDate.getFullYear().toString() === filterYear : true;
      const matchesMonth = filterMonth ? (donationDate.getMonth() + 1).toString() === filterMonth : true;
      
      return matchesSearch && matchesYear && matchesMonth;
    });
  };

  const filteredDonations = getFilteredDonations();
  const totalFilteredAmount = filteredDonations
    .filter((d) => d.status === 'Confirmada')
    .reduce((sum, d) => sum + d.amount, 0);

  const years = Array.from(new Set(donations.map(d => new Date(d.date).getFullYear()))).sort((a, b) => b - a);
  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getDonorPoints(donorCpf);
      const d = await getDonationsByCpf(donorCpf);
      const subs = await getRecurringSubscriptionsByCpf(donorCpf);
      setPoints(p);
      setDonations(d);
      setSubscriptions(subs);
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

  const handleStartEdit = (sub: RecurringSubscription) => {
    setEditingSubId(sub.id);
    setEditAmount(sub.amount.toString());
    setEditError('');
  };

  const handleSaveAmount = async (subId: string) => {
    setEditError('');
    const parsed = parseFloat(editAmount);
    if (isNaN(parsed) || parsed < 10) {
      setEditError('O valor mínimo de doação é R$ 10,00.');
      return;
    }
    try {
      await updateRecurringSubscription(subId, { amount: parsed });
      setEditingSubId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      setEditError('Erro ao atualizar valor da assinatura.');
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

  const pointsInfo = getPointsInfo();
  const prestige = points?.prestige || 0;
  const multiplier = 1 + (prestige * 0.1);
  const isEligibleForPrestige = pointsInfo.level === 'Diamante' && (points?.balance || 0) >= 30000 * multiplier;

  const donutData = [
    { name: 'Ala Infantil', value: 40, color: '#e31463' },
    { name: 'Prevenção Móvel', value: 25, color: '#3b82f6' },
    { name: 'Pesquisa Científica', value: 20, color: '#6366f1' },
    { name: 'Geral', value: 15, color: '#10b981' }
  ];

  const barData = [
    { label: 'Jan', val: 640 },
    { label: 'Fev', val: 720 },
    { label: 'Mar', val: 810 },
    { label: 'Abr', val: 790 },
    { label: 'Mai', val: 890 },
    { label: 'Jun', val: 950 }
  ];

  const getDonutSegments = () => {
    let accumulated = 0;
    return donutData.map((d, index) => {
      const percentage = d.value;
      const segmentLength = (percentage / 100) * 314.16;
      const offset = -accumulated;
      accumulated += segmentLength;
      
      const isHovered = hoveredInvestment === index;
      
      return (
        <circle
          key={index}
          cx="80"
          cy="80"
          r="50"
          fill="transparent"
          stroke={d.color}
          strokeWidth={isHovered ? "18" : "14"}
          strokeDasharray={`${segmentLength} 314.16`}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          onMouseEnter={() => setHoveredInvestment(index)}
          onMouseLeave={() => setHoveredInvestment(null)}
          className="transition-all duration-200 cursor-pointer"
        />
      );
    });
  };

  const activeSegment = hoveredInvestment !== null ? donutData[hoveredInvestment] : null;

  const getBarSegments = () => {
    return barData.map((b, index) => {
      const height = (b.val / 1000) * 90;
      const x = 20 + index * 42;
      const y = 110 - height;
      const isHovered = hoveredBar === index;
      
      return (
        <g key={index} onMouseEnter={() => setHoveredBar(index)} onMouseLeave={() => setHoveredBar(null)}>
          <rect
            x={x}
            y={y}
            width="26"
            height={height}
            rx="5"
            fill={isHovered ? '#e31463' : '#3b82f6'}
            opacity={isHovered ? '1' : '0.85'}
            className="transition-all duration-200 cursor-pointer"
          />
          <text
            x={x + 13}
            y={126}
            textAnchor="middle"
            className="text-[9px] font-bold fill-zinc-400 font-sans"
          >
            {b.label}
          </text>
          {isHovered && (
            <text
              x={x + 13}
              y={y - 6}
              textAnchor="middle"
              className="text-[9px] font-black fill-zinc-800 dark:fill-zinc-200 font-mono animate-in fade-in"
            >
              {b.val}
            </text>
          )}
        </g>
      );
    });
  };

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
        <div className="lg:col-span-12 flex flex-col">
          <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
              <Heart className="w-4 h-4 text-brand-pink fill-brand-pink" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Minhas Assinaturas Recorrentes</h3>
            </div>

            {loading ? (
              <div className="text-center py-6 text-xs text-zinc-400">Carregando assinaturas...</div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400">Nenhuma assinatura recorrente registrada.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {subscriptions.map((sub) => (
                  <Card key={sub.id} className="p-4 border border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10 rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-400 block">Projeto Destino</span>
                        <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">{sub.projectDestiny}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        sub.status === 'Ativa'
                          ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
                          : sub.status === 'Pausada'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                          : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
                      }`}>
                        {sub.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-zinc-450 dark:text-zinc-400 block">Valor Mensal</span>
                        {editingSubId === sub.id ? (
                          <div className="flex flex-col space-y-1.5 mt-1">
                            <div className="flex gap-1.5">
                              <div className="relative w-28">
                                <span className="absolute left-2.5 top-2 text-zinc-450 text-[11px] font-bold">R$</span>
                                <input
                                  type="number"
                                  className="w-full h-8 pl-7 pr-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-brand-pink"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  min="10"
                                />
                              </div>
                              <Button onClick={() => handleSaveAmount(sub.id)} className="h-8 px-2.5 bg-brand-pink hover:bg-brand-pink/90 text-white rounded-lg text-[10px] font-bold">
                                Salvar
                              </Button>
                              <Button onClick={() => setEditingSubId(null)} variant="outline" className="h-8 px-2.5 rounded-lg text-[10px] border-zinc-200 text-zinc-650">
                                Cancelar
                              </Button>
                            </div>
                            {editError && (
                              <span className="text-[9px] text-red-500 font-semibold">{editError}</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-extrabold text-zinc-900 dark:text-zinc-50 text-base">R$ {sub.amount.toFixed(2)}</span>
                            {sub.status !== 'Cancelada' && (
                              <button onClick={() => handleStartEdit(sub)} className="p-1 text-zinc-400 hover:text-primary transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-450 dark:text-zinc-400 block">Forma de Pagamento</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono mt-0.5 block">{sub.cardMaskedNumber}</span>
                      </div>
                    </div>

                    {sub.status !== 'Cancelada' && (
                      <div className="flex gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-850">
                        <Button
                          onClick={() => handleToggleStatus(sub)}
                          variant="outline"
                          className="flex-1 h-8 text-[10px] font-bold rounded-lg border-zinc-200 hover:bg-zinc-50 gap-1"
                        >
                          {sub.status === 'Ativa' ? (
                            <>
                              <Pause className="w-3 h-3 text-amber-500" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 text-green-500" />
                              Reativar
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleCancelSub(sub.id)}
                          variant="ghost"
                          className="h-8 text-[10px] font-bold text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/10 hover:text-red-600 rounded-lg gap-1 px-3 border border-transparent hover:border-red-200/50"
                        >
                          <XCircle className="w-3 h-3" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-12 flex flex-col">
          <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col space-y-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-brand-pink" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Histórico de Contribuições</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTaxModalOpen(true)}
                className="h-8 border-brand-pink/30 hover:border-brand-pink text-brand-pink font-bold text-[10px] rounded-lg gap-1.5 active:scale-[0.98] transition-all uppercase tracking-wider"
              >
                <FileText className="w-3.5 h-3.5" />
                Declaração IR 2025
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-850 p-4 rounded-2xl gap-3">
              <div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-550 block font-bold uppercase tracking-wider">Total doado no período selecionado</span>
                <span className="text-xl font-black text-brand-pink font-mono mt-0.5 block">
                  R$ {totalFilteredAmount.toFixed(2)}
                </span>
              </div>
              <p className="text-[9px] text-zinc-455 leading-normal max-w-sm">
                Apenas doações efetivamente liquidadas e com status <span className="font-extrabold text-green-600 dark:text-green-400">Confirmada</span> compõem este resumo financeiro.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-2">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  placeholder="Buscar por ID ou Hash da transação..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-brand-pink"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full h-9 px-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-brand-pink"
                >
                  <option value="">Todos os meses</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full h-9 px-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-brand-pink"
                >
                  <option value="">Todos os anos</option>
                  {years.map((y) => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="text-center py-8 text-xs text-zinc-400">Carregando histórico...</div>
              ) : filteredDonations.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-450">Nenhuma doação encontrada para os filtros aplicados.</div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5">Data</th>
                      <th className="py-2.5">Valor</th>
                      <th className="py-2.5">Método</th>
                      <th className="py-2.5">Destinação</th>
                      <th className="py-2.5 text-center">Pontos</th>
                      <th className="py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                    {filteredDonations.map((d) => (
                      <tr key={d.id} className="text-zinc-700 dark:text-zinc-300">
                        <td className="py-3 font-mono">{new Date(d.date).toLocaleDateString('pt-BR')}</td>
                        <td className="py-3 font-extrabold text-zinc-900 dark:text-zinc-100">R$ {d.amount.toFixed(2)}</td>
                        <td className="py-3">{d.method}</td>
                        <td className="py-3">{d.projectDestiny || 'Geral'}</td>
                        <td className="py-3 text-center font-bold text-brand-pink">+{d.amount * 10} pts</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            d.status === 'Confirmada' 
                              ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400' 
                              : d.status === 'Aguardando Pagamento' || d.status === 'Pendente'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                              : 'bg-zinc-100 text-zinc-400'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
        <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans mb-4">Mural de Transparência do Hospital</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
          <div className="lg:col-span-6">
            <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl h-full flex flex-col justify-between items-center text-center space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Distribuição de Recursos</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Como suas doações são aplicadas nos setores</p>
              </div>

              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 160 160">
                  {getDonutSegments()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest max-w-[85px] truncate">
                    {activeSegment ? activeSegment.name : 'Total Investido'}
                  </span>
                  <span className="text-lg font-black text-zinc-800 dark:text-zinc-100 font-mono mt-0.5">
                    {activeSegment ? `${activeSegment.value}%` : 'R$ 1.25M'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] w-full text-left pt-2 border-t border-zinc-50 dark:border-zinc-900">
                {donutData.map((d, index) => (
                  <div 
                    key={index}
                    onMouseEnter={() => setHoveredInvestment(index)}
                    onMouseLeave={() => setHoveredInvestment(null)}
                    className={`flex items-center gap-1.5 cursor-pointer p-1 rounded-lg transition-all ${hoveredInvestment === index ? 'bg-zinc-50 dark:bg-zinc-900 scale-102' : ''}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-zinc-500 font-medium truncate">{d.name}</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 ml-auto">{d.value}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-6">
            <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl h-full flex flex-col justify-between items-center text-center space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Volume de Atendimentos Clínicos</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Financiados pelas doações no semestre</p>
              </div>

              <div className="w-full flex justify-center py-1">
                <svg className="w-full max-w-[280px] h-[140px]" viewBox="0 0 280 140">
                  <line x1="20" y1="20" x2="260" y2="20" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                  <line x1="20" y1="50" x2="260" y2="50" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                  <line x1="20" y1="80" x2="260" y2="80" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                  <line x1="20" y1="110" x2="260" y2="110" stroke="#cbd5e1" strokeWidth="1" />
                  {getBarSegments()}
                </svg>
              </div>

              <div className="text-[10px] text-zinc-400 w-full pt-2 border-t border-zinc-50 dark:border-zinc-900 flex justify-between items-center">
                <span>Janeiro a Junho de 2026</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">Total: 4.800 atendimentos</span>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl text-center space-y-1 shadow-xs">
            <Users className="w-5 h-5 text-primary mx-auto" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Impacto Gerado</span>
            <span className="text-2xl font-black text-zinc-800 dark:text-zinc-100">4.520</span>
            <span className="text-[9px] text-zinc-400 block">Atendimentos clínicos financiados</span>
          </Card>
          <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl text-center space-y-1 shadow-xs">
            <TrendingUp className="w-5 h-5 text-primary mx-auto" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Investimento Total</span>
            <span className="text-2xl font-black text-zinc-800 dark:text-zinc-100">R$ 1.250.000</span>
            <span className="text-[9px] text-zinc-400 block">Arrecadado e investido no ano fiscal</span>
          </Card>
          <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl text-center space-y-1 shadow-xs">
            <Award className="w-5 h-5 text-primary mx-auto" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Selo Parceiro</span>
            <span className="text-2xl font-black text-brand-pink">Ouro</span>
            <span className="text-[9px] text-zinc-400 block">Classificação institucional ativa</span>
          </Card>
        </div>
      </div>

      {isPrestigeModalOpen && createPortal(
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
                  Parabéns por alcançar o nível Diamante! Ao ativar o prestígio:
                </p>
                <ul className="list-disc pl-4 text-[0.6875rem] text-zinc-505 dark:text-zinc-400 space-y-1 leading-normal">
                  <li>Seu saldo de pontos atual será redefinido para <strong>0</strong>.</li>
                  <li>Seu nível voltará para o rank <strong>Bronze</strong>, permitindo que você resgate novamente os selos do catálogo.</li>
                  <li>Você ganhará <strong>1 Ponto de Prestígio</strong> permanente.</li>
                  <li>A progressão de dificuldade para passar de nível e o custo dos selos aumentarão em <strong>10%</strong> cumulativamente.</li>
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
        </div>,
        document.body
      )}
      {isCatalogOpen && createPortal(
        <div onClick={() => setIsCatalogOpen(false)} className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
              <div>
                <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Minhas Conquistas & Insígnias</h2>
                <p className="text-[10px] text-zinc-400">Medalhas e selos institucionais que você já conquistou</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsCatalogOpen(false)} className="h-8 w-8 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50">
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
      )}
      {isCatalogOpen && createPortal(
        <div onClick={() => setIsCatalogOpen(false)} className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
              <div>
                <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Minhas Conquistas & Insígnias</h2>
                <p className="text-[10px] text-zinc-450">Medalhas e selos institucionais que você já conquistou</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsCatalogOpen(false)} className="h-8 w-8 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50">
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
      )}

      {isTaxModalOpen && createPortal(
        <div onClick={() => setIsTaxModalOpen(false)} className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:bg-white">
          <Card onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-h-none print:w-full print:rounded-none">
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 print:hidden">
              <div>
                <h2 className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">Declaração Anual de Doações</h2>
                <p className="text-[9px] text-zinc-400">Comprovante consolidado para fins de Imposto de Renda - Ano Calendário {selectedTaxYear}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedTaxYear}
                  onChange={(e) => setSelectedTaxYear(e.target.value)}
                  className="h-8 px-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-[10px] font-bold focus:outline-none dark:text-zinc-50"
                >
                  {years.length > 0 ? (
                    years.map((y) => (
                      <option key={y} value={y.toString()}>Ano Calendário {y}</option>
                    ))
                  ) : (
                    <option value="2025">Ano Calendário 2025</option>
                  )}
                </select>
                <Button variant="ghost" size="icon" onClick={() => setIsTaxModalOpen(false)} className="h-8 w-8 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50">
                  <X className="w-4 h-4 text-zinc-500" />
                </Button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-6 text-left text-zinc-800 dark:text-zinc-200 font-sans print:overflow-visible print:p-0">
              <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                <div className="space-y-1">
                  <h3 className="font-black text-sm uppercase text-primary">Hospital de Amor</h3>
                  <p className="text-[0.625rem] text-zinc-550 dark:text-zinc-400">Fundação Pio XII — CNPJ: 60.102.102/0001-10</p>
                  <p className="text-[0.5625rem] text-zinc-450 dark:text-zinc-505">Rua Antenor Duarte Villela, 1331 — Barretos/SP</p>
                </div>
                <div className="text-right text-[0.625rem] text-zinc-400">
                  <span className="font-bold block">Documento de Comprovação</span>
                  <span>Emitido em: {new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl space-y-2 text-[0.625rem]">
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Identificação do Doador</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-zinc-450 block font-semibold">Nome Completo:</span>
                    <span className="font-bold">{donorName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-450 block font-semibold">CPF:</span>
                    <span className="font-bold font-mono">
                      {donorCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[0.625rem] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Doações Recebidas em {selectedTaxYear}</h4>
                <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-[0.625rem] text-left">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 border-b border-zinc-150 dark:border-zinc-800 font-bold uppercase tracking-wider text-[0.5625rem]">
                        <th className="py-2 px-3">Data</th>
                        <th className="py-2 px-3">Método</th>
                        <th className="py-2 px-3">ID da Transação</th>
                        <th className="py-2 px-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                      {donations
                        .filter((d) => d.status === 'Confirmada' && new Date(d.date).getFullYear().toString() === selectedTaxYear)
                        .map((d) => (
                          <tr key={d.id} className="text-zinc-700 dark:text-zinc-300">
                            <td className="py-2 px-3 font-mono">{new Date(d.date).toLocaleDateString('pt-BR')}</td>
                            <td className="py-2 px-3">{d.method}</td>
                            <td className="py-2 px-3 font-mono text-zinc-500 truncate max-w-[120px]">{d.hash || d.id}</td>
                            <td className="py-2 px-3 text-right font-bold font-mono">R$ {d.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      {donations.filter((d) => d.status === 'Confirmada' && new Date(d.date).getFullYear().toString() === selectedTaxYear).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-zinc-400">Nenhuma doação realizada no ano fiscal de {selectedTaxYear}.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-zinc-200">
                <span className="text-[0.6875rem] font-black uppercase text-zinc-500">Valor Total Consolidado em {selectedTaxYear}:</span>
                <span className="text-sm font-black text-brand-pink font-mono">
                  R$ {donations
                    .filter((d) => d.status === 'Confirmada' && new Date(d.date).getFullYear().toString() === selectedTaxYear)
                    .reduce((sum, d) => sum + d.amount, 0)
                    .toFixed(2)}
                </span>
              </div>

              <div className="text-[0.5625rem] text-zinc-450 dark:text-zinc-400 leading-relaxed space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-850">
                <p>
                  Declaramos para os devidos fins de comprovação e dedução fiscal que a Fundação Pio XII (Hospital de Amor) é uma entidade filantrópica qualificada nos termos da legislação federal brasileira e que recebeu os valores acima identificados a título de doação espontânea, sem que tenha ocorrido qualquer contraprestação direta ou indireta de bens ou serviços.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <svg className="w-12 h-12 text-zinc-800 dark:text-zinc-200 shrink-0" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="white" stroke="#d4d4d8" strokeWidth="2" />
                    <rect x="10" y="10" width="25" height="25" fill="black" />
                    <rect x="15" y="15" width="15" height="15" fill="white" />
                    <rect x="65" y="10" width="25" height="25" fill="black" />
                    <rect x="70" y="15" width="15" height="15" fill="white" />
                    <rect x="10" y="65" width="25" height="25" fill="black" />
                    <rect x="15" y="70" width="15" height="15" fill="white" />
                    <rect x="45" y="45" width="10" height="10" fill="black" />
                    <rect x="40" y="20" width="10" height="15" fill="black" />
                    <rect x="45" y="70" width="20" height="10" fill="black" />
                    <rect x="75" y="75" width="15" height="15" fill="black" />
                  </svg>
                  <div>
                    <span className="font-bold block">Chave de Autenticação ICP-Brasil:</span>
                    <span className="font-mono text-zinc-500 break-all select-all block">HA{selectedTaxYear}-DF9A-87C2-E23B-98F1-44A9B8CE3A1D</span>
                    <span className="text-[0.5rem] text-zinc-400 block mt-0.5">Assinatura digitalizada e validada nos termos da Medida Provisória nº 2.200-2/2001.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-150 dark:border-zinc-800 print:hidden">
              <Button type="button" variant="outline" onClick={() => setIsTaxModalOpen(false)} className="h-10 rounded-xl text-xs font-bold">
                Fechar
              </Button>
              <Button type="button" onClick={() => window.print()} className="h-10 bg-brand-pink hover:bg-brand-pink/90 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-pink/20 gap-1.5 flex items-center">
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
                Imprimir Declaração
              </Button>
            </div>
          </Card>
        </div>,
        document.body
      )}
    </div>
  );
}
