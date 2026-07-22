"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Loader2 } from "lucide-react";
import { useNotasQuery } from "@/hooks/useNotas";
import { useTasksQuery } from "@/hooks/useTasks";
import NotaDrawer from "@/components/notes/NotaDrawer";
import type { Note } from "@/types/note";
import { NOTE_TYPE_COLOR } from "@/types/note";
import type { Task } from "@/types";
import {
  getMonthMatrix, getWeekDays, toISODate, parseISODate, isSameDay,
  addMonths, addDays, formatMonthYear, formatWeekRange, WEEKDAY_LABELS,
} from "@/lib/calendar";

interface Props { isAdmin: boolean }
type ViewMode = "mes" | "semana";

const STATUS_DOT: Record<string, string> = {
  pendente: "bg-surface-400",
  em_andamento: "bg-blue-500",
  concluido: "bg-brand-500",
  cancelado: "bg-red-500",
};
const STATUS_CHIP: Record<string, string> = {
  pendente: "bg-surface-100 text-surface-600",
  em_andamento: "bg-blue-50 text-blue-700",
  concluido: "bg-brand-50 text-brand-700",
  cancelado: "bg-red-50 text-red-600",
};

/** Uma nota ocorre neste dia? (data exata ou recorrência semanal) */
function notaOnDay(nota: Note, day: Date, dayISO: string): boolean {
  if (nota.data === dayISO) return true;
  if (nota.recorrencia === "semanal" && nota.diasSemana?.includes(day.getDay())) {
    const start = parseISODate(nota.data);
    if (start && day >= start) return true;
  }
  return false;
}

/** Data relevante de uma tarefa para o calendário (prazo, entrega ou conclusão). */
function taskDatesFor(task: Task): { iso: string; kind: string }[] {
  const out: { iso: string; kind: string }[] = [];
  if (task.dataConclusao?.trim()) out.push({ iso: task.dataConclusao, kind: "Conclusão" });
  else if (task.dueDate?.trim()) out.push({ iso: task.dueDate, kind: "Prazo" });
  else if (task.dataEntrega?.trim()) out.push({ iso: task.dataEntrega, kind: "Entrega" });
  return out;
}

