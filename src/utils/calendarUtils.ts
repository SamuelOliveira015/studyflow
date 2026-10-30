/**
 * Utilitários para geração e exportação de calendários iCalendar (.ics) compatíveis com RFC 5545
 * 
 * Estratégia de Fuso Horário:
 * Conforme RFC 5545 (Seção 3.3.5 - Formato DATE-TIME), utiliza-se a representação "Floating Local Time"
 * (formato YYYYMMDDTHHmmSS sem o sufixo 'Z' e sem especificação rígida de TZID).
 * Isso garante que o evento seja importado na hora local exata configurada no dispositivo
 * ou calendário do estudante (ex.: 19:00 é 19:00 onde quer que o estudante esteja).
 */

import { StudySession } from '../types/schedule';
import { isValidCalendarDateString } from './dateUtils';

/**
 * Valida se uma string representa um horário válido no formato 'HH:mm' de 24 horas (00:00 a 23:59).
 */
export function isValidTimeString(timeStr: unknown): timeStr is string {
  if (typeof timeStr !== 'string') return false;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeStr.trim());
  return match !== null;
}

/**
 * Converte um horário 'HH:mm' para o número total de minutos desde a meia-noite.
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Adiciona minutos a um horário 'HH:mm' e retorna o novo horário no formato 'HH:mm'.
 * Não transborda 23:59 por segurança.
 */
export function addMinutesToTimeString(timeStr: string, minutesToAdd: number): string {
  const currentMinutes = timeStringToMinutes(timeStr);
  const total = Math.min(24 * 60 - 1, Math.max(0, currentMinutes + minutesToAdd));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Valida a integridade temporal de uma sessão individual de estudo.
 * Garante que a data é válida, os horários estão no formato correto e endTime > startTime.
 */
export function isStudySessionValid(session: unknown): session is StudySession {
  if (!session || typeof session !== 'object') return false;
  const s = session as Record<string, unknown>;

  if (typeof s.id !== 'string' || !s.id.trim()) return false;
  if (typeof s.title !== 'string' || !s.title.trim()) return false;
  if (typeof s.description !== 'string') return false;

  // Validação de data
  if (!isValidCalendarDateString(s.date)) return false;

  // Validação de horários
  if (!isValidTimeString(s.startTime) || !isValidTimeString(s.endTime)) return false;

  // O horário de término deve ser estritamente posterior ao de início
  const startMinutes = timeStringToMinutes(s.startTime);
  const endMinutes = timeStringToMinutes(s.endTime);
  if (endMinutes <= startMinutes) return false;

  return true;
}

/**
 * Escapa caracteres reservados conforme especificação RFC 5545 (Seção 3.3.11).
 * Caracteres que devem ser escapados em propriedades de texto (SUMMARY, DESCRIPTION):
 * - Barra invertida (\ -> \\)
 * - Ponto e vírgula (; -> \;)
 * - Vírgula (, -> \,)
 * - Quebras de linha (\n ou \r\n -> \n escapado)
 */
export function escapeICalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n');
}

/**
 * Aplica line-folding conforme RFC 5545 (Seção 3.1).
 * Linhas com mais de 75 octetos/caracteres devem ser divididas inserindo CRLF seguido de espaço em branco.
 */
export function foldICalLine(line: string, maxLength: number = 75): string {
  if (line.length <= maxLength) {
    return line;
  }

  const parts: string[] = [];
  parts.push(line.slice(0, maxLength));
  let remaining = line.slice(maxLength);

  // Linhas subsequentes têm 1 espaço inicial, então o comprimento máximo do conteúdo restante é maxLength - 1
  while (remaining.length > 0) {
    const chunk = remaining.slice(0, maxLength - 1);
    parts.push(' ' + chunk);
    remaining = remaining.slice(maxLength - 1);
  }

  return parts.join('\r\n');
}

/**
 * Converte data ('YYYY-MM-DD') e horário ('HH:mm') para o formato DATE-TIME local da RFC 5545 ('YYYYMMDDTHHMMSS').
 */
