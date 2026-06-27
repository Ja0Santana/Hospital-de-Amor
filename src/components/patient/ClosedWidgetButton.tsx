import { X, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';

interface ClosedWidgetButtonProps {
  onOpen: () => void;
  onHide: () => void;
}

export function ClosedWidgetButton({ onOpen, onHide }: ClosedWidgetButtonProps) {
  return (
    <div className="relative group">
      <button
        onClick={onHide}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md border border-white dark:border-zinc-900 transition-all opacity-80 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 z-50 hover:scale-110 active:scale-95"
        title="Ocultar Assistente"
        aria-label="Ocultar assistente virtual"
      >
        <X className="w-2.5 h-2.5" />
      </button>
      <Button
        onClick={onOpen}
        className="w-12 h-12 bg-primary hover:bg-primary/95 text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/20 transition-all hover:scale-110 active:scale-95"
        aria-label="Abrir assistente virtual"
      >
        <MessageSquare className="w-5 h-5" />
      </Button>
    </div>
  );
}
