"use client";

import { useMemo, useRef, useState } from "react";
import { useTasksQuery } from "@/hooks/useTasks";
import { useUserRole } from "@/hooks/useUserRole";
import { buildCollaboratorData, buildProjectData } from "@/lib/reportMetrics";
import { startOfWeek, addDays, parseISODate } from "@/lib/calendar";
import { buildWeeklyEvolution, getWeekStartISO } from "@/lib/weeklyReportMetrics";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { CheckCircle2, Clock, ListTodo, AlertCircle, XCircle } from "lucide-react";
import ExportButtons from "@/components/export/ExportButtons";
import OperationalReportButton from "@/components/export/OperationalReportButton";
import { useSettingsQuery } from "@/hooks/useSettings";
import type { Task } from "@/types";
import { PRIORITY_LABELS } from "@/types";
import { StatusBadge, PriorityBadge } from "@/components/tasks/StatusBadge";

interface Props { isAdmin: boolean; userEmail: string; userName: string; }

const STATUS_COLORS: Record<string, string> = {
  pendente: "#94a3b8",
  em_andamento: "#3b82f6",
  concluido: "#044a42",
  cancelado: "#ef4444",
};

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-start gap-3">
      <div className={`p-2.5 rounded-lg ${accent} shrink-0`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-surface-900 leading-tight">{value}</p>
        <p className="text-xs text-surface-500 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-surface-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold text-surface-700">{children}</h2>;
}

type Period = "tudo" | "semana" | "mes";

const PERIOD_LABELS: Record<Period, string> = {
  tudo: "Tudo",
  semana: "Semana atual",
  mes: "Mês atual",
};

/** Data de referência da tarefa para o filtro de período. */
function taskRefDate(t: Task): Date | null {
  return parseISODate(t.dataConclusao || t.dataEntrega || t.dueDate || t.createdAt || "");
}

