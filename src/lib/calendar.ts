export const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
export const WEEKDAY_LABELS_SHORT = ["S", "T", "Q", "Q", "S", "S", "D"] as const;

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

/** Data local -> "YYYY-MM-DD" (evita problemas de timezone do toISOString). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(dateStr: string): Date | null {
  if (!dateStr?.trim()) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** Dia da semana começando na segunda (0 = seg ... 6 = dom). */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** Segunda-feira da semana que contém `date`. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return addDays(d, -mondayIndex(d));
}

/** Os 7 dias (seg-dom) da semana que contém `date`. */
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Matriz do mês: 6 semanas x 7 dias (seg-dom), incluindo dias vizinhos
 * para preencher a grade.
 */
export function getMonthMatrix(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const gridStart = startOfWeek(first);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(addDays(gridStart, w * 7 + d));
    }
    weeks.push(week);
  }
  return weeks;
}

export function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWeekRange(date: Date): string {
  const days = getWeekDays(date);
  const start = days[0];
  const end = days[6];
  const startStr = start.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const endStr = end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${startStr} – ${endStr}`;
}
