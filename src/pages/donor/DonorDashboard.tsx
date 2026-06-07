import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { getDonationsByCpf, getDonorPoints } from '../../services/db';
import type { Donation, DonorPoints } from '../../types';
import { Trophy, CreditCard, QrCode, History, TrendingUp, Users, Award, FileText } from 'lucide-react';
import DonationModal from '../../components/donor/DonationModal';

interface DonorDashboardProps {
  donorCpf: string;
  donorName: string;
  onLogout: () => void;
  updateTrigger?: number;
}

export default function DonorDashboard({ donorCpf, donorName, onLogout, updateTrigger }: DonorDashboardProps) {
  const [points, setPoints] = useState<DonorPoints | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [donorCpf, updateTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getDonorPoints(donorCpf);
      const d = await getDonationsByCpf(donorCpf);
      setPoints(p);
      setDonations(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDonation = () => {
    setIsModalOpen(true);
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
        <Button onClick={onLogout} variant="outline" className="h-10 px-4 rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs">
          Sair da Conta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        <div className="md:col-span-4 flex flex-col">
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

        <div className="md:col-span-4 flex flex-col">
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

        <div className="md:col-span-4 flex flex-col">
          <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-brand-pink text-white rounded-2xl flex-1 flex flex-col justify-between space-y-4 shadow-lg shadow-brand-pink/10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Faça uma Doação</h3>
              <p className="text-lg font-black mt-1">Sua contribuição salva vidas.</p>
              <p className="text-[10px] text-white/80 mt-1 leading-normal">Escolha a melhor forma de contribuição rápida:</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => openDonation()}
                className="bg-white hover:bg-white/95 text-brand-pink font-bold h-11 rounded-xl text-xs flex flex-col items-center justify-center p-0 gap-1 border-none shadow"
              >
                <QrCode className="w-4 h-4 shrink-0" />
                <span>Pix</span>
              </Button>
              <Button
                onClick={() => openDonation()}
                className="bg-white hover:bg-white/95 text-brand-pink font-bold h-11 rounded-xl text-xs flex flex-col items-center justify-center p-0 gap-1 border-none shadow"
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Cartão</span>
              </Button>
              <Button
                onClick={() => openDonation()}
                className="bg-white hover:bg-white/95 text-brand-pink font-bold h-11 rounded-xl text-xs flex flex-col items-center justify-center p-0 gap-1 border-none shadow"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Boleto</span>
              </Button>
            </div>
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

      <DonationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        donorCpf={donorCpf} 
        onDonationSuccess={loadData}
      />
    </div>
  );
}
