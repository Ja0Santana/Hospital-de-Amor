import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { formatCpf } from '../../lib/sanitizer';
import { AlertCircle, User, ChevronLeft } from 'lucide-react';

interface ForgotPasswordFormProps {
  loading: boolean;
  error: string;
  onForgotSubmit: (cpf: string) => void;
  onNavigateToLogin: () => void;
}

export default function ForgotPasswordForm({
  loading,
  error,
  onForgotSubmit,
  onNavigateToLogin,
}: ForgotPasswordFormProps) {
  const [forgotCpf, setForgotCpf] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onForgotSubmit(forgotCpf);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Voltar ao login"
          onClick={onNavigateToLogin}
          className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4 text-zinc-500" aria-hidden="true" />
        </Button>
        <span className="text-xs font-semibold text-zinc-500">Voltar ao Login</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Esqueci a Senha</h1>
        <p className="text-zinc-500 text-sm">Informe seu CPF. Um link de redefinição será enviado para o e-mail cadastrado.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-2xl flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="forgotCpf" className="font-semibold text-zinc-700 dark:text-zinc-300">
            CPF cadastrado
          </Label>
          <div className="relative">
            <Input
              id="forgotCpf"
              type="text"
              placeholder="000.000.000-00"
              value={formatCpf(forgotCpf)}
              onChange={(e) => setForgotCpf(e.target.value)}
              maxLength={14}
              className="pl-10 h-11 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl"
            />
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-12 rounded-2xl shadow-lg shadow-brand-pink/20 text-sm transition-transform active:scale-[0.98]"
        >
          {loading ? 'Verificando...' : 'Recuperar Senha'}
        </Button>
      </form>
    </div>
  );
}
