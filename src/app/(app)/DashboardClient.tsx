"use client";

import { useTasksQuery } from "@/hooks/useTasks";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import { CheckCircle2, Clock, ListTodo, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";

interface Props {
  isAdmin: boolean;
  userEmail: string;
}

function MetricCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: number; icon: React.ElementType; color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-surface-900">{value}</p>
        <p className="text-sm text-surface-500">{label}</p>
        {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  pendente: "bg-surface-100 text-surface-500",
  em_andamento: "bg-blue-50 text-blue-600",
  concluido: "bg-brand-50 text-brand-600",
  cancelado: "bg-red-50 text-red-500",
};
const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente", em_andamento: "Em andamento", concluido: "Concluído", cancelado: "Cancelado",
};
const PRIORITY_COLOR: Record<string, string> = {
  alta: "text-red-500", media: "text-amber-500", baixa: "text-surface-400",
};

export default function DashboardClient({ isAdmin, userEmail }: Props) {
  const { data: allTasks = [], isLoading } = useTasksQuery();

  const visibleTasks = isAdmin ? allTasks : allTasks.filter((t) => t.assignedTo === userEmail);

  const total = visibleTasks.length;
  const pending = visibleTasks.filter((t) => t.status === "pendente").length;
  const inProgress = visibleTasks.filter((t) => t.status === "em_andamento").length;
  const done = visibleTasks.filter((t) => t.status === "concluido").length;
  const avgProgress = total > 0
    ? Math.round(visibleTasks.reduce((acc, t) => acc + t.progress, 0) / total)
    : 0;

  const recentTasks = [...visibleTasks]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-900">
          {isAdmin ? "Visão Geral — Todos os Colaboradores" : "Minha Visão Geral"}
        </h1>
        <p className="text-sm text-surface-400 mt-0.5">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Total de tarefas" value={total} icon={ListTodo} color="bg-surface-600" />
        <MetricCard label="Pendentes" value={pending} icon={AlertCircle} color="bg-surface-400" />
        <MetricCard label="Em andamento" value={inProgress} icon={Clock} color="bg-blue-500" />
        <MetricCard label="Concluídas" value={done} icon={CheckCircle2} color="bg-brand-500" sub={`${avgProgress}% de progresso médio`} />
      </div>

      {isAdmin && <DashboardCharts tasks={allTasks} />}

      {!isAdmin && (
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-brand-500" />
            <h3 className="text-sm font-semibold text-surface-700">Meu progresso geral</h3>
            <span className="ml-auto text-2xl font-bold text-brand-500">{avgProgress}%</span>
          </div>
          <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
            <div className="h-2 bg-brand-500 rounded-full transition-all" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-surface-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h3 className="text-sm font-semibold text-surface-700">Atividade recente</h3>
          <Link href="/tarefas" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
            Ver todas →
          </Link>
        </div>
        <div className="divide-y divide-surface-50">
          {recentTasks.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-surface-400">Nenhuma tarefa ainda</p>
          ) : (
            recentTasks.map((task) => (
              <div key={task.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 truncate">{task.title}</p>
                  <p className="text-xs text-surface-400 mt-0.5">
                    {isAdmin && <span className="mr-2">{task.assignedToName} ·</span>}
                    Atualizado {task.updatedAt}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${PRIORITY_COLOR[task.priority]}`}>
                    {task.priority}
                  </span>
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[task.status]}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
