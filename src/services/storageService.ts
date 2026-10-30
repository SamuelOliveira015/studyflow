/**
 * Serviço isolado para gerenciamento de armazenamento do StudyFlow
 * Responsável por todas as operações de persistência no localStorage sem backend.
 * 
 * Implementa validação estrutural rigorosa, preservação de dados válidos,
 * recuperação segura e tratamento de exceções (como QuotaExceededError).
 */

import { GoalFormData, GoalStats, GoalStatus, StudyGoal } from '../types/goal';
import { addDaysToToday, getTodayCalendarDate, isValidCalendarDateString } from '../utils/dateUtils';

const STORAGE_KEY = 'studyflow_goals_v1';
const FIRST_VISIT_KEY = 'studyflow_has_visited';

/**
 * Status permitidos para validação
 */
const ALLOWED_STATUSES: readonly GoalStatus[] = ['nao_iniciado', 'em_andamento', 'concluido'];

/**
 * Validação estrutural de um objeto como StudyGoal válido
 */
export function isGoalValid(item: unknown): item is StudyGoal {
  if (!item || typeof item !== 'object') return false;

  const candidate = item as Record<string, unknown>;

  // Checagem de ID
  if (typeof candidate.id !== 'string' || candidate.id.trim() === '') {
    return false;
  }

  // Checagem de Título (obrigatório, string não vazia)
  if (typeof candidate.title !== 'string' || candidate.title.trim() === '') {
    return false;
  }

  // Checagem de Descrição (deve ser string se existir)
  if (typeof candidate.description !== 'string') {
    return false;
  }

  // Checagem de Deadline (deve ser string YYYY-MM-DD válida)
  if (typeof candidate.deadline !== 'string' || !isValidCalendarDateString(candidate.deadline)) {
    return false;
  }

  // Checagem de Status
  if (
    typeof candidate.status !== 'string' ||
    !ALLOWED_STATUSES.includes(candidate.status as GoalStatus)
  ) {
    return false;
  }

  // Checagem de createdAt e updatedAt (se existirem, devem ser strings; se ausentes, serão recompostos)
  if (candidate.createdAt !== undefined && typeof candidate.createdAt !== 'string') {
    return false;
  }
  if (candidate.updatedAt !== undefined && typeof candidate.updatedAt !== 'string') {
    return false;
  }

  return true;
}

/**
 * Tenta higienizar e normalizar um item potencialmente recuperável
 */
