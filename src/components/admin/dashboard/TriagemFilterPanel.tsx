import React from 'react';
import { Search, Filter, Save, X } from 'lucide-react';
import type { City, Specialty } from '../../../types';

interface ActiveFilterItem {
  id: string;
  label: string;
  clear: () => void;
}

interface TriagemFilterPanelProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCityId: string;
  setSelectedCityId: (val: string) => void;
  selectedSpecialtyId: string;
  setSelectedSpecialtyId: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  sortKey: string;
  setSortKey: (val: string) => void;
  sortOrder: 'asc' | 'desc';
  startDateFilter: string;
  setStartDateFilter: (val: string) => void;
  endDateFilter: string;
  setEndDateFilter: (val: string) => void;
  showColdStorage: boolean;
  setShowColdStorage: (val: boolean) => void;
  cities: City[];
  specialties: Specialty[];
  isSavingFilter: boolean;
  setIsSavingFilter: (val: boolean) => void;
  filterNameInput: string;
  setFilterNameInput: (val: string) => void;
  savedFilters: any[];
  activeFilters: ActiveFilterItem[];
  handleSaveFilter: () => void;
  handleApplySavedFilter: (filterState: any) => void;
  handleDeleteSavedFilter: (id: number, e: React.MouseEvent) => void;
  handleClearAllFilters: () => void;
}

export default function TriagemFilterPanel({
  searchQuery,
  setSearchQuery,
  selectedCityId,
  setSelectedCityId,
  selectedSpecialtyId,
  setSelectedSpecialtyId,
  statusFilter,
  setStatusFilter,
  sortKey,
  setSortKey,
  sortOrder,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  showColdStorage,
  setShowColdStorage,
  cities,
  specialties,
  isSavingFilter,
  setIsSavingFilter,
  filterNameInput,
  setFilterNameInput,
  savedFilters,
  activeFilters,
  handleSaveFilter,
  handleApplySavedFilter,
  handleDeleteSavedFilter,
  handleClearAllFilters
}: TriagemFilterPanelProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-450" />
          <input
            type="text"
            placeholder="Buscar por nome, protocolo ou CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
          />
        </div>

        <div className="relative flex items-center">
          <Filter className="absolute left-3.5 w-4 h-4 text-zinc-450" />
          <select
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 appearance-none cursor-pointer"
          >
            <option value="">Todas as Cidades</option>
            {cities.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.state})</option>
            ))}
          </select>
        </div>

        <div className="relative flex items-center">
          <Filter className="absolute left-3.5 w-4 h-4 text-zinc-450" />
          <select
            value={selectedSpecialtyId}
            onChange={(e) => setSelectedSpecialtyId(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 appearance-none cursor-pointer"
          >
            <option value="">Todas as Especialidades</option>
            {specialties.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="relative flex items-center">
          <Filter className="absolute left-3.5 w-4 h-4 text-zinc-450" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 appearance-none cursor-pointer"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em análise">Em análise</option>
            <option value="Reagendamento Pendente">Reagendamento Pendente</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Cancelado">Cancelado</option>
            <option value="Aguardando Follow-up">Aguardando Acompanhamento</option>
          </select>
        </div>

        <div className="relative flex items-center">
          <Filter className="absolute left-3.5 w-4 h-4 text-zinc-450" />
          <select
            value={sortKey}
            onChange={(e) => {
              const newKey = e.target.value;
              setSortKey(newKey);
              localStorage.setItem('hospital_amor_admin_sort', JSON.stringify({ key: newKey, order: sortOrder }));
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100 appearance-none cursor-pointer"
          >
            <option value="fila_priorizada">Fila Priorizada (Padrão)</option>
            <option value="protocol">Protocolo</option>
            <option value="patientName">Paciente</option>
            <option value="city">Cidade</option>
            <option value="changedAt">Última alteração de status</option>
            <option value="assignedTo">Operador responsável</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Período de Atendimento (Início)</label>
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Período de Atendimento (Fim)</label>
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
          />
        </div>
        <div className="flex items-center gap-2 mt-5">
          <input
            type="checkbox"
            id="coldStorageCheck"
            checked={showColdStorage}
            onChange={(e) => setShowColdStorage(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-350 text-pink-600 focus:ring-pink-500 dark:border-zinc-800 dark:bg-zinc-955"
          />
          <label htmlFor="coldStorageCheck" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
            Exibir Histórico Antigo (+2 anos)
          </label>
        </div>
        <div className="flex items-end justify-end">
          {!isSavingFilter ? (
            <button
              onClick={() => setIsSavingFilter(true)}
              className="w-full md:w-auto px-4 py-2 border border-pink-500 text-pink-600 dark:border-pink-400 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-955/15 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 justify-center"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Filtro Atual</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                placeholder="Nome do filtro..."
                value={filterNameInput}
                onChange={(e) => setFilterNameInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-955 focus:ring-1 focus:ring-pink-500 focus:outline-none dark:text-zinc-100"
              />
              <button
                onClick={handleSaveFilter}
                disabled={!filterNameInput.trim()}
                className="px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              >
                Salvar
              </button>
              <button
                onClick={() => {
                  setIsSavingFilter(false);
                  setFilterNameInput('');
                }}
                className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 text-xs font-bold rounded-xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-955 flex items-center justify-center h-8 transition-transform hover:rotate-90 duration-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {savedFilters.length > 0 && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Filtros Salvos:</span>
          {savedFilters.map((f) => (
            <div
              key={f.id}
              onClick={() => handleApplySavedFilter(f.filterState)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-zinc-250 border border-zinc-200 dark:border-zinc-800 hover:bg-pink-50 dark:hover:bg-pink-955/15 transition-all cursor-pointer"
            >
              <span>{f.name}</span>
              <button
                onClick={(e) => handleDeleteSavedFilter(f.id, e)}
                className="text-zinc-400 hover:text-red-500 font-extrabold ml-1 flex items-center justify-center transition-transform hover:rotate-90 duration-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 animate-in fade-in">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Filtros Ativos:</span>
          {activeFilters.map(filter => (
            <span key={filter.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800">
              {filter.label}
              <button onClick={filter.clear} className="text-zinc-400 hover:text-zinc-655 font-bold ml-1 inline-flex items-center justify-center transition-transform hover:rotate-90 duration-200">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button 
            onClick={handleClearAllFilters} 
            className="text-[10px] font-extrabold text-pink-600 hover:underline ml-2"
          >
            Limpar Todos
          </button>
        </div>
      )}
    </div>
  );
}
