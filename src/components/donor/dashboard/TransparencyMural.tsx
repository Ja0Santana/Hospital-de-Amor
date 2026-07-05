import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Label } from '../../ui/Label';
import { TrendingUp, Award, Mail, Check } from 'lucide-react';
import type { TransparencyData, Donation, DonorPoints } from '../../../types';

interface ReferredUser {
  id: string;
  name: string;
  date: string;
  status: 'Pendente' | 'Doou (100 pts)';
  amount?: number;
}

interface TransparencyMuralProps {
  points: DonorPoints | null;
  donations: Donation[];
  referredUsers: ReferredUser[];
  transparency: TransparencyData | null;
  donorName: string;
  onSendSupportMsg: (message: string, isAuthorized: boolean) => Promise<void>;
}

const GRATITUDE_BADGE_STYLES: Record<string, string> = {
  apoiador: 'from-amber-600/20 to-amber-700/10 border-amber-600/30 text-amber-700',
  anjo: 'from-zinc-400/20 to-zinc-500/10 border-zinc-400/30 text-zinc-550',
  defensor: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-600',
  guardiao: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-600',
  pilar: 'from-pink-500/20 to-indigo-650/20 border-pink-500/30 text-brand-pink'
};

export default function TransparencyMural({
  points,
  donations,
  referredUsers,
  transparency,
  donorName,
  onSendSupportMsg
}: TransparencyMuralProps) {
  const [transparencyTab, setTransparencyTab] = useState<'finance' | 'gratitude' | 'support' | 'emails'>('finance');
  const [supportMsg, setSupportMsg] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [hoveredInvestment, setHoveredInvestment] = useState<number | null>(null);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const donutData = transparency?.sectors || [
    { name: 'Oncologia', value: 45, color: '#e31463' },
    { name: 'Mastologia', value: 25, color: '#f472b6' },
    { name: 'Radiologia', value: 15, color: '#3b82f6' },
    { name: 'Geral', value: 15, color: '#10b981' }
  ];

  const barData = transparency?.monthlyRecords.map(r => ({
    label: r.month,
    val: r.atendimentos
  })) || [
    { label: 'Jan', val: 750 },
    { label: 'Fev', val: 800 },
    { label: 'Mar', val: 780 },
    { label: 'Abr', val: 820 },
    { label: 'Mai', val: 850 },
    { label: 'Jun', val: 800 }
  ];

  const totalArrecadadoMural = transparency ? transparency.totalArrecadadoAno : 1250000;
  const totalAtendimentosMural = transparency ? transparency.atendimentosAno : 4800;
  const lastUpdatedAtMural = transparency?.lastUpdatedAt 
    ? new Date(transparency.lastUpdatedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
    : '';

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

  const handleSendSupportMsg = async () => {
    if (!supportMsg.trim()) return;
    try {
      await onSendSupportMsg(supportMsg.trim(), isAuthorized);
      setSupportMsg('');
      setSupportSuccess(true);
      setTimeout(() => setSupportSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-2 border-b border-zinc-150 dark:border-zinc-850">
        <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-550 font-sans">Mural de Transparência e Engajamento</h2>
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Button
            variant={transparencyTab === 'finance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTransparencyTab('finance')}
            className={`h-8 text-[10px] font-bold rounded-lg uppercase tracking-wider ${transparencyTab === 'finance' ? 'bg-primary text-white' : 'border-zinc-200 text-zinc-750 hover:bg-zinc-50'}`}
          >
            Prestação de Contas
          </Button>
          <Button
            variant={transparencyTab === 'gratitude' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTransparencyTab('gratitude')}
            className={`h-8 text-[10px] font-bold rounded-lg uppercase tracking-wider ${transparencyTab === 'gratitude' ? 'bg-primary text-white' : 'border-zinc-200 text-zinc-750 hover:bg-zinc-50'}`}
          >
            Mural de Gratidão
          </Button>
          <Button
            variant={transparencyTab === 'support' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTransparencyTab('support')}
            className={`h-8 text-[10px] font-bold rounded-lg uppercase tracking-wider ${transparencyTab === 'support' ? 'bg-primary text-white' : 'border-zinc-200 text-zinc-750 hover:bg-zinc-50'}`}
          >
            Mensagem de Apoio
          </Button>
          <Button
            variant={transparencyTab === 'emails' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTransparencyTab('emails')}
            className={`h-8 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1.5 ${transparencyTab === 'emails' ? 'bg-primary text-white' : 'border-zinc-200 text-zinc-750 hover:bg-zinc-50'}`}
          >
            <Mail className="w-3.5 h-3.5" />
            Notificações (RF07)
          </Button>
        </div>
      </div>

      {transparencyTab === 'finance' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {lastUpdatedAtMural && (
            <div className="text-[10px] text-zinc-405 dark:text-zinc-505 font-bold text-right -mt-2">
              Última atualização: {lastUpdatedAtMural}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-6">
            <div className="lg:col-span-6">
              <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl h-full flex flex-col justify-between items-center text-center space-y-4 shadow-xs">
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
                      {activeSegment ? `${activeSegment.value}%` : `R$ ${(totalArrecadadoMural / 1000000).toFixed(2)}M`}
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
              <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl h-full flex flex-col justify-between items-center text-center space-y-4 shadow-xs">
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
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Total: {totalAtendimentosMural.toLocaleString('pt-BR')} atendimentos</span>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl text-center space-y-1 shadow-xs">
              <TrendingUp className="w-5 h-5 text-primary mx-auto" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Impacto Gerado</span>
              <span className="text-2xl font-black text-zinc-800 dark:text-zinc-100">{totalAtendimentosMural.toLocaleString('pt-BR')}</span>
              <span className="text-[9px] text-zinc-400 block font-semibold">Atendimentos clínicos financiados</span>
            </Card>
            <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl text-center space-y-1 shadow-xs">
              <TrendingUp className="w-5 h-5 text-primary mx-auto" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Investimento Total</span>
              <span className="text-2xl font-black text-zinc-800 dark:text-zinc-100">R$ {totalArrecadadoMural.toLocaleString('pt-BR')}</span>
              <span className="text-[9px] text-zinc-400 block font-semibold">Arrecadado e investido no ano fiscal</span>
            </Card>
            <Card className="p-5 border-zinc-200/80 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-2xl text-center space-y-1 shadow-xs">
              <Award className="w-5 h-5 text-primary mx-auto" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Selo Parceiro</span>
              <span className="text-2xl font-black text-brand-pink font-sans">Ouro</span>
              <span className="text-[9px] text-zinc-400 block font-semibold">Classificação institucional ativa</span>
            </Card>
          </div>

          <div className="border-t border-zinc-150 dark:border-zinc-800 pt-6">
            <div className="mb-4 text-left">
              <h4 className="text-sm font-black text-zinc-855 dark:text-zinc-100">Projetos Concluídos e Impacto</h4>
              <p className="text-[10px] text-zinc-450 mt-0.5">Projetos viabilizados através do apoio de nossos doadores</p>
            </div>

            {transparency?.projects && transparency.projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {transparency.projects.map((proj) => (
                  <Card key={proj.id} className="p-4 border border-zinc-150 dark:border-zinc-855 bg-white dark:bg-zinc-950 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs text-left">
                    <div className="space-y-1.5">
                      <h5 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-550 leading-tight">{proj.title}</h5>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{proj.description}</p>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-pink-655 dark:text-pink-400 pt-2 border-t border-zinc-100 dark:border-zinc-850">
                      <span>Investimento: R$ {proj.amountRaised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className="text-zinc-400 dark:text-zinc-550">Concluído: {new Date(proj.completedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 border border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl text-center">
                <p className="text-xs text-zinc-450">Nenhum projeto concluído cadastrado no momento.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {transparencyTab === 'gratitude' && (
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-150 dark:border-zinc-850 space-y-4 animate-in fade-in duration-200">
          <div>
            <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-100">Mural de Gratidão do Hospital</h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">Reconhecimento público aos doadores que resgataram selos de honra</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Carlos D.', badge: 'Defensor da Vida (Ouro)', date: '10/06/2026', color: GRATITUDE_BADGE_STYLES['defensor'] || '' },
              { name: 'Mariana S.', badge: 'Apoiador da Esperança (Bronze)', date: '12/06/2026', color: GRATITUDE_BADGE_STYLES['apoiador'] || '' },
              { name: 'Tiago A.', badge: 'Pilar da Solidariedade (Diamante)', date: '13/06/2026', color: GRATITUDE_BADGE_STYLES['pilar'] || '' },
              ...(points?.redeemedBadges?.map((b) => {
                const firstLetter = donorName.split(' ')[1] ? ` ${donorName.split(' ')[1].charAt(0)}.` : '';
                return {
                  name: `${donorName.split(' ')[0]}${firstLetter}`,
                  badge: b.name,
                  date: new Date(b.date).toLocaleDateString('pt-BR'),
                  color: GRATITUDE_BADGE_STYLES[b.badgeId] || GRATITUDE_BADGE_STYLES['pilar'] || ''
                };
              }) || [])
            ].map((item, idx) => (
              <Card key={idx} className="p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl flex flex-col justify-between space-y-3 shadow-xs">
                <div className="flex gap-2.5 items-center">
                  <div className={`p-2 bg-gradient-to-br ${item.color} rounded-xl border shrink-0`}>
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-550 block truncate">{item.name}</span>
                    <span className="text-[9px] text-zinc-400 block font-mono">{item.date}</span>
                  </div>
                </div>
                <div className="pt-1 border-t border-zinc-100 dark:border-zinc-900">
                  <span className="text-[10px] font-black text-brand-pink leading-tight block">{item.badge}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {transparencyTab === 'support' && (
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-150 dark:border-zinc-850 space-y-4 animate-in fade-in duration-200">
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-zinc-850 dark:text-zinc-100">Enviar Mensagem de Apoio (Avulsa)</h4>
            <p className="text-[10px] text-zinc-500">Deixe uma mensagem de apoio de até 300 caracteres para nossos pacientes e equipe.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label htmlFor="supportMsg" className="text-xs font-bold text-zinc-650 flex justify-between items-center">
                <span>Mensagem de Apoio</span>
                <span className="text-[9px] font-mono text-zinc-400">{supportMsg.length}/300</span>
              </Label>
              <textarea
                id="supportMsg"
                placeholder="Escreva sua mensagem de incentivo e carinho aqui..."
                value={supportMsg}
                onChange={(e) => setSupportMsg(e.target.value.slice(0, 300))}
                maxLength={300}
                className="w-full min-h-[96px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded-xl text-xs resize-none p-3 text-zinc-900 dark:text-zinc-50 leading-normal"
              />
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="checkbox"
                id="authMsg"
                checked={isAuthorized}
                onChange={(e) => setIsAuthorized(e.target.checked)}
                className="rounded border-zinc-300 text-brand-pink focus:ring-brand-pink h-4 w-4"
              />
              <Label htmlFor="authMsg" className="text-[10px] text-zinc-500 cursor-pointer select-none font-semibold">
                Autorizo exibir meu primeiro nome junto à mensagem nos painéis do hospital.
              </Label>
            </div>

            {supportSuccess && (
              <div className="p-3 bg-green-50/10 border border-green-200/50 text-green-600 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Mensagem enviada com sucesso! A administração avaliará a exibição nos painéis do hospital.</span>
              </div>
            )}

            <Button
              onClick={handleSendSupportMsg}
              disabled={!supportMsg.trim()}
              className="bg-brand-pink hover:bg-brand-pink/90 text-white font-bold h-10 px-6 rounded-xl shadow-md text-xs w-full sm:w-auto"
            >
              Enviar Mensagem
            </Button>
          </div>
        </div>
      )}

      {transparencyTab === 'emails' && (
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-zinc-150 dark:border-zinc-850 space-y-4 animate-in fade-in duration-200">
          <div>
            <h4 className="text-sm font-black text-zinc-805 dark:text-zinc-100">Notificações por E-mail (RF07)</h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">Histórico simulado de comunicações oficiais enviadas para o seu e-mail cadastrado</p>
          </div>

          <div className="space-y-2.5 text-xs">
            {points && points.balance > 0 && (
              <div className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Aviso de Expiração (RF10-4)</span>
                  <span className="text-[9px] text-zinc-405 font-mono">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
                <h5 className="text-xs font-black text-zinc-900 dark:text-zinc-50">Seus pontos de fidelidade expiram em breve!</h5>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Olá {donorName.split(' ')[0]}, informamos que o seu saldo de <strong>{Math.min(350, points.balance)} pontos</strong> expira em 15 dias. Acesse o portal e resgate seus selos!
                </p>
              </div>
            )}

            {referredUsers.filter(r => r.status.includes('Doou')).map((ref, idx) => (
              <div key={idx} className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Bônus de Indicação (RF19-5)</span>
                  <span className="text-[9px] text-zinc-405 font-mono">{new Date(ref.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <h5 className="text-xs font-black text-zinc-900 dark:text-zinc-50">Seu convidado realizou uma doação!</h5>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Olá {donorName.split(' ')[0]}, seu amigo indicado <strong>{ref.name}</strong> concluiu a primeira doação confirmada! Você recebeu <strong>100 pontos</strong> de bônus como agradecimento.
                </p>
              </div>
            ))}

            {donations.filter(d => d.status === 'Confirmada').slice(0, 2).map((d, idx) => (
              <div key={idx} className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-primary bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 rounded-full uppercase tracking-wider">Comprovante de Doação</span>
                  <span className="text-[9px] text-zinc-450 font-mono">{new Date(d.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <h5 className="text-xs font-black text-zinc-900 dark:text-zinc-50">Doação Confirmada — Hospital de Amor</h5>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  Recebemos com sucesso sua doação de <strong>R$ {d.amount.toFixed(2)}</strong> via {d.method}. Seu saldo de fidelidade subiu em <strong>{d.amount * 10} pontos</strong>. Obrigado pelo apoio!
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
