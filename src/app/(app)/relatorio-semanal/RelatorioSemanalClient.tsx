"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Loader2, Save, Sparkles, Printer,
  TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, CalendarClock, Check, ListTodo,
  FolderKanban, PlusCircle, RefreshCw, Activity, PieChart as PieIcon, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
  PieChart, Pie, Cell, ComposedChart, Line, ReferenceLine,
} from "recharts";
import { useTasksQuery } from "@/hooks/useTasks";
import { useWeeklyReportQuery, useSaveWeeklyReport } from "@/hooks/useWeeklyReport";
import {
  getWeekStartISO, weekBoundsFromISO, buildWeeklyAutofill, buildWeeklyMovement,
  getWeekTasks, buildProjectWeekBreakdown,
} from "@/lib/weeklyReportMetrics";
import { buildSCurveWindow, plannedDate } from "@/lib/projectMetrics";
import { addDays, toISODate } from "@/lib/calendar";
import { StatusBadge, PriorityBadge } from "@/components/tasks/StatusBadge";
import type { Task } from "@/types";

const MOV = {
  criadas: "#3b82f6",
  atualizadas: "#f59e0b",
  concluidas: "#044a42",
};

const PRIORITY_DOT: Record<string, string> = { alta: "bg-red-500", media: "bg-amber-500", baixa: "bg-surface-400" };

interface Props { isAdmin: boolean; userName: string }

function formatRange(weekStartISO: string): string {
  const { start, end } = weekBoundsFromISO(weekStartISO);
  const s = start.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  const e = end.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  return `${s} – ${e}`;
}

/* ---------------- Reusable pieces ---------------- */

function KpiCard({ icon: Icon, value, label, tint, iconColor }: {
  icon: React.ElementType; value: number | string; label: string; tint: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tint}`}>
        <Icon size={19} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-surface-900 leading-none tabular-nums">{value}</p>
        <p className="text-[11px] font-medium text-surface-500 mt-1 leading-tight">{label}</p>
      </div>
    </div>
  );
}

interface TooltipItem { dataKey?: string | number; name?: string; value?: number; color?: string }

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipItem[]; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-surface-200 bg-white shadow-lg px-3 py-2 text-xs min-w-[140px]">
      {label !== undefined && <p className="font-semibold text-surface-700 mb-1.5">{label}</p>}
      {payload.map((p) => (
        <div key={String(p.dataKey ?? p.name)} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-surface-500">{p.name}</span>
          <span className="ml-auto font-bold text-surface-800 tabular-nums">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, icon: Icon, accent, right, children, bodyClassName }: {
  title: string; icon: React.ElementType; accent: string;
  right?: React.ReactNode; children: React.ReactNode; bodyClassName?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-surface-100">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
            <Icon size={15} className="text-white" />
          </div>
          <h2 className="text-sm font-bold text-surface-800">{title}</h2>
        </div>
        {right}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

interface SectionProps {
  title: string; icon: React.ElementType; accent: string;
  value: string; onChange: (v: string) => void; placeholder: string;
}

function ReportSection({ title, icon: Icon, accent, value, onChange, placeholder }: SectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-surface-100">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon size={13} className="text-white" />
        </div>
        <h2 className="text-sm font-bold text-surface-800">{title}</h2>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder={placeholder}
        className="w-full flex-1 px-4 py-3 text-sm text-surface-700 resize-y focus:outline-none focus:bg-brand-50/20 leading-relaxed min-h-[130px]"
      />
    </div>
  );
}

function fmtPrazo(iso?: string): string {
  return iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "";
}

function BreakdownColumn({ icon: Icon, label, color, count, children }: {
  icon: React.ElementType; label: string; color: string; count: number; children: React.ReactNode;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={13} className={color} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-surface-500">{label}</span>
        <span className="ml-auto text-[11px] font-semibold text-surface-400 tabular-nums">{count}</span>
      </div>
      {count === 0 ? <p className="text-xs text-surface-400 italic">—</p> : <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

function TaskLink({ t, children, className = "" }: { t: Task; children: React.ReactNode; className?: string }) {
  return (
    <Link href={`/tarefas?task=${t.id}`} className={`group flex items-start gap-2 rounded-lg px-2 py-1 -mx-2 hover:bg-surface-50 transition-colors ${className}`}>
      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[t.priority] ?? "bg-surface-400"}`} />
      {children}
    </Link>
  );
}

const CAP = 8;

