import { useState } from 'react';

interface BodyRegionSelectorProps {
  selectedRegions: string[];
  onChange: (regions: string[]) => void;
}

export default function BodyRegionSelector({ selectedRegions, onChange }: BodyRegionSelectorProps) {
  const [view, setView] = useState<'frente' | 'costas'>('frente');

  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) {
      onChange(selectedRegions.filter((r) => r !== region));
    } else {
      onChange([...selectedRegions, region]);
    }
  };

  const isSelected = (region: string) => selectedRegions.includes(region);

  const getRegionClass = (region: string) => {
    return isSelected(region)
      ? 'fill-pink-600 stroke-pink-700 dark:fill-pink-700 dark:stroke-pink-600 cursor-pointer transition-all duration-200 hover:opacity-90'
      : 'fill-zinc-200 stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-700 cursor-pointer transition-all duration-200 hover:fill-zinc-300 dark:hover:fill-zinc-700';
  };

  return (
    <div className="flex flex-col items-center bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4">
      <div className="flex justify-between items-center w-full">
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Onde você está sentindo o sintoma?</span>
        <div className="flex bg-zinc-200 dark:bg-zinc-900 rounded-xl p-0.5 border border-zinc-300 dark:border-zinc-850 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setView('frente')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              view === 'frente'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setView('costas')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              view === 'costas'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Costas
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full">
        <div className="relative w-40 h-56 flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 160 220"
            className="w-full h-full select-none"
            style={{ touchAction: 'manipulation' }}
          >
            <circle
              cx="80"
              cy="30"
              r="14"
              className={getRegionClass('cabeça')}
              onClick={() => toggleRegion('cabeça')}
            />

            <rect
              x="76"
              y="44"
              width="8"
              height="8"
              className={getRegionClass('cabeça')}
              onClick={() => toggleRegion('cabeça')}
            />

            {view === 'frente' ? (
              <>
                <path
                  d="M 54,54 Q 80,52 106,54 L 100,105 Q 80,107 60,105 Z"
                  className={getRegionClass('tórax')}
                  onClick={() => toggleRegion('tórax')}
                />
                <path
                  d="M 60,108 Q 80,110 100,108 L 96,145 Q 80,147 64,145 Z"
                  className={getRegionClass('abdômen')}
                  onClick={() => toggleRegion('abdômen')}
                />
              </>
            ) : (
              <path
                d="M 54,54 Q 80,52 106,54 L 96,145 Q 80,147 64,145 Z"
                className={getRegionClass('costas')}
                onClick={() => toggleRegion('costas')}
              />
            )}

            <rect
              x="36"
              y="54"
              width="14"
              height="74"
              rx="7"
              className={getRegionClass('membros_superiores')}
              onClick={() => toggleRegion('membros_superiores')}
            />

            <rect
              x="110"
              y="54"
              width="14"
              height="74"
              rx="7"
              className={getRegionClass('membros_superiores')}
              onClick={() => toggleRegion('membros_superiores')}
            />

            <rect
              x="56"
              y="148"
              width="20"
              height="62"
              rx="8"
              className={getRegionClass('membros_inferiores')}
              onClick={() => toggleRegion('membros_inferiores')}
            />

            <rect
              x="84"
              y="148"
              width="20"
              height="62"
              rx="8"
              className={getRegionClass('membros_inferiores')}
              onClick={() => toggleRegion('membros_inferiores')}
            />
          </svg>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 w-full max-w-[280px]">
          {[
            { id: 'cabeça', label: 'Cabeça' },
            { id: 'tórax', label: 'Tórax', frontOnly: true },
            { id: 'abdômen', label: 'Abdômen', frontOnly: true },
            { id: 'costas', label: 'Costas', backOnly: true },
            { id: 'membros_superiores', label: 'Membros Superiores (Braços)' },
            { id: 'membros_inferiores', label: 'Membros Inferiores (Pernas)' },
          ]
            .filter((item) => {
              if (item.frontOnly && view !== 'frente') return false;
              if (item.backOnly && view !== 'costas') return false;
              return true;
            })
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleRegion(item.id)}
                className={`px-3 py-2 text-left rounded-xl border text-[11px] font-bold transition-all flex items-center justify-between ${
                  isSelected(item.id)
                    ? 'bg-pink-50 border-pink-300 text-pink-700 dark:bg-pink-950/20 dark:border-pink-900/50 dark:text-pink-400'
                    : 'bg-white border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                }`}
              >
                <span>{item.label}</span>
                {isSelected(item.id) && (
                  <span className="w-1.5 h-1.5 bg-pink-600 dark:bg-pink-400 rounded-full animate-pulse" />
                )}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
