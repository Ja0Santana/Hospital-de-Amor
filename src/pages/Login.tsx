import { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCpf, validateCpf } from '../lib/sanitizer';
import { ShieldCheck, Heart, Sun, Moon, Eye } from 'lucide-react';
import {
  authenticateUser,
  createUser,
  getUserByCpf,
  updateUserPassword,
  getLoginAttempts,
  recordLoginAttempt,
  clearLoginAttempts,
} from '../services/db';

import type { PatientUser } from '../types';
import logoHospitalDeAmor from '../assets/logoHospitalDeAmor.png';

import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import RecoverySuccessPanel from '../components/auth/RecoverySuccessPanel';
import SimulatedInboxPanel from '../components/auth/SimulatedInboxPanel';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import ResetSuccessPanel from '../components/auth/ResetSuccessPanel';

interface LoginProps {
  onLoginSuccess: (cpf: string, role: 'patient' | 'donor') => void;
  theme: string;
  setTheme: (theme: string) => void;
}

type LoginView = 'login' | 'register' | 'forgot-password' | 'recovery-success' | 'simulated-inbox' | 'reset-password' | 'reset-success';

export default function Login({ onLoginSuccess, theme, setTheme }: LoginProps) {
  const [view, setView] = useState<LoginView>('login');
  const [activeRole, setActiveRole] = useState<'patient' | 'donor'>('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [recoveryUser, setRecoveryUser] = useState<PatientUser | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [blockedSecondsLeft, setBlockedSecondsLeft] = useState(0);

  const [referrerCpf, setReferrerCpf] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  useEffect(() => {
    const getReferrer = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      let ref = searchParams.get('ref');
      if (!ref && window.location.hash) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery);
          ref = hashParams.get('ref');
        } else {
          const hashParts = window.location.hash.split('ref=');
          if (hashParts.length > 1) {
            ref = hashParts[1].split('&')[0];
          }
        }
      }
      if (ref) {
        const cleanRef = ref.replace(/\D/g, '');
        if (cleanRef.length === 11) {
          try {
            const user = await getUserByCpf(cleanRef);
            if (user) {
              setReferrerCpf(cleanRef);
              setReferrerName(user.name);
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
    };
    getReferrer();
  }, []);

  useEffect(() => {
    if (blockedSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setBlockedSecondsLeft((prev) => {
        if (prev <= 1) {
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [blockedSecondsLeft]);

  const checkCpfBlock = async (rawCpf: string) => {
    const cleanCpf = rawCpf.replace(/\D/g, '');
    if (cleanCpf.length === 11) {
      const record = await getLoginAttempts(cleanCpf);
      if (record && record.blockedUntil) {
        const diff = new Date(record.blockedUntil).getTime() - Date.now();
        if (diff > 0) {
          const sec = Math.ceil(diff / 1000);
          setBlockedSecondsLeft(sec);
          setError(`Acesso bloqueado por múltiplas tentativas incorretas. Aguarde ${sec} segundos.`);
        } else {
          setBlockedSecondsLeft(0);
          await clearLoginAttempts(cleanCpf);
        }
      } else {
        setBlockedSecondsLeft(0);
      }
    } else {
      setBlockedSecondsLeft(0);
    }
  };

  const handleLoginSubmit = async (rawCpf: string, pass: string) => {
    setError('');

    const cleanCpf = rawCpf.replace(/\D/g, '');
    if (!cleanCpf) {
      setError('Por favor, insira o seu CPF.');
      return;
    }

    if (!validateCpf(cleanCpf)) {
      setError('O CPF informado é inválido. Por favor, verifique os dígitos.');
      return;
    }

    if (blockedSecondsLeft > 0) {
      setError(`Acesso bloqueado por múltiplas tentativas incorretas. Aguarde ${blockedSecondsLeft} segundos.`);
      return;
    }

    const record = await getLoginAttempts(cleanCpf);
    if (record && record.blockedUntil) {
      const diff = new Date(record.blockedUntil).getTime() - Date.now();
      if (diff > 0) {
        const sec = Math.ceil(diff / 1000);
        setBlockedSecondsLeft(sec);
        setError(`Acesso bloqueado por múltiplas tentativas incorretas. Aguarde ${sec} segundos.`);
        return;
      } else {
        await clearLoginAttempts(cleanCpf);
      }
    }

    if (!pass) {
      setError('Por favor, insira a sua senha de acesso.');
      return;
    }

    setLoading(true);
    try {
      const authenticatedUser = await authenticateUser(cleanCpf, pass);
      if (authenticatedUser) {
        let userRole = (authenticatedUser.role || 'patient').toLowerCase().trim();
        if (userRole === 'paciente') userRole = 'patient';
        if (userRole === 'doador') userRole = 'donor';

        const rolesList = userRole.split(',').map((r) => r.trim());
        if (rolesList.includes('both')) {
          rolesList.push('patient', 'donor');
        }

        const hasActiveRole = rolesList.includes(activeRole);

        if (!hasActiveRole) {
          setLoading(false);
          const hasAdmin = rolesList.some((r) =>
            ['recepcionista', 'gestor', 'auditor'].includes(r)
          );
          if (hasAdmin) {
            setError(
              'Este CPF está cadastrado como Colaborador Administrativo. Por favor, acesse o Portal Administrativo para entrar.'
            );
          } else {
            setError(
              `Este CPF está cadastrado como ${
                rolesList.includes('donor') ? 'Doador' : 'Paciente'
              }. Por favor, selecione a aba correta acima para entrar.`
            );
          }
          return;
        }

        await recordLoginAttempt(cleanCpf, true);
        setLoading(false);
        onLoginSuccess(authenticatedUser.cpf === '12345678900' ? '123.456.789-00' : formatCpf(authenticatedUser.cpf), activeRole);
      } else {
        const attempt = await recordLoginAttempt(cleanCpf, false);
        setLoading(false);
        if (attempt.blockedUntil) {
          const sec = Math.ceil((new Date(attempt.blockedUntil).getTime() - Date.now()) / 1000);
          setBlockedSecondsLeft(sec);
          setError(`Múltiplas tentativas de login incorretas. CPF bloqueado temporariamente por 2 minutos.`);
        } else {
          setError(`CPF não cadastrado ou senha incorreta. Tentativa ${attempt.attemptsCount} de 5.`);
        }
      }
    } catch (err: any) {
      setLoading(false);
      setError('Ocorreu um erro ao realizar o login. Tente novamente.');
    }
  };

  const handleRegisterSubmit = async (formData: {
    name: string;
    cpf: string;
    birthDate: string;
    email: string;
    phone: string;
    passwordHash: string;
  }) => {
    setLoading(true);
    try {
      await createUser({
        cpf: formData.cpf,
        name: formData.name,
        birthDate: formData.birthDate,
        email: formData.email,
        phone: formData.phone,
        passwordHash: formData.passwordHash,
        role: activeRole,
        referredBy: referrerCpf || undefined,
      });

      if (referrerCpf) {
        const key = `referred_users_${referrerCpf}`;
        const stored = localStorage.getItem(key);
        const list = stored
          ? JSON.parse(stored)
          : [
              { id: 'ref-1', name: 'Marcos de Oliveira', date: '2026-06-01T14:32:00.000Z', status: 'Doou (100 pts)', amount: 50 },
              { id: 'ref-2', name: 'Carla Dias Souza', date: '2026-06-05T09:15:00.000Z', status: 'Pendente' },
            ];
        const alreadyExists = list.some((item: any) => item.id === `ref-${formData.cpf}`);
        if (!alreadyExists) {
          list.unshift({
            id: `ref-${formData.cpf}`,
            name: formData.name,
            date: new Date().toISOString(),
            status: 'Pendente',
          });
          localStorage.setItem(key, JSON.stringify(list));
        }
      }

      setLoading(false);
      onLoginSuccess(formatCpf(formData.cpf), activeRole);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erro ao realizar cadastro.');
    }
  };

  const handleForgotSubmit = async (forgotCpf: string) => {
    setError('');

    const cleanCpf = forgotCpf.replace(/\D/g, '');
    if (!cleanCpf) {
      setError('Por favor, insira o seu CPF.');
      return;
    }

    if (!validateCpf(cleanCpf)) {
      setError('O CPF informado é inválido.');
      return;
    }

    setLoading(true);
    try {
      const user = await getUserByCpf(cleanCpf);
      setLoading(false);
      if (!user) {
        setError('Paciente não cadastrado com este CPF.');
        return;
      }
      setRecoveryUser(user);

      const parts = user.email.split('@');
      const name = parts[0];
      const domain = parts[1];
      const maskedName =
        name.length > 3
          ? name.slice(0, 2) + '*'.repeat(name.length - 4) + name.slice(-2)
          : name.slice(0, 1) + '*'.repeat(name.length - 1);

      setMaskedEmail(`${maskedName}@${domain}`);
      setView('recovery-success');
    } catch (err: any) {
      setLoading(false);
      setError('Erro ao processar solicitação.');
    }
  };

  const handleResetSubmit = async (newPass: string) => {
    setError('');

    if (!recoveryUser) {
      setError('Erro de sessão de recuperação.');
      return;
    }

    setLoading(true);
    try {
      await updateUserPassword(recoveryUser.cpf, newPass);
      setLoading(false);
      setView('reset-success');
    } catch (err: any) {
      setLoading(false);
      setError('Erro ao atualizar a senha.');
    }
  };

  const handleCheckCpfExists = async (cleanCpf: string): Promise<boolean> => {
    try {
      const existing = await getUserByCpf(cleanCpf);
      if (existing) {
        const existingRole = existing.role || 'patient';
        return existingRole === activeRole || existingRole === 'both';
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const navigateToView = (newView: LoginView) => {
    setError('');
    setView(newView);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-50 flex items-center bg-white dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme('light')}
          className={`h-7 w-7 rounded-md transition-colors ${theme === 'light' ? 'bg-zinc-100 dark:bg-zinc-800 text-primary dark:text-white font-extrabold' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'}`}
          aria-label="Modo Claro"
          title="Modo Claro"
        >
          <Sun className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme('dark')}
          className={`h-7 w-7 rounded-md transition-colors ${theme === 'dark' ? 'bg-zinc-100 dark:bg-zinc-800 text-primary dark:text-white font-extrabold' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'}`}
          aria-label="Modo Escuro"
          title="Modo Escuro"
        >
          <Moon className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme('contrast')}
          className={`h-7 w-7 rounded-md transition-colors ${theme === 'contrast' ? 'bg-zinc-100 dark:bg-zinc-800 text-primary dark:text-white font-extrabold' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'}`}
          aria-label="Alto Contraste"
          title="Alto Contraste"
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Card className="w-full max-w-4xl border-none shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 grid grid-cols-1 md:grid-cols-12 min-h-[520px] max-h-screen md:max-h-none overflow-y-auto md:overflow-visible">
        <div className="hidden md:flex md:col-span-5 bg-primary p-8 text-white flex-col justify-between items-center text-center relative overflow-hidden md:rounded-l-3xl">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" aria-hidden="true"></div>

          <div className="flex flex-col items-center space-y-2 relative z-10 pt-8">
            <div className="bg-white p-4 rounded-3xl shadow-lg border border-zinc-100 flex items-center justify-center w-28 h-28">
              <img src={logoHospitalDeAmor} alt="Hospital de Amor" className="w-full h-full object-contain" aria-hidden="true" />
            </div>
            <div className="font-comfortaa font-bold text-sm tracking-wider text-white flex items-center select-none uppercase pt-2.5">
              <span>Hospital de Am</span>
              <Heart className="w-3.5 h-3.5 fill-brand-pink text-brand-pink inline mx-0.5" aria-hidden="true" />
              <span>r</span>
            </div>
          </div>

          <div className="space-y-4 relative z-10 my-8">
            <h3 className="text-2xl font-black leading-tight">Cuidar com amor é a nossa vocação.</h3>
            <p className="text-white/80 text-xs leading-relaxed max-w-[200px] mx-auto">
              Acesse seus agendamentos, envie exames preventivos e acompanhe sua triagem em um só lugar.
            </p>
          </div>

          <div className="text-[10px] text-white/50 flex items-center gap-1 relative z-10 pb-4">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Portal Seguro LGPD</span>
          </div>
        </div>

        <div className="md:col-span-7 p-6 md:p-12 flex flex-col justify-center bg-white dark:bg-zinc-900 md:rounded-r-3xl">
          <div className="flex md:hidden items-center gap-3 mb-6">
            <div className="bg-white p-1 rounded-xl flex items-center justify-center shadow-sm border border-zinc-100 w-12 h-12">
              <img src={logoHospitalDeAmor} alt="Hospital de Amor" className="w-full h-full object-contain" aria-hidden="true" />
            </div>
            <div>
              <div className="font-comfortaa font-bold text-xs tracking-wide text-primary flex items-center select-none uppercase">
                <span>Hospital de Am</span>
                <Heart className="w-3 h-3 fill-brand-pink text-brand-pink inline mx-0.5 -mt-0.5" aria-hidden="true" />
                <span>r</span>
              </div>
              <p className="text-[10px] text-zinc-400">{activeRole === 'donor' ? 'Portal do Doador' : 'Portal do Paciente'}</p>
            </div>
          </div>

          {['login', 'register', 'forgot-password'].includes(view) && (
            <div className="flex border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveRole('patient');
                  setError('');
                }}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${
                  activeRole === 'patient'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300'
                }`}
              >
                Portal do Paciente
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRole('donor');
                  setError('');
                }}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${
                  activeRole === 'donor'
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300'
                }`}
              >
                Portal do Doador
              </button>
            </div>
          )}

          {view === 'login' && (
            <LoginForm
              activeRole={activeRole}
              referrerName={referrerName}
              loading={loading}
              error={error}
              blockedSecondsLeft={blockedSecondsLeft}
              onLoginSubmit={handleLoginSubmit}
              onCpfChange={checkCpfBlock}
              onNavigateToRegister={() => navigateToView('register')}
              onNavigateToForgotPassword={() => navigateToView('forgot-password')}
            />
          )}

          {view === 'register' && (
            <RegisterForm
              activeRole={activeRole}
              referrerName={referrerName}
              loading={loading}
              error={error}
              onRegisterSubmit={handleRegisterSubmit}
              onNavigateToLogin={() => navigateToView('login')}
              onCheckCpfExists={handleCheckCpfExists}
              setError={setError}
            />
          )}

          {view === 'forgot-password' && (
            <ForgotPasswordForm
              loading={loading}
              error={error}
              onForgotSubmit={handleForgotSubmit}
              onNavigateToLogin={() => navigateToView('login')}
            />
          )}

          {view === 'recovery-success' && (
            <RecoverySuccessPanel
              maskedEmail={maskedEmail}
              onOpenSimulatedInbox={() => navigateToView('simulated-inbox')}
              onNavigateToLogin={() => navigateToView('login')}
            />
          )}

          {view === 'simulated-inbox' && (
            <SimulatedInboxPanel
              activeRole={activeRole}
              recoveryUser={recoveryUser}
              onNavigateToResetPassword={() => navigateToView('reset-password')}
              onNavigateToRecoverySuccess={() => navigateToView('recovery-success')}
            />
          )}

          {view === 'reset-password' && (
            <ResetPasswordForm
              loading={loading}
              error={error}
              recoveryUserCpf={recoveryUser?.cpf || ''}
              activeRole={activeRole}
              onResetSubmit={handleResetSubmit}
              setError={setError}
            />
          )}

          {view === 'reset-success' && (
            <ResetSuccessPanel
              activeRole={activeRole}
              onNavigateToLogin={() => navigateToView('login')}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
