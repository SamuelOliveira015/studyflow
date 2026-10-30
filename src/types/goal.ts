/**
 * Definições de tipos de dados para o StudyFlow
 * Separado em arquivo exclusivo conforme requisitos técnicos do projeto.
 */

export type GoalStatus = 'nao_iniciado' | 'em_andamento' | 'concluido';

export type GoalFilter = 'todos' | GoalStatus;

export type SortOption = 'prazo_asc' | 'prazo_desc' | 'recentes' | 'alfabetico';

export interface StudyGoal {
  id: string;
  title: string;
  description: string;
  deadline: string; // Formato YYYY-MM-DD
  status: GoalStatus;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface GoalFormData {
  title: string;
  description: string;
  deadline: string;
  status: GoalStatus;
}

export interface GoalStats {
  total: number;
  naoIniciados: number;
  emAndamento: number;
  concluidos: number;
  progressoPorcentagem: number;
}