export function sanitizeGoal(item: unknown): StudyGoal | null {
  if (!item || typeof item !== 'object') return null;
  const candidate = item as Record<string, unknown>;

  // Se não tem título aceitável, não é recuperável
  if (typeof candidate.title !== 'string' || candidate.title.trim() === '') {
    return null;
  }

  const id = typeof candidate.id === 'string' && candidate.id.trim() !== ''
    ? candidate.id.trim()
    : `goal-rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const title = candidate.title.trim();
  const description = typeof candidate.description === 'string' ? candidate.description.trim() : '';

  // Deadline: se inválido, adota a data de hoje como fallback seguro
  const deadline = typeof candidate.deadline === 'string' && isValidCalendarDateString(candidate.deadline)
    ? candidate.deadline
    : getTodayCalendarDate();

  // Status: se inválido, adota 'nao_iniciado' como fallback
  const status: GoalStatus = typeof candidate.status === 'string' && ALLOWED_STATUSES.includes(candidate.status as GoalStatus)
    ? (candidate.status as GoalStatus)
    : 'nao_iniciado';

  const now = new Date().toISOString();
  const createdAt = typeof candidate.createdAt === 'string' && candidate.createdAt ? candidate.createdAt : now;
  const updatedAt = typeof candidate.updatedAt === 'string' && candidate.updatedAt ? candidate.updatedAt : now;

  return {
    id,
    title,
    description,
    deadline,
    status,
    createdAt,
    updatedAt,
  };
}

/**
 * Gera os dados de exemplo didáticos baseados na data local de hoje do usuário
 */
export function getSampleGoals(): StudyGoal[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'goal-ex-1',
      title: 'Aprender Fundamentos de Lógica e Variáveis',
      description: 'Estudar conceitos básicos de tipos primitivos, estruturas condicionais e laços de repetição.',
      deadline: addDaysToToday(3),
      status: 'em_andamento',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'goal-ex-2',
      title: 'Leitura do Capítulo 1: Introdução aos Algoritmos',
      description: 'Fazer fichamento das anotações principais e responder os exercícios teóricos no caderno.',
      deadline: addDaysToToday(7),
      status: 'nao_iniciado',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'goal-ex-3',
      title: 'Configurar Ambiente de Estudos e VS Code',
      description: 'Instalar extensões recomendadas, temas com bom contraste e organizar pastas por matéria.',
      deadline: addDaysToToday(-1),
      status: 'concluido',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export const storageService = {
  /**
   * Recupera todos os objetivos salvos no localStorage com validação estrutural.
   * Não apaga todo o armazenamento se encontrar um registro inválido.
   */
  getGoals(): StudyGoal[] {
    try {
      const rawData = localStorage.getItem(STORAGE_KEY);
      if (!rawData) {
        // Se for a primeira visita do usuário, inicializa com exemplos úteis
        const hasVisited = localStorage.getItem(FIRST_VISIT_KEY);
        if (!hasVisited) {
          try {
            localStorage.setItem(FIRST_VISIT_KEY, 'true');
          } catch {
            // Ignora se o localStorage estiver bloqueado em modo anônimo restrito
          }
          const samples = getSampleGoals();
          this.saveGoals(samples);
          return samples;
        }
        return [];
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawData);
      } catch (parseError) {
        console.warn('JSON inválido detectado no localStorage do StudyFlow:', parseError);
        // Preserva o dado bruto em chave de emergência para não perder conteúdo do estudante
        try {
          localStorage.setItem(`${STORAGE_KEY}_corrupted_backup_${Date.now()}`, rawData);
        } catch {
          // ignora se falhar
        }
        return [];
      }

      if (!Array.isArray(parsed)) {
        console.warn('Dado no localStorage não é um array:', parsed);
        return [];
      }

      // Validação item a item
      const validGoals: StudyGoal[] = [];
      let hadInvalidEntries = false;

      for (const item of parsed) {
        if (isGoalValid(item)) {
          validGoals.push(item);
        } else {
          hadInvalidEntries = true;
          // Tenta higienizar para preservar o dado do usuário
          const recovered = sanitizeGoal(item);
          if (recovered) {
            console.info('Objetivo recuperado/higienizado com sucesso:', item);
            validGoals.push(recovered);
          } else {
            console.warn('Objetivo corrompido descartado na leitura:', item);
          }
        }
      }

      // Se houve correções e a lista final é válida, atualiza o storage silenciosamente para mantê-lo limpo
      if (hadInvalidEntries && validGoals.length > 0) {
        this.saveGoals(validGoals);
      }

      return validGoals;
    } catch (error) {
      console.error('Erro inesperado ao recuperar objetivos do localStorage:', error);
      return [];
    }
  },

  /**
   * Salva a lista completa de objetivos no localStorage com tratamento de exceções (ex.: QuotaExceededError).
   * Retorna boolean indicando sucesso.
   */
  saveGoals(goals: StudyGoal[]): boolean {
    try {
      // Garante que só salva itens válidos
      const verified = goals.filter(isGoalValid);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(verified));
      return true;
    } catch (error: unknown) {
      console.error('Falha ao salvar objetivos no localStorage:', error);
      // Detecção de QuotaExceededError (cota de 5MB atingida)
      if (
        error instanceof DOMException &&
        (error.code === 22 ||
          error.code === 1014 ||
          error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      ) {
        console.warn('Limite de armazenamento (localStorage quota) atingido.');
      }
      return false;
    }
  },

  /**
   * Cadastra um novo objetivo
   */
  createGoal(formData: GoalFormData): StudyGoal | null {
    if (!formData.title || !formData.title.trim()) {
      return null;
    }
    if (!isValidCalendarDateString(formData.deadline)) {
      return null;
    }

    const goals = this.getGoals();
    const now = new Date().toISOString();

    const newId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `goal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newGoal: StudyGoal = {
      id: newId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      deadline: formData.deadline,
      status: formData.status,
      createdAt: now,
      updatedAt: now,
    };

    const updatedGoals = [newGoal, ...goals];
    const saved = this.saveGoals(updatedGoals);
    return saved ? newGoal : null;
  },

  /**
   * Edita um objetivo existente
   */
  updateGoal(id: string, updates: Partial<GoalFormData>): StudyGoal | null {
    const goals = this.getGoals();
    const index = goals.findIndex((g) => g.id === id);

    if (index === -1) {
      return null;
    }

    const current = goals[index];
    const newTitle = updates.title !== undefined ? updates.title.trim() : current.title;
    if (!newTitle) {
      return null;
    }

    const newDeadline = updates.deadline !== undefined ? updates.deadline : current.deadline;
    if (!isValidCalendarDateString(newDeadline)) {
      return null;
    }

    const newStatus = updates.status !== undefined ? updates.status : current.status;
    if (!ALLOWED_STATUSES.includes(newStatus)) {
      return null;
    }

    const updatedGoal: StudyGoal = {
      ...current,
      title: newTitle,
      description: updates.description !== undefined ? updates.description.trim() : current.description,
      deadline: newDeadline,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    goals[index] = updatedGoal;
    const saved = this.saveGoals(goals);
    return saved ? updatedGoal : null;
  },

  /**
   * Exclui um objetivo por ID
   */
  deleteGoal(id: string): boolean {
    const goals = this.getGoals();
    const filtered = goals.filter((g) => g.id !== id);
    if (filtered.length !== goals.length) {
      return this.saveGoals(filtered);
    }
    return false;
  },

  /**
   * Carrega os dados de exemplo pré-definidos (baseados na data local de hoje)
   */
  loadSampleGoals(): StudyGoal[] {
    const samples = getSampleGoals();
    this.saveGoals(samples);
    return samples;
  },

  /**
   * Limpa todos os dados salvos
   */
  clearAllGoals(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
    }
  },

  /**
   * Calcula estatísticas consolidadas dos objetivos de forma segura
   */
  calculateStats(goals: StudyGoal[]): GoalStats {
    if (!Array.isArray(goals)) {
      return { total: 0, naoIniciados: 0, emAndamento: 0, concluidos: 0, progressoPorcentagem: 0 };
    }

    const total = goals.length;
    let naoIniciados = 0;
    let emAndamento = 0;
    let concluidos = 0;

    for (const goal of goals) {
      if (goal && typeof goal === 'object') {
        if (goal.status === 'nao_iniciado') naoIniciados++;
        else if (goal.status === 'em_andamento') emAndamento++;
        else if (goal.status === 'concluido') concluidos++;
      }
    }

    const progressoPorcentagem = total > 0 ? Math.round((concluidos / total) * 100) : 0;

    return {
      total,
      naoIniciados,
      emAndamento,
      concluidos,
      progressoPorcentagem,
    };
  },
};
