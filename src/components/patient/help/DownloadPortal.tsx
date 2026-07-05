import { Card } from '../../ui/Card';
import { Download } from 'lucide-react';

interface DownloadPortalProps {
  downloadProgress: number;
  onClose: () => void;
}

export default function DownloadPortal({ downloadProgress, onClose }: DownloadPortalProps) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
      <Card onClick={(e) => e.stopPropagation()} className="max-w-xs w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto animate-bounce">
          <Download className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">Baixando Cartilha</h3>
          <p className="text-[0.625rem] text-zinc-400">Estabelecendo conexão segura offline...</p>
        </div>
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-200"
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
        <span className="text-xs font-bold text-primary block">{downloadProgress}%</span>
      </Card>
    </div>
  );
}
