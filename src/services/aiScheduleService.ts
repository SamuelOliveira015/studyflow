/**
 * Serviço de Integração do Cronograma com IA (Google Gemini API) e Fallback Local
 * 
 * Regra de Segurança Primária:
 * NUNCA injetamos chaves secretas no código enviado ao navegador (VITE_GEMINI_API_KEY).
 * 
 * Como o fluxo funciona de forma segura:
 * 1. O motor local calcula com precisão todas as datas, horários e duração das sessões.
 * 2. Se houver um endpoint seguro de backend configurado (ex: '/api/generate-schedule'),
 *    ele envia o tópico e a quantidade de sessões para a IA gerar títulos e ementas ricas.
 * 3. Se a IA responder com sucesso, mesclamos o conteúdo gerado com as datas e horários já calculados.
 * 4. Se a IA estiver sem conexão, a rota falhar ou a quota gratuita for atingida (HTTP 429),
 *    o gerador local pedagógico assume automaticamente, sem interromper o estudante.
 */

import { ScheduleFormData, StudySession } from '../types/schedule';
import { generateLocalSchedule } from './scheduleGenerator';

export interface AIScheduleResult {
  sessions: StudySession[];
  source: 'ai' | 'local';
  message?: string;
}

/**
 * Interface simples para o conteúdo de cada sessão retornado pela IA
 */
interface AISessionTopic {
  title: string;
  description: string;
}

/**
 * Tenta enriquecer as sessões com a IA através de um backend proxy seguro.
 * Não inclui nenhuma chave secreta no frontend.
 */
async function fetchAIEnhancedTopics(
  topic: string,
  sessionCount: number
): Promise<AISessionTopic[] | null> {
  // Tentamos chamar a rota de proxy segura do servidor se ela estiver disponível
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 segundos de timeout máximo

    const response = await fetch('/api/generate-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        sessionCount,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (Array.isArray(data?.sessions) && data.sessions.length > 0) {
      // Valida se os itens retornados possuem título e descrição como strings
      const validTopics = data.sessions.filter(
        (item: unknown) =>
          typeof (item as Record<string, unknown>)?.title === 'string' &&
          typeof (item as Record<string, unknown>)?.description === 'string'
      );
      return validTopics.length > 0 ? validTopics : null;
    }

    return null;
  } catch {
    // Falha de rede, rota indisponível ou timeout: segue para o fallback local
    return null;
  }
}

/**
 * Função Principal de Geração de Cronograma:
 * Combina o cálculo rigoroso das datas com o conteúdo pedagógico (IA ou Local).
 */
export async function generateStudySchedule(
  formData: ScheduleFormData,
  startDateStr?: string
): Promise<AIScheduleResult> {
  // 1. Gera a estrutura base com datas, horários e conteúdo pedagógico local
  const localSessions = generateLocalSchedule(formData, startDateStr);

  if (localSessions.length === 0) {
    return {
      sessions: [],
      source: 'local',
      message: 'Nenhuma data compatível foi encontrada entre o início e a data limite para os dias selecionados.',
    };
  }

  // 2. Tenta enriquecer com IA sem bloquear o estudante se falhar
  const aiTopics = await fetchAIEnhancedTopics(formData.topic, localSessions.length);

  // 3. Se a IA retornou títulos e descrições válidos, mesclamos mantendo datas e horários intactos
  if (aiTopics && aiTopics.length > 0) {
    const enhancedSessions: StudySession[] = localSessions.map((session, index) => {
      const aiTopic = aiTopics[index];
      return {
        ...session,
        title: aiTopic?.title?.trim() || session.title,
        description: aiTopic?.description?.trim() || session.description,
      };
    });

    return {
      sessions: enhancedSessions,
      source: 'ai',
      message: 'Cronograma personalizado gerado com inteligência artificial!',
    };
  }

  // 4. Se a IA estiver indisponível ou offline, retorna as sessões pedagógicas locais
  return {
    sessions: localSessions,
    source: 'local',
    message: 'Cronograma gerado pelo motor de estudos local (Modo Offline / Custo Zero).',
  };
}
