import { Button } from '../ui/Button';
import { CheckCircle2 } from 'lucide-react';

interface RecoverySuccessPanelProps {
  maskedEmail: string;
  onOpenSimulatedInbox: () => void;
  onNavigateToLogin: () => void;
}

export default function RecoverySuccessPanel({
  maskedEmail,
  onOpenSimulatedInbox,
  onNavigateToLogin,
}: RecoverySuccessPanelProps) {
  return (
    <div className="space-y-6 text-center flex flex-col items-center">
      <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-full border border-green-200/50 dark:border-green-800/30">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">E-mail Enviado!</h1>
        <p className="text-zinc-500 text-xs max-w-sm mx-auto leading-relaxed">
          Enviamos as instruções e um link seguro de redefinição de senha para o e-mail mascarado abaixo associado ao seu CPF:
        </p>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/80 px-4 py-3 rounded-2xl font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
        {maskedEmail}
      </div>

      <p className="text-[10px] text-zinc-400 max-w-[280px]">
        O link expira automaticamente em 15 minutos por razões de segurança. Caso não receba, verifique sua caixa de spam.
      </p>

      <div className="w-full space-y-2 mt-2">
        <Button
          type="button"
          onClick={onOpenSimulatedInbox}
          className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform active:scale-[0.98]"
        >
          Abrir Simulador de E-mail
        </Button>
        <Button
          type="button"
          onClick={onNavigateToLogin}
          className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 font-semibold h-11 rounded-2xl shadow-sm text-xs"
        >
          Voltar ao Login
        </Button>
      </div>
    </div>
  );
}
