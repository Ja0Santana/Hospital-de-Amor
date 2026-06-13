import React, { useState, useEffect } from 'react';
import { 
  getAllUsersForAdmin, 
  createUser, 
  updateUserStatusAdmin,
  updateUserAdmin,
  getCustomRoles,
  saveCustomRole,
  deleteCustomRole
} from '../../services/db';
import type { PatientUser, CustomRole } from '../../types';
import { 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  AlertCircle, 
  CheckCircle,
  Users,
  Shield,
  Search,
  Edit2,
  Mail,
  Trash2,
  X
} from 'lucide-react';

interface AdminUsersProps {
  loggedEmployee: PatientUser;
}

const ALL_PERMISSIONS = [
  { id: 'view_appointments', label: 'Acessar Triagem' },
  { id: 'confirm_appointments', label: 'Confirmar Agendamentos' },
  { id: 'manage_config', label: 'Configurações do Hospital' },
  { id: 'manage_users', label: 'Gestão de Equipe' },
  { id: 'view_audit', label: 'Logs de Auditoria' }
];

export default function AdminUsers({ loggedEmployee }: AdminUsersProps) {
  const [activeTab, setActiveTab] = useState<'colaboradores' | 'perfis'>('colaboradores');
  const [users, setUsers] = useState<PatientUser[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCpf, setEditingCpf] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('recepcionista');

  const [profileName, setProfileName] = useState('');
  const [profilePermissions, setProfilePermissions] = useState<string[]>([]);

  const [simulatedEmails, setSimulatedEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadUsers();
    loadCustomRoles();
    loadSimulatedEmails();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsersForAdmin();
      setUsers(allUsers);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCustomRoles = async () => {
    try {
      const roles = await getCustomRoles();
      setCustomRoles(roles);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSimulatedEmails = () => {
    const stored = localStorage.getItem('hospital_amor_simulated_emails');
    setSimulatedEmails(stored ? JSON.parse(stored) : []);
  };

  const formatInputCpf = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    let formatted = numeric;
    if (numeric.length > 3) formatted = numeric.slice(0, 3) + '.' + numeric.slice(3);
    if (numeric.length > 6) formatted = formatted.slice(0, 7) + '.' + formatted.slice(7);
    if (numeric.length > 9) formatted = formatted.slice(0, 11) + '-' + formatted.slice(11, 13);
    return formatted.slice(0, 14);
  };

  const clearForm = () => {
    setName('');
    setCpf('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('recepcionista');
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

  const handleStartEdit = (user: PatientUser) => {
    setIsEditing(true);
    setEditingCpf(user.cpf);
    setName(user.name);
    setCpf(user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
    setEmail(user.email);
    setPhone(user.phone || '');
    setPassword('');
    setRole(user.role || 'recepcionista');
    setIsAdding(true);
    setErrorMsg('');
    setSuccessMsg('');
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

    if (isEditing) {
      try {
        await updateUserAdmin(
          editingCpf,
          { 
            name: name.trim(), 
            email: email.trim(), 
            phone: phone.trim(), 
            role: role as any 
          },
          loggedEmployee.cpf,
          loggedEmployee.name
        );
        setSuccessMsg(`Colaborador ${name} atualizado com sucesso.`);
        setIsAdding(false);
        setIsEditing(false);
        setEditingCpf('');
        clearForm();
        await loadUsers();
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao atualizar colaborador.');
      }
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
        role: role as any,
        isActive: true
      };

      await createUser(newUser);

      const roleLabel = getRoleBadgeLabel(role);
      const emailId = 'email-' + crypto.randomUUID().slice(0, 8);
      const newEmailMsg = {
        id: emailId,
        recipient: email.trim(),
        subject: 'Convite de Acesso - Portal Staff Hospital de Amor',
        date: new Date().toLocaleString('pt-BR'),
        body: `Olá, ${name.trim()}!\n\nVocê foi convidado a fazer parte da equipe do Hospital de Amor como ${roleLabel}.\n\nSeus dados de acesso temporários são:\nCPF: ${cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}\nSenha Provisória: ${password}\n\nPor razões de segurança, altere sua senha no primeiro acesso.`,
        tempPassword: password
      };

      const storedEmails = localStorage.getItem('hospital_amor_simulated_emails');
      const emailList = storedEmails ? JSON.parse(storedEmails) : [];
      emailList.unshift(newEmailMsg);
      localStorage.setItem('hospital_amor_simulated_emails', JSON.stringify(emailList));
      loadSimulatedEmails();

      setSuccessMsg(`Colaborador ${name} registrado com sucesso e convite enviado.`);
      setIsAdding(false);
      clearForm();
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar usuário. CPF ou e-mail já cadastrado.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!profileName.trim()) {
      setErrorMsg('Nome do perfil é obrigatório.');
      return;
    }

    if (profilePermissions.length === 0) {
      setErrorMsg('Selecione pelo menos uma permissão.');
      return;
    }

    const roleId = 'custom-' + profileName.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (roleId === 'gestor' || roleId === 'recepcionista' || roleId === 'auditor') {
      setErrorMsg('Este nome entra em conflito com um perfil padrão.');
      return;
    }

    try {
      const existing = await getCustomRoles();
      if (existing.some(r => r.id === roleId)) {
        setErrorMsg('Já existe um perfil cadastrado com esse nome.');
        return;
      }

      await saveCustomRole({
        id: roleId,
        name: profileName.trim(),
        permissions: profilePermissions
      });

      setSuccessMsg(`Perfil "${profileName.trim()}" criado com sucesso.`);
      setProfileName('');
      setProfilePermissions([]);
      await loadCustomRoles();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar perfil customizado.');
    }
  };

  const handleDeleteProfile = async (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await deleteCustomRole(id);
      setSuccessMsg('Perfil removido com sucesso.');
      await loadCustomRoles();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao remover perfil.');
    }
  };

  const handleTogglePermission = (permId: string) => {
    setProfilePermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const staffUsers = users.filter(user => 
    user.role !== 'patient' && user.role !== 'donor' && user.role !== 'both'
  );

  const filteredStaff = staffUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.cpf.includes(searchQuery) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeLabel = (userRole?: string) => {
    if (!userRole) return 'Staff';
    switch (userRole) {
      case 'recepcionista':
        return 'Recepcionista';
      case 'gestor':
        return 'Gestor Geral';
      case 'auditor':
        return 'Auditor';
      default:
        const custom = customRoles.find(r => r.id === userRole);
        return custom ? custom.name : userRole;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight font-sans">Gestão da Equipe</h1>
          <p className="text-zinc-500 mt-1 text-sm">Controle de acessos, perfis e credenciais administrativas.</p>
        </div>
        {activeTab === 'colaboradores' && (
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setIsEditing(false);
              clearForm();
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="inline-flex items-center gap-2 h-10 px-5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-pink-600/15 active:scale-95 shrink-0 self-start"
          >
            <UserPlus className="w-4 h-4" />
            {isAdding ? 'Cancelar Cadastro' : 'Cadastrar Colaborador'}
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          onClick={() => {
            setActiveTab('colaboradores');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'colaboradores' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-150/40 dark:hover:bg-zinc-900'}`}
        >
          Colaboradores
        </button>
        <button
          onClick={() => {
            setActiveTab('perfis');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'perfis' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-150/40 dark:hover:bg-zinc-900'}`}
        >
          Perfis e Permissões
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 text-red-800 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-450 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'colaboradores' ? (
        <>
          {isAdding && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm animate-in slide-in-from-top-3">
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-pink-600" />
                {isEditing ? 'Editar Colaborador' : 'Informações do Novo Colaborador'}
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
                    disabled={isEditing}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 disabled:opacity-50"
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

                {!isEditing && (
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
                )}

                <div className="space-y-1.5">
                  <label htmlFor="add-role" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Perfil Funcional</label>
                  <select
                    id="add-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 cursor-pointer"
                  >
                    <option value="recepcionista">Recepcionista</option>
                    <option value="gestor">Gestor Geral</option>
                    <option value="auditor">Auditor</option>
                    {customRoles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setIsEditing(false);
                      clearForm();
                    }}
                    className="h-10 px-5 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-955 dark:text-zinc-300 text-zinc-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-green-600/15"
                  >
                    Salvar Colaborador
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="max-w-xs relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-455" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
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
                            <span className="text-[9px] text-pink-600 bg-pink-50 dark:bg-pink-950/20 px-1 py-0.5 rounded border border-pink-200/10 font-bold mt-0.5 inline-block">
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
                        <td className="py-4 px-4">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => handleStartEdit(user)}
                              className="inline-flex items-center gap-1 h-8 px-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-650 dark:bg-zinc-950 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-300 font-bold text-xs transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Editar
                            </button>
                            
                            {user.cpf === loggedEmployee.cpf ? (
                              <span className="text-[10px] text-zinc-400 font-semibold italic w-[86px] text-center">Gestor Geral</span>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(user.cpf, user.isActive !== false)}
                                className={`inline-flex items-center gap-1 h-8 px-3 rounded-xl border font-bold transition-all shadow-xs ${
                                  user.isActive !== false 
                                    ? 'border-red-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-350 text-zinc-650 dark:bg-zinc-950 dark:border-red-950/40 dark:hover:bg-red-950/25 dark:text-red-450' 
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
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Mail className="w-4 h-4 text-pink-600" />
              Sandbox Inbox - E-mails de Convite Enviados
            </h2>
            {simulatedEmails.length === 0 ? (
              <p className="text-xs text-zinc-550 italic">Nenhum e-mail de convite enviado nesta sessão de testes.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {simulatedEmails.map(email => (
                  <div 
                    key={email.id} 
                    className="p-3 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 flex items-center justify-between text-xs cursor-pointer hover:bg-zinc-100/30 dark:hover:bg-zinc-900/40 transition-colors"
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{email.subject}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Para: {email.recipient} | Enviado em: {email.date}</div>
                    </div>
                    <button 
                      className="px-2.5 py-1 bg-pink-50 text-pink-600 hover:bg-pink-100 dark:bg-pink-950/20 dark:text-pink-400 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Abrir E-mail
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Shield className="w-4 h-4 text-pink-600" />
                Perfis e Acessos
              </h2>
              <div className="space-y-4 divide-y divide-zinc-150 dark:divide-zinc-800">
                <div className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50">Gestor Geral (Padrão)</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200/40 dark:border-zinc-700/50">Sistema</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_PERMISSIONS.map(p => (
                      <span key={p.id} className="px-2 py-0.5 bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 border border-pink-200/10 rounded-full text-[9px] font-extrabold">
                        {p.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50">Recepcionista (Padrão)</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200/40 dark:border-zinc-700/50">Sistema</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_PERMISSIONS.filter(p => p.id === 'view_appointments' || p.id === 'confirm_appointments').map(p => (
                      <span key={p.id} className="px-2 py-0.5 bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 border border-pink-200/10 rounded-full text-[9px] font-extrabold">
                        {p.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50">Auditor (Padrão)</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200/40 dark:border-zinc-700/50">Sistema</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_PERMISSIONS.filter(p => p.id === 'view_appointments' || p.id === 'view_audit').map(p => (
                      <span key={p.id} className="px-2 py-0.5 bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 border border-pink-200/10 rounded-full text-[9px] font-extrabold">
                        {p.label}
                      </span>
                    ))}
                  </div>
                </div>

                {customRoles.map(role => (
                  <div key={role.id} className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50">{role.name}</span>
                      <button 
                        onClick={() => handleDeleteProfile(role.id)}
                        className="p-1 text-zinc-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Excluir Perfil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map(pId => {
                        const info = ALL_PERMISSIONS.find(p => p.id === pId);
                        return (
                          <span key={pId} className="px-2 py-0.5 bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 border border-pink-200/10 rounded-full text-[9px] font-extrabold">
                            {info ? info.label : pId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-pink-600" />
              Criar Perfil Personalizado
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="role-name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nome do Perfil</label>
                <input
                  id="role-name"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Ex: Auxiliar Técnico"
                  className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Permissões de Acesso</label>
                <div className="space-y-2 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl">
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p.id} className="flex items-center gap-3 cursor-pointer select-none py-1">
                      <input
                        type="checkbox"
                        checked={profilePermissions.includes(p.id)}
                        onChange={() => handleTogglePermission(p.id)}
                        className="rounded border-zinc-350 dark:border-zinc-800 text-pink-600 focus:ring-pink-500 h-3.5 w-3.5"
                      />
                      <span className="text-xs text-zinc-750 dark:text-zinc-250 font-semibold">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-2xl transition-all shadow-sm shadow-pink-600/20 active:scale-[0.98]"
              >
                Criar Perfil
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedEmail && (
        <div className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in scale-in">
            <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/40">
              <div>
                <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-xs">Visualização de Sandbox Inbox</h3>
                <span className="text-[10px] text-zinc-400 mt-0.5">Simulação de e-mail transacional do sistema</span>
              </div>
              <button 
                onClick={() => setSelectedEmail(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-450 dark:text-zinc-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-left">
              <div className="text-xs space-y-1.5 text-zinc-500 border-b border-zinc-150 dark:border-zinc-800 pb-3">
                <div><strong>Destinatário:</strong> {selectedEmail.recipient}</div>
                <div><strong>Assunto:</strong> {selectedEmail.subject}</div>
                <div><strong>Data:</strong> {selectedEmail.date}</div>
              </div>
              <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                {selectedEmail.body}
              </div>
            </div>
            <div className="px-6 py-3.5 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-150 dark:border-zinc-800 text-right">
              <button
                onClick={() => setSelectedEmail(null)}
                className="h-9 px-4 bg-zinc-200 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
              >
                Fechar Leitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