export default function CalendarioClient({ isAdmin: _isAdmin }: Props) {
  const { data: notas = [], isLoading: notasLoading } = useNotasQuery();
  const { data: tasks = [], isLoading: tasksLoading } = useTasksQuery();

  const [view, setView] = useState<ViewMode>("mes");
  const [cursor, setCursor] = useState(new Date());
  const [drawer, setDrawer] = useState<{ nota: Note | null; date?: string } | null>(null);

  const today = new Date();
  const taskOptions = useMemo(() => tasks.map((t) => ({ id: t.id, title: t.title })), [tasks]);

  // Mapa dateISO -> tarefas
  const tasksByDate = useMemo(() => {
    const m: Record<string, Task[]> = {};
    for (const t of tasks) {
      for (const { iso } of taskDatesFor(t)) {
        (m[iso] ??= []).push(t);
      }
    }
    return m;
  }, [tasks]);

  function notasForDay(day: Date, dayISO: string): Note[] {
    return notas.filter((n) => notaOnDay(n, day, dayISO));
  }

  function shift(delta: number) {
    setCursor((c) => (view === "mes" ? addMonths(c, delta) : addDays(c, delta * 7)));
  }

  const days = view === "mes"
    ? getMonthMatrix(cursor.getFullYear(), cursor.getMonth()).flat()
    : getWeekDays(cursor);

  const loading = notasLoading || tasksLoading;

  return (
    <div className="p-4 md:p-6 max-w-[1300px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-surface-900">Calendário</h1>
          <p className="text-sm text-surface-400 mt-0.5">Reuniões, anotações, lembretes e tarefas por data</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setView("mes")}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${view === "mes" ? "bg-white shadow-sm text-surface-900" : "text-surface-400 hover:text-surface-700"}`}
            >
              Mês
            </button>
            <button
              onClick={() => setView("semana")}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${view === "semana" ? "bg-white shadow-sm text-surface-900" : "text-surface-400 hover:text-surface-700"}`}
            >
              Semana
            </button>
          </div>
          <button
            onClick={() => setDrawer({ nota: null, date: toISODate(today) })}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold"
          >
            <Plus size={15} /> Nova anotação
          </button>
        </div>
      </div>

      {/* Nav */}
      <div className="bg-white rounded-xl border border-surface-200 p-3 flex items-center justify-between">
        <button onClick={() => shift(-1)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500">
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-surface-800 capitalize">
            {view === "mes" ? formatMonthYear(cursor) : formatWeekRange(cursor)}
          </span>
          <button
            onClick={() => setCursor(new Date())}
            className="text-[11px] px-2 py-1 rounded-md text-brand-600 hover:bg-brand-50 font-medium"
          >
            Hoje
          </button>
        </div>
        <button onClick={() => shift(1)} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500">
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-brand-500" />
        </div>
      ) : view === "mes" ? (
        <div className="bg-white rounded-xl border border-surface-200 p-3">
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-surface-400 py-1">{d}</div>
            ))}
            {days.map((day) => {
              const iso = toISODate(day);
              const dayNotas = notasForDay(day, iso);
              const dayTasks = tasksByDate[iso] ?? [];
              const isCurrentMonth = day.getMonth() === cursor.getMonth();
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={iso}
                  onClick={() => setDrawer({ nota: null, date: iso })}
                  className={`text-left min-h-[96px] rounded-lg border p-1.5 transition-colors ${
                    isCurrentMonth ? "border-surface-100 bg-white hover:bg-surface-50" : "border-transparent bg-surface-50/40"
                  } ${isToday ? "ring-1 ring-brand-400" : ""}`}
                >
                  <div className={`text-[11px] font-medium ${isCurrentMonth ? "text-surface-600" : "text-surface-300"} ${isToday ? "text-brand-600 font-bold" : ""}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {dayNotas.slice(0, 3).map((n) => {
                      const c = NOTE_TYPE_COLOR[n.tipo];
                      return (
                        <div
                          key={n.id}
                          onClick={(e) => { e.stopPropagation(); setDrawer({ nota: n }); }}
                          className={`truncate text-[10px] px-1 py-0.5 rounded ${c.bg} ${c.text} hover:opacity-80`}
                          title={n.titulo}
                        >
                          {c.icon} {n.titulo}
                        </div>
                      );
                    })}
                    {dayTasks.slice(0, 2).map((t) => (
                      <div key={t.id} className="flex items-center gap-1 truncate text-[10px] text-surface-500" title={t.title}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[t.status]}`} />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                    {(dayNotas.length + dayTasks.length) > 5 && (
                      <div className="text-[9px] text-surface-400">+{dayNotas.length + dayTasks.length - 5} mais</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
          {days.map((day) => {
            const iso = toISODate(day);
            const dayNotas = notasForDay(day, iso);
            const dayTasks = tasksByDate[iso] ?? [];
            const isToday = isSameDay(day, today);
            return (
              <div key={iso} className={`bg-white rounded-xl border p-2.5 min-h-[220px] flex flex-col ${isToday ? "border-brand-400" : "border-surface-200"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-surface-400">
                      {WEEKDAY_LABELS[(day.getDay() + 6) % 7]}
                    </p>
                    <p className={`text-sm font-bold ${isToday ? "text-brand-600" : "text-surface-700"}`}>{day.getDate()}</p>
                  </div>
                  <button
                    onClick={() => setDrawer({ nota: null, date: iso })}
                    className="p-1 rounded-md text-surface-300 hover:text-brand-600 hover:bg-brand-50"
                    title="Adicionar"
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <div className="space-y-1 flex-1">
                  {dayNotas.map((n) => {
                    const c = NOTE_TYPE_COLOR[n.tipo];
                    return (
                      <button
                        key={n.id}
                        onClick={() => setDrawer({ nota: n })}
                        className={`w-full text-left text-[11px] px-1.5 py-1 rounded ${c.bg} ${c.text} hover:opacity-80`}
                      >
                        <span className="block truncate">{c.icon} {n.titulo}</span>
                      </button>
                    );
                  })}
                  {dayTasks.map((t) => (
                    <div key={t.id} className={`text-[11px] px-1.5 py-1 rounded ${STATUS_CHIP[t.status]}`}>
                      <span className="block truncate">{t.title}</span>
                    </div>
                  ))}
                  {dayNotas.length === 0 && dayTasks.length === 0 && (
                    <p className="text-[10px] text-surface-300 italic">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-surface-500">
        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Em andamento</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500" /> Concluída</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-surface-400" /> Pendente</span>
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={12} className="text-surface-400" /> Clique num dia para adicionar</span>
      </div>

      {drawer && (
        <NotaDrawer
          nota={drawer.nota}
          tasks={taskOptions}
          defaultDate={drawer.date}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
