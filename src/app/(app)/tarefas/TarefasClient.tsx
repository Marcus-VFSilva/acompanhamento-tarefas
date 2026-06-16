"use client";

import { useState } from "react";
import { Plus, Search, X, LayoutGrid, List, Filter } from "lucide-react";
import { useTaskStore } from "@/store/taskStore";
import { useFilteredTasks, useAllUsersQuery } from "@/hooks/useTasks";
import TaskCard from "@/components/tasks/TaskCard";
import TaskTable from "@/components/tasks/TaskTable";
import TaskModal from "@/components/tasks/TaskModal";
import type { Task, TaskStatus, TaskPriority } from "@/types";

interface Props {
  isAdmin: boolean;
  userEmail: string;
  userName: string;
}

type ViewMode = "cards" | "tabela";

const STATUS_OPTIONS: { value: TaskStatus | "todas"; label: string }[] = [
  { value: "todas", label: "Todos os status" },
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

const PRIORITY_OPTIONS: { value: TaskPriority | "todas"; label: string }[] = [
  { value: "todas", label: "Todas as prioridades" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

export default function TarefasClient({ isAdmin, userEmail, userName }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [view, setView] = useState<ViewMode>("tabela");

  const { filters, setFilters, resetFilters } = useTaskStore();
  const tasks = useFilteredTasks(userEmail, isAdmin);
  const { data: users = [] } = useAllUsersQuery();

  function openNew() { setEditingTask(null); setModalOpen(true); }
  function openEdit(task: Task) { setEditingTask(task); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditingTask(null); }

  const hasActiveFilter =
    filters.status !== "todas" || filters.priority !== "todas" ||
    filters.assignedTo !== "" || filters.search !== "";

  const canDelete = (task: Task) => isAdmin || task.assignedTo === userEmail;

  return (
    <>
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-surface-900">
              {isAdmin ? "Todas as Tarefas" : "Minhas Tarefas"}
            </h1>
            <p className="text-sm text-surface-400 mt-0.5">
              {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}
              {hasActiveFilter && " (filtrado)"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center gap-0.5 bg-surface-100 rounded-lg p-0.5">
              <button
                onClick={() => setView("tabela")}
                className={`p-1.5 rounded-md transition-all ${view === "tabela" ? "bg-white shadow-sm text-surface-700" : "text-surface-400 hover:text-surface-600"}`}
                title="Visualização em tabela"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setView("cards")}
                className={`p-1.5 rounded-md transition-all ${view === "cards" ? "bg-white shadow-sm text-surface-700" : "text-surface-400 hover:text-surface-600"}`}
                title="Visualização em cards"
              >
                <LayoutGrid size={15} />
              </button>
            </div>

            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors shrink-0"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Nova tarefa</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-surface-200 p-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[160px]">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
              <input
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder="Buscar tarefa..."
                className="w-full pl-8 pr-3 py-1.5 border border-surface-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
            </div>

            <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value as TaskStatus | "todas" })}
              className="border border-surface-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white text-surface-700">
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <select value={filters.priority} onChange={(e) => setFilters({ priority: e.target.value as TaskPriority | "todas" })}
              className="border border-surface-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white text-surface-700">
              {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {isAdmin && (
              <select value={filters.assignedTo} onChange={(e) => setFilters({ assignedTo: e.target.value })}
                className="border border-surface-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white text-surface-700">
                <option value="">Todos os colaboradores</option>
                {users.map((u) => <option key={u.email} value={u.email}>{u.name}</option>)}
              </select>
            )}

            {hasActiveFilter && (
              <button onClick={resetFilters} className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-surface-500 hover:text-surface-700 border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors">
                <X size={13} /> Limpar
              </button>
            )}
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
          <TaskTable tasks={tasks} onEdit={openEdit} canDeleteFn={canDelete} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={openEdit} canDelete={canDelete(task)} />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <TaskModal
          task={editingTask}
          userEmail={userEmail}
          userName={userName}
          isAdmin={isAdmin}
          users={users.length > 0 ? users : [{ email: userEmail, name: userName }]}
          onClose={closeModal}
        />
      )}
    </>
  );
}
