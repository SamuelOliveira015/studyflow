/**
 * Barra de Filtros, Busca e Ordenação
 * Permite filtrar por status, pesquisar por texto e ordenar prazos.
 */

import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { GoalFilter, SortOption } from '../types/goal';

interface FilterBarProps {
  currentFilter: GoalFilter;
  onFilterChange: (filter: GoalFilter) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  counts: {
    todos: number;
    nao_iniciado: number;
    em_andamento: number;
    concluido: number;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({
  currentFilter,
  onFilterChange,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  counts,
}) => {
  const tabs: { id: GoalFilter; label: string; count: number }[] = [
    { id: 'todos', label: 'Todos', count: counts.todos },
    { id: 'nao_iniciado', label: 'Não iniciados', count: counts.nao_iniciado },
    { id: 'em_andamento', label: 'Em andamento', count: counts.em_andamento },
    { id: 'concluido', label: 'Concluídos', count: counts.concluido },
  ];

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Abas de Filtro de Status */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg overflow-x-auto shrink-0 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = currentFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onFilterChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Busca e Ordenação */}
        <div className="flex flex-col sm:flex-row items-center gap-2 grow max-w-xl md:justify-end">
          {/* Campo de Busca */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por título ou descrição..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Seletor de Ordenação */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full sm:w-auto text-xs py-1.5 pl-2.5 pr-7 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="prazo_asc">Prazo: Mais próximo primeiro</option>
              <option value="prazo_desc">Prazo: Mais distante</option>
              <option value="recentes">Mais recentes</option>
              <option value="alfabetico">Ordem alfabética (A-Z)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