function periodBounds(period: Period): { start: Date; end: Date } | null {
  if (period === "tudo") return null;
  const now = new Date();
  if (period === "semana") {
    const start = startOfWeek(now);
    start.setHours(0, 0, 0, 0);
    const end = addDays(start, 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default function RelatoriosClient({ isAdmin, userEmail, userName }: Props) {
  const exportRef = useRef<HTMLDivElement>(null);
  const { data: allTasks = [] } = useTasksQuery();
  const { data: settings } = useSettingsQuery();
  const { isTeamLeader, canViewTeam, teamLabel } = useUserRole(isAdmin);
  const [period, setPeriod] = useState<Period>("tudo");

  const tasks = useMemo(() => {
    const bounds = periodBounds(period);
    if (!bounds) return allTasks;
    return allTasks.filter((t) => {
      const ref = taskRefDate(t);
      return ref !== null && ref >= bounds.start && ref <= bounds.end;
    });
  }, [allTasks, period]);

  const total = tasks.length;
  const concluido = tasks.filter((t) => t.status === "concluido").length;
  const emAndamento = tasks.filter((t) => t.status === "em_andamento").length;
  const pendente = tasks.filter((t) => t.status === "pendente").length;
  const cancelado = tasks.filter((t) => t.status === "cancelado").length;
  const taxa = total > 0 ? Math.round((concluido / total) * 100) : 0;
  const comImpeditivo = tasks.filter((t) => t.impeditivo && t.impeditivo.trim()).length;

  const statusPie = [
    { name: "Concluído", value: concluido, color: STATUS_COLORS.concluido },
    { name: "Em andamento", value: emAndamento, color: STATUS_COLORS.em_andamento },
    { name: "Pendente", value: pendente, color: STATUS_COLORS.pendente },
    { name: "Cancelado", value: cancelado, color: STATUS_COLORS.cancelado },
  ].filter((d) => d.value > 0);

  const projectData = buildProjectData(tasks);
  const collaboratorData = buildCollaboratorData(tasks);

  const priorityPie = useMemo(() => {
    const colors: Record<string, string> = { alta: "#ef4444", media: "#f59e0b", baixa: "#94a3b8" };
    return (["alta", "media", "baixa"] as const)
      .map((p) => ({ name: PRIORITY_LABELS[p], value: tasks.filter((t) => t.priority === p).length, color: colors[p] }))
      .filter((d) => d.value > 0);
  }, [tasks]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      const key = t.category?.trim() || "Sem categoria";
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [tasks]);

  // Evolução sempre sobre a base completa (independe do filtro de período).
  const weeklyEvolution = useMemo(() => buildWeeklyEvolution(allTasks, getWeekStartISO(), 8), [allTasks]);

  return (
    <div className="p-4 md:p-6 max-w-[1300px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900">
            {isTeamLeader ? "Relatórios da Equipe" : "Relatórios"}
          </h1>
          <p className="text-sm text-surface-400 mt-0.5">
            {isTeamLeader && teamLabel ? `${teamLabel} · ` : canViewTeam ? "Indicadores consolidados · " : "Seus indicadores · "}
            gerado em {new Date().toLocaleDateString("pt-BR")}
          </p>
          <div className="mt-2.5 flex items-center bg-surface-100 rounded-lg p-0.5 gap-0.5 w-fit">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  period === p ? "bg-white shadow-sm text-surface-900" : "text-surface-400 hover:text-surface-700"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <OperationalReportButton
            tasks={tasks}
            exportRef={exportRef}
            reporterName={userName}
            reporterEmail={userEmail}
            managerEmail={settings?.managerEmail}
            managerName={settings?.managerName}
          />
          <ExportButtons tasks={tasks} exportRef={exportRef} filenamePrefix="relatorio" />
        </div>
      </div>

      <div ref={exportRef} className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total de tarefas" value={total} icon={ListTodo} accent="bg-surface-500" />
        <KpiCard label="Concluídas" value={concluido} sub={`${taxa}% do total`} icon={CheckCircle2} accent="bg-brand-500" />
        <KpiCard label="Em andamento" value={emAndamento} icon={Clock} accent="bg-blue-500" />
        <KpiCard label="Pendentes" value={pendente} icon={AlertCircle} accent="bg-surface-400" />
        <KpiCard label="Canceladas" value={cancelado} icon={XCircle} accent="bg-red-500" />
        <KpiCard label="Com impeditivo" value={comImpeditivo} icon={AlertCircle} accent="bg-amber-500" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <SectionTitle>Distribuição por status</SectionTitle>
          <ResponsiveContainer width="100%" height={220} className="mt-3">
            <PieChart>
              <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}`, ""]} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <SectionTitle>Tarefas por projeto</SectionTitle>
          <ResponsiveContainer width="100%" height={220} className="mt-3">
            <BarChart data={projectData} layout="vertical" barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="pendente" name="Pendente" fill="#94a3b8" stackId="a" />
              <Bar dataKey="em_andamento" name="Em andamento" fill="#3b82f6" stackId="a" />
              <Bar dataKey="concluido" name="Concluído" fill="#044a42" stackId="a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {isTeamLeader && collaboratorData.length > 0 && (
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <SectionTitle>Tarefas por colaborador</SectionTitle>
          <ResponsiveContainer width="100%" height={Math.max(240, collaboratorData.length * 52)} className="mt-3">
            <BarChart data={collaboratorData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Legend iconSize={8} />
              <Bar dataKey="pendente" name="Pendente" fill="#94a3b8" stackId="a" />
              <Bar dataKey="em_andamento" name="Em andamento" fill="#3b82f6" stackId="a" />
              <Bar dataKey="concluido" name="Concluído" fill="#044a42" stackId="a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Charts row 2 — prioridade + categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <SectionTitle>Distribuição por prioridade</SectionTitle>
          <ResponsiveContainer width="100%" height={220} className="mt-3">
            <PieChart>
              <Pie data={priorityPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {priorityPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}`, ""]} />
              <Legend iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <SectionTitle>Tarefas por categoria</SectionTitle>
          <ResponsiveContainer width="100%" height={Math.max(220, categoryData.length * 34)} className="mt-3">
            <BarChart data={categoryData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="value" name="Tarefas" fill="#044a42" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 3 — evolução semanal */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <div className="flex items-center justify-between">
          <SectionTitle>Evolução semanal (últimas 8 semanas)</SectionTitle>
          <span className="text-[11px] text-surface-400">Concluídas x planejadas</span>
        </div>
        <ResponsiveContainer width="100%" height={240} className="mt-3">
          <BarChart data={weeklyEvolution} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend iconType="circle" iconSize={8} />
            <Bar dataKey="planejadas" name="Planejadas" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="concluidas" name="Concluídas" fill="#044a42" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed table */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <SectionTitle>Detalhamento das tarefas</SectionTitle>
          <span className="text-xs text-surface-400">{tasks.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-50">
                {["Título", "Responsável", "Projeto", "Status", "Prioridade", "Situação atual", "Prazo", "Entrega", "Conclusão", "%"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-200 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-surface-50/60 border-b border-surface-100 last:border-0">
                  <td className="px-3 py-2.5 text-xs font-medium text-surface-900 max-w-[200px]">
                    <span title={t.title}>{t.title.length > 35 ? t.title.slice(0, 35) + "…" : t.title}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-surface-600 whitespace-nowrap">{t.assignedToName}</td>
                  <td className="px-3 py-2.5 text-xs text-surface-500 whitespace-nowrap">{t.projeto || "—"}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>
                  <td className="px-3 py-2.5"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-3 py-2.5 text-xs text-surface-600 max-w-[200px]">
                    <span title={t.situacaoAtual}>{t.situacaoAtual ? (t.situacaoAtual.length > 45 ? t.situacaoAtual.slice(0, 45) + "…" : t.situacaoAtual) : "—"}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-surface-500 whitespace-nowrap tabular-nums">{t.dueDate || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-surface-500 whitespace-nowrap tabular-nums">{t.dataEntrega || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-surface-500 whitespace-nowrap tabular-nums">{t.dataConclusao || "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 min-w-[70px]">
                      <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                        <div className="h-1.5 bg-brand-500 rounded-full" style={{ width: `${t.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-surface-500 tabular-nums shrink-0">{t.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