export function toFloatingDateTime(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.replace(/-/g, '');
  const cleanTime = timeStr.replace(/:/g, '') + '00';
  return `${cleanDate}T${cleanTime}`;
}

/**
 * Gera um timestamp DTSTAMP no formato UTC Zulu para o arquivo iCalendar.
 */
export function generateDtStamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Converte uma sessão individual de estudo em um bloco VEVENT da RFC 5545.
 */
export function sessionToVEvent(session: StudySession, dtstamp: string): string[] {
  const dtstart = toFloatingDateTime(session.date, session.startTime);
  const dtend = toFloatingDateTime(session.date, session.endTime);

  // UID único e estável baseado no ID da sessão e domínio do app
  const uid = `${session.id}@studyflow.app`;

  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    foldICalLine(`SUMMARY:${escapeICalText(session.title)}`),
  ];

  if (session.description && session.description.trim()) {
    lines.push(foldICalLine(`DESCRIPTION:${escapeICalText(session.description.trim())}`));
  }

  lines.push('STATUS:CONFIRMED');
  lines.push('END:VEVENT');

  return lines;
}

/**
 * Gera o conteúdo textual completo de um arquivo .ics compatível com RFC 5545.
 * Apenas sessões válidas são incluídas. Se nenhuma sessão for válida, retorna string vazia.
 * Utiliza rigorosamente quebras de linha padrão CRLF (\r\n).
 */
export function generateICalendarContent(
  sessions: StudySession[],
  calendarTitle: string = 'StudyFlow - Cronograma de Estudos'
): string {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return '';
  }

  const validSessions = sessions.filter(isStudySessionValid);
  if (validSessions.length === 0) {
    return '';
  }

  const dtstamp = generateDtStamp();

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudyFlow//Cronograma de Estudos//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldICalLine(`X-WR-CALNAME:${escapeICalText(calendarTitle)}`),
    'X-WR-TIMEZONE:Floating',
  ];

  for (const session of validSessions) {
    const eventLines = sessionToVEvent(session, dtstamp);
    lines.push(...eventLines);
  }

  lines.push('END:VCALENDAR');

  // RFC 5545 exige que cada linha termine com CRLF (\r\n) e o arquivo finalize com CRLF
  return lines.join('\r\n') + '\r\n';
}

/**
 * Gera um nome de arquivo seguro e higienizado para o arquivo .ics exportado.
 * Ex: "cronograma-estudos-react-2026-10-30.ics"
 */
export function generateSafeCalendarFileName(title: string, dateStr?: string): string {
  const sanitizedTitle = (title || 'cronograma-estudos')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9_-]/g, '-') // substitui caracteres especiais por traço
    .replace(/-+/g, '-') // remove múltiplos traços
    .replace(/^-|-$/g, '') // remove traços no início e fim
    .slice(0, 50); // limita tamanho

  const dateSuffix = dateStr || new Date().toISOString().split('T')[0];
  return `${sanitizedTitle || 'cronograma'}-${dateSuffix}.ics`;
}

/**
 * Dispara o download automático do arquivo .ics no navegador do usuário utilizando Blob e URL.createObjectURL.
 * Libera a URL temporária da memória imediatamente após o clique simulado.
 * 
 * Funciona de forma 100% client-side, sem necessidade de backend ou permissões de terceiros.
 */
export function downloadICalendarFile(icsContent: string, fileName: string): boolean {
  if (!icsContent || !icsContent.trim()) {
    console.warn('Tentativa de download de calendário com conteúdo vazio.');
    return false;
  }

  // Verifica se o ambiente possui suporte a Blob e DOM
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof Blob === 'undefined') {
    return false;
  }

  try {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.setAttribute('download', fileName);
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();

    // Limpeza da URL de memória e remoção do elemento
    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 150);

    return true;
  } catch (error) {
    console.error('Falha ao exportar arquivo .ics:', error);
    return false;
  }
}
