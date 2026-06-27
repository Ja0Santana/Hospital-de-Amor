import { Shield, Edit2, Trash2 } from 'lucide-react';
import type { CustomRole } from '../../../types';

interface RolesListPanelProps {
  customRoles: CustomRole[];
  allPermissions: Array<{ id: string; label: string }>;
  onEditProfile: (role: CustomRole) => void;
  onDeleteProfile: (id: string) => Promise<void>;
}

export default function RolesListPanel({
  customRoles,
  allPermissions,
  onEditProfile,
  onDeleteProfile,
}: RolesListPanelProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
        <Shield className="w-4 h-4 text-pink-600" />
        Perfis e Acessos
      </h2>
      <div className="space-y-4 divide-y divide-zinc-150 dark:divide-zinc-800">
        <div className="pt-4 first:pt-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50">
              Gestor Geral (Padrão)
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200/40 dark:border-zinc-700/50">
              Sistema
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allPermissions.map((p) => (
              <span
                key={p.id}
                className="px-2 py-0.5 bg-pink-50 text-pink-600 dark:bg-pink-955/20 dark:text-pink-400 border border-pink-200/10 rounded-full text-[9px] font-extrabold"
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50">
              Recepcionista (Padrão)
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200/40 dark:border-zinc-700/50">
              Sistema
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allPermissions
              .filter((p) => p.id === 'view_appointments' || p.id === 'confirm_appointments')
              .map((p) => (
                <span
                  key={p.id}
                  className="px-2 py-0.5 bg-pink-50 text-pink-600 dark:bg-pink-955/20 dark:text-pink-400 border border-pink-200/10 rounded-full text-[9px] font-extrabold"
                >
                  {p.label}
                </span>
              ))}
          </div>
        </div>

        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50">
              Auditor (Padrão)
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded border border-zinc-200/40 dark:border-zinc-700/50">
              Sistema
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allPermissions
              .filter((p) => p.id === 'view_appointments' || p.id === 'view_audit')
              .map((p) => (
                <span
                  key={p.id}
                  className="px-2 py-0.5 bg-pink-50 text-pink-600 dark:bg-pink-955/20 dark:text-pink-400 border border-pink-200/10 rounded-full text-[9px] font-extrabold"
                >
                  {p.label}
                </span>
              ))}
          </div>
        </div>

        {customRoles.map((role) => (
          <div key={role.id} className="pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50">
                {role.name}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditProfile(role)}
                  className="p-1 text-zinc-400 hover:text-pink-600 transition-colors rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/20"
                  title="Editar Perfil"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteProfile(role.id)}
                  className="p-1 text-zinc-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-955/20"
                  title="Excluir Perfil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {role.permissions.map((pId) => {
                const info = allPermissions.find((p) => p.id === pId);
                return (
                  <span
                    key={pId}
                    className="px-2 py-0.5 bg-pink-50 text-pink-600 dark:bg-pink-955/20 dark:text-pink-400 border border-pink-200/10 rounded-full text-[9px] font-extrabold"
                  >
                    {info ? info.label : pId}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
