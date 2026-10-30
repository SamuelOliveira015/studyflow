/**
 * Componente de Métricas e Quantidades
 * Exibe a quantidade de objetivos cadastrados e o progresso geral do estudante.
 */

import React from 'react';
import { Target, Clock, CheckCircle2, Circle } from 'lucide-react';
import { GoalStats } from '../types/goal';

interface StatsOverviewProps {
  stats: GoalStats;
  onFilterSelect: (filter: 'todos' | 'nao_iniciado' | 'em_andamento' | 'concluido') => void;
  activeFilter: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats,
  onFilterSelect,
  activeFilter,
}) => {
  return (
    <section className="space-y-3">
      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total de Objetivos */}
        <button
          type="button"
          onClick={() => onFilterSelect('todos')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === 'todos'
              ? 'bg-indigo-50/70 border-indigo-200 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Cadastrado</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {stats.total}
            </span>
            <span className="text-xs text-slate-500">
              {stats.total === 1 ? 'objetivo' : 'objetivos'}
            </span>
          </div>
        </button>

        {/* Não Iniciados */}
        <button
          type="button"
          onClick={() => onFilterSelect('nao_iniciado')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === 'nao_iniciado'
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Não Iniciados</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Circle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-700 font-mono">
              {stats.naoIniciados}
            </span>
            <span className="text-xs text-slate-500">a começar</span>
          </div>
        </button>

        {/* Em Andamento */}
        <button
          type="button"
          onClick={() => onFilterSelect('em_andamento')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === 'em_andamento'
              ? 'bg-amber-50/80 border-amber-200 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Em Andamento</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-800 font-mono">
              {stats.emAndamento}
            </span>
            <span className="text-xs text-amber-700">em progresso</span>
          </div>
        </button>

        {/* Concluídos */}
        <button
          type="button"
          onClick={() => onFilterSelect('concluido')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            activeFilter === 'concluido'
              ? 'bg-emerald-50/80 border-emerald-200 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Concluídos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-800 font-mono">
              {stats.concluidos}
            </span>
            <span className="text-xs text-emerald-700">finalizados</span>
          </div>
        </button>
      </div>

      {/* Barra de Progresso Geral */}
      {stats.total > 0 && (
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Taxa de Conclusão dos Estudos</span>
              <span className="text-xs font-bold text-indigo-600 font-mono">
                {stats.progressoPorcentagem}%
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {stats.concluidos} de {stats.total} {stats.total === 1 ? 'meta cumprida' : 'metas cumpridas'}.
              {stats.progressoPorcentagem === 100
                ? ' Parabéns, você concluiu todas as suas metas!'
                : stats.progressoPorcentagem > 50
                ? ' Excelente ritmo, continue avançando!'
                : ' Um passo de cada vez para construir seu hábito.'}
            </p>
          </div>

          <div className="w-full sm:w-56 h-2.5 bg-slate-100 rounded-full overflow-hidden shrink-0 border border-slate-200/60">
            <div
              className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${stats.progressoPorcentagem}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
};
