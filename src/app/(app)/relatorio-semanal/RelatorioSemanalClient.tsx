"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, Loader2, Save, Sparkles, Printer,
  TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, CalendarClock, Check, ListTodo,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { useTasksQuery } from "@/hooks/useTasks";
import { useWeeklyReportQuery, useSaveWeeklyReport } from "@/hooks/useWeeklyReport";
import {
  getWeekStartISO, weekBoundsFromISO, buildWeeklyAutofill, buildWeeklyEvolution,
  getWeekTasks, type WeekTaskReason,
} from "@/lib/weeklyReportMetrics";
import { addDays, toISODate } from "@/lib/calendar";
import { StatusBadge, PriorityBadge } from "@/components/tasks/StatusBadge";

const REASON_STYLE: Record<WeekTaskReason, { label: string; className: string }> = {
  criada: { label: "Criada", className: "bg-blue-50 text-blue-600 border-blue-100" },
  atualizada: { label: "Atualizada", className: "bg-amber-50 text-amber-600 border-amber-100" },
  concluida: { label: "Concluída", className: "bg-brand-50 text-brand-600 border-brand-100" },
};

interface Props { isAdmin: boolean; userName: string }

function formatRange(weekStartISO: string): string {
  const { start, end } = weekBoundsFromISO(weekStartISO);
  const s = start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const e = end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  return `${s} – ${e}`;
}

interface SectionProps {
  title: string;
  icon: React.ElementType;
  accent: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

function ReportSection({ title, icon: Icon, accent, value, onChange, placeholder }: SectionProps) {
  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-100">
        <div className={`p-1.5 rounded-lg ${accent}`}>
          <Icon size={14} className="text-white" />
        </div>
        <h2 className="text-sm font-bold text-surface-700">{title}</h2>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm text-surface-700 resize-y focus:outline-none focus:bg-brand-50/20 leading-relaxed min-h-[120px]"
      />
    </div>
  );
}

