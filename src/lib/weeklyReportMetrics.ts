import type { Task } from "@/types";
import { startOfWeek, toISODate, addDays, parseISODate } from "@/lib/calendar";
import { completedDate, plannedDate } from "@/lib/projectMetrics";

export function getWeekStartISO(date = new Date()): string {
  return toISODate(startOfWeek(date));
}

export interface WeekBounds { start: Date; end: Date }

export function weekBoundsFromISO(weekStartISO: string): WeekBounds {
  const start = parseISODate(weekStartISO) ?? startOfWeek(new Date());
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function inRange(dateStr: string | undefined, start: Date, end: Date): boolean {
  const d = dateStr ? parseISODate(dateStr) : null;
  if (!d) return false;
  return d >= start && d <= end;
}

function projSuffix(t: Task): string {
  return t.projeto ? ` (${t.projeto})` : "";
}

export interface WeeklyAutofill {
  avancos: string;
  impeditivos: string;
  sugestoes: string;
  planejamento: string;
}

/**
 * Gera automaticamente os textos do report semanal a partir das tarefas:
 * - avanços: tarefas concluídas na semana selecionada;
 * - impeditivos: tarefas ativas com impeditivo;
 * - planejamento: tarefas ativas com prazo na próxima semana (ou próximas pendências).
 */
export function buildWeeklyAutofill(tasks: Task[], weekStartISO: string): WeeklyAutofill {
  const { start, end } = weekBoundsFromISO(weekStartISO);
  const nextStart = addDays(start, 7);
  const nextEnd = addDays(end, 7);

  const concluidas = tasks.filter((t) => inRange(completedDate(t), start, end));
  const avancos = concluidas.length
    ? concluidas.map((t) => `• ${t.title}${projSuffix(t)}`).join("\n")
    : "";

  const comImpeditivo = tasks.filter(
    (t) => t.impeditivo?.trim() && t.status !== "concluido" && t.status !== "cancelado",
  );
  const impeditivos = comImpeditivo.length
    ? comImpeditivo.map((t) => `• ${t.title}: ${t.impeditivo!.trim()}`).join("\n")
    : "";

  const ativas = tasks.filter((t) => t.status === "pendente" || t.status === "em_andamento");
  let planejadas = ativas.filter((t) => inRange(plannedDate(t), nextStart, nextEnd));
  if (planejadas.length === 0) {
    planejadas = [...ativas]
      .sort((a, b) => (plannedDate(a) || "9999").localeCompare(plannedDate(b) || "9999"))
      .slice(0, 6);
  }
  const planejamento = planejadas.length
    ? planejadas
        .map((t) => `• ${t.title}${projSuffix(t)}${plannedDate(t) ? ` — prazo ${plannedDate(t)}` : ""}`)
        .join("\n")
    : "";

  return { avancos, impeditivos, sugestoes: "", planejamento };
}

export type WeekTaskReason = "criada" | "atualizada" | "concluida";

export interface WeekTaskItem {
  task: Task;
  reasons: WeekTaskReason[];
}

/**
 * Tarefas movimentadas na semana selecionada: criadas, atualizadas
 * ou concluídas dentro do intervalo da semana.
 */
export function getWeekTasks(tasks: Task[], weekStartISO: string): WeekTaskItem[] {
  const { start, end } = weekBoundsFromISO(weekStartISO);
  const items: WeekTaskItem[] = [];

  for (const t of tasks) {
    const reasons: WeekTaskReason[] = [];
    if (inRange(t.createdAt, start, end)) reasons.push("criada");
    if (inRange(t.updatedAt, start, end)) reasons.push("atualizada");
    if (t.status === "concluido" && inRange(completedDate(t), start, end)) reasons.push("concluida");
    if (reasons.length > 0) items.push({ task: t, reasons });
  }

  // Concluídas primeiro, depois por atualização mais recente.
  return items.sort((a, b) => {
    const ac = a.reasons.includes("concluida") ? 0 : 1;
    const bc = b.reasons.includes("concluida") ? 0 : 1;
    if (ac !== bc) return ac - bc;
    return (b.task.updatedAt || "").localeCompare(a.task.updatedAt || "");
  });
}

export interface WeekEvolutionPoint {
  label: string;
  concluidas: number;
  planejadas: number;
}

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/** Evolução dia a dia (Seg→Dom) da semana selecionada: concluídas x planejadas. */
export function buildDailyEvolution(tasks: Task[], weekStartISO: string): WeekEvolutionPoint[] {
  const start = parseISODate(weekStartISO) ?? startOfWeek(new Date());
  const points: WeekEvolutionPoint[] = [];

  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    day.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const concluidas = tasks.filter((t) => inRange(completedDate(t), day, dayEnd)).length;
    const planejadas = tasks.filter((t) => inRange(plannedDate(t), day, dayEnd)).length;

    points.push({
      label: `${DAY_LABELS[i]} ${day.getDate().toString().padStart(2, "0")}`,
      concluidas,
      planejadas,
    });
  }

  return points;
}

/** Concluídas x planejadas por semana, para as últimas `weeks` semanas. */
export function buildWeeklyEvolution(tasks: Task[], refWeekStartISO: string, weeks = 8): WeekEvolutionPoint[] {
  const refStart = parseISODate(refWeekStartISO) ?? startOfWeek(new Date());
  const points: WeekEvolutionPoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(refStart, -7 * i);
    start.setHours(0, 0, 0, 0);
    const end = addDays(start, 6);
    end.setHours(23, 59, 59, 999);

    const concluidas = tasks.filter((t) => inRange(completedDate(t), start, end)).length;
    const planejadas = tasks.filter((t) => inRange(plannedDate(t), start, end)).length;

    points.push({
      label: start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      concluidas,
      planejadas,
    });
  }

  return points;
}
