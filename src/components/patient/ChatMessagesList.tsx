import type { ChangeEvent, RefObject } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  options?: Array<{ label: string; value: string }>;
  fileInput?: boolean;
}

interface ChatMessagesListProps {
  chatMessages: ChatMessage[];
  schedulingStep: string;
  isBotTyping: boolean;
  chatEndRef: RefObject<HTMLDivElement | null>;
  onOptionClick: (value: string) => void;
  onRealFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ChatMessagesList({
  chatMessages,
  schedulingStep,
  isBotTyping,
  chatEndRef,
  onOptionClick,
  onRealFileUpload
}: ChatMessagesListProps) {
  return (
    <>
      {chatMessages.map((msg, idx) => {
        const isLastMessage = idx === chatMessages.length - 1;
        return (
          <div
            key={idx}
            className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'items-start'}`}
          >
            <div
              className={`p-2.5 rounded-2xl text-[11px] leading-relaxed shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-zinc-800 dark:text-zinc-250 rounded-tl-none'
              }`}
            >
              {msg.text}
              {isLastMessage && msg.options && msg.options.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  {schedulingStep === 'select_city' ? (
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          onOptionClick(val);
                        }
                      }}
                      className="text-[11px] h-8 w-full bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-xl px-2 text-zinc-800 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                      defaultValue=""
                    >
                      <option value="" disabled>Selecione sua cidade...</option>
                      {msg.options.map((opt, optIdx) => (
                        <option key={optIdx} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      <option value="other">Outra</option>
                    </select>
                  ) : (
                    msg.options.map((opt, optIdx) => (
                      <Button
                        key={optIdx}
                        variant="outline"
                        size="sm"
                        onClick={() => onOptionClick(opt.value)}
                        className="text-[9px] h-6 px-2.5 rounded-xl border-primary/20 text-primary hover:bg-primary/5 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 font-bold"
                      >
                        {opt.label}
                      </Button>
                    ))
                  )}
                </div>
              )}
              {isLastMessage && msg.fileInput && (
                <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5">
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={onRealFileUpload}
                    className="text-[9px] h-7 bg-white dark:bg-zinc-950 dark:border-zinc-850 p-1"
                  />
                </div>
              )}
            </div>
            <span className="text-[7px] text-zinc-400 mt-0.5 font-semibold px-1">{msg.timestamp}</span>
          </div>
        );
      })}

      {isBotTyping && (
        <div className="flex flex-col items-start max-w-[85%] animate-pulse">
          <div className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-zinc-405 text-[11px] rounded-2xl rounded-tl-none">
            Digitando...
          </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </>
  );
}
