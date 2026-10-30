/**
 * Modal de Confirmação de Exclusão
 * Garante o cumprimento estrito do requisito:
 * "excluir um objetivo somente após uma confirmação".
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { StudyGoal } from '../types/goal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  goal: StudyGoal | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  goal,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen || !goal) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      aria-describedby="confirm-delete-desc"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Cancelar e fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 id="confirm-delete-title" className="text-base font-bold text-slate-900 mb-2">
            Confirmar Exclusão
          </h2>

          <p id="confirm-delete-desc" className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
            Você tem certeza de que deseja excluir o objetivo de estudo:
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 mb-4 line-clamp-2">
            "{goal.title}"
          </div>

          <p className="text-xs text-slate-400 mb-6">
            Esta ação não poderá ser desfeita. O objetivo será removido permanentemente do seu armazenamento local.
          </p>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Sim, excluir objetivo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
