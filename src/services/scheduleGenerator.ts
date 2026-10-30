/**
 * Motor Local de Geração de Cronogramas de Estudo (StudyFlow)
 * 
 * Este arquivo faz a matemática de calendário:
 * 1. Pega os dias disponíveis selecionados pelo estudante (ex: Terça e Quinta).
 * 2. Percorre os dias a partir de amanhã até o prazo limite (deadline).
 * 3. Seleciona as datas correspondentes aos dias de estudo.
 * 4. Calcula o horário de término com base na duração informada (ex: 19:00 + 60 min = 20:00).
 * 5. Distribui os conteúdos de estudo de forma pedagógica (Fundamentos -> Prática -> Revisão).
 * 
 * Funciona 100% no navegador (offline), com zero dependências externas e custo R$ 0.
 */

import { ScheduleFormData, StudySession } from '../types/schedule';
import { addMinutesToTimeString } from '../utils/calendarUtils';
import { isValidCalendarDateString } from '../utils/dateUtils';

/**
 * Converte 'YYYY-MM-DD' para o dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado).
 * Usa ano, mês e dia locais para evitar distorções de fuso horário.
 */
export function getWeekdayFromDate(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay();
}

/**
 * Adiciona 1 dia a uma data 'YYYY-MM-DD' e retorna a próxima data no mesmo formato.
 */
export function getNextCalendarDay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const nextDate = new Date(year, month - 1, day + 1);
  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
  const nextDay = String(nextDate.getDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

/**
 * Encontra todas as datas de estudo válidas entre amanhã e a data limite.
 */
export function findAvailableStudyDates(
  startDateStr: string,
  deadlineStr: string,
  availableDays: number[]
): string[] {
  if (!isValidCalendarDateString(startDateStr) || !isValidCalendarDateString(deadlineStr)) {
    return [];
  }

  if (availableDays.length === 0) {
    return [];
  }

  const studyDates: string[] = [];
  let current = startDateStr;

  // Percorre dia a dia até atingir o prazo limite
  while (current <= deadlineStr) {
    const weekday = getWeekdayFromDate(current);
    if (availableDays.includes(weekday)) {
      studyDates.push(current);
    }
    current = getNextCalendarDay(current);
  }

  return studyDates;
}

/**
 * Cria tópicos pedagógicos padrão para quando a IA estiver indisponível ou offline.
 * Segue a lógica: Introdução -> Aprofundamento -> Prática -> Revisão.
 */
export function generateLocalPedagogicalPlan(topic: string, totalSessions: number): Array<{ title: string; description: string }> {
  if (totalSessions <= 0) return [];

  if (totalSessions === 1) {
    return [
      {
        title: `Visão Geral e Prática: ${topic}`,
        description: `Introdução aos principais conceitos de ${topic}, anotações fundamentais e aplicação em exercícios iniciais.`,
      },
    ];
  }

  if (totalSessions === 2) {
    return [
      {
        title: `Parte 1: Conceitos e Fundamentos de ${topic}`,
        description: `Compreender a base teórica, termos principais e estruturar as primeiras anotações sobre ${topic}.`,
      },
      {
        title: `Parte 2: Exercícios Práticos e Consolidação de ${topic}`,
        description: `Resolver problemas práticos, testar o conhecimento adquirido e revisar pontos de dúvida.`,
      },
    ];
  }

  const plan: Array<{ title: string; description: string }> = [];

  for (let i = 0; i < totalSessions; i++) {
    const sessionNum = i + 1;
    const progressRatio = i / (totalSessions - 1);

    if (progressRatio === 0) {
      plan.push({
        title: `Sessão ${sessionNum}: Introdução e Base Teórica de ${topic}`,
        description: `Mapear o escopo de ${topic}, entender a terminologia essencial e definir o roteiro de aprendizado.`,
      });
    } else if (progressRatio < 0.4) {
      plan.push({
        title: `Sessão ${sessionNum}: Estruturas e Conceitos Centrais de ${topic}`,
        description: `Aprofundar nos pilares teóricos e mecânicas mais importantes de ${topic}. Fazer fichamento de pontos-chave.`,
      });
    } else if (progressRatio < 0.8) {
      plan.push({
        title: `Sessão ${sessionNum}: Aplicação Prática e Resolução de Problemas`,
        description: `Colocar a mão na massa com exercícios reais, pequenos desafios e construção prática em ${topic}.`,
      });
    } else {
      plan.push({
        title: `Sessão ${sessionNum}: Revisão Final, Dúvidas e Autoavaliação`,
        description: `Revisar resumos criados, preencher lacunas de conhecimento e validar o domínio completo de ${topic}.`,
      });
    }
  }

  return plan;
}

/**
 * Gerador 100% Local: cria o cronograma completo com base nas datas e horários disponíveis.
 */
export function generateLocalSchedule(
  formData: ScheduleFormData,
  startDateStr?: string
): StudySession[] {
  // Por padrão começa a partir do dia seguinte a hoje (para dar tempo de se planejar)
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const defaultStart = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const start = startDateStr || defaultStart;
  const studyDates = findAvailableStudyDates(start, formData.deadline, formData.availableDays);

  if (studyDates.length === 0) {
    return [];
  }

  const duration = formData.sessionDurationMinutes || 60;
  const startTime = formData.preferredStartTime || '19:00';
  const endTime = addMinutesToTimeString(startTime, duration);

  const pedagogicalContent = generateLocalPedagogicalPlan(formData.topic, studyDates.length);

  return studyDates.map((date, index) => {
    const content = pedagogicalContent[index] || {
      title: `Sessão ${index + 1}: Estudo de ${formData.topic}`,
      description: `Sessão dedicada ao estudo contínuo de ${formData.topic}.`,
    };

    return {
      id: `session-${Date.now()}-${index + 1}`,
      date,
      startTime,
      endTime,
      title: content.title,
      description: content.description,
      goalId: formData.goalId,
      isCompleted: false,
    };
  });
}
