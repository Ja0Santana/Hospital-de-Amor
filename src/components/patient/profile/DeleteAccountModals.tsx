import { createPortal } from 'react-dom';
import { Button } from '../../ui/Button';
import { AlertTriangle } from 'lucide-react';
import type { PatientUser, Appointment } from '../../../types';

interface DeleteAccountModalsProps {
  user: PatientUser | null;
  showBlockedModal: boolean;
  setShowBlockedModal: (open: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (open: boolean) => void;
  openAppointments: Appointment[];
  onConfirmDelete: () => void;
  onNavigate: (page: string) => void;
}

export default function DeleteAccountModals({
  user,
  showBlockedModal,
  setShowBlockedModal,
  showDeleteModal,
  setShowDeleteModal,
  openAppointments,
  onConfirmDelete,
  onNavigate
}: DeleteAccountModalsProps) {
  return (
    <>
      {showBlockedModal && createPortal(
        <div onClick={() => setShowBlockedModal(false)} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] animate-in fade-in">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5">
            <div className="flex gap-3 items-start text-left">
              <div className="p-2.5 bg-yellow-100 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 rounded-full shrink-0 border border-yellow-200/20">
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-50">Você tem eventos em aberto</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Não é possível excluir sua conta enquanto houver consultas ou exames pendentes. Resolva os itens abaixo antes de continuar.
                </p>
              </div>
            </div>

            <ul className="space-y-2 list-none max-h-48 overflow-y-auto">
              {openAppointments.map((app) => (
                <li key={app.id} className="flex items-center justify-between gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs text-left">
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">{app.examName}</p>
                    <p className="text-zinc-400 text-[0.625rem]">Protocolo: {app.protocol}</p>
                  </div>
                  <span className={`shrink-0 font-semibold text-[0.625rem] px-2 py-0.5 rounded-full border ${
                    app.status === 'Confirmado' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400' :
                    app.status === 'Em análise' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400'
                  }`}>{app.status}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBlockedModal(false)}
                className="h-10 px-4 border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-xs"
              >
                Fechar
              </Button>
              <Button
                type="button"
                onClick={() => { setShowBlockedModal(false); onNavigate('status-check'); }}
                className="h-10 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Ver Meus Agendamentos
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showDeleteModal && createPortal(
        <div onClick={() => setShowDeleteModal(false)} className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] animate-in fade-in">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex gap-3 items-start text-left">
              <div className="p-2.5 bg-red-100 dark:bg-red-955/20 text-red-600 dark:text-red-400 rounded-full shrink-0 border border-red-200/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-50">Excluir conta?</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {user?.role === 'both'
                    ? 'Ao confirmar, seu acesso ao portal será encerrado e todos os seus históricos de doações, agendamentos e exames serão removidos permanentemente. Você precisará criar uma nova conta caso queira utilizar o serviço novamente.'
                    : user?.role === 'donor'
                    ? 'Ao confirmar, seu acesso ao portal será encerrado e todo o seu histórico de doações será removido. Você precisará criar uma nova conta caso queira utilizar o serviço novamente.'
                    : 'Ao confirmar, seu acesso ao portal será encerrado e todo o seu histórico de agendamentos e exames será removido. Você precisará criar uma nova conta caso queira utilizar o serviço novamente.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} className="h-10 px-4 border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-xs">
                Cancelar
              </Button>
              <Button type="button" onClick={onConfirmDelete} className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md">
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
