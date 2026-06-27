
import { AlertCircle, X } from 'lucide-react';
import type { PatientUser } from '../../../types';

interface DeleteRoleBlockedModalProps {
  blockedData: { roleName: string; users: PatientUser[] } | null;
  onClose: () => void;
}

export default function DeleteRoleBlockedModal({
  blockedData,
  onClose,
}: DeleteRoleBlockedModalProps) {
  if (!blockedData) {
    return null;
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/55 z-55 flex items-center justify-center p-4 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in scale-in"
      >
        <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-955/40">
          <div>
            <h3 className="font-extrabold text-zinc-900 dark:text-zinc-50 text-xs">
              Exclusão Bloqueada
            </h3>
            <span className="text-[10px] text-zinc-400 mt-0.5">
              O perfil possui colaboradores associados
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-455 dark:text-zinc-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-left">
          <div className="p-4 bg-red-50 dark:bg-red-955/20 border border-red-200/50 dark:border-red-900/30 text-red-850 dark:text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>
              Não é possível excluir o perfil "{blockedData.roleName}" enquanto houver colaboradores
              vinculados a ele. Reassocie-os para outros perfis antes de prosseguir.
            </span>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold text-zinc-455">
              Colaboradores Vinculados:
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
              {blockedData.users.map((u) => (
                <div
                  key={u.cpf}
                  className="p-2.5 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 flex justify-between text-xs font-semibold"
                >
                  <span className="text-zinc-800 dark:text-zinc-200">{u.name}</span>
                  <span className="text-zinc-455 font-mono">
                    {u.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-3.5 bg-zinc-50 dark:bg-zinc-955/40 border-t border-zinc-150 dark:border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="h-9 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
