import { MessageSquare } from 'lucide-react';

interface MinimizedBubbleProps {
  onRestore: () => void;
}

export function MinimizedBubble({ onRestore }: MinimizedBubbleProps) {
  return (
    <div className="fixed right-6 bottom-6 z-40 font-sans animate-in fade-in duration-200">
      <button
        onClick={onRestore}
        className="w-8 h-8 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 border border-zinc-300/40 dark:border-zinc-700/50"
        title="Restaurar Assistente de Dúvidas"
        aria-label="Restaurar assistente virtual"
      >
        <MessageSquare className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
