import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { formatCpf, validateCpf, formatPhone, sanitizeString } from '../lib/sanitizer';
import { AlertCircle, Lock, ShieldCheck, User, Calendar, Mail, Phone, ChevronLeft, CheckCircle2, Heart } from 'lucide-react';
import { authenticateUser, createUser, getUserByCpf, updateUserPassword } from '../services/db';
import type { PatientUser } from '../types';
import logoHospitalDeAmor from '../assets/logoHospitalDeAmor.png';

interface LoginProps {
  onLoginSuccess: (cpf: string) => void;
}

type LoginView = 'login' | 'register' | 'forgot-password' | 'recovery-success' | 'simulated-inbox' | 'reset-password' | 'reset-success' | 'donor-coming-soon';

export default function Login({ onLoginSuccess }: LoginProps) {
  const [view, setView] = useState<LoginView>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regConsent, setRegConsent] = useState(false);

  const [forgotCpf, setForgotCpf] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [recoveryUser, setRecoveryUser] = useState<PatientUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCpf = cpf.replace(/\D/g, "");
    if (!cleanCpf) {
      setError('Por favor, insira o seu CPF.');
      return;
    }

    if (!validateCpf(cleanCpf)) {
      setError('O CPF informado é inválido. Por favor, verifique os dígitos.');
      return;
    }

    if (!password) {
      setError('Por favor, insira a sua senha de acesso.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const authenticatedUser = await authenticateUser(cleanCpf, password);
      setLoading(false);
      if (authenticatedUser) {
        onLoginSuccess(authenticatedUser.cpf === '12345678900' ? '123.456.789-00' : formatCpf(authenticatedUser.cpf));
      } else {
        setError('CPF não cadastrado ou senha incorreta. Verifique suas credenciais.');
      }
    } catch (err: any) {
      setLoading(false);
      setError('Ocorreu um erro ao realizar o login. Tente novamente.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = sanitizeString(regName);
    if (!cleanName) {
      setError('Por favor, insira o seu nome completo.');
      return;
    }

    const cleanCpf = regCpf.replace(/\D/g, "");
    if (!cleanCpf) {
      setError('Por favor, insira o seu CPF.');
      return;
    }

    if (!validateCpf(cleanCpf)) {
      setError('O CPF informado é inválido.');
      return;
    }

    if (!regBirthDate) {
      setError('Por favor, informe sua data de nascimento.');
      return;
    }

    if (!regEmail.trim()) {
      setError('Por favor, insira o seu e-mail.');
      return;
    }

    if (!regPhone.trim()) {
      setError('Por favor, insira o seu telefone.');
      return;
    }

    if (!regPassword) {
      setError('Por favor, crie uma senha de acesso.');
      return;
    }

    if (regPassword.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('As senhas informadas não coincidem.');
      return;
    }

    if (!regConsent) {
      setError('Você deve aceitar a declaração de consentimento de dados.');
      return;
    }

    setLoading(true);
    try {
      await createUser({
        cpf: cleanCpf,
        name: cleanName,
        birthDate: regBirthDate,
        email: regEmail,
        phone: regPhone,
        passwordHash: regPassword
      });
      setLoading(false);
      onLoginSuccess(formatCpf(cleanCpf));
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Erro ao realizar cadastro.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCpf = forgotCpf.replace(/\D/g, "");
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
      const maskedName = name.length > 3 
        ? name.slice(0, 2) + '*'.repeat(name.length - 4) + name.slice(-2) 
        : name.slice(0, 1) + '*'.repeat(name.length - 1);
      
      setMaskedEmail(`${maskedName}@${domain}`);
      setView('recovery-success');
    } catch (err: any) {
      setLoading(false);
      setError('Erro ao processar solicitação.');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recoveryUser) {
      setError('Erro de sessão de recuperação.');
      return;
    }

    if (!newPassword) {
      setError('Por favor, digite a nova senha.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await updateUserPassword(recoveryUser.cpf, newPassword);
      setLoading(false);
      setView('reset-success');
    } catch (err: any) {
      setLoading(false);
      setError('Erro ao atualizar a senha.');
    }
  };

  const navigateToView = (newView: LoginView) => {
    setError('');
    setView(newView);
  };


  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
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
              <p className="text-[10px] text-zinc-400">Portal do Paciente</p>
            </div>
          </div>

          {['login', 'register', 'forgot-password', 'donor-coming-soon'].includes(view) && (
            <div className="flex border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <button
                type="button"
                onClick={() => navigateToView('login')}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${
                  view !== 'donor-coming-soon'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                Portal do Paciente
              </button>
              <button
                type="button"
                onClick={() => navigateToView('donor-coming-soon')}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${
                  view === 'donor-coming-soon'
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                Portal do Doador
              </button>
            </div>
          )}

          {view === 'donor-coming-soon' && (
            <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <Heart className="w-8 h-8 fill-secondary/20" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-comfortaa font-bold tracking-tight text-zinc-900 dark:text-zinc-50 uppercase">
                    Portal do Doador
                  </h1>
                  <p className="text-xs font-semibold text-secondary uppercase tracking-widest">
                    Em Breve / Em Desenvolvimento
                  </p>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-md">
                  A ala exclusiva para doadores e parceiros do Hospital de Amor está sendo construída.
                  Neste espaço, você poderá realizar doações de forma rápida via Pix, Cartão ou Criptomoedas,
                  acompanhar seu nível de doador (Bronze, Prata e Ouro), acumular pontos de fidelidade e
                  enviar mensagens de apoio que serão transmitidas diretamente no hospital.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-center">
                <Button
                  onClick={() => navigateToView('login')}
                  className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-6 rounded-2xl shadow-lg shadow-primary/20 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Voltar para o Portal do Paciente
                </Button>
              </div>
            </div>
          )}

          {view === 'login' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Portal do Paciente</h1>
                <p className="text-zinc-500 text-sm">Insira suas credenciais de acesso para entrar no painel.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-2xl flex gap-2.5 items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="font-semibold text-zinc-700 dark:text-zinc-300">CPF do Paciente</Label>
                    <div className="relative">
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={formatCpf(cpf)}
                        onChange={(e) => setCpf(e.target.value)}
                        maxLength={14}
                        className="pl-10 h-11 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl"
                      />
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="font-semibold text-zinc-700 dark:text-zinc-300">Senha de Acesso</Label>
                      <Button variant="link" type="button" onClick={() => navigateToView('forgot-password')} className="text-primary text-xs p-0 h-auto font-semibold">
                        Esqueceu a senha?
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="Digite sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-11 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl"
                      />
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-12 rounded-2xl shadow-lg shadow-brand-pink/20 text-sm transition-transform active:scale-[0.98]"
                >
                  {loading ? 'Entrando...' : 'Entrar no Portal'}
                </Button>
              </form>

              <div className="text-center text-xs text-zinc-400 pt-2">
                <span>Ainda não tem acesso? </span>
                <Button variant="link" type="button" onClick={() => navigateToView('register')} className="text-primary font-bold p-0 h-auto">
                  Cadastre-se aqui
                </Button>
              </div>
            </div>
          )}

          {view === 'register' && (
            <div className="space-y-6">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="Voltar ao login" onClick={() => navigateToView('login')} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                  <ChevronLeft className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                </Button>
                <span className="text-xs font-semibold text-zinc-500">Voltar ao Login</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Criar Cadastro</h1>
                <p className="text-zinc-500 text-xs">Preencha com seus dados para liberar o primeiro acesso.</p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="regName" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nome Completo</Label>
                    <div className="relative">
                      <Input
                        id="regName"
                        type="text"
                        placeholder="Nome completo"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="pl-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
                      />
                      <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="regCpf" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">CPF</Label>
                    <div className="relative">
                      <Input
                        id="regCpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={formatCpf(regCpf)}
                        onChange={(e) => setRegCpf(e.target.value)}
                        maxLength={14}
                        className="pl-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
                      />
                      <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="regBirth" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nascimento</Label>
                    <div className="relative">
                      <Input
                        id="regBirth"
                        type="date"
                        value={regBirthDate}
                        onChange={(e) => setRegBirthDate(e.target.value)}
                        className="pl-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
                      />
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="regEmail" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">E-mail</Label>
                    <div className="relative">
                      <Input
                        id="regEmail"
                        type="email"
                        placeholder="exemplo@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
                      />
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="regPhone" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Telefone</Label>
                    <div className="relative">
                      <Input
                        id="regPhone"
                        type="text"
                        placeholder="(79) 99999-9999"
                        value={formatPhone(regPhone)}
                        onChange={(e) => setRegPhone(e.target.value)}
                        maxLength={15}
                        className="pl-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
                      />
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="regPass" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="regPass"
                        type="password"
                        placeholder="Crie sua senha"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="pl-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
                      />
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="regConfirm" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Confirmar Senha</Label>
                    <div className="relative">
                      <Input
                        id="regConfirm"
                        type="password"
                        placeholder="Confirme sua senha"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="pl-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
                      />
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200/50 dark:border-zinc-800 mt-2">
                  <Checkbox
                    id="regConsent"
                    checked={regConsent}
                    onCheckedChange={(checked) => setRegConsent(checked === true)}
                    className="mt-0.5 focus-visible:ring-primary border-zinc-300"
                  />
                  <Label htmlFor="regConsent" className="text-[10px] text-zinc-500 leading-normal cursor-pointer">
                    Estou ciente e aceito que meus dados cadastrais e exames sejam tratados pelo hospital estritamente para fins de triagem de agendamento, conforme a LGPD.
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform active:scale-[0.98] mt-2"
                >
                  {loading ? 'Criando Conta...' : 'Criar Conta'}
                </Button>
              </form>
            </div>
          )}

          {view === 'forgot-password' && (
            <div className="space-y-6">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="Voltar ao login" onClick={() => navigateToView('login')} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                  <ChevronLeft className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                </Button>
                <span className="text-xs font-semibold text-zinc-500">Voltar ao Login</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Esqueci a Senha</h1>
                <p className="text-zinc-500 text-sm">Informe seu CPF. Um link de redefinição será enviado para o e-mail cadastrado.</p>
              </div>

              <form onSubmit={handleForgotSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-2xl flex gap-2.5 items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="forgotCpf" className="font-semibold text-zinc-700 dark:text-zinc-300">CPF cadastrado</Label>
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
          )}

          {view === 'recovery-success' && (
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
                  onClick={() => navigateToView('simulated-inbox')}
                  className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform active:scale-[0.98]"
                >
                  Abrir Simulador de E-mail
                </Button>
                <Button
                  type="button"
                  onClick={() => navigateToView('login')}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 font-semibold h-11 rounded-2xl shadow-sm text-xs"
                >
                  Voltar ao Login
                </Button>
              </div>
            </div>
          )}

          {view === 'simulated-inbox' && (
            <div className="space-y-6">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" aria-label="Voltar à confirmação de e-mail" onClick={() => navigateToView('recovery-success')} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                  <ChevronLeft className="w-4 h-4 text-zinc-500" aria-hidden="true" />
                </Button>
                <span className="text-xs font-semibold text-zinc-500">Voltar à Confirmação</span>
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Caixa de Entrada (Simulador)</h1>
                <p className="text-zinc-500 text-[11px]">Esta é uma simulação segura do e-mail de recuperação que foi enviado para a sua conta.</p>
              </div>

              <Card className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-md">
                <div className="bg-zinc-50 dark:bg-zinc-900/80 px-4 py-3 border-b border-zinc-200/60 dark:border-zinc-800 flex flex-col gap-1 text-[11px] text-zinc-500">
                  <div><strong className="text-zinc-700 dark:text-zinc-300">De:</strong> suporte@hospitalamor.org (Hospital de Amor)</div>
                  <div><strong className="text-zinc-700 dark:text-zinc-300">Para:</strong> {recoveryUser?.email}</div>
                  <div><strong className="text-zinc-700 dark:text-zinc-300">Assunto:</strong> Redefinição de Senha - Portal do Paciente</div>
                </div>
                <div className="p-6 bg-white dark:bg-zinc-950 flex flex-col items-center text-center space-y-4 text-xs">
                  <div className="bg-white p-1.5 rounded-xl flex items-center justify-center shadow-sm border border-zinc-100 w-12 h-12">
                    <img src={logoHospitalDeAmor} alt="Hospital de Amor" className="w-full h-full object-contain" aria-hidden="true" />
                  </div>
                  <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Recuperação de Senha</h2>
                  <p className="text-zinc-500 leading-relaxed max-w-sm">
                    Olá, <strong>{recoveryUser?.name}</strong>. Recebemos uma solicitação para redefinir a senha do seu Portal do Paciente (Hospital de Amor). Clique no botão abaixo para criar uma nova senha:
                  </p>
                  <Button
                    type="button"
                    onClick={() => navigateToView('reset-password')}
                    className="bg-primary hover:bg-primary/95 text-white font-bold px-6 h-10 rounded-xl shadow-md text-xs transition-transform active:scale-[0.98]"
                  >
                    Redefinir Minha Senha
                  </Button>
                  <p className="text-[10px] text-zinc-400">
                    Se você não solicitou essa redefinição, apenas desconsidere este e-mail. Seus dados continuam protegidos conforme a LGPD.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {view === 'reset-password' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Definir Nova Senha</h1>
                <p className="text-zinc-500 text-xs">Crie uma nova senha de acesso forte para o paciente com o CPF {formatCpf(recoveryUser?.cpf || '')}.</p>
              </div>

              <form onSubmit={handleResetSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Digite a nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
                      />
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmNewPassword" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        placeholder="Confirme a nova senha"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="pl-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
                      />
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform active:scale-[0.98]"
                >
                  {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                </Button>
              </form>
            </div>
          )}

          {view === 'reset-success' && (
            <div className="space-y-6 text-center flex flex-col items-center">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-full border border-green-200/50 dark:border-green-800/30">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Senha Alterada!</h1>
                <p className="text-zinc-500 text-xs max-w-sm mx-auto leading-relaxed">
                  Sua nova senha foi salva no banco de dados local com sucesso. Agora você já pode retornar à tela de login e acessar o Portal do Paciente.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => {
                  setNewPassword('');
                  setConfirmNewPassword('');
                  navigateToView('login');
                }}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold h-11 rounded-2xl shadow-sm text-xs mt-2"
              >
                Ir para o Login
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