export default function RelatorioSemanalClient({ userName }: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekStartISO());
  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery();
  const reportQuery = useWeeklyReportQuery(weekStart);
  const save = useSaveWeeklyReport();
  const printRef = useRef<HTMLDivElement>(null);

  const [avancos, setAvancos] = useState("");
  const [impeditivos, setImpeditivos] = useState("");
  const [sugestoes, setSugestoes] = useState("");
  const [planejamento, setPlanejamento] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const appliedRef = useRef<string>("");

  const saved = reportQuery.data;

  // Popula os campos: usa o report salvo, ou gera automaticamente das tarefas.
  useEffect(() => {
    if (reportQuery.isLoading) return;
    const source = saved ? "saved" : "auto";
    const key = `${weekStart}|${source}|${source === "auto" ? !tasksLoading : "s"}`;
    if (appliedRef.current === key) return;
    appliedRef.current = key;

    if (saved) {
      setAvancos(saved.avancos ?? "");
      setImpeditivos(saved.impeditivos ?? "");
      setSugestoes(saved.sugestoes ?? "");
      setPlanejamento(saved.planejamento ?? "");
    } else {
      const auto = buildWeeklyAutofill(tasks, weekStart);
      setAvancos(auto.avancos);
      setImpeditivos(auto.impeditivos);
      setSugestoes(auto.sugestoes);
      setPlanejamento(auto.planejamento);
    }
  }, [weekStart, saved, reportQuery.isLoading, tasksLoading, tasks]);

  const evolution = useMemo(() => buildWeeklyEvolution(tasks, weekStart, 8), [tasks, weekStart]);
  const weekTasks = useMemo(() => getWeekTasks(tasks, weekStart), [tasks, weekStart]);

  const summary = useMemo(() => {
    const auto = buildWeeklyAutofill(tasks, weekStart);
    const count = (s: string) => (s.trim() ? s.trim().split("\n").filter(Boolean).length : 0);
    return {
      avancos: count(auto.avancos),
      impeditivos: count(auto.impeditivos),
      planejamento: count(auto.planejamento),
    };
  }, [tasks, weekStart]);

  const isCurrentWeek = weekStart === getWeekStartISO();

  function shiftWeek(delta: number) {
    const { start } = weekBoundsFromISO(weekStart);
    setWeekStart(toISODate(addDays(start, delta * 7)));
  }

  function regenerate() {
    const auto = buildWeeklyAutofill(tasks, weekStart);
    setAvancos(auto.avancos);
    setImpeditivos(auto.impeditivos);
    setPlanejamento(auto.planejamento);
  }

  async function handleSave() {
    await save.mutateAsync({ weekStart, avancos, impeditivos, sugestoes, planejamento });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  }

  return (
    <div className="p-4 md:p-6 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Relatório Semanal</h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Consolidado para a apresentação de sexta · {userName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-surface-200 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-50"
          >
            <Printer size={15} /> Imprimir / PDF
          </button>
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            {save.isPending ? <Loader2 size={15} className="animate-spin" /> : savedFlash ? <Check size={15} /> : <Save size={15} />}
            {savedFlash ? "Salvo!" : "Salvar semana"}
          </button>
        </div>
      </div>

      {/* Week selector */}
      <div className="bg-white rounded-xl border border-surface-200 p-3 flex items-center justify-between gap-3">
        <button onClick={() => shiftWeek(-1)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500">
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-surface-800 capitalize">{formatRange(weekStart)}</p>
          <p className="text-[11px] text-surface-400">
            {isCurrentWeek ? "Semana atual" : "Outra semana"}
            {saved ? " · relatório salvo" : " · não salvo"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekStart(getWeekStartISO())}
              className="text-[11px] px-2 py-1 rounded-md text-brand-600 hover:bg-brand-50 font-medium"
            >
              Hoje
            </button>
          )}
          <button onClick={() => shiftWeek(1)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div ref={printRef} className="space-y-6">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
            <p className="text-2xl font-bold text-brand-600">{summary.avancos}</p>
            <p className="text-[11px] text-surface-500 mt-0.5">Concluídas na semana</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{summary.impeditivos}</p>
            <p className="text-[11px] text-surface-500 mt-0.5">Impeditivos ativos</p>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.planejamento}</p>
            <p className="text-[11px] text-surface-500 mt-0.5">Planejadas p/ próxima</p>
          </div>
        </div>

        {/* Autofill hint */}
        <div className="flex items-center justify-between gap-3 bg-brand-50/60 border border-brand-100 rounded-xl px-4 py-2.5">
          <p className="text-xs text-brand-700 flex items-center gap-1.5">
            <Sparkles size={14} /> Os campos foram pré-preenchidos a partir das suas tarefas. Edite livremente antes de salvar.
          </p>
          <button
            onClick={regenerate}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 border border-brand-200 rounded-lg px-2.5 py-1.5 hover:bg-brand-100/60"
          >
            <Sparkles size={13} /> Regerar dos dados
          </button>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ReportSection
            title="Principais avanços da semana"
            icon={CheckCircle2}
            accent="bg-brand-500"
            value={avancos}
            onChange={setAvancos}
            placeholder="O que foi entregue/avançou nesta semana…"
          />
          <ReportSection
            title="Impeditivos e sugestões"
            icon={AlertTriangle}
            accent="bg-amber-500"
            value={impeditivos}
            onChange={setImpeditivos}
            placeholder="Bloqueios encontrados e o que precisa para destravar…"
          />
          <ReportSection
            title="Sugestões / melhorias"
            icon={Lightbulb}
            accent="bg-violet-500"
            value={sugestoes}
            onChange={setSugestoes}
            placeholder="Ideias, riscos, pontos de atenção para a liderança…"
          />
          <ReportSection
            title="Planejamento para a próxima"
            icon={CalendarClock}
            accent="bg-blue-500"
            value={planejamento}
            onChange={setPlanejamento}
            placeholder="Prioridades e tarefas previstas para a próxima semana…"
          />
        </div>

        {/* Tarefas movimentadas na semana */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-500">
                <ListTodo size={14} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-surface-700">Tarefas movimentadas nesta semana</h2>
            </div>
            <span className="text-xs text-surface-400">{weekTasks.length} tarefa(s)</span>
          </div>

          {weekTasks.length === 0 ? (
            <p className="px-4 py-6 text-sm text-surface-400 text-center">
              Nenhuma tarefa criada, atualizada ou concluída nesta semana.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-surface-50">
                    {["Tarefa", "Projeto", "Status", "Prioridade", "Movimentação", "%"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-surface-400 border-b border-surface-200 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weekTasks.map(({ task: t, reasons }) => (
                    <tr key={t.id} className="hover:bg-surface-50/60 border-b border-surface-100 last:border-0">
                      <td className="px-3 py-2.5 text-xs font-medium text-surface-900 max-w-[240px]">
                        <span title={t.title}>{t.title.length > 40 ? t.title.slice(0, 40) + "…" : t.title}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-surface-500 whitespace-nowrap">{t.projeto || "—"}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={t.status} /></td>
                      <td className="px-3 py-2.5"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {reasons.map((r) => (
                            <span key={r} className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${REASON_STYLE[r].className}`}>
                              {REASON_STYLE[r].label}
                            </span>
                          ))}
                        </div>
                      </td>
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
          )}
        </div>

        {/* Evolution chart */}
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-brand-600" />
            <h2 className="text-sm font-bold text-surface-700">Evolução das últimas 8 semanas</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={evolution} barGap={4} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v, name) => [v as number, name === "concluidas" ? "Concluídas" : "Planejadas"]} />
              <Legend iconSize={8} formatter={(v) => (v === "concluidas" ? "Concluídas" : "Planejadas")} />
              <Bar dataKey="planejadas" name="planejadas" fill="#94a3b8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="concluidas" name="concluidas" fill="#044a42" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
