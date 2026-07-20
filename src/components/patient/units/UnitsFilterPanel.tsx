import { Input } from '../../ui/Input';
import { Search, ChevronDown } from 'lucide-react';

interface UnitsFilterPanelProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterType: string;
  setFilterType: (val: string) => void;
  filterCity: string;
  setFilterCity: (val: string) => void;
  filterSpecialty: string;
  setFilterSpecialty: (val: string) => void;
  cities: string[];
  specialties: string[];
}

export default function UnitsFilterPanel({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterCity,
  setFilterCity,
  filterSpecialty,
  setFilterSpecialty,
  cities,
  specialties,
}: UnitsFilterPanelProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-center bg-white/50 dark:bg-zinc-900/30 p-5 rounded-3xl border border-zinc-200/50 dark:border-zinc-850/60 backdrop-blur-xs shadow-xs">
      <div className="relative flex-1 w-full group">
        <Input
          id="unit-search"
          type="text"
          placeholder="Buscar por nome, cidade ou estado (UF)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-2 focus-visible:ring-pink-500/10 focus-visible:border-pink-500 bg-white/80 dark:bg-zinc-950/80 transition-all placeholder:text-zinc-400 text-xs font-medium"
        />
        <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400 group-hover:text-pink-500 transition-colors" />
      </div>
      <div className="flex flex-wrap gap-2.5 w-full lg:w-auto justify-start sm:justify-end shrink-0 items-center">
        <div className="relative w-full sm:w-52 shrink-0">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 pl-3 pr-9 w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-xs font-bold focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 focus:outline-none text-zinc-750 dark:text-zinc-300 cursor-pointer shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all appearance-none"
          >
            <option value="Todos">Todas as Categorias</option>
            <option value="Prevenção">Prevenção</option>
            <option value="Tratamento">Tratamento</option>
            <option value="Reabilitação">Reabilitação</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>

        <div className="relative w-full sm:w-52 shrink-0">
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="h-10 pl-3 pr-9 w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-xs font-bold focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 focus:outline-none text-zinc-750 dark:text-zinc-300 cursor-pointer shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all appearance-none"
          >
            <option value="Todas">Todas as Cidades</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>

        <div className="relative w-full sm:w-56 shrink-0">
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="h-10 pl-3 pr-9 w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-xs font-bold focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500 focus:outline-none text-zinc-750 dark:text-zinc-300 cursor-pointer shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all appearance-none"
          >
            <option value="Todas">Todas as Especialidades</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
