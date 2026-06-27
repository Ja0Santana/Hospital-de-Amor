import type { FormEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ChatInputFormProps {
  chatInput: string;
  onChangeChatInput: (val: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function ChatInputForm({ chatInput, onChangeChatInput, onSubmit }: ChatInputFormProps) {
  return (
    <form onSubmit={onSubmit} className="p-2 bg-zinc-50 border-t border-zinc-200/50 dark:bg-zinc-900/30 dark:border-zinc-800 flex gap-1.5 shrink-0">
      <Input
        type="text"
        placeholder="Digite aqui..."
        value={chatInput}
        onChange={(e) => onChangeChatInput(e.target.value)}
        className="bg-white border-zinc-250 dark:bg-zinc-950 dark:border-zinc-850 h-8 text-[11px] focus-visible:ring-primary"
      />
      <Button type="submit" size="icon" className="h-8 w-8 shrink-0 bg-primary hover:bg-primary/95 text-white">
        <Send className="w-3.5 h-3.5" />
      </Button>
    </form>
  );
}
