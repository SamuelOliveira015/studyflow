/**
 * Modal de Geração e Exportação de Cronogramas de Estudo (StudyFlow)
 * 
 * Permite ao estudante:
 * 1. Escolher um objetivo cadastrado ou digitar um novo tema.
 * 2. Definir o prazo final.
 * 3. Selecionar os dias disponíveis da semana (ex: Seg, Qua, Sex).
 * 4. Escolher a duração das sessões e o horário de início.
 * 5. Gerar o cronograma com validação completa.
 * 6. Visualizar as sessões organizadas cronologicamente.
 * 7. Baixar o arquivo .ics para importar no Google Agenda com 1 clique.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { StudyGoal } from '../types/goal';
import {
  ScheduleFormData,
  StudySession,
  Weekday,
  WEEKDAY_LABELS,
  WEEKDAY_SHORT_LABELS,
} from '../types/schedule';
import { addDaysToToday, formatCalendarDate, isValidCalendarDateString } from '../utils/dateUtils';
import { downloadICalendarFile, generateICalendarContent, generateSafeCalendarFileName } from '../utils/calendarUtils';
import { generateStudySchedule } from '../services/aiScheduleService';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: StudyGoal[];
  initialGoal?: StudyGoal | null;
  onShowToast: (message: string) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  goals,
  initialGoal,
  onShowToast,
}) => {
  // Campos do formulário
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [deadline, setDeadline] = useState('');
  const [availableDays, setAvailableDays] = useState<Weekday[]>([1, 3, 5]); // Padrão: Seg, Qua, Sex
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(60);
  const [preferredStartTime, setPreferredStartTime] = useState<string>('19:00');

  // Estados de processo
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedSessions, setGeneratedSessions] = useState<StudySession[]>([]);
  const [generationSource, setGenerationSource] = useState<'ai' | 'local' | null>(null);

  // Inicialização quando o modal abre
  useEffect(() => {
    if (!isOpen) {
      setGeneratedSessions([]);
      setGenerationSource(null);
      setErrorMessage(null);
      return;
    }

    if (initialGoal) {
      setSelectedGoalId(initialGoal.id);
      setTopic(initialGoal.title);
      setDeadline(initialGoal.deadline);
    } else {
      setSelectedGoalId('');
      setTopic('');
      // Sugere como prazo padrão 14 dias à frente
      setDeadline(addDaysToToday(14));
    }

    setAvailableDays([1, 3, 5]);
    setSessionDurationMinutes(60);
    setPreferredStartTime('19:00');
    setErrorMessage(null);
  }, [isOpen, initialGoal]);

  if (!isOpen) return null;

  // Alternar dia da semana no seletor
  const handleToggleWeekday = (day: Weekday) => {
    setAvailableDays((current) => {
      if (current.includes(day)) {
        // Não deixa desmarcar todos os dias
        if (current.length === 1) {
          setErrorMessage('Selecione pelo menos um dia da semana para estudar.');
          return current;
        }
        setErrorMessage(null);
        return current.filter((d) => d !== day);
      } else {
        setErrorMessage(null);
        return [...current, day].sort();
      }
    });
  };

  // Ao selecionar um objetivo existente no dropdown
  const handleGoalSelect = (goalId: string) => {
    setSelectedGoalId(goalId);
    if (!goalId) {
      return;
    }
    const found = goals.find((g) => g.id === goalId);
    if (found) {
      setTopic(found.title);
      if (found.deadline && isValidCalendarDateString(found.deadline)) {
        setDeadline(found.deadline);
      }
    }
  };

  // Geração do cronograma
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações
    if (!topic.trim()) {
      setErrorMessage('Informe o objetivo ou tema que você deseja aprender.');
      return;
    }

    if (!deadline || !isValidCalendarDateString(deadline)) {
      setErrorMessage('Defina uma data limite válida para o seu cronograma.');
      return;
    }

    if (availableDays.length === 0) {
      setErrorMessage('Selecione pelo menos um dia da semana disponível para estudar.');
      return;
    }

    setIsLoading(true);

    const formData: ScheduleFormData = {
      topic: topic.trim(),
      deadline,
      availableDays,
      sessionDurationMinutes,
      preferredStartTime,
      goalId: selectedGoalId || undefined,
    };

    try {
      const result = await generateStudySchedule(formData);

      if (result.sessions.length === 0) {
        setErrorMessage(
          'Nenhuma data de estudo foi encontrada entre amanhã e a data limite para os dias selecionados. Tente ampliar o prazo ou adicionar mais dias da semana.'
        );
        setIsLoading(false);
        return;
      }

      setGeneratedSessions(result.sessions);
      setGenerationSource(result.source);

      if (result.source === 'ai') {
        onShowToast('Cronograma criado com sucesso!');
      } else {
        onShowToast('Cronograma gerado no modo local.');
      }
    } catch {
      setErrorMessage('Ocorreu um erro ao gerar o cronograma. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Exportar para Google Agenda (.ics)
  const handleDownloadCalendar = () => {
    if (generatedSessions.length === 0) {
      setErrorMessage('Não há sessões no cronograma para exportar.');
      return;
    }

    const icsContent = generateICalendarContent(
      generatedSessions,
      `StudyFlow - ${topic}`
    );

    if (!icsContent) {
      setErrorMessage('Falha ao gerar o arquivo de calendário. Verifique os dados das sessões.');
      return;
    }

    const fileName = generateSafeCalendarFileName(`cronograma-${topic}`, deadline);
    const success = downloadICalendarFile(icsContent, fileName);

    if (success) {
      onShowToast('Arquivo de calendário baixado.');
    } else {
      setErrorMessage('Não foi possível iniciar o download do arquivo de calendário.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Cabeçalho do Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 id="schedule-modal-title" className="text-base font-semibold text-slate-900">
                Criar Cronograma de Estudos
              </h2>
              <p className="text-xs text-slate-500">
                Organize suas sessões conforme seus dias e horários livres.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal: Formulário ou Visualização */}
        <div className="p-6 overflow-y-auto space-y-5 grow">
          {/* Alerta de Erro */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {generatedSessions.length === 0 ? (
            /* ETAPA 1: Formulário de Configuração */
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Seleção opcional a partir de meta existente */}
              {goals.length > 0 && (
                <div>
                  <label htmlFor="select-existing-goal" className="block text-xs font-semibold text-slate-700 mb-1">
                    Vincular a um Objetivo Cadastrado <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <select
                    id="select-existing-goal"
                    value={selectedGoalId}
                    onChange={(e) => handleGoalSelect(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">Digitar um novo tema livremente...</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title} ({formatCalendarDate(goal.deadline)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Título ou Tema do Estudo */}
              <div>
                <label htmlFor="schedule-topic" className="block text-xs font-semibold text-slate-700 mb-1">
                  O que você vai estudar? <span className="text-red-500">*</span>
                </label>
                <input
                  id="schedule-topic"
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Introdução a Estruturas de Dados e Algoritmos"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Grid: Prazo e Horário de Início */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Prazo Limite */}
                <div>
                  <label htmlFor="schedule-deadline" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Data Limite</span> <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="schedule-deadline"
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  />
                </div>

                {/* Horário de Início */}
                <div>
                  <label htmlFor="schedule-start-time" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Horário Preferencial de Início</span>
                  </label>
                  <input
                    id="schedule-start-time"
                    type="time"
                    required
                    value={preferredStartTime}
                    onChange={(e) => setPreferredStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* Duração da Sessão */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Duração de Cada Sessão
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { minutes: 30, label: '30 minutos' },
                    { minutes: 45, label: '45 minutos' },
                    { minutes: 60, label: '1 hora' },
                    { minutes: 90, label: '1h 30min' },
                  ].map((opt) => (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() => setSessionDurationMinutes(opt.minutes)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        sessionDurationMinutes === opt.minutes
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold ring-1 ring-indigo-400/30'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dias da Semana Disponíveis */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dias Disponíveis da Semana <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleWeekday(day)}
                        title={WEEKDAY_LABELS[day]}
                        className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {WEEKDAY_SHORT_LABELS[day]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Selecione os dias em que você pode estudar (ex: Segundas, Quartas e Sextas).
                </p>
              </div>

              {/* Botão de Envio */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Gerando seu cronograma...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Gerar meu cronograma</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ETAPA 2: Visualização do Cronograma Gerado */
            <div className="space-y-4">
              {/* Aviso de Origem (IA ou Local) */}
              <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-indigo-900 font-medium">
                  {generationSource === 'ai' ? (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Cronograma criado com sucesso via inteligência artificial!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Cronograma gerado no modo local (Offline / Custo Zero).</span>
                    </>
                  )}
                </div>
                <span className="font-mono font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                  {generatedSessions.length} {generatedSessions.length === 1 ? 'sessão' : 'sessões'}
                </span>
              </div>

              {/* Lista Organizada Cronologicamente */}
              <div className="space-y-3">
                {generatedSessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-all space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-900">
                        {session.title}
                      </span>
                      <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatCalendarDate(session.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {session.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Ações de Exportação e Ajuste */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedSessions([]);
                    setGenerationSource(null);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ajustar parâmetros</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCalendar}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar para Google Agenda (.ics)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
