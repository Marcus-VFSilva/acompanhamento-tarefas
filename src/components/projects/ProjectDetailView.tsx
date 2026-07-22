"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ListTodo, CheckCircle2, Clock, AlertCircle,
  TrendingUp, ChevronLeft, ChevronRight, CalendarDays, ChevronRight as ArrowIcon,
} from "lucide-react";
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { StatusBadge, PriorityBadge } from "@/components/tasks/StatusBadge";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_COLOR, type ProjectStatus, type Project } from "@/types/project";
import { buildProjectKpis, buildSCurve, plannedDate, completedDate } from "@/lib/projectMetrics";
import {
  getMonthMatrix, toISODate, isSameDay, addMonths, formatMonthYear, WEEKDAY_LABELS,
} from "@/lib/calendar";
import type { Task } from "@/types";

const STATUS_DOT: Record<string, string> = {
  pendente: "bg-surface-400",
  em_andamento: "bg-blue-500",
  concluido: "bg-brand-500",
  cancelado: "bg-red-500",
};

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent: string;
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

function ProjectCalendar({ tasks }: { tasks: Task[] }) {
  const [cursor, setCursor] = useState(new Date());
  const today = new Date();

  const byDate = useMemo(() => {
    const m: Record<string, Task[]> = {};
    for (const t of tasks) {
      const d = completedDate(t) || plannedDate(t);
      if (!d) continue;
      (m[d] ??= []).push(t);
    }
    return m;
  }, [tasks]);

  const weeks = getMonthMatrix(cursor.getFullYear(), cursor.getMonth());

  return (
    <div className="bg-white rounded-xl border border-surface-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-brand-600" />
          <h2 className="text-sm font-bold text-surface-700">Calendário do projeto</h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCursor((c) => addMonths(c, -1))} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500">
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-medium text-surface-700 w-32 text-center capitalize">{formatMonthYear(cursor)}</span>
          <button onClick={() => setCursor((c) => addMonths(c, 1))} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-500">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-surface-400 py-1">{d}</div>
        ))}
        {weeks.flat().map((day) => {
          const iso = toISODate(day);
          const dayTasks = byDate[iso] ?? [];
          const isCurrentMonth = day.getMonth() === cursor.getMonth();
          const isToday = isSameDay(day, today);
          return (
            <div
              key={iso}
              className={`min-h-[52px] rounded-lg border p-1 ${
                isCurrentMonth ? "border-surface-100 bg-white" : "border-transparent bg-surface-50/50"
              } ${isToday ? "ring-1 ring-brand-400" : ""}`}
            >
              <div className={`text-[10px] font-medium ${isCurrentMonth ? "text-surface-600" : "text-surface-300"} ${isToday ? "text-brand-600 font-bold" : ""}`}>
                {day.getDate()}
              </div>
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {dayTasks.slice(0, 4).map((t) => (
                  <span key={t.id} title={t.title} className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[t.status]}`} />
                ))}
                {dayTasks.length > 4 && (
                  <span className="text-[8px] text-surface-400">+{dayTasks.length - 4}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  project: Project;
  projectTasks: Task[];
  /** Mostra cabeçalho com nome/status/objetivo do projeto. */
  showHeader?: boolean;
}

export default function ProjectDetailView({ project, projectTasks, showHeader = true }: Props) {
  const kpis = useMemo(() => buildProjectKpis(projectTasks), [projectTasks]);
  const sCurve = useMemo(() => buildSCurve(projectTasks), [projectTasks]);

  const status = (project.status ?? "em_andamento") as ProjectStatus;
  const sc = PROJECT_STATUS_COLOR[status];

  const sortedTasks = useMemo(
    () => [...projectTasks].sort((a, b) => (plannedDate(a) || "").localeCompare(plannedDate(b) || "")),
    [projectTasks],
  );

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-surface-900">{project.name}</h2>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
            {PROJECT_STATUS_LABEL[status]}
          </span>
          {project.objetivo && (
            <p className="basis-full text-sm text-surface-500 mt-1 max-w-3xl leading-relaxed">{project.objetivo}</p>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total de tarefas" value={kpis.total} icon={ListTodo} accent="bg-surface-500" />
        <KpiCard label="Concluídas" value={kpis.concluido} sub={`${kpis.taxaConclusao}% do total`} icon={CheckCircle2} accent="bg-brand-500" />
        <KpiCard label="Em andamento" value={kpis.emAndamento} icon={Clock} accent="bg-blue-500" />
        <KpiCard label="Progresso médio" value={`${kpis.progressoMedio}%`} sub={kpis.comImpeditivo > 0 ? `${kpis.comImpeditivo} com impeditivo` : undefined} icon={TrendingUp} accent="bg-violet-500" />
      </div>

      {/* S-curve */}
      <div className="bg-white rounded-xl border border-surface-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={15} className="text-brand-600" />
          <h2 className="text-sm font-bold text-surface-700">Curva de evolução (S)</h2>
        </div>
        <p className="text-xs text-surface-400 mb-3">
          Planejado (por prazo) vs. realizado (por conclusão), em % das tarefas do projeto.
        </p>
        {sCurve.length === 0 ? (
          <p className="text-sm text-surface-400 italic py-8 text-center">
            Sem datas suficientes para gerar a curva. Defina prazos e datas de conclusão nas tarefas.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={sCurve} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v, name) => [`${v}%`, name === "planejado" ? "Planejado" : "Realizado"]} />
              <Legend iconType="plainline" iconSize={16} formatter={(v) => (v === "planejado" ? "Planejado" : "Realizado")} />
              <Line type="monotone" dataKey="planejado" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              <Line type="monotone" dataKey="realizado" stroke="#044a42" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Calendar + task list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectCalendar tasks={projectTasks} />

        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-surface-700">Tarefas do projeto</h2>
            <span className="text-xs text-surface-400">{sortedTasks.length} registros</span>
          </div>
          {sortedTasks.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-surface-400">Nenhuma tarefa neste projeto ainda</p>
          ) : (
            <ul className="divide-y divide-surface-50 max-h-[420px] overflow-y-auto">
              {sortedTasks.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/tarefas?task=${t.id}`}
                    className="group flex items-start justify-between gap-3 px-5 py-3 hover:bg-surface-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-surface-800 leading-snug group-hover:text-brand-700 flex items-center gap-1">
                        {t.title}
                        <ArrowIcon size={13} className="text-surface-300 group-hover:text-brand-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                        {plannedDate(t) && (
                          <span className="text-[10px] text-surface-400 tabular-nums">prazo {plannedDate(t)}</span>
                        )}
                        {t.impeditivo?.trim() && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                            <AlertCircle size={10} /> impeditivo
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 min-w-[70px]">
                      <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${t.progress}%` }} />
                      </div>
                      <span className="text-[10px] text-surface-500 tabular-nums">{t.progress}%</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
