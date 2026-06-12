import React, { useState, useEffect } from 'react';
import { 
  getAllUsersForAdmin, 
  createUser, 
  updateUserStatusAdmin 
} from '../../services/db';
import type { PatientUser, UserRole } from '../../types';
import { 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  AlertCircle, 
  CheckCircle,
  Users,
  Shield,
  Search
} from 'lucide-react';

interface AdminUsersProps {
  loggedEmployee: PatientUser;
}

export default function AdminUsers({ loggedEmployee }: AdminUsersProps) {
  const [users, setUsers] = useState<PatientUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('recepcionista');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsersForAdmin();
      setUsers(allUsers);
    } catch (e) {
      console.error(e);
    }
  };

  const formatInputCpf = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    let formatted = numeric;
    if (numeric.length > 3) formatted = numeric.slice(0, 3) + '.' + numeric.slice(3);
    if (numeric.length > 6) formatted = formatted.slice(0, 7) + '.' + formatted.slice(7);
    if (numeric.length > 9) formatted = formatted.slice(0, 11) + '-' + formatted.slice(11, 13);
    return formatted.slice(0, 14);
  };

  const handleToggleStatus = async (targetCpf: string, currentActive: boolean) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (targetCpf === loggedEmployee.cpf) {
      setErrorMsg('Ação negada: Você não pode desativar o seu próprio usuário de gestor.');
      return;
    }

    try {
      const nextActiveState = !currentActive;
      await updateUserStatusAdmin(
        targetCpf, 
        nextActiveState, 
        loggedEmployee.cpf, 
        loggedEmployee.name
      );
      setSuccessMsg(`Usuário ${nextActiveState ? 'ativado' : 'desativado'} com sucesso.`);
      await loadUsers();
    } catch (e) {
      console.error(e);
      setErrorMsg('Falha ao alterar o status do usuário.');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanCpf = cpf.replace(/\D/g, '');

    if (!name.trim()) {
      setErrorMsg('Nome é obrigatório.');
      return;
    }
    if (cleanCpf.length !== 11) {
      setErrorMsg('Insira um CPF válido.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Insira um e-mail válido.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMsg('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    try {
      const newUser: Omit<PatientUser, 'createdAt'> = {
        cpf: cleanCpf,
        name: name.trim(),
        birthDate: '1990-01-01',
        email: email.trim(),
        phone: phone.trim() || '(79) 99999-9999',
        passwordHash: password,
        role: role,
        isActive: true
      };

      await createUser(newUser);
      setSuccessMsg(`Colaborador ${name} registrado como ${role} com sucesso.`);
      setIsAdding(false);
      setName('');
      setCpf('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole('recepcionista');
      await loadUsers();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao registrar usuário. CPF já cadastrado.');
    }
  };

  const staffUsers = users.filter(user => 
    user.role === 'recepcionista' || user.role === 'gestor' || user.role === 'auditor'
  );

  const filteredStaff = staffUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.cpf.includes(searchQuery) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeLabel = (userRole?: string) => {
    switch (userRole) {
      case 'recepcionista':
        return 'Recepcionista';
      case 'gestor':
        return 'Gestor';
      case 'auditor':
        return 'Auditor';
      default:
        return 'Staff';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">Gestão da Equipe</h1>
          <p className="text-zinc-500 mt-1 text-sm">Controle de acessos, perfis e credenciais administrativas.</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className="inline-flex items-center gap-2 h-10 px-5 bg-pink-650 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-pink-600/15 active:scale-95 shrink-0 self-start"
        >
          <UserPlus className="w-4 h-4" />
          {isAdding ? 'Cancelar Cadastro' : 'Cadastrar Colaborador'}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-800 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {isAdding && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm animate-in slide-in-from-top-3">
          <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-pink-600" />
            Informações do Novo Colaborador
          </h2>

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="add-name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nome Completo</label>
              <input
                id="add-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Mariana Lemos"
                className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="add-cpf" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">CPF</label>
              <input
                id="add-cpf"
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatInputCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="add-email" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">E-mail</label>
              <input
                id="add-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@hospitalamor.org.br"
                className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="add-phone" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Telefone</label>
              <input
                id="add-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(79) 99999-9999"
                className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="add-pass" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Senha Provisória</label>
              <input
                id="add-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="add-role" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Perfil Funcional</label>
              <select
                id="add-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer"
              >
                <option value="recepcionista">Recepcionista</option>
                <option value="gestor">Gestor Geral</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="h-10 px-5 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-950 dark:text-zinc-300 text-zinc-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-10 px-5 bg-green-650 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-green-600/15"
              >
                Salvar Colaborador
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="max-w-xs relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="py-3 px-4">Nome do Colaborador</th>
                <th className="py-3 px-4">CPF</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 text-xs font-semibold">
                    Nenhum colaborador encontrado na equipe administrativa.
                  </td>
                </tr>
              ) : (
                filteredStaff.map(user => (
                  <tr 
                    key={user.cpf} 
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-xs text-zinc-700 dark:text-zinc-355 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{user.name}</div>
                      {user.cpf === loggedEmployee.cpf && (
                        <span className="text-[9px] text-pink-650 bg-pink-50 dark:bg-pink-950/20 px-1 py-0.5 rounded border border-pink-200/10 font-bold mt-0.5 inline-block">
                          Você (Logado)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono">{user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td>
                    <td className="py-4 px-4">{user.email}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-zinc-800 dark:text-zinc-200">
                        <Shield className="w-3.5 h-3.5 text-pink-600" />
                        {getRoleBadgeLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.isActive !== false ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-200/20' :
                        'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/20'
                      }`}>
                        {user.isActive !== false ? 'Ativo' : 'Desativado'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {user.cpf === loggedEmployee.cpf ? (
                        <span className="text-[10px] text-zinc-400 font-semibold italic">Gestor Geral</span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(user.cpf, user.isActive !== false)}
                          className={`inline-flex items-center gap-1 h-8 px-3 rounded-xl border font-bold transition-all shadow-xs ${
                            user.isActive !== false 
                              ? 'border-red-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-350 text-zinc-650 dark:bg-zinc-950 dark:border-red-950/40 dark:hover:bg-red-950/25 dark:text-red-400' 
                              : 'border-emerald-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-350 text-zinc-650 dark:bg-zinc-950 dark:border-emerald-950/40 dark:hover:bg-emerald-950/25 dark:text-emerald-450'
                          }`}
                        >
                          {user.isActive !== false ? (
                            <>
                              <UserMinus className="w-3.5 h-3.5" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              Reativar
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
