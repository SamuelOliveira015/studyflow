/**
 * Definições de tipos de dados para o módulo de Cronogramas de Estudo (StudyFlow)
 * Projetado para suportar sessões de aprendizado, estruturação de planos
 * e exportação para formatos de calendário padrão (iCalendar / Google Calendar).
 */

/**
 * Dias da semana disponíveis para estudo (0 = Domingo até 6 = Sábado)
 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Nomes amigáveis dos dias da semana em português (pt-BR)
 */
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
} as const;

/**
 * Abreviações dos dias da semana para chips/seletores rápidos de UI
 */
export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
} as const;

/**
 * Sessão individual de estudo dentro de um cronograma
 */
export interface StudySession {
  /** Identificador único e estável da sessão */
  id: string;
  /** Data no formato estrito 'YYYY-MM-DD' */
  date: string;
  /** Horário de início no formato 'HH:mm' (ex: '19:00') */
  startTime: string;
  /** Horário de término no formato 'HH:mm' (ex: '20:00') */
  endTime: string;
  /** Título conciso da sessão (ex: 'Sessão 1: Introdução a Hooks') */
  title: string;
  /** Descrição dos tópicos abordados, leitura ou exercícios da sessão */
  description: string;
  /** Referência opcional ao ID do objetivo de estudo original (StudyGoal.id) */
  goalId?: string;
  /** Indicador de conclusão individual da sessão */
  isCompleted?: boolean;
}

/**
 * Dados de entrada preenchidos pelo estudante para geração do cronograma
 */
export interface ScheduleFormData {
  /** Objetivo ou tema de estudo (ex: 'Aprender React e TypeScript') */
  topic: string;
  /** Data limite final para conclusão do estudo ('YYYY-MM-DD') */
  deadline: string;
  /** Dias da semana em que o estudante tem disponibilidade para estudar */
  availableDays: Weekday[];
  /** Duração de cada sessão de estudo em minutos (ex: 30, 45, 60, 90, 120) */
  sessionDurationMinutes: number;
  /** Horário preferencial de início das sessões no formato 'HH:mm' (ex: '19:00') */
  preferredStartTime: string;
  /** ID opcional do objetivo cadastrado ao qual o cronograma se vincula */
  goalId?: string;
}

/**
 * Estrutura completa de um cronograma de estudo gerado
 */
export interface StudySchedule {
  /** Identificador único do cronograma */
  id: string;
  /** Título do cronograma de estudos */
  title: string;
  /** Parâmetros de entrada utilizados para gerar o cronograma */
  parameters: ScheduleFormData;
  /** Lista ordenada cronologicamente de sessões */
  sessions: StudySession[];
  /** Timestamp ISO de criação */
  createdAt: string;
  /** Timestamp ISO de última atualização */
  updatedAt: string;
}
