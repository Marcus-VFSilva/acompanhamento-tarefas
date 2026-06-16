"use client";

import { useState, useCallback } from "react";
import { Plus, Search, X, LayoutGrid, List, Filter } from "lucide-react";
import { useTaskStore, DEFAULT_FILTERS } from "@/store/taskStore";
import { useFilteredTasks, useAllUsersQuery } from "@/hooks/useTasks";
import TaskCard from "@/components/tasks/TaskCard";
import TaskTable from "@/components/tasks/TaskTable";
import TaskModal from "@/components/tasks/TaskModal";
import TaskDetailPanel from "@/components/tasks/TaskDetailPanel";
import type { Task, TaskStatus, TaskPriority } from "@/types";

interface Props {
  isAdmin: boolean;
  userEmail: string;
  userName: string;
}

type ViewMode = "cards" | "tabela";

const STATUS_PILLS: { value: TaskStatus; label: string }[] = [
  { value: "pendente",     label: "Pendente"     },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido",    label: "Concluído"    },
  { value: "cancelado",    label: "Cancelado"    },
];

const PRIORITY_PILLS: { value: TaskPriority; label: string }[] = [
  { value: "alta",  label: "Alta"  },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

const PILL_ON  = "bg-brand-700 text-white border-brand-700 shadow-sm";
const PILL_OFF = "bg-transparent text-surface-600 border-surface-200 hover:bg-surface-50 hover:border-surface-300 hover:text-surface-800";

export default function TarefasClient({ isAdmin, userEmail, userName }: Props) {
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [view, setView] = useState<ViewMode>("tabela");

  const { filters, setFilters, resetFilters } = useTaskStore();
  const tasks = useFilteredTasks(userEmail, isAdmin);
  const { data: users = [] } = useAllUsersQuery();

  function toggleStatus(s: TaskStatus) {
    const next = filters.status.includes(s)
      ? filters.status.filter((x) => x !== s)
      : [...filters.status, s];
    setFilters({ status: next });
  }

  function togglePriority(p: TaskPriority) {
    const next = filters.priority.includes(p)
      ? filters.priority.filter((x) => x !== p)
      : [...filters.priority, p];
    setFilters({ priority: next });
  }

  const isDefaultStatus =
    filters.status.length === DEFAULT_FILTERS.status.length &&
    filters.status.every((s) => DEFAULT_FILTERS.status.includes(s));

  const hasActiveFilter =
    !isDefaultStatus ||
    filters.priority.length > 0 ||
    filters.assignedTo !== "" ||
    filters.search !== "";

  const canDelete = (task: Task) => isAdmin || task.assignedTo === userEmail;

  // Keep panel in sync: if tasks refetch and selected task is updated, update the panel reference
  const selectedTaskLive = selectedTask
    ? (tasks.find((t) => t.id === selectedTask.id) ?? selectedTask)
    : null;

  const selectedIndex = selectedTaskLive ? tasks.findIndex((t) => t.id === selectedTaskLive.id) : -1;

  const handleSelect = useCallback((task: Task) => {
    setSelectedTask((prev) => (prev?.id === task.id ? null : task));
  }, []);

  function handlePrev() {
    if (selectedIndex > 0) setSelectedTask(tasks[selectedIndex - 1]);
  }

  function handleNext() {
    if (selectedIndex < tasks.length - 1) setSelectedTask(tasks[selectedIndex + 1]);
  }

  return (
    <>
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-surface-900">Minhas Tarefas</h1>
            <p className="text-sm text-surface-400 mt-0.5">
              {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}
              {hasActiveFilter && " (filtrado)"}
              {selectedTaskLive && (
                <span className="ml-2 text-brand-500 font-medium">· {selectedTaskLive.title.slice(0, 30)}{selectedTaskLive.title.length > 30 ? "…" : ""}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center gap-0.5 bg-surface-100 rounded-lg p-0.5">
              <button
                onClick={() => setView("tabela")}
                className={`p-1.5 rounded-md transition-all ${view === "tabela" ? "bg-white shadow-sm text-surface-700" : "text-surface-400 hover:text-surface-600"}`}
                title="Tabela"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setView("cards")}
                className={`p-1.5 rounded-md transition-all ${view === "cards" ? "bg-white shadow-sm text-surface-700" : "text-surface-400 hover:text-surface-600"}`}
                title="Cards"
              >
                <LayoutGrid size={15} />
              </button>
            </div>

            <button
              onClick={() => setNewTaskOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors shrink-0"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nova tarefa</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-surface-200 p-3 space-y-2.5">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            <input
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              placeholder="Buscar por título, descrição..."
              className="w-full pl-8 pr-3 py-1.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          <div className="h-px bg-surface-100" />

          {/* Filter groups */}
          <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
            {/* Status group */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1.5">
                Status da tarefa
              </p>
              <div className="flex flex-wrap gap-1">
                {STATUS_PILLS.map(({ value, label }) => {
                  const active = filters.status.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => toggleStatus(value)}
                      className={`px-3 py-1 rounded-md text-[12px] font-medium border transition-all ${active ? PILL_ON : PILL_OFF}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-px self-stretch bg-surface-100 shrink-0" />

            {/* Priority group */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1.5">
                Prioridade
              </p>
              <div className="flex flex-wrap gap-1">
                {PRIORITY_PILLS.map(({ value, label }) => {
                  const active = filters.priority.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => togglePriority(value)}
                      className={`px-3 py-1 rounded-md text-[12px] font-medium border transition-all ${active ? PILL_ON : PILL_OFF}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset + hint */}
            <div className="ml-auto flex flex-col items-end gap-1.5 self-center">
              {hasActiveFilter && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-surface-400 hover:text-surface-700 border border-surface-200 rounded-md hover:bg-surface-50 transition-colors"
                >
                  <X size={11} /> Resetar
                </button>
              )}
              <span className="text-[10px] text-surface-300 text-right leading-tight">
                {selectedTaskLive
                  ? "↑↓ navegar · Esc fechar"
                  : `${tasks.length} tarefa${tasks.length !== 1 ? "s" : ""}`}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        {tasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-surface-200">
            <Filter size={32} className="mx-auto text-surface-300 mb-3" />
            <p className="text-sm font-medium text-surface-500">Nenhuma tarefa encontrada</p>
            <p className="text-xs text-surface-400 mt-1">
              {hasActiveFilter ? "Tente ajustar os filtros" : "Crie sua primeira tarefa"}
            </p>
          </div>
        ) : view === "tabela" ? (
          <TaskTable
            tasks={tasks}
            selectedTaskId={selectedTaskLive?.id ?? null}
            onSelect={handleSelect}
            canDeleteFn={canDelete}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(t) => setSelectedTask(t)}
                canDelete={canDelete(task)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task detail panel */}
      {selectedTaskLive && (
        <TaskDetailPanel
          key={selectedTaskLive.id}
          task={selectedTaskLive}
          taskIndex={selectedIndex}
          taskCount={tasks.length}
          onClose={() => setSelectedTask(null)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}

      {/* New task modal */}
      {newTaskOpen && (
        <TaskModal
          task={null}
          userEmail={userEmail}
          userName={userName}
          isAdmin={isAdmin}
          users={users.length > 0 ? users : [{ email: userEmail, name: userName }]}
          onClose={() => setNewTaskOpen(false)}
        />
      )}
    </>
  );
}
