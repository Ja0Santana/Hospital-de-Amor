import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { formatCpf } from '../../lib/sanitizer';
import { AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthMeter } from '../common/PasswordStrengthMeter';

interface ResetPasswordFormProps {
  loading: boolean;
  error: string;
  recoveryUserCpf: string;
  activeRole: 'patient' | 'donor';
  onResetSubmit: (newPass: string) => void;
  setError: (error: string) => void;
}

export default function ResetPasswordForm({
  loading,
  error,
  recoveryUserCpf,
  activeRole,
  onResetSubmit,
  setError,
}: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [isResetPasswordValid, setIsResetPasswordValid] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('Por favor, digite a nova senha.');
      return;
    }

    if (!isResetPasswordValid) {
      setError('A nova senha não atende aos requisitos mínimos de segurança.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    onResetSubmit(newPassword);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Definir Nova Senha</h1>
        <p className="text-zinc-500 text-xs">
          Crie uma nova senha de acesso forte para o {activeRole === 'donor' ? 'doador' : 'paciente'} com o CPF{' '}
          {formatCpf(recoveryUserCpf)}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showResetPassword ? 'text' : 'password'}
                placeholder="Digite a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-9 pr-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <button
                type="button"
                onClick={() => setShowResetPassword(!showResetPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-650 focus:outline-none"
                aria-label={showResetPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmNewPassword" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Confirmar Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="confirmNewPassword"
                type={showResetConfirmPassword ? 'text' : 'password'}
                placeholder="Confirme a nova senha"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="pl-9 pr-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <button
                type="button"
                onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-650 focus:outline-none"
                aria-label={showResetConfirmPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showResetConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {newPassword && (
            <PasswordStrengthMeter password={newPassword} onValidityChange={setIsResetPasswordValid} />
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || !isResetPasswordValid}
          className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : 'Salvar Nova Senha'}
        </Button>
      </form>
    </div>
  );
}
