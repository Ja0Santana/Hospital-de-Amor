import { Calendar } from 'lucide-react';

interface ChatSuggestionsProps {
  onStartScheduling: () => void;
  onSelectShortcut: (shortcut: string) => void;
}

export function ChatSuggestions({ onStartScheduling, onSelectShortcut }: ChatSuggestionsProps) {
  return (
    <div className="p-2.5 border-t border-zinc-100 dark:border-zinc-850 shrink-0 space-y-1 bg-white dark:bg-zinc-950">
      <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-wider block">Sugestões:</span>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={onStartScheduling}
          className="px-2 py-0.5 bg-pink-100 hover:bg-pink-200 border border-pink-250 text-pink-700 rounded-lg text-[8px] font-bold transition-all flex items-center gap-1"
        >
          <span>Novo Agendamento</span>
          <Calendar className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={() => onSelectShortcut('Preparo Mamografia')}
          className="px-2 py-0.5 bg-zinc-50 hover:bg-primary/5 border border-zinc-150 hover:border-primary/20 dark:bg-zinc-900 dark:border-zinc-850 rounded-lg text-[8px] font-bold text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          Preparo Mama
        </button>
        <button
          type="button"
          onClick={() => onSelectShortcut('Febre na quimioterapia')}
          className="px-2 py-0.5 bg-zinc-50 hover:bg-primary/5 border border-zinc-150 hover:border-primary/20 dark:bg-zinc-900 dark:border-zinc-850 rounded-lg text-[8px] font-bold text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          Febre pós-Quimio
        </button>
        <button
          type="button"
          onClick={() => onSelectShortcut('Direitos do Paciente')}
          className="px-2 py-0.5 bg-zinc-50 hover:bg-primary/5 border border-zinc-150 hover:border-primary/20 dark:bg-zinc-900 dark:border-zinc-850 rounded-lg text-[8px] font-bold text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          Direitos
        </button>
      </div>
    </div>
  );
}
