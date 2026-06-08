import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { getDonationsByCpf, getDonorPoints, getRecurringSubscriptionsByCpf, updateRecurringSubscription } from '../../services/db';
import type { Donation, DonorPoints, RecurringSubscription } from '../../types';
import { Trophy, History, TrendingUp, Users, Award, Heart, Play, Pause, XCircle, Edit2 } from 'lucide-react';

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

  useEffect(() => {
    loadData();
  }, [donorCpf, updateTrigger]);

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
    const level = points?.level || 'Bronze';
    
    if (level === 'Bronze') {
      const nextLimit = 1000;
      const progress = (balance / nextLimit) * 100;
      const remaining = nextLimit - balance;
      return { progress, label: `Faltam ${remaining} pontos para o nível Prata`, nextLevel: 'Prata' };
    } else if (level === 'Prata') {
      const nextLimit = 5000;
      const progress = ((balance - 1000) / (nextLimit - 1000)) * 100;
      const remaining = nextLimit - balance;
      return { progress, label: `Faltam ${remaining} pontos para o nível Ouro`, nextLevel: 'Ouro' };
    } else {
      return { progress: 100, label: 'Nível máximo atingido! Obrigado pelo seu apoio extraordinário.', nextLevel: null };
    }
  };

  const pointsInfo = getPointsInfo();

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
            Olá, {donorName.split(' ')[0]}
          </h1>
          <p className="text-zinc-500 mt-1">Obrigado por fazer a diferença. Acompanhe seu impacto hoje.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        <div className="md:col-span-6 flex flex-col">
          <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col justify-between space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nível do Doador</h3>
                <p className="text-2xl font-black text-primary mt-1 flex items-center gap-2">
                  <Award className="w-6 h-6 text-secondary" />
                  {points?.level || 'Bronze'}
                </p>
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

            <div className="flex justify-between text-[10px] text-zinc-400 font-bold border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <span>Bronze</span>
              <span>Prata</span>
              <span>Ouro</span>
            </div>
          </Card>
        </div>

        <div className="md:col-span-6 flex flex-col">
          <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col justify-between space-y-4">
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
              onClick={() => alert('O catálogo de resgate de selos e homenagens estará disponível em breve.')}
              className="w-full h-10 border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs"
            >
              Ver Catálogo
            </Button>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-12 flex flex-col">
          <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col space-y-4">
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
          <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
              <History className="w-4 h-4 text-brand-pink" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Histórico de Contribuições</h3>
            </div>

            <div className="overflow-x-auto flex-1">
              {loading ? (
                <div className="text-center py-8 text-xs text-zinc-400">Carregando histórico...</div>
              ) : donations.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400">Nenhuma doação registrada ainda.</div>
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
                    {donations.map((d) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl text-center space-y-1">
            <Users className="w-5 h-5 text-primary mx-auto" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Impacto Gerado</span>
            <span className="text-2xl font-black text-zinc-800 dark:text-zinc-100">4.520</span>
            <span className="text-[9px] text-zinc-400 block">Atendimentos clínicos financiados</span>
          </Card>
          <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl text-center space-y-1">
            <TrendingUp className="w-5 h-5 text-primary mx-auto" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Investimento Total</span>
            <span className="text-2xl font-black text-zinc-800 dark:text-zinc-100">R$ 1.250.000</span>
            <span className="text-[9px] text-zinc-400 block">Arrecadado e investido no ano fiscal</span>
          </Card>
          <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl text-center space-y-1">
            <Award className="w-5 h-5 text-primary mx-auto" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Selo Parceiro</span>
            <span className="text-2xl font-black text-brand-pink">Ouro</span>
            <span className="text-[9px] text-zinc-400 block">Classificação institucional ativa</span>
          </Card>
        </div>
      </div>

    </div>
  );
}

