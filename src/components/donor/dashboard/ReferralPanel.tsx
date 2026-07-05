import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Label } from '../../ui/Label';
import { Users, Check, Copy, Send } from 'lucide-react';

interface ReferredUser {
  id: string;
  name: string;
  date: string;
  status: 'Pendente' | 'Doou (100 pts)';
  amount?: number;
}

interface ReferralPanelProps {
  donorCpf: string;
  referredUsers: ReferredUser[];
  onSimulateReferral: () => Promise<void>;
  onSimulateShare: (channel: string) => void;
}

export default function ReferralPanel({
  donorCpf,
  referredUsers,
  onSimulateReferral,
  onSimulateShare
}: ReferralPanelProps) {
  const [copiedRefLink, setCopiedRefLink] = useState(false);

  const handleCopyRefLink = () => {
    setCopiedRefLink(true);
    navigator.clipboard.writeText(`https://hospitaldeamor.org.br/doar?ref=${donorCpf}`);
    setTimeout(() => setCopiedRefLink(false), 2000);
  };

  return (
    <Card className="p-6 border-zinc-200/80 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-2xl flex-1 flex flex-col space-y-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">Indicar Amigos & Convites (RF19)</h3>
      </div>

      <div className="space-y-4 text-xs flex-1 flex flex-col justify-between">
        <p className="text-zinc-500 dark:text-zinc-400 leading-normal">
          Indique novos doadores para ajudar o hospital! Para cada amigo indicado que realizar a primeira doação, você ganha <strong className="text-brand-pink">100 pontos de bônus</strong> para seu perfil de fidelidade.
        </p>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Seu Link de Indicação</Label>
          <div className="flex gap-2">
            <input
              readOnly
              value={`https://hospitaldeamor.org.br/doar?ref=${donorCpf}`}
              className="h-10 text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 px-3 font-mono text-zinc-500 rounded-xl flex-1 select-all focus:outline-none"
            />
            <Button onClick={handleCopyRefLink} variant="outline" className="h-10 w-10 shrink-0 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-200/50 flex items-center justify-center p-0">
              {copiedRefLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-zinc-500" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Compartilhar rápido:</span>
          <div className="flex gap-1.5">
            <Button onClick={() => onSimulateShare('WhatsApp')} size="sm" variant="outline" className="h-8 text-[10px] font-bold border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 text-zinc-650">
              WhatsApp
            </Button>
            <Button onClick={() => onSimulateShare('E-mail')} size="sm" variant="outline" className="h-8 text-[10px] font-bold border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 text-zinc-650">
              E-mail
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-150 dark:border-zinc-850 flex-1 flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550">Amigos Indicados ({referredUsers.length})</h4>
            <Button onClick={onSimulateReferral} size="sm" variant="link" className="text-[10px] text-primary hover:text-primary/90 p-0 h-auto font-bold flex items-center gap-1">
              <Send className="w-3 h-3" />
              Simular Nova Indicação
            </Button>
          </div>

          <div className="max-h-[140px] overflow-y-auto pr-1 space-y-2">
            {referredUsers.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-[10px]">Nenhuma indicação realizada ainda.</div>
            ) : (
              referredUsers.map((ref) => (
                <div key={ref.id} className="flex justify-between items-center p-2 border border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-900/10 rounded-xl shadow-xs">
                  <div>
                    <span className="font-extrabold text-zinc-800 dark:text-zinc-200 block leading-tight">{ref.name}</span>
                    <span className="text-[9px] text-zinc-400">{new Date(ref.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    ref.status.includes('Doou') 
                      ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400' 
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                  }`}>
                    {ref.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
