import React, { useState } from 'react';
import { User, Lock, AlertCircle, Loader2, Heart } from 'lucide-react';
import { authenticateUser, getLoginAttempts, recordLoginAttempt, clearLoginAttempts } from '../../services/db';
import type { PatientUser } from '../../types';
import logoHospitalDeAmor from '../../assets/logoHospitalDeAmor.png';

interface AdminLoginProps {
  onLogin: (employee: PatientUser) => void;
  onNavigate: (hash: string) => void;
}

export default function AdminLogin({ onLogin, onNavigate }: AdminLoginProps) {
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [blockedUntil, setBlockedUntil] = useState<string | null>(null);

  const formatInputCpf = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    let formatted = numeric;
    if (numeric.length > 3) formatted = numeric.slice(0, 3) + '.' + numeric.slice(3);
    if (numeric.length > 6) formatted = formatted.slice(0, 7) + '.' + formatted.slice(7);
    if (numeric.length > 9) formatted = formatted.slice(0, 11) + '-' + formatted.slice(11, 13);
    return formatted.slice(0, 14);
  };

  const checkLockout = async (cleanCpf: string) => {
    try {
      const attemptsInfo = await getLoginAttempts(cleanCpf);
      if (attemptsInfo && attemptsInfo.blockedUntil) {
        const remainingTime = new Date(attemptsInfo.blockedUntil).getTime() - Date.now();
        if (remainingTime > 0) {
          setBlockedUntil(attemptsInfo.blockedUntil);
          setErrorMsg(`Múltiplas tentativas incorretas. Acesso bloqueado até ${new Date(attemptsInfo.blockedUntil).toLocaleTimeString('pt-BR')}`);
          return true;
        } else {
          await clearLoginAttempts(cleanCpf);
          setBlockedUntil(null);
          setErrorMsg('');
        }
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      setErrorMsg('CPF inválido. Insira os 11 dígitos.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Insira a sua senha.');
      return;
    }

    setLoading(true);

    const isLocked = await checkLockout(cleanCpf);
    if (isLocked) {
      setLoading(false);
      return;
    }

    try {
      const user = await authenticateUser(cleanCpf, password);
      if (user) {
        const isValidRole = user.role === 'recepcionista' || user.role === 'gestor' || user.role === 'auditor';
        if (!isValidRole) {
          setErrorMsg('Acesso negado. Esta conta não possui perfil administrativo.');
          await recordLoginAttempt(cleanCpf, false);
          setLoading(false);
          return;
        }

        if (user.isActive === false) {
          setErrorMsg('Acesso negado. Esta conta de funcionário está desativada.');
          setLoading(false);
          return;
        }

        await clearLoginAttempts(cleanCpf);
        onLogin(user);
      } else {
        setErrorMsg('CPF ou senha incorretos.');
        const attempt = await recordLoginAttempt(cleanCpf, false);
        if (attempt.blockedUntil) {
          setBlockedUntil(attempt.blockedUntil);
          setErrorMsg(`Múltiplas tentativas incorretas. Acesso bloqueado até ${new Date(attempt.blockedUntil).toLocaleTimeString('pt-BR')}`);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocorreu um erro ao tentar realizar o login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-24 h-24 rounded-3xl bg-white dark:bg-zinc-950 p-3.5 border border-zinc-200/50 dark:border-zinc-800/80 flex items-center justify-center shadow-md">
            <img src={logoHospitalDeAmor} alt="Hospital de Amor" className="w-full h-full object-contain" />
          </div>
          <div className="font-comfortaa font-bold text-base tracking-wider text-zinc-950 dark:text-zinc-50 flex items-center justify-center select-none uppercase pt-1">
            <span>Hospital de Am</span>
            <Heart className="w-4 h-4 fill-pink-600 text-pink-600 inline mx-0.5" aria-hidden="true" />
            <span>r</span>
          </div>
          <h1 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400">Painel Administrativo</h1>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">Área exclusiva para colaboradores e auditores da instituição.</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-800 dark:text-red-400 rounded-xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="staff-cpf" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">CPF</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="staff-cpf"
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatInputCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="staff-pass" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="staff-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || blockedUntil !== null}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold h-11 text-xs rounded-2xl transition-all shadow-sm shadow-pink-600/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Acessar Painel'}
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 text-center">
          <p className="text-[10px] text-zinc-400">
            Ambiente de Testes Locais?{' '}
            <button
              onClick={() => onNavigate('#/registro')}
              className="text-pink-600 hover:underline font-bold"
            >
              Registrar Funcionário de Teste
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
