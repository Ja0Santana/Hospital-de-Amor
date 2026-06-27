import React from 'react';
import { Shield } from 'lucide-react';

interface RoleFormPanelProps {
  profileName: string;
  setProfileName: (val: string) => void;
  profilePermissions: string[];
  allPermissions: Array<{ id: string; label: string }>;
  editingProfileId: string | null;
  onTogglePermission: (permId: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

export default function RoleFormPanel({
  profileName,
  setProfileName,
  profilePermissions,
  allPermissions,
  editingProfileId,
  onTogglePermission,
  onSubmit,
  onCancel,
}: RoleFormPanelProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
        <Shield className="w-4 h-4 text-pink-600" />
        {editingProfileId ? 'Editar Perfil Personalizado' : 'Criar Perfil Personalizado'}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="role-name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            Nome do Perfil
          </label>
          <input
            id="role-name"
            type="text"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Ex: Auxiliar Técnico"
            className="w-full p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
            Permissões de Acesso
          </label>
          <div className="space-y-2 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl">
            {allPermissions.map((p) => (
              <label key={p.id} className="flex items-center gap-3 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={profilePermissions.includes(p.id)}
                  onChange={() => onTogglePermission(p.id)}
                  className="rounded border-zinc-350 dark:border-zinc-800 text-pink-600 focus:ring-pink-500 h-3.5 w-3.5"
                />
                <span className="text-xs text-zinc-755 dark:text-zinc-255 font-semibold">
                  {p.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {editingProfileId && (
            <button
              type="button"
              onClick={onCancel}
              className="w-1/2 h-11 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-950/25 font-bold text-xs rounded-2xl transition-all"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className={`h-11 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-2xl transition-all shadow-sm shadow-pink-600/20 active:scale-[0.98] ${
              editingProfileId ? 'w-1/2' : 'w-full'
            }`}
          >
            {editingProfileId ? 'Salvar Alterações' : 'Criar Perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}
