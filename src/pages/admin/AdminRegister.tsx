import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { createUser } from '../../services/db';
import type { PatientUser, UserRole } from '../../types';

interface AdminRegisterProps {
  onNavigate: (hash: string) => void;
}

export default function AdminRegister({ onNavigate }: AdminRegisterProps) {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('recepcionista');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const formatInputCpf = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    let formatted = numeric;
    if (numeric.length > 3) formatted = numeric.slice(0, 3) + '.' + numeric.slice(3);
    if (numeric.length > 6) formatted = formatted.slice(0, 7) + '.' + formatted.slice(7);
    if (numeric.length > 9) formatted = formatted.slice(0, 11) + '-' + formatted.slice(11, 13);
    return formatted.slice(0, 14);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanCpf = cpf.replace(/\D/g, '');

    if (!name.trim()) {
      setErrorMsg('Nome completo é obrigatório.');
      return;
    }
    if (cleanCpf.length !== 11) {
      setErrorMsg('Insira um CPF válido com 11 dígitos.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('E-mail inválido.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMsg('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const newEmployee: Omit<PatientUser, 'createdAt'> = {
        cpf: cleanCpf,
        name: name.trim(),
        birthDate: '1990-01-01',
        email: email.trim(),
        phone: phone.trim() || '(79) 99999-9999',
        passwordHash: password,
        role: role,
        isActive: true
      };

      await createUser(newEmployee);
      setSuccessMsg('Funcionário de teste criado com sucesso!');
      setName('');
      setCpf('');
      setEmail('');
      setPhone('');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao registrar funcionário de teste. Talvez o CPF já exista.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-950/20 text-pink-600 flex items-center justify-center font-black text-xl shadow-inner">
            H
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Criar Conta de Teste</h1>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">Cadastre credenciais fictícias de funcionários para testar permissões.</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-800 dark:text-red-400 rounded-xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-450 rounded-xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="reg-name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Dra. Mariana Reis"
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-cpf" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">CPF</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="reg-cpf"
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
            <label htmlFor="reg-email" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@hospitalamor.org.br"
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-phone" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Telefone (opcional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="reg-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(79) 99999-9999"
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-pass" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="reg-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha de acesso"
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reg-role" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Perfil de Acesso</label>
            <div className="relative flex items-center">
              <Shield className="absolute left-3 w-4 h-4 text-zinc-400" />
              <select
                id="reg-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 transition-all appearance-none cursor-pointer"
                disabled={loading}
              >
                <option value="recepcionista">Recepcionista</option>
                <option value="gestor">Gestor Geral</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold h-11 text-xs rounded-2xl transition-all shadow-sm shadow-pink-600/20 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Cadastrando...' : 'Registrar Funcionário'}
          </button>
        </form>

        <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 text-center">
          <button
            onClick={() => onNavigate('#/login')}
            className="text-xs text-pink-600 hover:underline font-bold"
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    </div>
  );
}
