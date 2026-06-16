"use client";

import { useState } from "react";
import { useTasksQuery } from "@/hooks/useTasks";
import { useNotasQuery, useCreateNota, useUpdateNota, useDeleteNota } from "@/hooks/useNotas";
import { useSistemasQuery } from "@/hooks/useSistemas";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import {
  CheckCircle2, Clock, ListTodo, AlertCircle, TrendingUp, Loader2,
  Plus, X, Save, Server, Trash2, Pencil,
} from "lucide-react";
import Link from "next/link";
import type { Note, NoteType } from "@/types/note";
import { NOTE_TYPE_LABEL, NOTE_TYPE_COLOR } from "@/types/note";

interface Props { isAdmin: boolean; userEmail: string; }

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

// ── Note Drawer ───────────────────────────────────────────────────────
function NotaDrawer({
  nota,
  tasks,
  onClose,
}: {
  nota: Note | null;
  tasks: { id: string; title: string }[];
  onClose: () => void;
}) {
  const create = useCreateNota();
  const update = useUpdateNota();
  const isEditing = !!nota;

  const [titulo, setTitulo] = useState(nota?.titulo ?? "");
  const [conteudo, setConteudo] = useState(nota?.conteudo ?? "");
  const [tipo, setTipo] = useState<NoteType>(nota?.tipo ?? "anotacao");
  const [tarefaId, setTarefaId] = useState(nota?.tarefaId ?? "");
  const [data, setData] = useState(nota?.data ?? new Date().toISOString().split("T")[0]);

  const isBusy = create.isPending || update.isPending;

  async function handleSave() {
    if (!titulo.trim()) return;
    const linkedTask = tasks.find((t) => t.id === tarefaId);
    const payload = {
      titulo,
      conteudo,
      tipo,
      tarefaId: tarefaId || undefined,
      tarefaTitulo: linkedTask?.title || undefined,
      data,
    };
    if (isEditing) {
      await update.mutateAsync({ id: nota!.id, updates: payload });
    } else {
      await create.mutateAsync(payload as any);
    }
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[400px] max-w-[95vw] bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <h2 className="text-sm font-bold text-surface-900">{isEditing ? "Editar anotação" : "Nova anotação"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Tipo */}
          <div className="flex gap-2">
            {(["reuniao", "anotacao", "lembrete"] as NoteType[]).map((t) => {
              const c = NOTE_TYPE_COLOR[t];
              return (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all border ${
                    tipo === t ? `${c.bg} ${c.text} border-current` : "bg-surface-50 text-surface-500 border-surface-200"
                  }`}
                >
                  {c.icon} {NOTE_TYPE_LABEL[t]}
                </button>
              );
            })}
          </div>

          {/* Título */}
          <div>
            <label className="block text-[12px] font-medium text-surface-700 mb-1">Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="ex: Reunião com Jackson — Zendesk"
              className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-[12px] font-medium text-surface-700 mb-1">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>

          {/* Conteúdo */}
          <div>
            <label className="block text-[12px] font-medium text-surface-700 mb-1">Conteúdo</label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={5}
              placeholder="Detalhes, decisões, próximas ações..."
              className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none"
            />
          </div>

          {/* Vincular tarefa */}
          {tasks.length > 0 && (
            <div>
              <label className="block text-[12px] font-medium text-surface-700 mb-1">Vincular a uma tarefa (opcional)</label>
              <select
                value={tarefaId}
                onChange={(e) => setTarefaId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 bg-white"
              >
                <option value="">— Sem vínculo —</option>
                {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="border-t border-surface-200 px-5 py-3 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm font-medium text-surface-600 border border-surface-200 rounded-lg hover:bg-surface-50">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={isBusy || !titulo.trim()}
            className="flex-1 py-2 text-sm font-semibold text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function DashboardClient({ isAdmin, userEmail }: Props) {
  const { data: allTasks = [], isLoading } = useTasksQuery();
  const { data: notas = [] } = useNotasQuery();
  const { data: sistemas = [] } = useSistemasQuery();
  const deleteNota = useDeleteNota();

  const [notaDrawer, setNotaDrawer] = useState<Note | null | "new">(null);

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

  const recentNotas = notas.slice(0, 4);

  const sistemaStats = {
    total: sistemas.length,
    estaveis: sistemas.filter((s) => s.status === "estavel").length,
    emDev: sistemas.filter((s) => s.status === "desenvolvimento" || s.status === "implantacao").length,
  };

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
        <h1 className="text-xl font-bold text-surface-900">Minha Visão Geral</h1>
        <p className="text-sm text-surface-400 mt-0.5">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Task KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Total de tarefas" value={total} icon={ListTodo} color="bg-surface-600" />
        <MetricCard label="Pendentes" value={pending} icon={AlertCircle} color="bg-surface-400" />
        <MetricCard label="Em andamento" value={inProgress} icon={Clock} color="bg-blue-500" />
        <MetricCard label="Concluídas" value={done} icon={CheckCircle2} color="bg-brand-500" sub={`${avgProgress}% de progresso médio`} />
      </div>

      {/* Systems mini widget */}
      {sistemas.length > 0 && (
        <Link href="/monitoramento" className="block">
          <div className="bg-white rounded-xl border border-surface-200 p-4 hover:border-brand-400/50 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server size={15} className="text-brand-600" />
                <span className="text-sm font-semibold text-surface-700">Sistemas do Grupo</span>
              </div>
              <span className="text-[11px] text-brand-500 font-medium">Ver mapa →</span>
            </div>
            <div className="flex gap-6 mt-3">
              <div>
                <p className="text-lg font-bold text-surface-900">{sistemaStats.total}</p>
                <p className="text-[11px] text-surface-400">Total</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-600">{sistemaStats.estaveis}</p>
                <p className="text-[11px] text-surface-400">Estáveis</p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">{sistemaStats.emDev}</p>
                <p className="text-[11px] text-surface-400">Em desenvolvimento</p>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Charts (admin) or progress bar (personal) */}
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

      {/* Two-column: recent tasks + notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent tasks */}
        <div className="bg-white rounded-xl border border-surface-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
            <h3 className="text-sm font-semibold text-surface-700">Atividade recente</h3>
            <Link href="/tarefas" className="text-xs text-brand-500 hover:text-brand-600 font-medium">Ver todas →</Link>
          </div>
          <div className="divide-y divide-surface-50">
            {recentTasks.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-surface-400">Nenhuma tarefa ainda</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 truncate">{task.title}</p>
                    <p className="text-xs text-surface-400 mt-0.5">Atualizado {task.updatedAt}</p>
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

        {/* Notes */}
        <div className="bg-white rounded-xl border border-surface-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
            <h3 className="text-sm font-semibold text-surface-700">Anotações recentes</h3>
            <button
              onClick={() => setNotaDrawer("new")}
              className="inline-flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium"
            >
              <Plus size={13} />
              Nova
            </button>
          </div>
          <div className="divide-y divide-surface-50">
            {recentNotas.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-surface-400 mb-3">Nenhuma anotação ainda</p>
                <button
                  onClick={() => setNotaDrawer("new")}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:text-brand-600"
                >
                  <Plus size={13} /> Criar primeira anotação
                </button>
              </div>
            ) : (
              recentNotas.map((nota) => {
                const c = NOTE_TYPE_COLOR[nota.tipo];
                return (
                  <div key={nota.id} className="px-5 py-3.5 flex items-start gap-3 group">
                    <span className="text-base shrink-0 mt-0.5">{c.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{nota.titulo}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>
                          {NOTE_TYPE_LABEL[nota.tipo]}
                        </span>
                        <span className="text-[11px] text-surface-400">{nota.data}</span>
                        {nota.tarefaTitulo && (
                          <span className="text-[10px] text-brand-500 truncate max-w-[100px]">↗ {nota.tarefaTitulo}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setNotaDrawer(nota)}
                        className="p-1 rounded hover:bg-surface-100 text-surface-400 hover:text-surface-700"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => deleteNota.mutate(nota.id)}
                        className="p-1 rounded hover:bg-red-50 text-surface-400 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            {notas.length > 4 && (
              <div className="px-5 py-3 text-center">
                <span className="text-xs text-surface-400">{notas.length - 4} anotações mais antigas</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note drawer */}
      {notaDrawer !== null && (
        <NotaDrawer
          nota={notaDrawer === "new" ? null : notaDrawer}
          tasks={visibleTasks.map((t) => ({ id: t.id, title: t.title }))}
          onClose={() => setNotaDrawer(null)}
        />
      )}
    </div>
  );
}
