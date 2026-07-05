import type { ChangeEvent } from 'react';
import { Input } from '../../ui/Input';
import { Search } from 'lucide-react';

interface DocumentListFilterProps {
  filterType: string;
  searchQuery: string;
  recordsCount: number;
  examesCount: number;
  laudosCount: number;
  receituariosCount: number;
  onFilterChange: (type: string) => void;
  onSearchChange: (query: string) => void;
}

export default function DocumentListFilter({
  filterType,
  searchQuery,
  recordsCount,
  examesCount,
  laudosCount,
  receituariosCount,
  onFilterChange,
  onSearchChange,
}: DocumentListFilterProps) {
  const getCountByType = (type: string) => {
    switch (type) {
      case 'Todos':
        return recordsCount;
      case 'Exame':
        return examesCount;
      case 'Laudo':
        return laudosCount;
      case 'Receituário':
        return receituariosCount;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['Todos', 'Exame', 'Laudo', 'Receituário'].map((t) => (
          <div
            key={t}
            onClick={() => onFilterChange(t)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
              filterType === t
                ? 'bg-primary border-primary text-white shadow-md shadow-primary/10'
                : 'bg-white border-zinc-200 text-zinc-700 hover:border-primary/30 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
              {t === 'Todos' ? 'Total de Documentos' : t + 's'}
            </span>
            <span className="text-2xl font-black block mt-2">{getCountByType(t)}</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar por título ou especialidade..."
          value={searchQuery}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          className="pl-10 h-10 border-zinc-200 dark:border-zinc-800 rounded-xl"
        />
        <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
      </div>
    </div>
  );
}
