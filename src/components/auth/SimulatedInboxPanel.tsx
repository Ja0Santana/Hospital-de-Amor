import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ChevronLeft } from 'lucide-react';
import type { PatientUser } from '../../types';
import logoHospitalDeAmor from '../../assets/logoHospitalDeAmor.png';

interface SimulatedInboxPanelProps {
  activeRole: 'patient' | 'donor';
  recoveryUser: PatientUser | null;
  onNavigateToResetPassword: () => void;
  onNavigateToRecoverySuccess: () => void;
}

export default function SimulatedInboxPanel({
  activeRole,
  recoveryUser,
  onNavigateToResetPassword,
  onNavigateToRecoverySuccess,
}: SimulatedInboxPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar à confirmação de e-mail"
          onClick={onNavigateToRecoverySuccess}
          className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4 text-zinc-500" aria-hidden="true" />
        </Button>
        <span className="text-xs font-semibold text-zinc-500">Voltar à Confirmação</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Caixa de Entrada (Simulador)</h1>
        <p className="text-zinc-500 text-[11px]">
          Esta é uma simulação segura do e-mail de recuperação que foi enviado para a sua conta.
        </p>
      </div>

      <Card className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-md">
        <div className="bg-zinc-50 dark:bg-zinc-900/80 px-4 py-3 border-b border-zinc-200/60 dark:border-zinc-800 flex flex-col gap-1 text-[11px] text-zinc-500">
          <div>
            <strong className="text-zinc-700 dark:text-zinc-300">De:</strong> suporte@hospitalamor.org (Hospital de Amor)
          </div>
          <div>
            <strong className="text-zinc-700 dark:text-zinc-300">Para:</strong> {recoveryUser?.email}
          </div>
          <div>
            <strong className="text-zinc-700 dark:text-zinc-300">Assunto:</strong> Redefinição de Senha -{' '}
            {activeRole === 'donor' ? 'Portal do Doador' : 'Portal do Paciente'}
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-zinc-950 flex flex-col items-center text-center space-y-4 text-xs">
          <div className="bg-white p-1.5 rounded-xl flex items-center justify-center shadow-sm border border-zinc-100 w-12 h-12">
            <img src={logoHospitalDeAmor} alt="Hospital de Amor" className="w-full h-full object-contain" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Recuperação de Senha</h2>
          <p className="text-zinc-500 leading-relaxed max-w-sm">
            Olá, <strong>{recoveryUser?.name}</strong>. Recebemos uma solicitação para redefinir a senha do seu{' '}
            {activeRole === 'donor' ? 'Portal do Doador' : 'Portal do Paciente'} (Hospital de Amor). Clique no botão abaixo
            para criar uma nova senha:
          </p>
          <Button
            type="button"
            onClick={onNavigateToResetPassword}
            className="bg-primary hover:bg-primary/95 text-white font-bold px-6 h-10 rounded-xl shadow-md text-xs transition-transform active:scale-[0.98]"
          >
            Redefinir Minha Senha
          </Button>
          <p className="text-[10px] text-zinc-400">
            Se você não solicitou essa redefinição, apenas desconsidere este e-mail. Seus dados continuam protegidos conforme
            a LGPD.
          </p>
        </div>
      </Card>
    </div>
  );
}
