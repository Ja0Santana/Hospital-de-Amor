import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Heart, Edit2, Pause, Play, XCircle } from 'lucide-react';
import type { RecurringSubscription } from '../../../types';

interface RecurringSubscriptionsListProps {
  loading: boolean;
  subscriptions: RecurringSubscription[];
  onToggleStatus: (sub: RecurringSubscription) => Promise<void>;
  onCancelSub: (subId: string) => Promise<void>;
  onUpdateAmount: (subId: string, amount: number) => Promise<void>;
}

export default function RecurringSubscriptionsList({
  loading,
  subscriptions,
  onToggleStatus,
  onCancelSub,
  onUpdateAmount
}: RecurringSubscriptionsListProps) {
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editError, setEditError] = useState<string>('');

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
      await onUpdateAmount(subId, parsed);
      setEditingSubId(null);
    } catch (err) {
      setEditError('Erro ao atualizar valor da assinatura.');
    }
  };

  return (
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
        <div className="grid grid-cols-1 gap-4 text-xs">
          {subscriptions.map((sub) => (
            <Card key={sub.id} className="p-4 border border-zinc-150 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-900/10 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Projeto Destino</span>
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-550">{sub.projectDestiny}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  sub.status === 'Ativa'
                    ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
                    : sub.status === 'Pausada'
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                    : 'bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400'
                }`}>
                  {sub.status}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-zinc-400 block">Valor Mensal</span>
                  {editingSubId === sub.id ? (
                    <div className="flex flex-col space-y-1.5 mt-1">
                      <div className="flex gap-1.5">
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-2 text-zinc-400 text-[11px] font-bold">R$</span>
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
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-550 text-base">R$ {sub.amount.toFixed(2)}</span>
                      {sub.status !== 'Cancelada' && (
                        <button onClick={() => handleStartEdit(sub)} className="p-1 text-zinc-400 hover:text-primary transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block">Forma de Pagamento</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono mt-0.5 block">{sub.cardMaskedNumber}</span>
                </div>
              </div>

              {sub.status !== 'Cancelada' && (
                <div className="flex gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-850">
                  <Button
                    onClick={() => onToggleStatus(sub)}
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
                    onClick={() => onCancelSub(sub.id)}
                    variant="ghost"
                    className="h-8 text-[10px] font-bold text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/10 hover:text-red-650 rounded-lg gap-1 px-3 border border-transparent hover:border-red-200/50"
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
  );
}