/* ---------------- Page ---------------- */

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

  const movement = useMemo(() => buildWeeklyMovement(tasks, weekStart), [tasks, weekStart]);
  const generalSCurve = useMemo(() => {
    const { start } = weekBoundsFromISO(weekStart);
    // Janela: 15 dias antes da semana até a sexta-feira da semana (seg + 4).
    return buildSCurveWindow(tasks, addDays(start, -15), addDays(start, 4));
  }, [tasks, weekStart]);
  // Rótulo do dia de hoje (para o marcador "Hoje" na curva), se estiver na janela.
  const todayLabel = useMemo(() => {
    const l = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    return generalSCurve.some((p) => p.label === l) ? l : null;
  }, [generalSCurve]);
  const weekTasks = useMemo(() => getWeekTasks(tasks, weekStart), [tasks, weekStart]);

  const movTotals = useMemo(() => {
    let criadas = 0, atualizadas = 0, concluidas = 0;
    for (const { reasons } of weekTasks) {
      if (reasons.includes("criada")) criadas++;
      if (reasons.includes("atualizada")) atualizadas++;
      if (reasons.includes("concluida")) concluidas++;
    }
    return { criadas, atualizadas, concluidas, movimentadas: weekTasks.length };
  }, [weekTasks]);

  const movDonut = useMemo(() => [
    { name: "Criadas", value: movTotals.criadas, color: MOV.criadas },
    { name: "Atualizadas", value: movTotals.atualizadas, color: MOV.atualizadas },
    { name: "Concluídas", value: movTotals.concluidas, color: MOV.concluidas },
  ].filter((d) => d.value > 0), [movTotals]);

  const weekEndISO = useMemo(() => toISODate(weekBoundsFromISO(weekStart).end), [weekStart]);

  // Consolidado de TODOS os projetos: avanços, foco e impeditivos da semana.
  const weekBreakdown = useMemo(() => buildProjectWeekBreakdown(tasks, weekStart), [tasks, weekStart]);

  const summary = useMemo(() => {
    const auto = buildWeeklyAutofill(tasks, weekStart);
    const count = (s: string) => (s.trim() ? s.trim().split("\n").filter(Boolean).length : 0);
    return { impeditivos: count(auto.impeditivos), planejamento: count(auto.planejamento) };
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
    <div className="p-4 md:p-6 max-w-[1180px] mx-auto space-y-6">
      {/* Toolbar (fora da captura) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-surface-200 p-1.5 shadow-sm">
          <button onClick={() => shiftWeek(-1)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500">
            <ChevronLeft size={16} />
          </button>
          <div className="text-center px-2 min-w-[190px]">
            <p className="text-sm font-semibold text-surface-800 capitalize">{formatRange(weekStart)}</p>
            <p className="text-[11px] text-surface-400">
              {isCurrentWeek ? "Semana atual" : "Outra semana"}{saved ? " · salvo" : " · não salvo"}
            </p>
          </div>
          {!isCurrentWeek && (
            <button onClick={() => setWeekStart(getWeekStartISO())} className="text-[11px] px-2 py-1 rounded-md text-brand-600 hover:bg-brand-50 font-medium">
              Hoje
            </button>
          )}
          <button onClick={() => shiftWeek(1)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500">
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-surface-200 bg-white rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-50 shadow-sm"
          >
            <Printer size={15} /> Imprimir / PDF
          </button>
          <button
            onClick={handleSave}
            disabled={save.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60 shadow-sm"
          >
            {save.isPending ? <Loader2 size={15} className="animate-spin" /> : savedFlash ? <Check size={15} /> : <Save size={15} />}
            {savedFlash ? "Salvo!" : "Salvar semana"}
          </button>
        </div>
      </div>

      {/* Área capturável */}
      <div ref={printRef} className="space-y-5">
        {/* Capa */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white p-6 md:p-7 shadow-sm">
          <div className="absolute -right-8 -top-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -right-16 top-16 w-40 h-40 rounded-full bg-white/5" />
          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="uppercase tracking-[0.18em] text-brand-100/90 text-[11px] font-semibold">Relatório Semanal</p>
              <h1 className="text-2xl md:text-3xl font-bold mt-1.5 capitalize leading-tight">{formatRange(weekStart)}</h1>
              <p className="text-brand-100/85 text-sm mt-1.5">{userName} · consolidado da semana</p>
            </div>
            <div className="flex gap-5">
              <div className="text-center">
                <p className="text-3xl font-bold leading-none">{movTotals.movimentadas}</p>
                <p className="text-[11px] text-brand-100/80 mt-1">movimentadas</p>
              </div>
              <div className="w-px bg-white/15" />
              <div className="text-center">
                <p className="text-3xl font-bold leading-none">{movTotals.concluidas}</p>
                <p className="text-[11px] text-brand-100/80 mt-1">concluídas</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={Activity} value={movTotals.movimentadas} label="Movimentadas" tint="bg-surface-100" iconColor="text-surface-600" />
          <KpiCard icon={PlusCircle} value={movTotals.criadas} label="Criadas na semana" tint="bg-blue-50" iconColor="text-blue-600" />
          <KpiCard icon={RefreshCw} value={movTotals.atualizadas} label="Atualizadas" tint="bg-amber-50" iconColor="text-amber-600" />
          <KpiCard icon={CheckCircle2} value={movTotals.concluidas} label="Concluídas" tint="bg-brand-50" iconColor="text-brand-600" />
          <KpiCard icon={AlertTriangle} value={summary.impeditivos} label="Impeditivos ativos" tint="bg-red-50" iconColor="text-red-600" />
          <KpiCard icon={CalendarClock} value={summary.planejamento} label="Planejadas p/ próxima" tint="bg-violet-50" iconColor="text-violet-600" />
        </div>

        {/* Movimentação: gráfico + rosca */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SectionCard
              title="Movimentação da semana (dia a dia)"
              icon={TrendingUp}
              accent="bg-brand-600"
              right={<span className="text-[11px] text-surface-400">Criadas · Atualizadas · Concluídas</span>}
              bodyClassName="p-4 pt-5"
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={movement} barGap={2} barCategoryGap="22%">
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#eef2f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} axisLine={false} tickLine={false} width={28} />
                  <Tooltip cursor={{ fill: "#f8fafc" }} content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="criadas" name="Criadas" fill={MOV.criadas} radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="atualizadas" name="Atualizadas" fill={MOV.atualizadas} radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="concluidas" name="Concluídas" fill={MOV.concluidas} radius={[4, 4, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>

          <SectionCard title="Distribuição" icon={PieIcon} accent="bg-violet-500" bodyClassName="p-4">
            {movDonut.length === 0 ? (
              <p className="text-sm text-surface-400 text-center py-12">Nenhuma movimentação nesta semana.</p>
            ) : (
              <>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={movDonut} dataKey="value" cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none">
                        {movDonut.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-surface-900 leading-none">{movTotals.movimentadas}</span>
                    <span className="text-[10px] uppercase tracking-wider text-surface-400 mt-1">tarefas</span>
                  </div>
                </div>
                <div className="space-y-1.5 mt-3">
                  {movDonut.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-surface-600">{d.name}</span>
                      <span className="ml-auto font-bold text-surface-800 tabular-nums">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        </div>

        {/* Curva em S geral (janela da semana ± 15 dias) */}
        <SectionCard
          title="Curva em S — geral (todos os projetos e entregas)"
          icon={TrendingUp}
          accent="bg-brand-600"
          right={<span className="text-[11px] text-surface-400">Realizado até hoje · planejado até sexta da semana</span>}
          bodyClassName="p-4 pt-5"
        >
          {generalSCurve.length === 0 ? (
            <p className="text-sm text-surface-400 italic py-10 text-center">
              Sem datas suficientes para gerar a curva. Defina prazos e datas de conclusão nas tarefas.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={generalSCurve} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} minTickGap={28} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} width={34} />
                <Tooltip
                  formatter={(v, name) => [v == null ? "—" : `${v}%`, name === "planejado" ? "Planejado" : "Realizado"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 8px 24px rgba(15,23,42,0.08)" }}
                />
                <Legend iconType="plainline" iconSize={16} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(v) => (v === "planejado" ? "Planejado" : "Realizado")} />
                {todayLabel && (
                  <ReferenceLine
                    x={todayLabel}
                    stroke="#0f766e"
                    strokeDasharray="3 3"
                    label={{ value: "Hoje", position: "top", fontSize: 10, fill: "#0f766e" }}
                  />
                )}
                <Line type="monotone" dataKey="planejado" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
                <Line type="monotone" dataKey="realizado" stroke="#044a42" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Dica autofill (oculta na impressão) */}
        <div className="print:hidden flex items-center justify-between gap-3 bg-brand-50/60 border border-brand-100 rounded-xl px-4 py-2.5">
          <p className="text-xs text-brand-700 flex items-center gap-1.5">
            <Sparkles size={14} /> Campos pré-preenchidos a partir das tarefas. Edite livremente antes de salvar.
          </p>
          <button
            onClick={regenerate}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 border border-brand-200 rounded-lg px-2.5 py-1.5 hover:bg-brand-100/60"
          >
            <Sparkles size={13} /> Regerar dos dados
          </button>
        </div>

        {/* Seções de texto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ReportSection title="Principais avanços da semana" icon={CheckCircle2} accent="bg-brand-500" value={avancos} onChange={setAvancos} placeholder="O que foi entregue/avançou nesta semana…" />
          <ReportSection title="Impeditivos e sugestões" icon={AlertTriangle} accent="bg-amber-500" value={impeditivos} onChange={setImpeditivos} placeholder="Bloqueios encontrados e o que precisa para destravar…" />
          <ReportSection title="Sugestões / melhorias" icon={Lightbulb} accent="bg-violet-500" value={sugestoes} onChange={setSugestoes} placeholder="Ideias, riscos, pontos de atenção para a liderança…" />
          <ReportSection title="Planejamento para a próxima" icon={CalendarClock} accent="bg-blue-500" value={planejamento} onChange={setPlanejamento} placeholder="Prioridades e tarefas previstas para a próxima semana…" />
        </div>

        {/* Resumo consolidado (todos os projetos) — cabe em um print */}
        <SectionCard
          title="Avanços · Foco da semana · Impeditivos"
          icon={FolderKanban}
          accent="bg-violet-500"
          right={<span className="text-[11px] text-surface-400">consolidado de todos os projetos</span>}
          bodyClassName=""
        >
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-surface-100">
            <BreakdownColumn icon={CheckCircle2} label="Principais avanços" color="text-brand-600" count={weekBreakdown.avancos.length}>
              {weekBreakdown.avancos.slice(0, CAP).map((t) => (
                <TaskLink key={t.id} t={t}>
                  <span className="min-w-0 text-xs leading-snug">
                    <span className="text-surface-700 group-hover:text-brand-700">{t.title}</span>
                    {t.projeto && <span className="text-[10px] text-surface-400"> · {t.projeto}</span>}
                  </span>
                </TaskLink>
              ))}
              {weekBreakdown.avancos.length > CAP && <p className="text-[11px] text-surface-400 pl-0.5 pt-1">+{weekBreakdown.avancos.length - CAP} mais</p>}
            </BreakdownColumn>

            <BreakdownColumn icon={Target} label="Foco desta semana" color="text-blue-600" count={weekBreakdown.foco.length}>
              {weekBreakdown.foco.slice(0, CAP).map((t) => {
                const pz = plannedDate(t);
                const urgent = !!pz && pz <= weekEndISO;
                return (
                  <TaskLink key={t.id} t={t} className={urgent ? "bg-brand-50/70 hover:bg-brand-50" : ""}>
                    <span className="min-w-0 flex-1 text-xs leading-snug">
                      <span className="text-surface-700 group-hover:text-brand-700">{t.title}</span>
                      {t.projeto && <span className="text-[10px] text-surface-400"> · {t.projeto}</span>}
                    </span>
                    {pz && (
                      <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${urgent ? "bg-brand-600 text-white" : "bg-surface-100 text-surface-500"}`}>
                        {fmtPrazo(pz)}
                      </span>
                    )}
                  </TaskLink>
                );
              })}
              {weekBreakdown.foco.length > CAP && <p className="text-[11px] text-surface-400 pl-0.5 pt-1">+{weekBreakdown.foco.length - CAP} mais</p>}
            </BreakdownColumn>

            <BreakdownColumn icon={AlertTriangle} label="Impeditivos" color="text-amber-600" count={weekBreakdown.impeditivos.length}>
              {weekBreakdown.impeditivos.slice(0, CAP).map((t) => (
                <TaskLink key={t.id} t={t}>
                  <span className="min-w-0">
                    <span className="block text-xs text-surface-700 group-hover:text-brand-700 leading-snug">
                      {t.title}{t.projeto && <span className="text-[10px] text-surface-400"> · {t.projeto}</span>}
                    </span>
                    {t.impeditivo?.trim() && (
                      <span className="block text-[11px] text-amber-600 leading-snug mt-0.5 line-clamp-2">{t.impeditivo.trim()}</span>
                    )}
                  </span>
                </TaskLink>
              ))}
              {weekBreakdown.impeditivos.length > CAP && <p className="text-[11px] text-surface-400 pl-0.5 pt-1">+{weekBreakdown.impeditivos.length - CAP} mais</p>}
            </BreakdownColumn>
          </div>
        </SectionCard>

        {/* Tarefas movimentadas — layout limpo (título · descrição · status · prioridade) */}
        <SectionCard
          title="Tarefas movimentadas nesta semana"
          icon={ListTodo}
          accent="bg-brand-600"
          right={<span className="text-xs text-surface-400">{weekTasks.length} tarefa(s)</span>}
          bodyClassName=""
        >
          {weekTasks.length === 0 ? (
            <p className="px-5 py-6 text-sm text-surface-400 text-center">Nenhuma tarefa criada, atualizada ou concluída nesta semana.</p>
          ) : (
            <ul className="divide-y divide-surface-100">
              {weekTasks.map(({ task: t }) => (
                <li key={t.id}>
                  <Link
                    href={`/tarefas?task=${t.id}`}
                    title={`Abrir "${t.title}" nas tarefas`}
                    className="group flex items-start justify-between gap-4 px-5 py-3.5 hover:bg-brand-50/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-surface-900 group-hover:text-brand-700 leading-snug">{t.title}</p>
                      {t.description?.trim() && (
                        <p className="text-xs text-surface-500 mt-1 leading-relaxed line-clamp-2">{t.description.trim()}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
