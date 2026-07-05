import { Button } from '../ui/Button';
import { CheckCircle2 } from 'lucide-react';

interface ResetSuccessPanelProps {
  activeRole: 'patient' | 'donor';
  onNavigateToLogin: () => void;
}

export default function ResetSuccessPanel({
  activeRole,
  onNavigateToLogin,
}: ResetSuccessPanelProps) {
  return (
    <div className="space-y-6 text-center flex flex-col items-center">
      <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-full border border-green-200/50 dark:border-green-800/30">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Senha Alterada!</h1>
        <p className="text-zinc-500 text-xs max-w-sm mx-auto leading-relaxed">
          Sua nova senha foi salva no banco de dados local com sucesso. Agora você já pode retornar à tela de login e acessar o{' '}
          {activeRole === 'donor' ? 'Portal do Doador' : 'Portal do Paciente'}.
        </p>
      </div>

      <Button
        type="button"
        onClick={onNavigateToLogin}
        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold h-11 rounded-2xl shadow-sm text-xs mt-2"
      >
        Ir para o Login
      </Button>
    </div>
  );
}
