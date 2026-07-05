import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { formatCpf, validateCpf, formatPhone, sanitizeString } from '../../lib/sanitizer';
import { AlertCircle, Lock, User, Calendar, Mail, Phone, ChevronLeft, Eye, EyeOff, Heart } from 'lucide-react';
import { PasswordStrengthMeter } from '../common/PasswordStrengthMeter';

interface RegisterFormProps {
  activeRole: 'patient' | 'donor';
  referrerName: string | null;
  loading: boolean;
  error: string;
  onRegisterSubmit: (formData: {
    name: string;
    cpf: string;
    birthDate: string;
    email: string;
    phone: string;
    passwordHash: string;
  }) => void;
  onNavigateToLogin: () => void;
  onCheckCpfExists: (cpf: string) => Promise<boolean>;
  setError: (error: string) => void;
}

export default function RegisterForm({
  activeRole,
  referrerName,
  loading,
  error,
  onRegisterSubmit,
  onNavigateToLogin,
  onCheckCpfExists,
  setError,
}: RegisterFormProps) {
  const [regName, setRegName] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regConsent, setRegConsent] = useState(false);

  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [isRegPasswordValid, setIsRegPasswordValid] = useState(false);

  const handleRegCpfBlur = async () => {
    setError('');
    const cleanCpf = regCpf.replace(/\D/g, '');
    if (!cleanCpf) return;

    if (!validateCpf(cleanCpf)) {
      setError('O CPF informado é inválido. Por favor, verifique os dígitos.');
      return;
    }

    const exists = await onCheckCpfExists(cleanCpf);
    if (exists) {
      setError('Este CPF já está cadastrado');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = sanitizeString(regName);
    if (!cleanName) {
      setError('Por favor, insira o seu nome completo.');
      return;
    }

    const cleanCpf = regCpf.replace(/\D/g, '');
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

    if (!isRegPasswordValid) {
      setError('A senha criada não atende aos requisitos mínimos de segurança.');
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

    onRegisterSubmit({
      name: cleanName,
      cpf: cleanCpf,
      birthDate: regBirthDate,
      email: regEmail,
      phone: regPhone,
      passwordHash: regPassword,
    });
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
        <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          {activeRole === 'donor' ? 'Cadastro de Doador' : 'Criar Cadastro'}
        </h1>
        <p className="text-zinc-500 text-xs">
          {activeRole === 'donor'
            ? 'Preencha com seus dados para iniciar sua jornada de apoio.'
            : 'Preencha com seus dados para liberar o primeiro acesso.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50/10 border border-red-200/80 text-red-500 text-xs font-semibold rounded-xl flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="regName" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nome Completo
            </Label>
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
            <Label htmlFor="regCpf" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              CPF
            </Label>
            <div className="relative">
              <Input
                id="regCpf"
                type="text"
                placeholder="000.000.000-00"
                value={formatCpf(regCpf)}
                onChange={(e) => setRegCpf(e.target.value)}
                onBlur={handleRegCpfBlur}
                maxLength={14}
                className="pl-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
              />
              <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="regBirth" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nascimento
            </Label>
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
            <Label htmlFor="regEmail" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              E-mail
            </Label>
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
            <Label htmlFor="regPhone" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Telefone
            </Label>
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
            <Label htmlFor="regPass" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="regPass"
                type={showRegPassword ? 'text' : 'password'}
                placeholder="Crie sua senha"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="pl-9 pr-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <button
                type="button"
                onClick={() => setShowRegPassword(!showRegPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-650 focus:outline-none"
                aria-label={showRegPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="regConfirm" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Confirmar Senha
            </Label>
            <div className="relative">
              <Input
                id="regConfirm"
                type={showRegConfirmPassword ? 'text' : 'password'}
                placeholder="Confirme sua senha"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                className="pl-9 pr-9 h-10 border-zinc-200 focus-visible:ring-primary dark:border-zinc-800 rounded-xl text-xs"
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <button
                type="button"
                onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-650 focus:outline-none"
                aria-label={showRegConfirmPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {regPassword && (
            <div className="sm:col-span-2">
              <PasswordStrengthMeter password={regPassword} onValidityChange={setIsRegPasswordValid} />
            </div>
          )}
        </div>

        <div className="flex gap-2.5 items-start p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200/50 dark:border-zinc-800 mt-2">
          <Checkbox
            id="regConsent"
            checked={regConsent}
            onCheckedChange={(checked) => setRegConsent(checked === true)}
            className="mt-0.5 focus-visible:ring-primary border-zinc-300"
          />
          <Label htmlFor="regConsent" className="text-[10px] text-zinc-550 dark:text-zinc-400 leading-normal cursor-pointer select-none">
            {activeRole === 'donor'
              ? 'Estou ciente e aceito que meus dados cadastrais sejam tratados pelo hospital estritamente para processamento de doações e relacionamento institucional, conforme a LGPD.'
              : 'Estou ciente e aceito que meus dados cadastrais e exames sejam tratados pelo hospital estritamente para fins de triagem de agendamento, conforme a LGPD.'}
          </Label>
        </div>

        <Button
          type="submit"
          disabled={loading || !isRegPasswordValid || !regConsent}
          className="w-full bg-brand-pink hover:bg-brand-pink/95 text-white font-bold h-11 rounded-2xl shadow-lg shadow-brand-pink/20 text-xs transition-transform active:scale-[0.98] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Criando Conta...' : 'Criar Conta'}
        </Button>
      </form>
    </div>
  );
}
