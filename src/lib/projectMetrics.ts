import type { Task } from "@/types";
import { addDays } from "@/lib/calendar";

/** Tarefas pertencentes a um projeto (comparação pelo rótulo `projeto`). */
export function tasksForProject(tasks: Task[], projectName: string): Task[] {
  return tasks.filter((t) => (t.projeto || "") === projectName);
}

function parseDateOnly(dateStr?: string): Date | null {
  if (!dateStr?.trim()) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Data planejada de uma tarefa (prazo ou, na ausência, data de entrega prevista). */
export function plannedDate(task: Task): string | undefined {
  return task.dueDate?.trim() || task.dataEntrega?.trim() || undefined;
}

/** Data de conclusão real (data de conclusão ou, na ausência, data de entrega). */
export function completedDate(task: Task): string | undefined {
  if (task.status !== "concluido") return undefined;
  return task.dataConclusao?.trim() || task.dataEntrega?.trim() || undefined;
}

export interface SCurvePoint {
  date: string;
  label: string;
  planejado: number;
  realizado: number;
}

/**
 * Curva em S do projeto.
 * - planejado: acumulado de tarefas por data planejada (prazo/entrega prevista).
 * - realizado: acumulado de tarefas concluídas por data de conclusão.
 * Ambas as séries são expressas em % do total de tarefas do projeto.
 */
export function buildSCurve(tasks: Task[]): SCurvePoint[] {
  const total = tasks.length;
  if (total === 0) return [];

  const plannedDates = tasks
    .map((t) => parseDateOnly(plannedDate(t)))
    .filter((d): d is Date => d !== null);
  const completedDates = tasks
    .map((t) => parseDateOnly(completedDate(t)))
    .filter((d): d is Date => d !== null);

  const allTimes = [...plannedDates, ...completedDates].map((d) => d.getTime());
  if (allTimes.length === 0) return [];

  const uniqueTimes = Array.from(new Set(allTimes)).sort((a, b) => a - b);

  return uniqueTimes.map((time) => {
    const plannedCount = plannedDates.filter((d) => d.getTime() <= time).length;
    const completedCount = completedDates.filter((d) => d.getTime() <= time).length;
    const date = new Date(time);
    return {
      date: date.toISOString().split("T")[0],
      label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      planejado: Math.round((plannedCount / total) * 100),
      realizado: Math.round((completedCount / total) * 100),
    };
  });
}

/**
 * Curva em S limitada a uma janela [start, end], com um ponto por dia.
 * Os acumulados (planejado/realizado) consideram TODAS as datas até cada dia,
 * então o % permanece correto mesmo mostrando apenas o recorte da janela.
 */
export function buildSCurveWindow(tasks: Task[], start: Date, end: Date): SCurvePoint[] {
  const total = tasks.length;
  if (total === 0) return [];

  const plannedTimes = tasks
    .map((t) => parseDateOnly(plannedDate(t)))
    .filter((d): d is Date => d !== null)
    .map((d) => d.getTime());
  const completedTimes = tasks
    .map((t) => parseDateOnly(completedDate(t)))
    .filter((d): d is Date => d !== null)
    .map((d) => d.getTime());

  if (plannedTimes.length === 0 && completedTimes.length === 0) return [];

  const points: SCurvePoint[] = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cur.getTime() <= last.getTime()) {
    const dayEnd = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 23, 59, 59, 999).getTime();
    const plannedCount = plannedTimes.filter((x) => x <= dayEnd).length;
    const completedCount = completedTimes.filter((x) => x <= dayEnd).length;
    points.push({
      date: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`,
      label: cur.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      planejado: Math.round((plannedCount / total) * 100),
      realizado: Math.round((completedCount / total) * 100),
    });
    cur = addDays(cur, 1);
  }

  return points;
}

export interface ProjectKpis {
  total: number;
  concluido: number;
  emAndamento: number;
  pendente: number;
  cancelado: number;
  comImpeditivo: number;
  taxaConclusao: number;
  progressoMedio: number;
}

export function buildProjectKpis(tasks: Task[]): ProjectKpis {
  const total = tasks.length;
  const concluido = tasks.filter((t) => t.status === "concluido").length;
  const emAndamento = tasks.filter((t) => t.status === "em_andamento").length;
  const pendente = tasks.filter((t) => t.status === "pendente").length;
  const cancelado = tasks.filter((t) => t.status === "cancelado").length;
  const comImpeditivo = tasks.filter((t) => t.impeditivo?.trim()).length;
  const taxaConclusao = total > 0 ? Math.round((concluido / total) * 100) : 0;
  const progressoMedio = total > 0
    ? Math.round(tasks.reduce((s, t) => s + (t.progress ?? 0), 0) / total)
    : 0;
  return { total, concluido, emAndamento, pendente, cancelado, comImpeditivo, taxaConclusao, progressoMedio };
}
