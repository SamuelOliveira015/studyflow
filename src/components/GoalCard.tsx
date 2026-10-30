/**
 * Componente de Cartão de Objetivo (GoalCard)
 * Apresenta o objetivo de estudo com título, descrição, prazo e status,
 * além das ações de edição, exclusão e alternância rápida de status.
 */

import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { GoalStatus, StudyGoal } from '../types/goal';
import { calculateDeadlineInfo } from '../utils/dateUtils';

interface GoalCardProps {
  goal: StudyGoal;
  onEdit: (goal: StudyGoal) => void;
  onRequestDelete: (goal: StudyGoal) => void;
  onStatusChange: (id: string, newStatus: GoalStatus) => void;
  onOpenSchedule?: (goal: StudyGoal) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onRequestDelete,
  onStatusChange,
  onOpenSchedule,
}) => {
  // Configuração visual por status
  const statusConfig: Record<
    GoalStatus,
    { label: string; badgeClass: string; icon: React.ReactNode }
  > = {
    nao_iniciado: {
      label: 'Não iniciado',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: <Circle className="w-3.5 h-3.5 text-slate-500" />,
    },
    em_andamento: {
      label: 'Em andamento',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
      icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
    },
    concluido: {
      label: 'Concluído',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
  };

  // Cálculo centralizado e robusto do prazo via dateUtils
  const deadlineInfo = calculateDeadlineInfo(goal.deadline, goal.status);
  const currentStatus = statusConfig[goal.status] ?? statusConfig.nao_iniciado;

  return (
    <article
      className={`group bg-white rounded-xl border p-4 sm:p-5 transition-all flex flex-col justify-between shadow-2xs hover:shadow-sm ${
        goal.status === 'concluido'
          ? 'border-emerald-100 bg-slate-50/40'
          : deadlineInfo.isOverdue
          ? 'border-red-200/90 ring-1 ring-red-400/20'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Topo do Card: Badge de Status e Ações Rápidas */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5">
          {/* Seletor rápido de Status */}
          <div className="relative inline-block">
            <label htmlFor={`status-select-${goal.id}`} className="sr-only">
              Alterar status de {goal.title}
            </label>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${currentStatus.badgeClass}`}
              >
                {currentStatus.icon}
                <span>{currentStatus.label}</span>
              </span>
              <select
                id={`status-select-${goal.id}`}
                value={goal.status}
                onChange={(e) => onStatusChange(goal.id, e.target.value as GoalStatus)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                title="Clique para alterar status rapidamente"
              >
                <option value="nao_iniciado">Não iniciado</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
          </div>

          {/* Botões de Ação: Editar e Excluir */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(goal)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
              title="Editar objetivo"
              aria-label={`Editar objetivo ${goal.title}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onRequestDelete(goal)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Excluir objetivo"
              aria-label={`Excluir objetivo ${goal.title}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Título do Objetivo */}
        <h3
          className={`text-base font-semibold leading-snug tracking-tight text-slate-900 mb-2 ${
            goal.status === 'concluido' ? 'line-through text-slate-500' : ''
          }`}
        >
          {goal.title}
        </h3>

        {/* Descrição */}
        {goal.description ? (
          <p
            className={`text-xs sm:text-sm text-slate-600 leading-relaxed mb-4 whitespace-pre-line line-clamp-3 ${
              goal.status === 'concluido' ? 'text-slate-400' : ''
            }`}
          >
            {goal.description}
          </p>
        ) : (
          <p className="text-xs italic text-slate-400 mb-4">Sem descrição detalhada.</p>
        )}
      </div>

      {/* Rodapé do Card: Prazo e Botão de Alternância Rápida */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Informação do Prazo */}
        <div className="flex items-center gap-1.5 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700">Prazo: {deadlineInfo.text}</span>
          {deadlineInfo.diffLabel && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-sm ${
                deadlineInfo.isOverdue
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : deadlineInfo.isUrgent
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {deadlineInfo.isOverdue && <AlertCircle className="w-3 h-3 text-red-600" />}
              {deadlineInfo.diffLabel}
            </span>
          )}
        </div>

        {/* Ações do Card */}
        <div className="flex items-center gap-1.5">
          {onOpenSchedule && (
            <button
              type="button"
              onClick={() => onOpenSchedule(goal)}
              className="px-2 py-1 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-100"
              title="Gerar cronograma para esta meta"
            >
              Cronograma
            </button>
          )}

          {/* Ação rápida para marcar/desmarcar conclusão */}
          <button
            type="button"
            onClick={() =>
              onStatusChange(
                goal.id,
                goal.status === 'concluido' ? 'em_andamento' : 'concluido'
              )
            }
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              goal.status === 'concluido'
                ? 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100'
            }`}
          >
            {goal.status === 'concluido' ? 'Reabrir meta' : 'Marcar concluído'}
          </button>
        </div>
      </div>
    </article>
  );
};
