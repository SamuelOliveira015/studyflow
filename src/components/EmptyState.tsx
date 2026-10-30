/**
 * Componente de Estado Vazio (EmptyState)
 * Cumpre o requisito "mensagens quando não houver objetivos" de forma acolhedora e encorajadora.
 */

import React from 'react';
import { BookMarked, Plus, Sparkles, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  isFiltered: boolean;
  onOpenNewGoalModal: () => void;
  onResetFilter?: () => void;
  onLoadSamples?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isFiltered,
  onOpenNewGoalModal,
  onResetFilter,
  onLoadSamples,
}) => {
  if (isFiltered) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
          <BookMarked className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Nenhum objetivo encontrado com esse filtro
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
          Tente ajustar os filtros de status ou a busca por texto para encontrar o que procura.
        </p>
        {onResetFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Ver todos os objetivos</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-indigo-50/50">
        <Sparkles className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1.5">
        Seu mural de estudos está limpo!
      </h3>
      <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed max-w-sm mx-auto">
        Começar é o passo mais importante. Cadastre seu primeiro objetivo de estudo para dar ritmo à sua rotina ou carregue exemplos práticos.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onOpenNewGoalModal}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Primeiro Objetivo</span>
        </button>

        {onLoadSamples && (
          <button
            type="button"
            onClick={onLoadSamples}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <BookMarked className="w-4 h-4 text-slate-500" />
            <span>Carregar Exemplos</span>
          </button>
        )}
      </div>
    </div>
  );
};
