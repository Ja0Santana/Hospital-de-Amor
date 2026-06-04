import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  id: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ content, children, id, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 translate-y-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 -translate-x-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 translate-x-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 -translate-y-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-zinc-900 dark:border-b-zinc-950';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-zinc-900 dark:border-l-zinc-950';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-zinc-900 dark:border-r-zinc-950';
      case 'top':
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-t-zinc-900 dark:border-t-zinc-950';
    }
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <button
        type="button"
        id={id}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        aria-haspopup="true"
        aria-expanded={isVisible}
        className="focus:outline-none cursor-help inline-flex items-center justify-center p-0.5 rounded-full hover:bg-zinc-150 dark:hover:bg-zinc-850 transition-colors"
      >
        {children}
      </button>
      {isVisible && (
        <div
          role="tooltip"
          id={`${id}-content`}
          className={`absolute z-50 w-52 sm:w-60 p-3 text-[11px] bg-zinc-900 text-zinc-100 rounded-xl shadow-lg border border-zinc-800 dark:bg-zinc-950 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-1 duration-150 text-left font-normal select-none ${getPositionClasses()}`}
        >
          <div className="leading-normal">{content}</div>
          <div className={`absolute border-4 border-transparent ${getArrowClasses()}`} />
        </div>
      )}
    </div>
  );
}
