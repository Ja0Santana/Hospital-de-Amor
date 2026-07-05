import { useState } from 'react';
import { Info, XCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Label } from '../../ui/Label';

interface CancelRequestWidgetProps {
  cancelSuccess: boolean;
  onCancelSubmit: (reason: string) => Promise<void> | void;
}

export default function CancelRequestWidget({
  cancelSuccess,
  onCancelSubmit,
}: CancelRequestWidgetProps) {
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleSubmit = async () => {
    await onCancelSubmit(cancelReason);
    setIsCancelOpen(false);
    setCancelReason('');
  };

  return (
    <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800/50 space-y-4">
      <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">Ações da Solicitação</h4>
      {cancelSuccess ? (
        <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200">
          <Info className="w-4 h-4" />
          Solicitação cancelada com sucesso!
        </div>
      ) : isCancelOpen ? (
        <div className="bg-red-50/10 dark:bg-red-950/5 border border-red-200/30 dark:border-red-800/20 p-4 rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-200">
          <Label htmlFor="cancelReason" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Por favor, informe o motivo do cancelamento:
          </Label>
          <textarea
            id="cancelReason"
            rows={2}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Digite o motivo..."
            className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-primary focus:outline-none dark:text-zinc-100"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCancelOpen(false);
                setCancelReason('');
              }}
              className="text-xs h-8 px-3 rounded-lg"
            >
              Desistir
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleSubmit}
              className="text-xs h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Confirmar Cancelamento
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="destructive"
          onClick={() => setIsCancelOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold h-9 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
        >
          <XCircle className="w-4 h-4" />
          Cancelar Solicitação
        </Button>
      )}
    </div>
  );
}
