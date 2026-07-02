import { Shield } from 'lucide-react';
import { Button } from '../ui/Button';

interface AccessDeniedProps {
  title?: string;
  description?: string;
}

export function AccessDenied({
  title = 'Acesso Negado',
  description = 'Você não tem permissão para visualizar esta página. Entre em contato com o administrador.'
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm animate-in fade-in duration-200">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-900/50 mb-4">
        <Shield className="w-8 h-8 text-red-500 dark:text-red-400" />
      </div>
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">{title}</h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      <Button
        onClick={() => {
          window.location.hash = '#/dashboard';
        }}
        className="bg-primary hover:bg-primary/95 text-white h-9 rounded-xl px-4 text-xs font-bold transition-all"
      >
        Voltar ao Início
      </Button>
    </div>
  );
}
