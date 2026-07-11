
import { useState } from 'react';
import { Search, Shield, Edit2, UserMinus, UserCheck, Trash2 } from 'lucide-react';
import type { PatientUser, CustomRole } from '../../../types';

interface CollaboratorsTableProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filteredStaff: PatientUser[];
  loggedEmployeeCpf: string;
  customRoles: CustomRole[];
  onEdit: (user: PatientUser) => void;
  onToggleStatus: (cpf: string, currentActive: boolean) => Promise<void>;
  onDelete: (cpf: string, name: string) => Promise<void>;
}

export default function CollaboratorsTable({
  searchQuery,
  setSearchQuery,
  filteredStaff,
  loggedEmployeeCpf,
  customRoles,
  onEdit,
  onToggleStatus,
  onDelete,
}: CollaboratorsTableProps) {
  const [confirmDeleteCpf, setConfirmDeleteCpf] = useState<string | null>(null);
  const getRoleBadgeLabel = (userRole?: string) => {
    if (!userRole) {
      return 'Staff';
    }
    const roles = userRole.split(',').map((r) => r.trim());
    const mainRole = roles.find((r) => ['recepcionista', 'gestor', 'auditor'].includes(r)) || userRole;
    switch (mainRole) {
      case 'recepcionista':
        return 'Recepcionista';
      case 'gestor':
        return 'Gestor Geral';
      case 'auditor':
        return 'Auditor';
      default:
        const custom = customRoles.find((r) => r.id === mainRole);
        return custom ? custom.name : mainRole;
    }
  };

  return (
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
        <table className="w-full text-left border-collapse hidden md:table">
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
              filteredStaff.map((user) => (
                <tr
                  key={user.cpf}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 text-xs text-zinc-700 dark:text-zinc-355 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{user.name}</div>
                    {user.cpf === loggedEmployeeCpf && (
                      <span className="text-[9px] text-pink-600 bg-pink-50 dark:bg-pink-950/20 px-1 py-0.5 rounded border border-pink-200/10 font-bold mt-0.5 inline-block">
                        Você (Logado)
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-mono">
                    {user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                  </td>
                  <td className="py-4 px-4">{user.email}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-zinc-800 dark:text-zinc-200">
                      <Shield className="w-3.5 h-3.5 text-pink-600" />
                      {getRoleBadgeLabel(user.role)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        user.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-450 border border-emerald-200/20'
                          : 'bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400 border border-red-200/20'
                      }`}
                    >
                      {user.isActive !== false ? 'Ativo' : 'Desativado'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => onEdit(user)}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-650 dark:bg-zinc-955 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-300 font-bold text-xs transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </button>

                      {user.cpf === loggedEmployeeCpf ? (
                        <span className="text-[10px] text-zinc-400 font-semibold italic w-[86px] text-center">
                          Gestor Geral
                        </span>
                      ) : (
                        <button
                          onClick={() => onToggleStatus(user.cpf, user.isActive !== false)}
                          className={`inline-flex items-center gap-1 h-8 px-3 rounded-xl border font-bold transition-all shadow-xs ${
                            user.isActive !== false
                              ? 'border-red-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-350 text-zinc-650 dark:bg-zinc-955 dark:border-red-955/40 dark:hover:bg-red-955/25 dark:text-red-450'
                              : 'border-emerald-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-350 text-zinc-650 dark:bg-zinc-955 dark:border-emerald-955/40 dark:hover:bg-emerald-955/25 dark:text-emerald-450'
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

                      {user.cpf !== loggedEmployeeCpf && (
                        confirmDeleteCpf === user.cpf ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={async () => { await onDelete(user.cpf, user.name); setConfirmDeleteCpf(null); }}
                              className="inline-flex items-center gap-1 h-8 px-3 rounded-xl border border-red-300 bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteCpf(null)}
                              className="inline-flex items-center h-8 px-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 dark:bg-zinc-955 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-400 font-bold text-xs transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteCpf(user.cpf)}
                            className="inline-flex items-center gap-1 h-8 px-3 rounded-xl border border-red-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-350 text-zinc-650 dark:bg-zinc-955 dark:border-red-955/40 dark:hover:bg-red-955/25 dark:text-red-450 font-bold text-xs transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remover
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="block md:hidden space-y-4">
          {filteredStaff.length === 0 ? (
            <div className="py-8 text-center text-zinc-550 text-xs font-semibold">
              Nenhum colaborador encontrado na equipe administrativa.
            </div>
          ) : (
            filteredStaff.map((user) => (
              <div
                key={user.cpf}
                className="p-4 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 space-y-3 text-[11px]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{user.name}</span>
                    {user.cpf === loggedEmployeeCpf && (
                      <span className="text-[8px] text-pink-650 bg-pink-50 dark:bg-pink-950/20 px-1 py-0.5 rounded border border-pink-200/10 font-bold ml-1.5 inline-block">
                        Você
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      user.isActive !== false
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-450 border border-emerald-200/20'
                        : 'bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400 border border-red-200/20'
                    }`}
                  >
                    {user.isActive !== false ? 'Ativo' : 'Desativado'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 text-zinc-600 dark:text-zinc-350">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-400 uppercase tracking-wider text-[8px]">CPF</span>
                    <span className="font-mono">{user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-400 uppercase tracking-wider text-[8px]">E-mail</span>
                    <span className="truncate max-w-[170px]">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-zinc-400 uppercase tracking-wider text-[8px]">Perfil</span>
                    <span className="inline-flex items-center gap-1 font-bold text-zinc-800 dark:text-zinc-200 text-[10px]">
                      <Shield className="w-3 h-3 text-pink-600" />
                      {getRoleBadgeLabel(user.role)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2.5 border-t border-zinc-150 dark:border-zinc-800/80">
                  <button
                    onClick={() => onEdit(user)}
                    className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-650 dark:bg-zinc-955 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-300 font-bold text-[10px] transition-all"
                  >
                    <Edit2 className="w-3 h-3" />
                    Editar
                  </button>

                  {user.cpf === loggedEmployeeCpf ? (
                    <span className="text-[9px] text-zinc-400 font-semibold italic py-1.5 px-3">
                      Gestor Geral
                    </span>
                  ) : (
                    <button
                      onClick={() => onToggleStatus(user.cpf, user.isActive !== false)}
                      className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-xl border font-bold transition-all shadow-xs text-[10px] ${
                        user.isActive !== false
                          ? 'border-red-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-350 text-zinc-650 dark:bg-zinc-955 dark:border-red-955/40 dark:hover:bg-red-955/25 dark:text-red-450'
                          : 'border-emerald-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-350 text-zinc-650 dark:bg-zinc-955 dark:border-emerald-955/40 dark:hover:bg-emerald-955/25 dark:text-emerald-450'
                      }`}
                    >
                      {user.isActive !== false ? (
                        <>
                          <UserMinus className="w-3 h-3" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3" />
                          Reativar
                        </>
                      )}
                    </button>
                  )}

                  {user.cpf !== loggedEmployeeCpf && (
                    confirmDeleteCpf === user.cpf ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={async () => { await onDelete(user.cpf, user.name); setConfirmDeleteCpf(null); }}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl border border-red-300 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition-all"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteCpf(null)}
                          className="inline-flex items-center h-8 px-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 dark:bg-zinc-955 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-400 font-bold text-[10px] transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteCpf(user.cpf)}
                        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-350 text-zinc-650 dark:bg-zinc-955 dark:border-red-955/40 dark:hover:bg-red-955/25 dark:text-red-450 font-bold text-[10px] transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remover
                      </button>
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
