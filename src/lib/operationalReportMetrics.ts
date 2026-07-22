import type { Task } from "@/types";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/types";
import { buildCollaboratorData, buildProjectData } from "@/lib/reportMetrics";
import { buildWeeklyEvolution, getWeekStartISO, type WeekEvolutionPoint } from "@/lib/weeklyReportMetrics";

export interface OperationalReportContext {
  reporterName: string;
  reporterEmail: string;
  managerName?: string;
  managerEmail?: string;
}

export interface OperationalReportMetrics {
  total: number;
  concluido: number;
  emAndamento: number;
  pendente: number;
  cancelado: number;
  taxaConclusao: number;
  comImpeditivo: number;
  statusBreakdown: { label: string; value: number; pct: number }[];
  priorityBreakdown: { label: string; value: number; pct: number }[];
  categoryBreakdown: { label: string; value: number }[];
  weeklyEvolution: WeekEvolutionPoint[];
  projectSummary: ReturnType<typeof buildProjectData>;
  collaboratorSummary: ReturnType<typeof buildCollaboratorData>;
  impeditivos: Task[];
  activeTasks: Task[];
  deliveredThisWeek: Task[];
}

function parseDateOnly(dateStr: string): Date | null {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function getWeekBounds(date = new Date()) {
  const ref = new Date(date);
  ref.setHours(0, 0, 0, 0);
  const day = ref.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(ref);
  start.setDate(ref.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getTaskDeliveryDate(task: Task): string | undefined {
  return task.dataConclusao?.trim() || task.dataEntrega?.trim() || undefined;
}

export function isTaskDeliveredThisWeek(task: Task, ref = new Date()): boolean {
  if (task.status !== "concluido") return false;
  const deliveryDate = getTaskDeliveryDate(task);
  if (!deliveryDate) return false;
  const date = parseDateOnly(deliveryDate);
  if (!date) return false;
  const { start, end } = getWeekBounds(ref);
  return date >= start && date <= end;
}

export function formatShortDate(dateStr?: string) {
  if (!dateStr?.trim()) return "—";
  const date = parseDateOnly(dateStr);
  if (!date) return "—";
  return date.toLocaleDateString("pt-BR");
}

export function buildOperationalReportMetrics(tasks: Task[]): OperationalReportMetrics {
  const total = tasks.length;
  const concluido = tasks.filter((t) => t.status === "concluido").length;
  const emAndamento = tasks.filter((t) => t.status === "em_andamento").length;
  const pendente = tasks.filter((t) => t.status === "pendente").length;
  const cancelado = tasks.filter((t) => t.status === "cancelado").length;
  const taxaConclusao = total > 0 ? Math.round((concluido / total) * 100) : 0;
  const comImpeditivo = tasks.filter((t) => t.impeditivo?.trim()).length;

  const statusBreakdown = (["concluido", "em_andamento", "pendente", "cancelado"] as const)
    .map((status) => {
      const value = tasks.filter((t) => t.status === status).length;
      return {
        label: STATUS_LABELS[status],
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      };
    })
    .filter((s) => s.value > 0);

  const priorityBreakdown = (["alta", "media", "baixa"] as const)
    .map((priority) => {
      const value = tasks.filter((t) => t.priority === priority).length;
      return {
        label: PRIORITY_LABELS[priority],
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      };
    })
    .filter((p) => p.value > 0);

  const categoryMap = new Map<string, number>();
  for (const t of tasks) {
    const key = t.category?.trim() || "Sem categoria";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
  }
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const weeklyEvolution = buildWeeklyEvolution(tasks, getWeekStartISO(), 8);

  return {
    total,
    concluido,
    emAndamento,
    pendente,
    cancelado,
    taxaConclusao,
    comImpeditivo,
    statusBreakdown,
    priorityBreakdown,
    categoryBreakdown,
    weeklyEvolution,
    projectSummary: buildProjectData(tasks),
    collaboratorSummary: buildCollaboratorData(tasks),
    impeditivos: tasks.filter((t) => t.impeditivo?.trim()),
    activeTasks: tasks.filter((t) => t.status === "em_andamento" || t.status === "pendente"),
    deliveredThisWeek: tasks.filter((t) => isTaskDeliveredThisWeek(t)),
  };
}

export function formatReportDate(date = new Date()) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatReportFileDate(date = new Date()) {
  return date.toISOString().split("T")[0];
}

export function buildReportFilenames(prefix = "report-operacional") {
  const date = formatReportFileDate();
  return {
    excel: `${prefix}-tarefas_${date}.xlsx`,
    pdfIndicadores: `${prefix}-indicadores_${date}.pdf`,
    pdfRelatorio: `${prefix}-relatorio_${date}.pdf`,
    eml: `${prefix}_${date}.eml`,
  };
}

export function buildEmailSubject(context: OperationalReportContext, date = new Date()) {
  const dateStr = date.toLocaleDateString("pt-BR");
  return `Report Operacional — ${context.reporterName} — ${dateStr}`;
}

export function buildEmailBody(
  context: OperationalReportContext,
  metrics: OperationalReportMetrics,
  filenames: ReturnType<typeof buildReportFilenames>,
  date = new Date(),
) {
  const greeting = context.managerName ? `Olá, ${context.managerName},` : "Olá,";
  const dateStr = formatReportDate(date);

  return [
    greeting,
    "",
    `Segue o meu report operacional, referente a ${dateStr}.`,
    "",
    "Resumo dos indicadores:",
    `• Total de tarefas: ${metrics.total}`,
    `• Concluídas: ${metrics.concluido} (${metrics.taxaConclusao}%)`,
    `• Em andamento: ${metrics.emAndamento}`,
    `• Pendentes: ${metrics.pendente}`,
    `• Com impeditivo: ${metrics.comImpeditivo}`,
    "",
    "Anexos incluídos neste e-mail:",
    `• ${filenames.excel} — detalhamento completo das tarefas (Excel estilizado)`,
    `• ${filenames.pdfIndicadores} — indicadores e números consolidados`,
    `• ${filenames.pdfRelatorio} — visão geral com gráficos e tabela de relatórios`,
    "",
    "Atenciosamente,",
  ].join("\r\n");
}

const EMAIL_FONT = "'Aptos','Segoe UI',Helvetica,sans-serif";
const EMAIL_BASE = `font-family:${EMAIL_FONT};font-size:12pt;color:#000000;line-height:1.35;mso-line-height-rule:exactly;`;

function htmlP(extra = "") {
  return `<p style="margin:0 0 2px;${EMAIL_BASE}${extra}">`;
}

function htmlSection() {
  return `<p style="margin:10px 0 3px;${EMAIL_BASE}">`;
}

function htmlLi(text: string) {
  return `<li style="margin:0 0 1px;${EMAIL_BASE}">${text}</li>`;
}

function esc(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildEmailHtmlBody(
  context: OperationalReportContext,
  metrics: OperationalReportMetrics,
  filenames: ReturnType<typeof buildReportFilenames>,
  date = new Date(),
) {
  const greeting = context.managerName ? `Olá, ${context.managerName},` : "Olá,";
  const dateStr = formatReportDate(date);

  const indicatorItems = [
    `Total de tarefas: ${metrics.total}`,
    `Concluídas: ${metrics.concluido} (${metrics.taxaConclusao}%)`,
    `Em andamento: ${metrics.emAndamento}`,
    `Pendentes: ${metrics.pendente}`,
    `Com impeditivo: ${metrics.comImpeditivo}`,
  ];

  const attachmentItems = [
    `${esc(filenames.excel)} — detalhamento completo das tarefas (Excel estilizado)`,
    `${esc(filenames.pdfIndicadores)} — indicadores e números consolidados`,
    `${esc(filenames.pdfRelatorio)} — visão geral com gráficos e tabela de relatórios`,
  ];

  return [
    "<!DOCTYPE html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8">',
    "<!--[if mso]>",
    `<style>body,p,li,ul{font-family:Aptos,sans-serif;font-size:12pt;}</style>`,
    "<![endif]-->",
    "</head>",
    `<body lang="PT-BR" style="margin:0;padding:0;${EMAIL_BASE}">`,
    `${htmlP()}${esc(greeting)}</p>`,
    `${htmlP()}${esc(`Segue o meu report operacional, referente a ${dateStr}.`)}</p>`,
    `${htmlSection()}Resumo dos indicadores:</p>`,
    `<ul style="margin:0 0 4px 20px;padding:0;${EMAIL_BASE}">`,
    ...indicatorItems.map((item) => htmlLi(esc(item))),
    "</ul>",
    `${htmlSection()}Anexos incluídos neste e-mail:</p>`,
    `<ul style="margin:0 0 4px 20px;padding:0;${EMAIL_BASE}">`,
    ...attachmentItems.map((item) => htmlLi(item)),
    "</ul>",
    `${htmlSection()}Atenciosamente,</p>`,
    `<p style="margin:0;${EMAIL_BASE}"><br></p>`,
    "</body></html>",
  ].join("");
}
