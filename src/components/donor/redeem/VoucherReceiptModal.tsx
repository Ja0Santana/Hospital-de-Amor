import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Award, X } from 'lucide-react';
import { BADGE_STYLES } from './constants';

interface VoucherData {
  badgeName: string;
  cost: number;
  date: string;
  badgeId: string;
  prestige: number;
  hash: string;
}

interface VoucherReceiptModalProps {
  voucher: VoucherData;
  onClose: () => void;
}

export default function VoucherReceiptModal({ voucher, onClose }: VoucherReceiptModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const badgeStyle = BADGE_STYLES[voucher.badgeId] || {
    color: 'text-zinc-500',
    bg: 'from-zinc-400/20 to-zinc-500/10 border-zinc-400/30',
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:bg-white"
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:w-full print:rounded-none"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 print:hidden">
          <div>
            <h2 className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
              Comprovante de Resgate
            </h2>
            <p className="text-[9px] text-zinc-400">Voucher digital de honra institucional</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
          >
            <X className="w-4 h-4 text-zinc-505" />
          </Button>
        </div>

        <div className="p-6 space-y-4 text-center text-zinc-800 dark:text-zinc-200 font-sans print:p-0 overflow-y-auto flex-1">
          <div className="space-y-0.5 pb-3 border-b border-zinc-150 dark:border-zinc-850">
            <h3 className="font-black text-xs uppercase text-primary">Hospital de Amor</h3>
            <p className="text-[8px] text-zinc-455 dark:text-zinc-400">
              Agradecemos profundamente pela sua preciosa doação.
            </p>
          </div>

          <div className="space-y-3 py-1 flex flex-col items-center">
            <div
              className={`p-3 bg-gradient-to-br ${badgeStyle.bg} rounded-3xl border shrink-0 ${badgeStyle.color} w-14 h-14 flex items-center justify-center`}
            >
              <Award className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">{voucher.badgeName}</h4>
              <span className="text-[9px] text-zinc-455 dark:text-zinc-400 block">Selo de Honra Institucional Resgatado</span>
            </div>
          </div>

          <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl p-3 text-left text-xs space-y-1.5 bg-zinc-50/50 dark:bg-zinc-900/10 font-mono">
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-zinc-450">Data de Resgate:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {new Date(voucher.date).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-zinc-450">Pontos Utilizados:</span>
              <span className="font-bold text-brand-pink">{voucher.cost} pts</span>
            </div>
            <div className="flex justify-between items-center text-[9px]">
              <span className="text-zinc-450">Tipo de Adição:</span>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                {voucher.prestige > 0 ? `Prestígio ${voucher.prestige}` : 'Regular'}
              </span>
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-1.5 text-[8px] break-all">
              <span className="text-zinc-450 block">Hash da Transação:</span>
              <span className="text-zinc-650 dark:text-zinc-400 font-bold select-all block">{voucher.hash}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 pt-1">
            <svg className="w-20 h-20 text-zinc-800 dark:text-zinc-200" viewBox="0 0 100 100">
              <rect width="100" height="100" fill="white" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="10" y="10" width="25" height="25" fill="black" />
              <rect x="15" y="15" width="15" height="15" fill="white" />
              <rect x="65" y="10" width="25" height="25" fill="black" />
              <rect x="70" y="15" width="15" height="15" fill="white" />
              <rect x="10" y="65" width="25" height="25" fill="black" />
              <rect x="15" y="70" width="15" height="15" fill="white" />
              <rect x="45" y="45" width="10" height="10" fill="black" />
              <rect x="35" y="40" width="10" height="15" fill="black" />
              <rect x="55" y="65" width="20" height="10" fill="black" />
              <rect x="75" y="75" width="15" height="15" fill="black" />
            </svg>
            <span className="text-[7px] text-zinc-400 uppercase tracking-widest font-bold">
              Controle Administrativo Fictício
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-150 dark:border-zinc-800 print:hidden">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 rounded-xl text-xs font-bold">
            Fechar
          </Button>
          <Button
            type="button"
            onClick={() => window.print()}
            className="h-10 bg-brand-pink hover:bg-brand-pink/90 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-pink/20 gap-1.5 flex items-center"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
            </svg>
            Imprimir Comprovante
          </Button>
        </div>
      </Card>
    </div>,
    document.body
  );
}
