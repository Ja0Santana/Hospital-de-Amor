import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { formatCpf } from '../../lib/sanitizer';
import { AlertCircle, Lock, User, Eye, EyeOff, Heart } from 'lucide-react';

interface LoginFormProps {
  activeRole: 'patient' | 'donor';
  referrerName: string | null;
  loading: boolean;
  error: string;
  blockedSecondsLeft: number;
  onLoginSubmit: (cpf: string, pass: string) => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  onCpfChange: (cpf: string) => void;
}

export default function LoginForm({
  activeRole,
  referrerName,
  loading,
  error,
  blockedSecondsLeft,
  onLoginSubmit,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  onCpfChange,
}: LoginFormProps) {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSubmit(cpf, password);
  };

  return (
    <div className="space-y-6">
      {referrerName && (
        <div className="p-4 bg-gradient-to-r from-brand-pink/20 to-primary/10 border border-brand-pink/30 rounded-2xl flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
          <Heart className="w-5 h-5 text-brand-pink shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1">
            <p className="text-xs font-black text-zinc-800 dark:text-zinc-100">
              {referrerName.split(' ')[0]} convidou você para apoiar o Hospital de Amor. Faça parte dessa causa!
            </p>
            <p className="text-[10px] text-zinc-550 dark:text-zinc-400 leading-normal">
              O Hospital de Amor é referência nacional na luta contra o câncer, oferecendo atendimento humanizado e de excelência de forma 100% gratuita. Seu apoio salva vidas.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          {activeRole === 'donor' ? 'Portal do Doador' : 'Portal do Paciente'}
        </h1>
        <p className="text-zinc-500 text-sm">
          {activeRole === 'donor'
            ? 'Insira suas credenciais de doador para entrar.'
            : 'Insira suas credenciais de acesso para entrar no painel.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-2xl flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpf" className="font-semibold text-zinc-700 dark:text-zinc-300">
              {activeRole === 'donor' ? 'CPF do Doador' : 'CPF do Paciente'}
            </Label>
            <div className="relative">
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={formatCpf(cpf)}
                onChange={(e) => {
                  const val = e.target.value;
                  setCpf(val);
                  onCpfChange(val);
                }}
                maxLength={14}
                className="pl-10 h-11 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl"
              />
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="font-semibold text-zinc-700 dark:text-zinc-300">
                Senha de Acesso
              </Label>
              <Button
                variant="link"
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-primary text-xs p-0 h-auto font-semibold"
              >
                Esqueceu a senha?
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl"
              />
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-650 focus:outline-none"
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || blockedSecondsLeft > 0}
          className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-12 rounded-2xl shadow-lg shadow-brand-pink/20 text-sm transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Entrando...' : blockedSecondsLeft > 0 ? `Bloqueado (${blockedSecondsLeft}s)` : 'Entrar no Portal'}
        </Button>
      </form>

      <div className="text-center text-xs text-zinc-400 pt-2">
        <span>Ainda não tem acesso? </span>
        <Button variant="link" type="button" onClick={onNavigateToRegister} className="text-primary font-bold p-0 h-auto">
          Cadastre-se aqui
        </Button>
      </div>
    </div>
  );
}
