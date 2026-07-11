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
  AlertCircle, 
  CheckCircle
} from 'lucide-react';
import CollaboratorFormPanel from '../../components/admin/users/CollaboratorFormPanel';
import CollaboratorsTable from '../../components/admin/users/CollaboratorsTable';
import SandboxEmailsViewer from '../../components/admin/users/SandboxEmailsViewer';
import RolesListPanel from '../../components/admin/users/RolesListPanel';
import RoleFormPanel from '../../components/admin/users/RoleFormPanel';
import EmailDetailModal from '../../components/admin/users/EmailDetailModal';
import DeleteRoleBlockedModal from '../../components/admin/users/DeleteRoleBlockedModal';
import { formatCpf } from '../../lib/sanitizer';

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
  const [userToEdit, setUserToEdit] = useState<PatientUser | null>(null);

  const [profileName, setProfileName] = useState('');
  const [profilePermissions, setProfilePermissions] = useState<string[]>([]);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [blockedDeleteRole, setBlockedDeleteRole] = useState<{ roleName: string; users: PatientUser[] } | null>(null);

  const [simulatedEmails, setSimulatedEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadUsers();
    loadCustomRoles();
    loadSimulatedEmails();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedEmail) {
        setSelectedEmail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEmail]);

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

  const handleCollaboratorSubmit = async (
    userData: Omit<PatientUser, 'createdAt'> & { password?: string },
    isEditing: boolean
  ) => {
    setErrorMsg('');
    setSuccessMsg('');

    if (isEditing) {
      try {
        await updateUserAdmin(
          userToEdit!.cpf,
          { 
            name: userData.name, 
            email: userData.email, 
            phone: userData.phone, 
            role: userData.role as any 
          },
          loggedEmployee.cpf,
          loggedEmployee.name
        );
        setSuccessMsg(`Colaborador ${userData.name} atualizado com sucesso.`);
        setIsAdding(false);
        setUserToEdit(null);
        await loadUsers();
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao atualizar colaborador.');
      }
      return;
    }

    if (!userData.password || userData.password.length < 6) {
      setErrorMsg('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    try {
      const newUser: Omit<PatientUser, 'createdAt'> = {
        cpf: userData.cpf,
        name: userData.name,
        birthDate: userData.birthDate,
        email: userData.email,
        phone: userData.phone,
        passwordHash: userData.passwordHash,
        role: userData.role,
        isActive: userData.isActive
      };

      await createUser(newUser);

      const roleLabel = getRoleBadgeLabel(userData.role);
      const emailId = 'email-' + crypto.randomUUID().slice(0, 8);
      const newEmailMsg = {
        id: emailId,
        recipient: userData.email,
        subject: 'Convite de Acesso - Portal Staff Hospital de Amor',
        date: new Date().toLocaleString('pt-BR'),
        body: `Olá, ${userData.name}!\n\nVocê foi convidado a fazer parte da equipe do Hospital de Amor como ${roleLabel}.\n\nSeus dados de acesso temporários são:\nCPF: ${formatCpf(userData.cpf)}\nSenha Provisória: ${userData.password}\n\nPor razões de segurança, altere sua senha no primeiro acesso.`,
        tempPassword: userData.password
      };

      const storedEmails = localStorage.getItem('hospital_amor_simulated_emails');
      const emailList = storedEmails ? JSON.parse(storedEmails) : [];
      emailList.unshift(newEmailMsg);
      localStorage.setItem('hospital_amor_simulated_emails', JSON.stringify(emailList));
      loadSimulatedEmails();

      setSuccessMsg(`Colaborador ${userData.name} registrado com sucesso e convite enviado.`);
      setIsAdding(false);
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

    if (editingProfileId) {
      try {
        await saveCustomRole({
          id: editingProfileId,
          name: profileName.trim(),
          permissions: profilePermissions
        });
        setSuccessMsg(`Perfil "${profileName.trim()}" atualizado com sucesso.`);
        setProfileName('');
        setProfilePermissions([]);
        setEditingProfileId(null);
        await loadCustomRoles();
      } catch (err) {
        console.error(err);
        setErrorMsg('Erro ao salvar perfil customizado.');
      }
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

    const roleObj = customRoles.find(r => r.id === id);
    const roleName = roleObj ? roleObj.name : id;

    const associatedUsers = users.filter(u => u.role === id);
    if (associatedUsers.length > 0) {
      setBlockedDeleteRole({ roleName, users: associatedUsers });
      return;
    }

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

  const staffUsers = users.filter(user => {
    const rolesList = user.role ? user.role.split(',').map(r => r.trim()) : [];
    return rolesList.some(r => ['recepcionista', 'gestor', 'auditor'].includes(r));
  });

  const filteredStaff = staffUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.cpf.includes(searchQuery) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeLabel = (userRole?: string) => {
    if (!userRole) return 'Staff';
    const roles = userRole.split(',').map(r => r.trim());
    const mainRole = roles.find(r => ['recepcionista', 'gestor', 'auditor'].includes(r)) || userRole;
    switch (mainRole) {
      case 'recepcionista':
        return 'Recepcionista';
      case 'gestor':
        return 'Gestor Geral';
      case 'auditor':
        return 'Auditor';
      default:
        const custom = customRoles.find(r => r.id === mainRole);
        return custom ? custom.name : mainRole;
    }
  };

  return (
    <>
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
                setUserToEdit(null);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="inline-flex items-center gap-2 h-10 px-5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-pink-600/15 active:scale-95 shrink-0 self-start"
            >
              <UserPlus className="w-4 h-4" />
              {isAdding || userToEdit ? 'Cancelar Cadastro' : 'Cadastrar Colaborador'}
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
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'colaboradores' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-650 dark:text-zinc-400 hover:bg-zinc-150/40 dark:hover:bg-zinc-900'}`}
          >
            Colaboradores
          </button>
          <button
            onClick={() => {
              setActiveTab('perfis');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${activeTab === 'perfis' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-650 dark:text-zinc-400 hover:bg-zinc-150/40 dark:hover:bg-zinc-900'}`}
          >
            Perfis e Permissões
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 dark:bg-red-955/20 border border-red-200/50 dark:border-red-900/30 text-red-800 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-250/50 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-455 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-3">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {activeTab === 'colaboradores' ? (
          <>
            {(isAdding || userToEdit) && (
              <CollaboratorFormPanel
                userToEdit={userToEdit}
                customRoles={customRoles}
                onSubmit={handleCollaboratorSubmit}
                onCancel={() => {
                  setIsAdding(false);
                  setUserToEdit(null);
                }}
              />
            )}

            <CollaboratorsTable
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredStaff={filteredStaff}
              loggedEmployeeCpf={loggedEmployee.cpf}
              customRoles={customRoles}
              onEdit={(user) => {
                setUserToEdit(user);
                setIsAdding(false);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              onToggleStatus={handleToggleStatus}
            />

            <SandboxEmailsViewer
              simulatedEmails={simulatedEmails}
              onOpenEmail={setSelectedEmail}
            />
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-4">
              <RolesListPanel
                customRoles={customRoles}
                allPermissions={ALL_PERMISSIONS}
                onEditProfile={(roleObj) => {
                  setEditingProfileId(roleObj.id);
                  setProfileName(roleObj.name);
                  setProfilePermissions(roleObj.permissions);
                }}
                onDeleteProfile={handleDeleteProfile}
              />
            </div>

            <RoleFormPanel
              profileName={profileName}
              setProfileName={setProfileName}
              profilePermissions={profilePermissions}
              allPermissions={ALL_PERMISSIONS}
              editingProfileId={editingProfileId}
              onTogglePermission={handleTogglePermission}
              onSubmit={handleSaveProfile}
              onCancel={() => {
                setEditingProfileId(null);
                setProfileName('');
                setProfilePermissions([]);
              }}
            />
          </div>
        )}
      </div>

      <EmailDetailModal
        email={selectedEmail}
        onClose={() => setSelectedEmail(null)}
      />

      <DeleteRoleBlockedModal
        blockedData={blockedDeleteRole}
        onClose={() => setBlockedDeleteRole(null)}
      />
    </>
  );
}
