/**
 * Utilitários para manipulação e cálculo de datas de calendário
 * 
 * Regras de ouro para datas de calendário (sem horário):
 * 1. O formato padrão é 'YYYY-MM-DD'.
 * 2. As operações de data de calendário não devem depender de fusos horários UTC
 *    ou horários arbitrários (evita problemas de virada de dia às 21:00 UTC-3).
 * 3. Cálculos de dias de diferença usam Date.UTC(year, month, day) como épocas de calendário
 *    puras para ficarem imunes a mudanças de horário de verão (DST shifts de 23h ou 25h).
 */

export interface DeadlineCalculationResult {
  text: string;
  isUrgent: boolean;
  isOverdue: boolean;
  diffLabel: string | null;
  isValid: boolean;
}

/**
 * Valida se uma string está no formato estrito YYYY-MM-DD e representa uma data de calendário válida.
 */
export function isValidCalendarDateString(dateStr: unknown): dateStr is string {
  if (typeof dateStr !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  // Verifica se o dia é compatível com o mês e ano (incluindo anos bissextos)
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

/**
 * Retorna a data de hoje formatada como 'YYYY-MM-DD' no fuso horário local do usuário.
 */
export function getTodayCalendarDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adiciona ou subtrai dias de uma data de calendário local retornando no formato 'YYYY-MM-DD'.
 * Respeita viradas de mês, ano e anos bissextos.
 */
export function addDaysToToday(daysToAdd: number): string {
  const now = new Date();
  // Usamos construtor local com dias adicionados
  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd);
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte 'YYYY-MM-DD' em timestamps UTC à meia-noite para cálculo puramente numérico
 * de dias de calendário, imune a mudanças de horário de verão (DST).
 */
export function getCalendarDaysDifference(
  deadlineDateStr: string,
  baseDateStr: string = getTodayCalendarDate()
): number | null {
  if (!isValidCalendarDateString(deadlineDateStr) || !isValidCalendarDateString(baseDateStr)) {
    return null;
  }

  const [dYear, dMonth, dDay] = deadlineDateStr.split('-').map(Number);
  const [bYear, bMonth, bDay] = baseDateStr.split('-').map(Number);

  // UTC puro para os dias de calendário evita desvios de 23h/25h do horário de verão
  const deadlineUtc = Date.UTC(dYear, dMonth - 1, dDay);
  const baseUtc = Date.UTC(bYear, bMonth - 1, bDay);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((deadlineUtc - baseUtc) / MS_PER_DAY);
}

/**
 * Formata 'YYYY-MM-DD' de forma amigável em pt-BR (ex: "30 de out. de 2026").
 */
export function formatCalendarDate(dateStr: string): string {
  if (!isValidCalendarDateString(dateStr)) {
    return dateStr || 'Sem prazo definido';
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  // Instancia a data local especificando ano, mês (0-indexed) e dia
  const date = new Date(year, month - 1, day);

  try {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calcula todas as informações de prazo para apresentação no GoalCard.
 * Preserva estritamente os textos originais:
 * - "Vence hoje!"
 * - "Vence amanhã"
 * - "Vence em X dias"
 * - "Atrasado há X dia(s)"
 * - "Meta concluída"
 */
export function calculateDeadlineInfo(
  deadlineStr: string,
  status: 'nao_iniciado' | 'em_andamento' | 'concluido',
  referenceDateStr: string = getTodayCalendarDate()
): DeadlineCalculationResult {
  if (!deadlineStr || !isValidCalendarDateString(deadlineStr)) {
    return {
      text: deadlineStr ? 'Prazo com formato inválido' : 'Sem prazo definido',
      isUrgent: false,
      isOverdue: false,
      diffLabel: null,
      isValid: false,
    };
  }

  const formattedDate = formatCalendarDate(deadlineStr);

  if (status === 'concluido') {
    return {
      text: formattedDate,
      isUrgent: false,
      isOverdue: false,
      diffLabel: 'Meta concluída',
      isValid: true,
    };
  }

  const diffDays = getCalendarDaysDifference(deadlineStr, referenceDateStr);

  if (diffDays === null) {
    return {
      text: formattedDate,
      isUrgent: false,
      isOverdue: false,
      diffLabel: null,
      isValid: false,
    };
  }

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      text: formattedDate,
      isUrgent: true,
      isOverdue: true,
      diffLabel: `Atrasado há ${absDays} dia(s)`,
      isValid: true,
    };
  }

  if (diffDays === 0) {
    return {
      text: formattedDate,
      isUrgent: true,
      isOverdue: false,
      diffLabel: 'Vence hoje!',
      isValid: true,
    };
  }

  if (diffDays === 1) {
    return {
      text: formattedDate,
      isUrgent: true,
      isOverdue: false,
      diffLabel: 'Vence amanhã',
      isValid: true,
    };
  }

  if (diffDays <= 3) {
    return {
      text: formattedDate,
      isUrgent: true,
      isOverdue: false,
      diffLabel: `Vence em ${diffDays} dias`,
      isValid: true,
    };
  }

  return {
    text: formattedDate,
    isUrgent: false,
    isOverdue: false,
    diffLabel: null,
    isValid: true,
  };
}
