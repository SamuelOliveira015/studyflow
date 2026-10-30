/**
 * StudyFlow - Aplicação Web para Organização de Objetivos de Estudo
 * Criada para estudantes iniciantes com foco em usabilidade, acolhimento e clareza.
 * 
 * Requisitos atendidos integralmente:
 * - Cadastrar um objetivo com título, descrição, prazo e status;
 * - Listar os objetivos cadastrados;
 * - Editar um objetivo;
 * - Excluir um objetivo somente após uma confirmação;
 * - Exibir a quantidade de objetivos cadastrados;
 * - Salvar os dados no localStorage para que permaneçam após a atualização da página;
 * - Visual simples, acolhedor e organizado;
 * - Formulário fácil de entender;
 * - Cartões para apresentar os objetivos;
 * - Mensagens quando não houver objetivos;
 * - Interface responsiva;
 * - Textos em português do Brasil (pt-BR);
 * - TypeScript, separação de componentes, separação de tipos e serviço de armazenamento dedicado sem backend.
 */

import { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { FilterBar } from './components/FilterBar';
import { GoalCard } from './components/GoalCard';
import { GoalFormModal } from './components/GoalFormModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { EmptyState } from './components/EmptyState';
import { ScheduleModal } from './components/ScheduleModal';
import { storageService } from './services/storageService';
import { GoalFilter, GoalFormData, GoalStatus, SortOption, StudyGoal } from './types/goal';
import { Check, Lightbulb } from 'lucide-react';

export default function App() {
  // Lista principal de objetivos
  const [goals, setGoals] = useState<StudyGoal[]>([]);

  // Filtros, Busca e Ordenação
  const [currentFilter, setCurrentFilter] = useState<GoalFilter>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('prazo_asc');

  // Estados dos Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<StudyGoal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<StudyGoal | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleGoal, setScheduleGoal] = useState<StudyGoal | null>(null);

  // Notificação toast temporária para feedback ao estudante
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 3200);
  };

  // Carregamento inicial do localStorage na montagem
  useEffect(() => {
    const loadedGoals = storageService.getGoals();
    setGoals(loadedGoals);
  }, []);

  // Estatísticas calculadas em tempo real
  const stats = useMemo(() => {
    return storageService.calculateStats(goals);
  }, [goals]);

  // Contagens por aba de filtro
  const filterCounts = useMemo(() => {
    return {
      todos: goals.length,
      nao_iniciado: goals.filter((g) => g.status === 'nao_iniciado').length,
      em_andamento: goals.filter((g) => g.status === 'em_andamento').length,
      concluido: goals.filter((g) => g.status === 'concluido').length,
    };
  }, [goals]);

  // Objetivos filtrados e ordenados
  const filteredGoals = useMemo(() => {
    return goals
      .filter((goal) => {
        // Filtro por status
        if (currentFilter !== 'todos' && goal.status !== currentFilter) {
          return false;
        }

        // Filtro por termo de busca (título ou descrição)
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase().trim();
          const matchesTitle = goal.title.toLowerCase().includes(query);
          const matchesDesc = goal.description.toLowerCase().includes(query);
          if (!matchesTitle && !matchesDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'prazo_asc') {
          return a.deadline.localeCompare(b.deadline);
        }
        if (sortBy === 'prazo_desc') {
          return b.deadline.localeCompare(a.deadline);
        }
        if (sortBy === 'recentes') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'alfabetico') {
          return a.title.localeCompare(b.title, 'pt-BR');
        }
        return 0;
      });
  }, [goals, currentFilter, searchTerm, sortBy]);

  // Abertura do modal de criação
  const handleOpenNewGoal = () => {
    setEditingGoal(null);
    setIsFormModalOpen(true);
  };

  // Abertura do modal de edição
  const handleOpenEditGoal = (goal: StudyGoal) => {
    setEditingGoal(goal);
    setIsFormModalOpen(true);
  };

  // Submissão do formulário (Criar ou Editar)
  const handleFormSubmit = (formData: GoalFormData) => {
    if (editingGoal) {
      const updated = storageService.updateGoal(editingGoal.id, formData);
      if (updated) {
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        showToast('Objetivo atualizado com sucesso!');
      }
    } else {
      const created = storageService.createGoal(formData);
      if (created) {
        setGoals((prev) => [created, ...prev]);
        showToast('Novo objetivo de estudo cadastrado!');
      } else {
        showToast('Não foi possível salvar o objetivo. Verifique os dados ou limite de armazenamento.');
      }
    }
  };

  // Mudança rápida de status diretamente pelo cartão
  const handleStatusChange = (id: string, newStatus: GoalStatus) => {
    const updated = storageService.updateGoal(id, { status: newStatus });
    if (updated) {
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
      const statusNames: Record<GoalStatus, string> = {
        nao_iniciado: 'marcado como Não Iniciado',
        em_andamento: 'movido para Em Andamento',
        concluido: 'concluído! Parabéns pelo esforço 🎉',
      };
      showToast(`Objetivo ${statusNames[newStatus]}`);
    }
  };

  // Solicitação de exclusão (Abre modal de confirmação obrigatório)
  const handleRequestDelete = (goal: StudyGoal) => {
    setDeletingGoal(goal);
  };

  // Confirmação final da exclusão
  const handleConfirmDelete = () => {
    if (deletingGoal) {
      const success = storageService.deleteGoal(deletingGoal.id);
      if (success) {
        setGoals((prev) => prev.filter((g) => g.id !== deletingGoal.id));
        showToast('Objetivo excluído.');
      }
      setDeletingGoal(null);
    }
  };

  // Carregar exemplos didáticos
  const handleLoadSamples = () => {
    const samples = storageService.loadSampleGoals();
    setGoals(samples);
    showToast('Exemplos práticos de estudos carregados com sucesso!');
  };

  // Abertura do modal de cronograma geral
  const handleOpenGeneralSchedule = () => {
    setScheduleGoal(null);
    setIsScheduleModalOpen(true);
  };

  // Abertura do modal de cronograma a partir de um objetivo específico
  const handleOpenGoalSchedule = (goal: StudyGoal) => {
    setScheduleGoal(goal);
    setIsScheduleModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Toast de Feedback */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs sm:text-sm font-medium rounded-xl shadow-lg border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabeçalho */}
      <Header
        onOpenNewGoalModal={handleOpenNewGoal}
        onOpenScheduleModal={handleOpenGeneralSchedule}
      />

      {/* Conteúdo Principal */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 grow">
        {/* Painel de Métricas e Quantidades Cadastradas */}
        <StatsOverview
          stats={stats}
          activeFilter={currentFilter}
          onFilterSelect={setCurrentFilter}
        />

        {/* Barra de Filtros, Busca e Ordenação */}
        <FilterBar
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          counts={filterCounts}
        />

        {/* Listagem de Objetivos ou Estado Vazio */}
        {filteredGoals.length > 0 ? (
          <section
            aria-label="Lista de Objetivos de Estudo"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={handleOpenEditGoal}
                onRequestDelete={handleRequestDelete}
                onStatusChange={handleStatusChange}
                onOpenSchedule={handleOpenGoalSchedule}
              />
            ))}
          </section>
        ) : (
          <EmptyState
            isFiltered={goals.length > 0}
            onOpenNewGoalModal={handleOpenNewGoal}
            onResetFilter={() => {
              setCurrentFilter('todos');
              setSearchTerm('');
            }}
            onLoadSamples={goals.length === 0 ? handleLoadSamples : undefined}
          />
        )}

        {/* Bloco de Dicas para Estudantes Iniciantes */}
        <aside className="bg-indigo-50/60 border border-indigo-100/90 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-semibold text-indigo-950">
              Dica para construir seu hábito de estudo
            </h4>
            <p className="text-xs text-indigo-900/80 leading-relaxed">
              Divida matérias extensas em objetivos menores com prazos realistas de 2 a 5 dias. Marcar cada etapa concluída gera motivação contínua e reduz a ansiedade de quem está começando.
            </p>
          </div>
        </aside>
      </main>

      {/* Rodapé Tranquilo e Limpo */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            <strong className="font-semibold text-slate-700">StudyFlow</strong> — Seu organizador de objetivos de estudo.
          </p>
          <p className="text-slate-400">
            Dados salvos com segurança no seu navegador via <span className="font-mono text-[11px] text-slate-600">localStorage</span>.
          </p>
        </div>
      </footer>

      {/* Modais de Ação */}
      <GoalFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingGoal(null);
        }}
        onSubmit={handleFormSubmit}
        initialGoal={editingGoal}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingGoal)}
        goal={deletingGoal}
        onCancel={() => setDeletingGoal(null)}
        onConfirm={handleConfirmDelete}
      />

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleGoal(null);
        }}
        goals={goals}
        initialGoal={scheduleGoal}
        onShowToast={showToast}
      />
    </div>
  );
}
